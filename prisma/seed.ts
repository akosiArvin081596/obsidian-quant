import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";
import { ROLE_PERMISSIONS, PERMISSIONS } from "../src/lib/auth/permissions";
import { resolveSeedAdmin } from "../src/lib/auth/seedCredentials";

const prisma = new PrismaClient();

async function main() {
  // Resolved before any write so a misconfigured environment fails fast, rather
  // than half-seeding and then aborting on the administrator.
  const { email: adminEmail, password: adminPassword } = resolveSeedAdmin(process.env);

  const permissionKeys = Object.values(PERMISSIONS);
  for (const key of permissionKeys) {
    await prisma.permission.upsert({
      where: { key },
      create: { key, description: key },
      update: {},
    });
  }

  const allPermissions = await prisma.permission.findMany();
  const byKey = Object.fromEntries(allPermissions.map((p) => [p.key, p.id]));

  for (const [roleName, perms] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      create: { name: roleName },
      update: {},
    });

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: perms.map((key) => ({
        roleId: role.id,
        permissionId: byKey[key],
      })),
    });
  }

  const passwordHash = await hashPassword(adminPassword);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      name: "Site Administrator",
      email: adminEmail,
      passwordHash,
      status: "active",
    },
    // Bootstrap only — matching every other upsert in this file. Re-seeding an
    // existing database must never rewrite a live credential back to whatever
    // ADMIN_SEED_PASSWORD happens to hold, nor silently reactivate an account
    // an operator deliberately suspended. `prisma migrate dev` runs this hook,
    // so it fires far more often than a deliberate bootstrap. Rotate passwords
    // through the admin UI, not the seed.
    update: {},
  });

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: "Administrator" } });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
    create: { userId: admin.id, roleId: adminRole.id },
    update: {},
  });

  const defaultCategory = await prisma.category.upsert({
    where: { slug: "market-notes" },
    create: {
      name: "Market Notes",
      slug: "market-notes",
      description: "Research notes and market commentary.",
    },
    update: {},
  });

  console.log("Seed complete.");
  console.log(`Admin: ${adminEmail}`);
  console.log(`Default category: ${defaultCategory.slug}`);
  // The password is never printed. Seed output lands in deploy and CI logs,
  // which are retained far longer and read far more widely than a terminal.
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
