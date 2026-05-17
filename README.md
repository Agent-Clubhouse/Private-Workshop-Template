# Clubhouse Private Workshop Template

**Host your own private plugin marketplace for [Clubhouse](https://github.com/Agent-Clubhouse/Clubhouse).** Fork this repo, point Clubhouse at your fork, and you've got an internal-only catalog of plugins for your team — with the same install, discover, and update flow as the [official Workshop](https://github.com/Agent-Clubhouse/Clubhouse-Workshop).

Use it for:

- **Internal plugins** that shouldn't live in the public registry
- **Pre-release builds** you want a small group to test
- **Curated mirrors** of public plugins your org has vetted
- **Customer-specific** plugin bundles

This template ships empty on purpose — add your plugins, push to GitHub, and you're done.

---

## How it works

Clubhouse's plugin marketplace is just a `registry.json` file fetched over HTTP. The official marketplace lives at:

```
https://raw.githubusercontent.com/Agent-Clubhouse/Clubhouse-Workshop/main/registry/registry.json
```

A **private marketplace** is the exact same thing, hosted in your own repo. You list the plugins, link to release zips, and Clubhouse handles fetching, integrity-checking, installing, and updating.

```
┌────────────────────────┐         ┌─────────────────────────┐
│   Your fork of this    │         │     Clubhouse app       │
│   template (GitHub)    │         │                         │
│                        │         │  Settings →             │
│  registry/             │ fetch   │   Plugin Marketplaces → │
│    registry.json    ◀──┼─────────┤   Add custom URL        │
│    featured.json       │         │                         │
│                        │         │  → Discover plugins     │
│  Releases:             │ download│  → Install              │
│   foo-v1.0.0.zip   ◀───┼─────────┤  → Auto-update          │
└────────────────────────┘         └─────────────────────────┘
```

---

## Quick start

### 1. Fork (or "Use this template")

Click **Use this template** at the top of the GitHub page (or fork normally). Give your repo a meaningful name like `acme-clubhouse-plugins` and make it **private** if that's the point.

> **Heads up:** if the repo is private, Clubhouse needs to be able to read `registry.json` and the release zip assets. The simplest way is to make those individual files public via a download proxy, but for most internal use cases a **public repo with un-listed plugin asset URLs** is fine — plugin zips contain only the bundled JS your team would install anyway. See [docs/PRIVATE-REPOS.md](docs/PRIVATE-REPOS.md) for options.

### 2. Clone your fork and update the placeholders

```bash
git clone https://github.com/<your-org>/<your-repo>.git
cd <your-repo>
```

Edit `registry/registry.json` and change the `name` / `description` placeholders to identify your marketplace. The `plugins` array starts empty — that's expected.

### 3. Get your marketplace URL

It's the raw URL to `registry/registry.json` on your default branch:

```
https://raw.githubusercontent.com/<your-org>/<your-repo>/main/registry/registry.json
```

You can paste either that full URL or just `https://raw.githubusercontent.com/<your-org>/<your-repo>/main/registry/` — Clubhouse will append `registry.json` if you omit it.

### 4. Add it to Clubhouse

In the Clubhouse app:

1. Open **Settings → Plugin Marketplaces**
2. Click **Add custom marketplace**
3. Give it a name (e.g. "Acme Internal") and paste your URL
4. Click **Save**

Plugins from your marketplace now appear in the Plugin Browser alongside the official ones, tagged with your marketplace name.

### 5. Add your first plugin

See [docs/ADDING-PLUGINS.md](docs/ADDING-PLUGINS.md) for the full walkthrough. The TL;DR is:

1. Build your plugin (using the [official Workshop](https://github.com/Agent-Clubhouse/Clubhouse-Workshop) tools — `npx create-clubhouse-plugin`)
2. Create a GitHub Release in this repo with a zip of `manifest.json` + `dist/main.js` + `README.md`
3. Add an entry to `registry/registry.json` pointing at the release asset, with its sha256
4. Push — Clubhouse picks up the new plugin within the cache TTL (5 min) or on the next manual refresh

---

## What's in this repo

```
.
├── README.md                 ← you are here
├── LICENSE
├── registry/
│   ├── registry.json         ← the plugin catalog Clubhouse reads
│   └── featured.json         ← optional curated highlights
├── plugins/                  ← (optional) check plugin sources in here
├── docs/
│   ├── ADDING-PLUGINS.md     ← step-by-step: publishing a plugin
│   ├── UPDATING.md           ← step-by-step: releasing a new version
│   ├── PRIVATE-REPOS.md      ← serving from a private repo
│   └── SCHEMA.md             ← every field in registry.json explained
├── scripts/
│   └── validate-registry.mjs ← CI-friendly schema validator
└── .github/
    └── workflows/
        └── validate-pr.yml   ← runs the validator on every PR
```

You don't have to keep plugin source in this repo — the registry only needs the **release asset URL**, which can live anywhere GitHub Releases (or any other HTTP host) can serve it. Most teams will keep plugin source in separate repos and use this one purely as a catalog.

---

## Updating

You'll keep this template up to date with two flows:

| Flow                                     | What you do                                                                          |
|------------------------------------------|--------------------------------------------------------------------------------------|
| Adding a brand-new plugin                | Append an entry to `registry.json`, push                                             |
| Releasing a new version of a plugin      | Add the new version under `releases`, bump `latest`, push                            |
| Pulling in upstream template improvements| `git remote add template <this-template-url>` + `git pull template main` periodically|

See [docs/UPDATING.md](docs/UPDATING.md) for details.

---

## Validation

Before pushing changes, validate locally:

```bash
node scripts/validate-registry.mjs
```

This checks:

- `registry.json` is valid JSON matching the schema
- Each plugin's `latest` exists in `releases`
- Plugin IDs are unique and follow `[a-z0-9-]+`
- Each release has an asset URL, sha256, and permissions array
- (with `--check-assets`) every asset URL is reachable

The bundled GitHub Actions workflow runs this automatically on every PR.

---

## Sharing with your team

Once your marketplace is up, give teammates a one-liner to add it:

> Open Clubhouse → Settings → Plugin Marketplaces → Add custom → paste:
> `https://raw.githubusercontent.com/<your-org>/<your-repo>/main/registry/registry.json`

That's all they need. New plugins and updates show up in their app automatically.

---

## FAQ

**Do I have to host the plugin source in this repo?**
No. The registry only points at release zips. Keep plugin source wherever you like.

**Can I mirror plugins from the official Workshop?**
Yes — copy entries from [the public registry](https://github.com/Agent-Clubhouse/Clubhouse-Workshop/blob/main/registry/registry.json) into yours. Updates won't auto-flow; you control when they land for your team.

**What if I want to override an official plugin with a custom build?**
Clubhouse's marketplace merge gives precedence to the **official** registry on ID conflicts. To override, give your build a distinct ID (e.g. `acme-pomodoro` instead of `pomodoro`).

**How fast do my changes propagate to clients?**
The marketplace cache TTL is 5 minutes. Users can force-refresh from the Plugin Browser to skip the cache.

**Can I use this without GitHub?**
Yes — `registry.json` can be hosted anywhere reachable over HTTPS. The defaults assume GitHub because it's the easiest path; nothing in the schema is GitHub-specific.

---

## Related

- [Clubhouse](https://github.com/Agent-Clubhouse/Clubhouse) — the host app
- [Clubhouse-Workshop](https://github.com/Agent-Clubhouse/Clubhouse-Workshop) — the public marketplace and plugin SDK
- [Plugin SDK docs](https://github.com/Agent-Clubhouse/Clubhouse-Workshop/wiki) — building plugins

---

## License

[MIT](LICENSE) — fork freely, modify freely.
