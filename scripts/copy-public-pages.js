#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const source = path.join(root, "public");
const outputArg = process.argv[2];

if (!outputArg) {
  console.error("Usage: node scripts/copy-public-pages.js <web-output-directory>");
  process.exit(1);
}

const output = path.resolve(root, outputArg);
if (!fs.existsSync(output)) {
  console.error(`Web output directory does not exist: ${output}`);
  process.exit(1);
}

fs.cpSync(source, output, { recursive: true, force: true });

for (const page of ["privacy", "terms", "returns", "account-deletion"]) {
  const exportedPage = path.join(output, page, "index.html");
  if (!fs.existsSync(exportedPage)) {
    console.error(`Public page was not copied: ${exportedPage}`);
    process.exit(1);
  }
}

console.log(`Copied public policy pages to ${output}.`);

