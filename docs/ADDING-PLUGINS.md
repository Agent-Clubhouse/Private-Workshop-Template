# Adding a Plugin to Your Private Marketplace

This guide walks through publishing a plugin in your private marketplace, end-to-end.

## Prerequisites

- A working Clubhouse plugin (built with the [Clubhouse-Workshop](https://github.com/Agent-Clubhouse/Clubhouse-Workshop) tools — usually `npx create-clubhouse-plugin`)
- A `manifest.json` targeting a [supported API version](https://github.com/Agent-Clubhouse/Clubhouse-Workshop/blob/main/sdk/versions.json) (currently 0.6 and 0.7)
- A built `dist/main.js`
- A GitHub repo where you can attach release assets (this repo, or any other you own)

## 1. Package the plugin

The release artifact is a zip containing your built plugin files at the root:

```
my-plugin-v1.0.0.zip
├── manifest.json
├── dist/main.js
└── README.md
```

From your plugin's source directory:

```bash
# Build first
npm run build

# Zip up the bits Clubhouse needs
zip -r my-plugin-v1.0.0.zip manifest.json dist/main.js README.md
```

> The zip can contain extra files (other docs, assets, etc.) — Clubhouse only requires `manifest.json` at the root after extraction. If the zip extracts into a single subdirectory, Clubhouse will hoist its contents up automatically.

## 2. Compute the sha256

Clubhouse verifies the integrity of every downloaded asset against the hash you put in `registry.json`. Get it:

```bash
# macOS
shasum -a 256 my-plugin-v1.0.0.zip

# Linux
sha256sum my-plugin-v1.0.0.zip
```

Copy the 64-character hex string.

## 3. Attach the zip to a GitHub Release

In this repo (or wherever you want to host the asset):

1. Go to **Releases → Draft a new release**
2. Create a tag like `my-plugin-v1.0.0`
3. Drop the zip into the **Attach binaries** area
4. Publish

The asset URL will look like:

```
https://github.com/<your-org>/<your-repo>/releases/download/my-plugin-v1.0.0/my-plugin-v1.0.0.zip
```

## 4. Register the plugin

Edit `registry/registry.json` and add an entry to the `plugins` array:

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Does the thing.",
  "author": "Your Team",
  "official": false,
  "repo": "https://github.com/<your-org>/<your-repo>",
  "path": "",
  "tags": ["productivity"],
  "latest": "1.0.0",
  "releases": {
    "1.0.0": {
      "api": 0.7,
      "asset": "https://github.com/<your-org>/<your-repo>/releases/download/my-plugin-v1.0.0/my-plugin-v1.0.0.zip",
      "sha256": "PASTE_YOUR_SHA256_HERE",
      "permissions": ["logging", "storage"],
      "size": 12345
    }
  }
}
```

A few rules worth knowing:

- **`id`** must be lowercase, alphanumeric, hyphens only; unique within your registry
- **`permissions`** must match what's declared in the plugin's `manifest.json` exactly
- **`api`** is the plugin API version your plugin targets (number, not string — `0.7` not `"0.7"`)
- **`latest`** must be a key inside `releases`
- **`size`** is the byte size of the zip (used for UI display; not strictly required but recommended)

## 5. Validate

```bash
node scripts/validate-registry.mjs
```

If schema-clean, also verify the asset is reachable:

```bash
node scripts/validate-registry.mjs --check-assets
```

## 6. (Optional) Feature it

To highlight the plugin in the browser, add an entry to `registry/featured.json`:

```json
{
  "version": 1,
  "updated": "2026-05-17T00:00:00.000Z",
  "featured": [
    { "id": "my-plugin", "reason": "Streamlines deploys for the platform team." }
  ]
}
```

## 7. Commit and push

```bash
git add registry/
git commit -m "Add my-plugin v1.0.0"
git push
```

CI validates the registry on PRs. Once merged to `main`, Clubhouse clients will see the new plugin within ~5 minutes (the marketplace cache TTL), or immediately if they hit the refresh button in the Plugin Browser.

## Common mistakes

| Symptom                                                          | Fix                                                                                |
|------------------------------------------------------------------|------------------------------------------------------------------------------------|
| `Integrity check failed: expected X, got Y`                      | Your sha256 doesn't match the asset bytes. Recompute and update `registry.json`.   |
| `Downloaded plugin does not contain a manifest.json`             | The zip structure is wrong — `manifest.json` must be at the root (or one level deep). |
| Plugin doesn't appear after pushing                              | Hit the refresh button in the Plugin Browser to bypass the 5-minute cache.         |
| Plugin appears but fails to install                              | Check the asset URL is publicly readable (HEAD it from a curl).                    |
| `targets removed API version 0.5`                                | Rebuild your plugin against a supported SDK version (0.6+).                        |
