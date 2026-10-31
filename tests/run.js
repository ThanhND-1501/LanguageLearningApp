const fs = require("fs");
const path = require("path");
const createJiti = require("jiti");

const rootDir = path.resolve(__dirname, "..");
const jiti = createJiti(rootDir);

const testDir = __dirname;
const testFiles = fs
  .readdirSync(testDir)
  .filter((file) => file.endsWith(".test.ts") || file.endsWith(".test.js"))
  .sort();

if (testFiles.length === 0) {
  console.log("No test files found in tests/");
  process.exit(0);
}

for (const file of testFiles) {
  const fullPath = path.join(testDir, file);
  jiti(fullPath);
}

