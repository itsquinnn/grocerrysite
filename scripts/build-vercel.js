const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("=== DOVAN Vercel Build Runner ===");

const frontendDir = path.resolve(__dirname, "../frontend");
const srcOutput = path.resolve(frontendDir, ".vercel/output");
const destVercelDir = path.resolve(__dirname, "../.vercel");
const destOutput = path.resolve(destVercelDir, "output");

// 1. Build frontend with NITRO_PRESET=vercel
console.log("Building frontend with Nitro Vercel preset in:", frontendDir);
execSync("npm run build", {
  cwd: frontendDir,
  stdio: "inherit",
  env: {
    ...process.env,
    NITRO_PRESET: "vercel",
  },
});

// 2. Ensure .vercel/output is positioned at the repository root
if (!fs.existsSync(srcOutput)) {
  console.error("Error: Nitro output not found at:", srcOutput);
  process.exit(1);
}

console.log("Copying .vercel/output to repository root:", destOutput);
fs.rmSync(destOutput, { recursive: true, force: true });
fs.mkdirSync(destVercelDir, { recursive: true });
fs.cpSync(srcOutput, destOutput, { recursive: true });

// Also create a fallback dist/ directory with static assets just in case
const fallbackDist = path.resolve(__dirname, "../dist");
const staticSrc = path.resolve(destOutput, "static");
if (fs.existsSync(staticSrc)) {
  fs.rmSync(fallbackDist, { recursive: true, force: true });
  fs.cpSync(staticSrc, fallbackDist, { recursive: true });
  console.log("Created fallback static dist directory.");
}

console.log("=== Vercel Build Output successfully prepared! ===");
