import { cpSync, existsSync, rmSync } from "node:fs";

/** Copy Next static export `out/` → `dist/` so the VPS nginx root stays unchanged. */
if (!existsSync("out")) {
  console.error("out/ missing — next build did not produce a static export.");
  process.exit(1);
}

rmSync("dist", { recursive: true, force: true });
cpSync("out", "dist", { recursive: true });
console.log("Synced out/ → dist/");
