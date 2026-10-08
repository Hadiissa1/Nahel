// Starts a production build of the shop for the browser tests, on its own
// fresh database (DATA_DIR) so the real shop data in data/ is never touched.
import { execSync, spawn } from "node:child_process";
import { rmSync } from "node:fs";

const dataDir = process.env.DATA_DIR;
if (!dataDir || !dataDir.includes("nahel-e2e")) throw new Error("DATA_DIR must point to the e2e temp folder");
rmSync(dataDir, { recursive: true, force: true });

execSync("npx next build", { stdio: "inherit" });
const server = spawn(`npx next start -p ${process.env.PORT ?? "3100"}`, { stdio: "inherit", shell: true });
const stop = () => server.kill();
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
server.on("exit", (code) => process.exit(code ?? 0));
