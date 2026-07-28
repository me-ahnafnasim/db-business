const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, 'src');
const themeDir = path.join(sourceDir, 'theme');
const baselinePath = path.join(__dirname, 'token-baseline.json');

const verbose = process.argv.includes('--verbose');
const save = process.argv.includes('--save');

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(fullPath);
    return entry.name.endsWith('.js') ? [fullPath] : [];
  });
}

// Each metric counts design values written inline instead of taken from src/theme.
// `skipTheme` excludes the token definitions themselves, which are allowed to hold literals.
const METRICS = [
  {
    key: 'hexLiterals',
    label: 'Hardcoded hex colors',
    skipTheme: true,
    pattern: /#[0-9a-fA-F]{6}\b/g,
  },
  {
    key: 'rgbaLiterals',
    label: 'Hardcoded rgb()/rgba()',
    skipTheme: true,
    pattern: /\brgba?\(/g,
  },
  {
    key: 'rawFontSize',
    label: 'Raw fontSize values',
    skipTheme: true,
    pattern: /fontSize:\s*[0-9]+/g,
  },
  {
    key: 'rawRadius',
    label: 'Raw borderRadius values',
    skipTheme: true,
    pattern: /borderRadius:\s*[0-9]+/g,
  },
  {
    key: 'rawSpacing',
    label: 'Raw padding/margin values',
    skipTheme: true,
    pattern: /(?:padding|margin)(?:Top|Bottom|Left|Right|Horizontal|Vertical)?:\s*[0-9]+/g,
  },
];

const files = sourceFiles(sourceDir);
const counts = Object.fromEntries(METRICS.map((metric) => [metric.key, 0]));
const perFile = Object.fromEntries(METRICS.map((metric) => [metric.key, new Map()]));

// A getStyles(colors) factory rebuilds its StyleSheet on every render unless it is
// routed through useStyles(). Files that still do so are counted as debt.
const unmemoized = [];
// A getStyles closure that takes extra arguments must declare them to useStyles, or
// the memo silently freezes those styles. See UI_IMPROVEMENT_REPORT.md risk R3.
const undeclaredDeps = [];

for (const file of files) {
  const relative = path.relative(root, file);
  const source = fs.readFileSync(file, 'utf8');
  const inTheme = file.startsWith(themeDir + path.sep);

  for (const metric of METRICS) {
    if (metric.skipTheme && inTheme) continue;
    const hits = source.match(metric.pattern);
    if (!hits) continue;
    counts[metric.key] += hits.length;
    perFile[metric.key].set(relative, hits.length);
  }

  if (/const getStyles/.test(source)) {
    if (!/\buseStyles\s*\(/.test(source)) {
      unmemoized.push(relative);
    } else {
      // getStyles(colors, layout) memoized as useStyles(getStyles) — extra args undeclared.
      const call = source.match(/useStyles\(\s*getStyles\s*(,\s*\[[^\]]*\])?\s*\)/);
      const takesExtraArgs = /const getStyles\s*=\s*\(([^)]*)\)/.exec(source);
      const argCount = takesExtraArgs
        ? takesExtraArgs[1].split(',').filter((arg) => arg.trim()).length
        : 0;
      // colors + typography + isDarkMode are supplied by useStyles itself.
      if (argCount > 3 && call && !call[1]) undeclaredDeps.push(relative);
    }
  }
}

counts.unmemoizedStyles = unmemoized.length;

// The `accent` token is red and means "danger" at 21 call sites. It is being retired in
// favour of `error`. While both exist they must hold the same value, or migrating a call
// site silently recolours it. See UI_IMPROVEMENT_REPORT.md risk R4.
function paletteGateFailures() {
  const colorsPath = path.join(themeDir, 'colors.js');
  if (!fs.existsSync(colorsPath)) return [];
  const source = fs.readFileSync(colorsPath, 'utf8');
  const failures = [];
  for (const palette of ['darkColors', 'lightColors']) {
    const block = new RegExp(`export const ${palette}\\s*=\\s*\\{([\\s\\S]*?)\\n\\};`).exec(source);
    if (!block) continue;
    const read = (token) => {
      const found = new RegExp(`\\b${token}:\\s*"([^"]+)"`).exec(block[1]);
      return found ? found[1] : null;
    };
    const accent = read('accent');
    const error = read('error');
    if (accent && error && accent !== error) {
      failures.push(`${palette}: accent (${accent}) must equal error (${error}) until accent is removed`);
    }
  }
  return failures;
}

if (save) {
  fs.writeFileSync(baselinePath, `${JSON.stringify(counts, null, 2)}\n`);
  console.log(`Baseline written to ${path.relative(root, baselinePath)}:`);
  console.log(JSON.stringify(counts, null, 2));
  process.exit(0);
}

if (!fs.existsSync(baselinePath)) {
  console.error(`No baseline found. Run: node scripts/check-tokens.js --save`);
  process.exit(1);
}

const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
const rows = [...METRICS, { key: 'unmemoizedStyles', label: 'Unmemoized getStyles files' }];
const regressions = [];

console.log(`Token check across ${files.length} files\n`);
console.log(`  ${'metric'.padEnd(30)}${'now'.padStart(6)}${'base'.padStart(8)}${'delta'.padStart(8)}`);
for (const { key, label } of rows) {
  const now = counts[key];
  const base = baseline[key] ?? 0;
  const delta = now - base;
  const marker = delta > 0 ? '  REGRESSED' : delta < 0 ? '  improved' : '';
  console.log(`  ${label.padEnd(30)}${String(now).padStart(6)}${String(base).padStart(8)}${String(delta > 0 ? `+${delta}` : delta).padStart(8)}${marker}`);
  if (delta > 0) regressions.push(`${label}: ${base} -> ${now}`);
}

if (verbose) {
  for (const { key, label } of METRICS) {
    const entries = [...perFile[key].entries()].sort((a, b) => b[1] - a[1]);
    if (!entries.length) continue;
    console.log(`\n${label} by file:`);
    for (const [file, count] of entries) console.log(`  ${String(count).padStart(4)}  ${file}`);
  }
  if (unmemoized.length) {
    console.log('\nUnmemoized getStyles factories:');
    for (const file of unmemoized) console.log(`  ${file}`);
  }
}

const gateFailures = [...paletteGateFailures(), ...undeclaredDeps.map((file) => `${file}: getStyles takes extra arguments but useStyles declares no dependency array`)];

if (gateFailures.length || regressions.length) {
  console.error('');
  for (const failure of gateFailures) console.error(`Gate failed: ${failure}`);
  for (const regression of regressions) console.error(`Regression: ${regression}`);
  console.error('\nMigrate to tokens from src/theme instead of inline values.');
  console.error('If a rise is intentional, rerun with --save to move the baseline.');
  process.exit(1);
}

console.log('\nToken check passed.');
