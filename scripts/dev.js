const { spawn } = require("child_process");
const path = require("path");

console.log("\x1b[36m%s\x1b[0m", "==================================================");
console.log("\x1b[36m%s\x1b[0m", "🚀 Starting DOVAN Frontend (Vite) & Backend (Next.js) ...");
console.log("\x1b[36m%s\x1b[0m", "   Frontend: http://localhost:8080 (proxies /api to :3002)");
console.log("\x1b[36m%s\x1b[0m", "   Backend:  http://localhost:3002");
console.log("\x1b[36m%s\x1b[0m", "==================================================");

const isWindows = process.platform === "win32";
const npmCmd = isWindows ? "npm.cmd" : "npm";

// 1. Start Backend (port 3002)
const backend = spawn(npmCmd, ["run", "dev"], {
  cwd: path.resolve(__dirname, "../backend"),
  stdio: "inherit",
  shell: true,
});

// 2. Start Frontend
const frontend = spawn(npmCmd, ["run", "dev"], {
  cwd: path.resolve(__dirname, "../frontend"),
  stdio: "inherit",
  shell: true,
});

const cleanup = () => {
  console.log("\n🛑 Stopping all services...");
  try {
    if (backend && !backend.killed) backend.kill("SIGTERM");
  } catch {}
  try {
    if (frontend && !frontend.killed) frontend.kill("SIGTERM");
  } catch {}
  process.exit(0);
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("exit", cleanup);

