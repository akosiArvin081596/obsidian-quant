import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";
import { ROLE_PERMISSIONS, PERMISSIONS } from "../src/lib/auth/permissions";

const prisma = new PrismaClient();

async function main() {
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

  const adminEmail = process.env.ADMIN_SEED_EMAIL ?? "admin@obsidianquantgroup.com";
  const adminPassword = process.env.ADMIN_SEED_PASSWORD ?? "ChangeMeNow!2026";
  const passwordHash = await hashPassword(adminPassword);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      name: "Site Administrator",
      email: adminEmail,
      passwordHash,
      status: "active",
    },
    update: {
      passwordHash,
      status: "active",
    },
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
  if (!process.env.ADMIN_SEED_PASSWORD) {
    console.log("Default password: ChangeMeNow!2026 (set ADMIN_SEED_PASSWORD to override)");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
