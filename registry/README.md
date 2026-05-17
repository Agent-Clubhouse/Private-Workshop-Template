# Registry

This folder is the heart of your marketplace.

## Files

- **`registry.json`** — the plugin catalog. Clubhouse fetches this file and lists every entry in the Plugin Browser. Edit the `plugins` array to add, update, or remove plugins.
- **`featured.json`** — *(optional)* curated highlights shown at the top of the browser. Reference plugin IDs from `registry.json`.

## Example: a fully-populated plugin entry

```json
{
  "id": "acme-internal-tools",
  "name": "Acme Internal Tools",
  "description": "Internal-only tools for Acme engineers (deploy helpers, oncall views).",
  "author": "Acme Platform Team",
  "official": false,
  "repo": "https://github.com/acme/clubhouse-internal-tools",
  "path": "",
  "tags": ["internal", "ops"],
  "latest": "1.2.0",
  "releases": {
    "1.0.0": {
      "api": 0.6,
      "asset": "https://github.com/acme/clubhouse-plugins/releases/download/acme-internal-tools-v1.0.0/acme-internal-tools-v1.0.0.zip",
      "sha256": "abc123...",
      "permissions": ["logging", "storage", "commands"],
      "size": 12345
    },
    "1.2.0": {
      "api": 0.7,
      "asset": "https://github.com/acme/clubhouse-plugins/releases/download/acme-internal-tools-v1.2.0/acme-internal-tools-v1.2.0.zip",
      "sha256": "def456...",
      "permissions": ["logging", "storage", "commands", "notifications"],
      "size": 18432
    }
  }
}
```

See [../docs/SCHEMA.md](../docs/SCHEMA.md) for every field documented in detail.

## After editing

Always run the validator before pushing:

```bash
node ../scripts/validate-registry.mjs
```

CI runs the same check on every PR.
