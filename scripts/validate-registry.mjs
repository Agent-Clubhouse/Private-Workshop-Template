#!/usr/bin/env node

// Validate registry/registry.json against the marketplace schema Clubhouse expects.
//
// Usage:
//   node scripts/validate-registry.mjs                 # schema only
//   node scripts/validate-registry.mjs --check-assets  # also HEAD-request each asset URL
//
// Exit code is non-zero if any errors are found. Warnings do not fail the run.

import { readFileSync, existsSync } from "fs";
import { resolve, join } from "path";

const REPO_ROOT = resolve(import.meta.dirname, "..");

// The set of plugin API versions Clubhouse currently supports. Keep in sync with
// SUPPORTED_PLUGIN_API_VERSIONS in the Clubhouse main app.
const SUPPORTED_API_VERSIONS = [0.5, 0.6, 0.7, 0.8, 0.9];
const DEPRECATED_API_VERSIONS = [0.5];

// Canonical permission set (from sdk/permissions.json at v0.7). The validator
// allows anything in here; unknown permissions emit a warning, not an error,
// since this list may drift slightly from the host app.
const KNOWN_PERMISSIONS = new Set([
  "files",
  "files.external",
  "files.watch",
  "git",
  "terminal",
  "agents",
  "agents.free-agent-mode",
  "notifications",
  "storage",
  "navigation",
  "projects",
  "commands",
  "events",
  "widgets",
  "logging",
  "process",
  "badges",
  "agent-config",
  "agent-config.cross-project",
  "agent-config.permissions",
  "agent-config.mcp",
  "sounds",
  "theme",
]);

const SENSITIVE_PERMISSIONS = new Set([
  "files.external",
  "process",
  "terminal",
  "agent-config.permissions",
  "agent-config.mcp",
  "agents.free-agent-mode",
]);

async function checkUrl(url) {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    return res.ok;
  } catch {
    return false;
  }
}

export async function validateRegistry({ checkAssets = false } = {}) {
  const errors = [];
  const warnings = [];

  const registryPath = join(REPO_ROOT, "registry", "registry.json");
  if (!existsSync(registryPath)) {
    return { errors: ["registry/registry.json not found"], warnings };
  }

  let registry;
  try {
    registry = JSON.parse(readFileSync(registryPath, "utf8"));
  } catch (e) {
    return { errors: [`registry.json is not valid JSON: ${e.message}`], warnings };
  }

  if (typeof registry.version !== "number") {
    errors.push("Missing or invalid top-level `version` field (must be a number)");
  }
  if (!Array.isArray(registry.plugins)) {
    errors.push("Missing or invalid `plugins` array");
    return { errors, warnings, registry };
  }

  const ids = new Set();
  for (const plugin of registry.plugins) {
    const prefix = plugin.id || "(unknown)";

    const required = ["id", "name", "description", "author", "repo", "latest", "releases"];
    for (const field of required) {
      if (!(field in plugin)) errors.push(`${prefix}: missing required field \`${field}\``);
    }

    if (plugin.id) {
      if (ids.has(plugin.id)) errors.push(`Duplicate plugin ID: ${plugin.id}`);
      ids.add(plugin.id);
      if (!/^[a-z0-9-]+$/.test(plugin.id)) {
        errors.push(`${prefix}: invalid ID format (must be lowercase alphanumeric + hyphens)`);
      }
    }

    if ("official" in plugin && typeof plugin.official !== "boolean") {
      errors.push(`${prefix}: \`official\` must be a boolean`);
    }

    if (plugin.releases && plugin.latest && !(plugin.latest in plugin.releases)) {
      errors.push(`${prefix}: \`latest\` version "${plugin.latest}" not present in \`releases\``);
    }

    if (plugin.releases) {
      for (const [version, release] of Object.entries(plugin.releases)) {
        const rPrefix = `${prefix}@${version}`;

        if (typeof release.api !== "number") {
          errors.push(`${rPrefix}: missing or invalid \`api\` version (must be a number like 0.7)`);
        } else if (!SUPPORTED_API_VERSIONS.includes(release.api)) {
          warnings.push(`${rPrefix}: API version ${release.api} is not in the known supported list (${SUPPORTED_API_VERSIONS.join(", ")})`);
        } else if (DEPRECATED_API_VERSIONS.includes(release.api)) {
          warnings.push(`${rPrefix}: targets deprecated API version ${release.api}`);
        }

        if (typeof release.asset !== "string" || !release.asset) {
          errors.push(`${rPrefix}: missing \`asset\` URL`);
        }
        if (typeof release.sha256 !== "string" || !/^[a-f0-9]{64}$/i.test(release.sha256 || "")) {
          errors.push(`${rPrefix}: \`sha256\` must be a 64-character hex string`);
        }
        if (!Array.isArray(release.permissions)) {
          errors.push(`${rPrefix}: missing or invalid \`permissions\` array`);
        } else {
          for (const perm of release.permissions) {
            if (!KNOWN_PERMISSIONS.has(perm)) {
              warnings.push(`${rPrefix}: unknown permission "${perm}" (may be valid in a newer SDK)`);
            }
            if (SENSITIVE_PERMISSIONS.has(perm)) {
              warnings.push(`${rPrefix}: uses sensitive permission "${perm}"`);
            }
          }
        }

        if (typeof release.size !== "number") {
          warnings.push(`${rPrefix}: \`size\` field is recommended (asset bytes)`);
        }

        if (checkAssets && typeof release.asset === "string") {
          const ok = await checkUrl(release.asset);
          if (ok) {
            console.log(`  OK: ${rPrefix} — asset reachable`);
          } else {
            warnings.push(`${rPrefix}: asset URL not reachable: ${release.asset}`);
          }
        }
      }
    }
  }

  return { errors, warnings, registry };
}

const args = process.argv.slice(2);
if (args.includes("--help")) {
  console.log("Usage: node scripts/validate-registry.mjs [--check-assets]");
  console.log("  --check-assets  HTTP HEAD each asset URL to verify reachability");
  process.exit(0);
}

const checkAssets = args.includes("--check-assets");
const { errors, warnings, registry } = await validateRegistry({ checkAssets });

for (const w of warnings) console.warn(`WARNING: ${w}`);
if (errors.length > 0) {
  for (const e of errors) console.error(`ERROR: ${e}`);
  process.exit(1);
}

console.log(`Registry valid: ${registry?.plugins?.length ?? 0} plugin(s)`);
