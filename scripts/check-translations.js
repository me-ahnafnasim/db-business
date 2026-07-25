const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const localesDir = path.join(root, 'src', 'i18n', 'locales');
const sourceDir = path.join(root, 'src');
const en = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'));
const bn = JSON.parse(fs.readFileSync(path.join(localesDir, 'bn.json'), 'utf8'));

function flatten(value, prefix = '', output = new Map()) {
  for (const [key, child] of Object.entries(value)) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === 'object' && !Array.isArray(child)) flatten(child, next, output);
    else output.set(next, child);
  }
  return output;
}

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(fullPath);
    return entry.name.endsWith('.js') ? [fullPath] : [];
  });
}

const enKeys = flatten(en);
const bnKeys = flatten(bn);
const missingInBangla = [...enKeys.keys()].filter((key) => !bnKeys.has(key));
const missingInEnglish = [...bnKeys.keys()].filter((key) => !enKeys.has(key));
const untranslatedBangla = [...bnKeys.entries()]
  .filter(([key, value]) => typeof value === 'string' && value === enKeys.get(key) && !['common'].includes(key.split('.')[0]))
  .map(([key]) => key);

const referenced = new Set();
const staticKeyPattern = /\bt\(\s*["']([a-zA-Z0-9_.-]+)["']/g;
for (const file of sourceFiles(sourceDir)) {
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(staticKeyPattern)) referenced.add(match[1]);
}
const missingReferences = [...referenced].filter((key) => !enKeys.has(key));

const failures = [
  ['Missing in Bangla', missingInBangla],
  ['Missing in English', missingInEnglish],
  ['Unknown referenced keys', missingReferences],
  ['Untranslated Bangla values', untranslatedBangla],
].filter(([, values]) => values.length);

if (failures.length) {
  for (const [label, values] of failures) {
    console.error(`${label}:\n${values.map((value) => `  - ${value}`).join('\n')}`);
  }
  process.exit(1);
}

console.log(`Translation check passed (${enKeys.size} keys, ${referenced.size} statically referenced).`);
