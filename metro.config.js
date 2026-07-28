const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Metro's default watchFolder is the project root, so on every `expo start` it crawls and
// hashes ~14 MB of committed build output — `dist/` plus nine `temp-export-*` directories,
// which contain single-line minified bundles that are pathological input for a file
// crawler. None of it is reachable from AppEntry, so none of it ever reaches the app
// bundle; blocking it is purely a dev-loop win.
//
// These patterns are anchored to the project root on purpose. An unanchored /\/dist\//
// also matches node_modules packages that ship a dist/ directory — react-i18next among
// them — and silently breaks module resolution.
const projectRoot = __dirname.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const sep = path.sep === "\\" ? "\\\\" : "/";

config.resolver.blockList = [
  new RegExp(`^${projectRoot}${sep}dist${sep}.*`),
  new RegExp(`^${projectRoot}${sep}temp-export-[^${sep}]*${sep}.*`),
];

module.exports = config;
