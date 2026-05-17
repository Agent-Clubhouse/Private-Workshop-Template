# Updating

Three things you might want to update — each has a different flow.

## 1. Releasing a new version of an existing plugin

This is the most common case. You ship a new build of a plugin already in your registry.

1. **Build & zip** your new plugin version (see [ADDING-PLUGINS.md](ADDING-PLUGINS.md) steps 1-2)
2. **Create a GitHub Release** with the new zip (e.g. `my-plugin-v1.1.0`)
3. **Edit `registry/registry.json`** for that plugin's entry:
   - Add a new key inside `releases` for the new version
   - Update the top-level `latest` to point at the new version
   - Update the registry's `updated` timestamp

   ```json
   {
     "id": "my-plugin",
     "latest": "1.1.0",       ← bump
     "releases": {
       "1.0.0": { /* keep the old one for users who haven't updated */ },
       "1.1.0": {              ← add the new one
         "api": 0.7,
         "asset": "https://github.com/.../my-plugin-v1.1.0.zip",
         "sha256": "...",
         "permissions": ["logging", "storage"],
         "size": 13200
       }
     }
   }
   ```

4. **Validate**: `node scripts/validate-registry.mjs`
5. **Commit & push.** Clubhouse clients pick the update up within ~5 minutes; the Plugin Browser shows an "Update available" badge.

> **Keep old releases.** Don't delete the old `releases` keys — users on older host versions may still need them, and the marketplace history is useful. Clubhouse always installs the highest version compatible with the user's host API.

## 2. Removing a plugin

Delete the plugin's entry from `registry.json` and `featured.json` (if listed). Existing installs are not auto-uninstalled; new clients just won't see it in the browser anymore.

If you want to forcibly retire a plugin, leave a deprecation note in your team's docs — there's no client-side deprecation banner.

## 3. Pulling in upstream template improvements

This template will evolve — bug fixes to the validator, new doc sections, additions to the CI workflow. To stay in sync without losing your data:

```bash
# One-time setup
git remote add template https://github.com/Agent-Clubhouse/Private-Workshop-Template.git
git fetch template

# Periodically
git fetch template
git merge template/main
# Resolve any conflicts (almost always in README.md or scripts/)
```

Files you'll **rarely** want from upstream:

- `registry/registry.json` — your data; keep yours
- `registry/featured.json` — your data; keep yours
- `README.md` — you'll have customized this

Files you **probably** want from upstream:

- `scripts/validate-registry.mjs` — schema fixes, new validation rules
- `.github/workflows/validate-pr.yml` — CI improvements
- `docs/*` — better guidance

A common pattern: do `git merge template/main --no-commit`, then `git checkout HEAD -- registry/ README.md` to keep your versions of those, and commit the rest.

## How fast do updates reach clients?

| Action                                            | Latency                       |
|---------------------------------------------------|-------------------------------|
| Push to `main`                                    | 0s (GitHub raw is immediate)  |
| Clubhouse picks up registry change                | ≤5 minutes (cache TTL)        |
| Or immediately when the user opens the browser    | 0s (force refresh)            |
| Plugin update notification shows                  | Next periodic check or app restart |

If you need an instant rollout (security patch, broken build), tell users to:
- **Settings → Plugin Marketplaces → ⟳ Refresh**
- Or restart the app

There's no way for the registry to push a notification to clients — it's a pull model.
