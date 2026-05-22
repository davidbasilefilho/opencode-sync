#!/usr/bin/env node

/**
 * Publish.mjs -- Publishes workspace packages to npm with workspace protocol replacement.
 *
 * `workspace:*` is correct for local development but breaks consumers who install from npm. This
 * script replaces `workspace:*` with `^<actual_version>` before publish, then restores the
 * originals afterwards -- even on failure.
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PACKAGES = resolve(ROOT, "packages");

const originals = new Map();

/** Walk workspace directories, find publishable packages, and replace workspace:*. */
function prepare() {
  const entries = existsSync(PACKAGES) ? readdirSafe(PACKAGES) : [];

  for (const entry of entries) {
    const pkgPath = resolve(PACKAGES, entry, "package.json");
    if (!existsSync(pkgPath)) continue;

    const raw = readFileSync(pkgPath, "utf-8");
    const pkg = JSON.parse(raw);

    if (pkg.private === true) continue;

    // Store original for restore
    originals.set(pkgPath, raw);

    const updated = replaceWorkspaceDeps(pkg);
    writeFileSync(pkgPath, JSON.stringify(updated, null, 2) + "\n", "utf-8");
    console.log(`  [prepare] ${pkg.name}: workspace:* replaced`);
  }

  if (originals.size === 0) {
    console.log("No publishable packages found.");
    process.exit(0);
  }
}

/** Recursively replace workspace:* with ^<version> in dependency blocks. */
function replaceWorkspaceDeps(pkg) {
  const result = { ...pkg };
  for (const key of [
    "dependencies",
    "devDependencies",
    "peerDependencies",
    "optionalDependencies",
  ]) {
    const deps = result[key];
    if (!deps) continue;
    const updated = { ...deps };
    for (const [name, spec] of Object.entries(updated)) {
      if (spec === "workspace:*" || spec === "workspace:^" || spec === "workspace:~") {
        // Find version from workspace packages
        const version = findWorkspaceVersion(name);
        if (version) {
          updated[name] = `^${version}`;
          console.log(`    ${name}: workspace:* -> ^${version}`);
        }
      }
    }
    result[key] = updated;
  }
  return result;
}

/** Look up a workspace package's version by name. */
function findWorkspaceVersion(name) {
  const entries = readdirSafe(PACKAGES);
  for (const entry of entries) {
    const pkgPath = resolve(PACKAGES, entry, "package.json");
    if (!existsSync(pkgPath)) continue;
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      if (pkg.name === name) return pkg.version;
    } catch {
      // skip malformed
    }
  }
  return null;
}

/** Restore all original package.json files. */
function restore() {
  for (const [filePath, content] of originals) {
    writeFileSync(filePath, content, "utf-8");
    const name = JSON.parse(content).name ?? filePath;
    console.log(`  [restore] ${name}: restored`);
  }
}

/** Safe readdir that returns [] on error. */
function readdirSafe(dir) {
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  } catch {
    return [];
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

console.log("Step 1: Replace workspace:* deps with version ranges");
prepare();

console.log("\nStep 2: Publishing...");
try {
  execSync("npm publish --workspaces --provenance --access public", {
    cwd: ROOT,
    stdio: "inherit",
  });
  console.log("\nPublish succeeded.");
} catch (err) {
  console.error("\nPublish failed:", err.message);
} finally {
  console.log("\nStep 3: Restoring workspace:* deps");
  restore();
}
