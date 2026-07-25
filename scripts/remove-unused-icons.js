#!/usr/bin/env node
/**
 * Removes unused @expo/vector-icons font files to reduce APK size.
 *
 * Used icon families (keep):
 *   Feather, Ionicons, SimpleLineIcons, AntDesign, MaterialCommunityIcons
 *
 * Run via: node scripts/remove-unused-icons.js
 * Add to "prebuild" in package.json for automatic execution before EAS builds.
 */

const fs = require("fs");
const path = require("path");

const FONTS_DIR = path.join(
  __dirname,
  "..",
  "node_modules",
  "expo",
  "node_modules",
  "@expo/vector-icons",
  "build",
  "vendor",
  "react-native-vector-icons",
  "Fonts"
);

const KEEP_FONTS = new Set([
  "AntDesign.ttf",
  "Feather.ttf",
  "Ionicons.ttf",
  "MaterialCommunityIcons.ttf",
  "SimpleLineIcons.ttf",
]);

if (!fs.existsSync(FONTS_DIR)) {
  console.log("Fonts directory not found, skipping icon cleanup.");
  process.exit(0);
}

const files = fs.readdirSync(FONTS_DIR).filter((f) => f.endsWith(".ttf"));
let removed = 0;
let kept = 0;
let savedBytes = 0;

for (const file of files) {
  if (KEEP_FONTS.has(file)) {
    kept++;
    continue;
  }
  const filePath = path.join(FONTS_DIR, file);
  const stats = fs.statSync(filePath);
  fs.unlinkSync(filePath);
  savedBytes += stats.size;
  removed++;
  console.log(`  removed: ${file} (${(stats.size / 1024).toFixed(0)} KB)`);
}

const savedMB = (savedBytes / (1024 * 1024)).toFixed(2);
console.log(
  `\nDone. Removed ${removed} unused font(s), kept ${kept}. Saved ~${savedMB} MB.`
);
