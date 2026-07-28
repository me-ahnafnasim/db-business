#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const app = require(path.join(root, "app.json")).expo;
const eas = require(path.join(root, "eas.json"));
const pkg = require(path.join(root, "package.json"));

const errors = [];

function requireValue(condition, message) {
  if (!condition) errors.push(message);
}

function requireFile(relativePath, message = `Missing ${relativePath}`) {
  const absolutePath = path.join(root, relativePath.replace(/^\.\//, ""));
  requireValue(fs.existsSync(absolutePath), message);
  return absolutePath;
}

function readPngSize(relativePath) {
  const absolutePath = requireFile(relativePath);
  if (!fs.existsSync(absolutePath)) return null;

  const bytes = fs.readFileSync(absolutePath);
  const isPng =
    bytes.length >= 24 &&
    bytes.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    );
  requireValue(isPng, `${relativePath} is not a valid PNG`);
  if (!isPng) return null;
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

requireValue(app.name === "NoboSole", "Expo app name must be NoboSole");
requireValue(
  app.android?.package === "com.nobosole.mobile",
  "Android package must remain com.nobosole.mobile"
);
requireValue(app.version === pkg.version, "app.json and package.json versions must match");
requireValue(Boolean(app.icon), "Expo launcher icon is not configured");
requireValue(
  Boolean(app.android?.adaptiveIcon?.foregroundImage),
  "Android adaptive icon is not configured"
);
for (const permission of [
  "android.permission.READ_EXTERNAL_STORAGE",
  "android.permission.WRITE_EXTERNAL_STORAGE",
  "android.permission.SYSTEM_ALERT_WINDOW",
]) {
  requireValue(
    app.android?.blockedPermissions?.includes(permission),
    `Release config must block unnecessary permission ${permission}`
  );
}
requireValue(
  eas.cli?.appVersionSource === "remote",
  "EAS appVersionSource must be remote for automatic Play version codes"
);
requireValue(
  eas.build?.production?.environment === "production",
  "Production build must use the EAS production environment"
);
requireValue(
  eas.build?.production?.autoIncrement === true,
  "Production builds must auto-increment the Android version code"
);
requireValue(
  eas.submit?.production?.android?.track === "internal",
  "First submissions must target the internal track"
);
requireValue(
  eas.submit?.production?.android?.releaseStatus === "draft",
  "First submissions must remain draft until Play setup is complete"
);

const iconSize = readPngSize("./assets/icon.png");
if (iconSize) {
  requireValue(
    iconSize.width === 1024 && iconSize.height === 1024,
    "assets/icon.png must be 1024x1024"
  );
}

const storeIconSize = readPngSize("./assets/store/play-icon-512.png");
if (storeIconSize) {
  requireValue(
    storeIconSize.width === 512 && storeIconSize.height === 512,
    "Play Store icon must be 512x512"
  );
}

const featureSize = readPngSize("./assets/store/feature-graphic.png");
if (featureSize) {
  requireValue(
    featureSize.width === 1024 && featureSize.height === 500,
    "Play feature graphic must be 1024x500"
  );
}

for (const page of ["privacy", "terms", "returns", "account-deletion"]) {
  requireFile(`public/${page}/index.html`);
}

// NOTE: EXPO_PUBLIC_WEB_URL is deliberately NOT checked here.
//
// It is `http://localhost:8081` in .env because local web development needs it — the Supabase
// OAuth redirect has to come back to the dev server, and pinning it to production sent
// sign-in to the deployed site instead.
//
// That value is also inlined into the APK at bundle time, so a device build made from this
// machine carries localhost, and the Privacy / Terms / Returns / Delete Account links in
// Profile open a dead address — which is what a Play reviewer taps. It is recorded as an open
// blocker in ANDROID_RELEASE_READINESS.md rather than enforced here, because failing the
// build would block the local workflow this value exists to serve.
//
// EAS builds do not upload .env (see .easignore), so a cloud build takes the value from the
// EAS `production` environment. Set it there, and confirm on device before submitting.

if (errors.length) {
  console.error("Release configuration check failed:");
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(
  `Release configuration passed (${app.name} ${app.version}, ${app.android.package}, remote versioning).`
);
