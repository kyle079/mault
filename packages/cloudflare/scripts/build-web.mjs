import { spawnSync } from "node:child_process";

const result = spawnSync("pnpm", ["--filter", "@magic-vault/web", "build"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: { ...process.env, VITE_API_URL: "/api", VITE_APP_ENV: "production" },
});
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
