# registry.json Schema

The schema your registry must follow for Clubhouse to read it. This matches the [official Workshop registry](https://github.com/Agent-Clubhouse/Clubhouse-Workshop/blob/main/registry/registry.json) — keep your file in sync as the spec evolves.

## Top-level structure

```ts
{
  version: number;          // Registry schema version. Currently 1.
  name?: string;            // Optional display name for your marketplace.
  description?: string;     // Optional short blurb.
  updated: string;          // ISO-8601 timestamp of the last edit.
  supportedApis?: {         // Optional. Informational — Clubhouse checks per-release.
    latest: string;
    minimum: string;
    versions: string[];
  };
  plugins: Plugin[];
}
```

## Plugin entry

```ts
{
  id: string;               // Lowercase, [a-z0-9-]+. Unique within your registry.
  name: string;             // Display name shown in the Plugin Browser.
  description: string;      // One-sentence summary.
  author: string;           // Person or team name.
  official?: boolean;       // false for private/community plugins. Optional.
  repo: string;             // URL of the plugin's source repo (informational).
  path?: string;            // Path within the repo where source lives. Optional.
  tags: string[];           // Free-form keywords for search/filter.
  latest: string;           // Must be a key in `releases`.
  releases: Record<string, Release>;
}
```

## Release entry

Keyed by version string (e.g. `"1.0.0"`):

```ts
{
  api: number;              // Plugin API version (number, not string: 0.7 not "0.7").
  asset: string;            // HTTPS URL to the plugin zip.
  sha256: string;           // 64-char hex sha256 of the zip bytes.
  permissions: string[];    // Must match manifest.json declared permissions exactly.
  size: number;             // Zip byte size. Optional but recommended.
}
```

## featured.json

A separate, optional file at `registry/featured.json`:

```ts
{
  version: number;          // 1
  updated: string;          // ISO-8601 timestamp.
  featured: Array<{
    id: string;             // Must reference an id in registry.json.
    reason: string;         // One-sentence pitch shown in the browser.
  }>;
}
```

## Permissions reference

Valid permission strings as of API v0.7:

```
agent-config           agent-config.cross-project   agent-config.mcp
agent-config.permissions
agents                 agents.free-agent-mode
badges                 commands                     events
files                  files.external               files.watch
git                    logging                      navigation
notifications          process                      projects
sounds                 storage                      terminal
theme                  widgets
```

Permissions marked **sensitive** (`files.external`, `process`, `terminal`, `agent-config.permissions`, `agent-config.mcp`, `agents.free-agent-mode`) trigger user prompts on install. Your validator will warn when releases use them.

## How Clubhouse resolves a plugin install

1. Fetch `registry.json` over HTTPS
2. Find the plugin entry by `id`
3. Pick `releases[latest]` (or a user-chosen version)
4. Skip if `release.api` exceeds the host's supported API range
5. Download `release.asset`
6. Verify the bytes match `release.sha256` (install aborts on mismatch)
7. Extract to `~/.clubhouse/plugins/<id>/`
8. Check `manifest.json` exists; cross-check declared permissions against `release.permissions`
9. Drop a `.marketplace` marker file so the client knows where the plugin came from

If you change `release.permissions` without rebuilding the zip and updating its `manifest.json`, the install will fail with a permissions-mismatch error.
