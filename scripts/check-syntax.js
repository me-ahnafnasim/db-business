const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

// Parses every source file straight from disk.
//
// This exists because Metro's transform cache can serve a stale module even after the file
// on disk has become syntactically invalid — so `expo export` reported success while
// src/screens/MainTabs.js contained a duplicate `const` declaration, and the app bundled
// green but rendered a blank screen on the device. This check reads the files itself and
// has no cache to be fooled by.

const root = path.resolve(__dirname, '..');
const preset = require.resolve('@babel/preset-react');

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(fullPath);
    return entry.name.endsWith('.js') ? [fullPath] : [];
  });
}

const files = [...sourceFiles(path.join(root, 'src')), path.join(root, 'App.js')];
const failures = [];

for (const file of files) {
  try {
    babel.transformSync(fs.readFileSync(file, 'utf8'), {
      filename: file,
      presets: [[preset, { runtime: 'automatic' }]],
      babelrc: false,
      configFile: false,
    });
  } catch (error) {
    failures.push([path.relative(root, file), String(error.message).split('\n')[0]]);
  }
}

if (failures.length) {
  for (const [file, message] of failures) {
    console.error(`${file}\n  ${message}`);
  }
  console.error(`\nSyntax check failed: ${failures.length} of ${files.length} files.`);
  process.exit(1);
}

console.log(`Syntax check passed (${files.length} files).`);
