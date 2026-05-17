# Serving from a Private Repo

By default, Clubhouse fetches your marketplace over plain HTTPS — no auth headers, no tokens. The `raw.githubusercontent.com` URL has to return a 200 to an unauthenticated request.

That means a strictly **private GitHub repo will not work** out of the box. You have a few options.

## Option 1 (recommended for most teams): public repo, internal-only knowledge

A public GitHub repo containing only:

- `registry.json` (text — a list of plugin IDs and release URLs)
- `featured.json`
- Documentation

…isn't really sensitive. Anyone who finds it sees the same thing they'd see browsing your GitHub releases page. The **plugin zip assets** are the actual code; if those are attached to public GitHub Releases, they're already discoverable.

If your plugins aren't secret code (most internal plugins aren't — they're glue, integrations, and UI tweaks), a public marketplace repo is the simplest path.

## Option 2: private repo + raw-content proxy

If the registry itself must be private (e.g., the plugin names leak product strategy), put a small proxy in front of it.

Run a Cloudflare Worker / Vercel function / Pages function that:

1. Receives the registry request
2. Authenticates the caller (shared secret in a header, IP allowlist, mTLS, etc.)
3. Pulls `registry.json` from your private repo using a fine-grained GitHub PAT
4. Streams the response back

Then the URL you give Clubhouse points at your proxy. Same goes for the asset zips — proxy those too if they need to stay private.

This is more setup but gives you proper access control.

## Option 3: self-host the JSON

Skip GitHub entirely for the registry. Host `registry.json` on:

- An S3 bucket with a public-read object
- An internal CDN
- A static site behind your VPN (works if clients are on the network)
- Any HTTPS endpoint that returns the right JSON

Same for the release zips — anything reachable over HTTPS works as an asset URL.

## Option 4: GitHub Pages with org SSO

For some GitHub Enterprise plans you can publish a private Pages site that requires GitHub auth. Clubhouse can't currently follow SSO redirects, so this works only if the user's session is shared — usually not the case for an Electron app fetching a URL.

In practice this option doesn't work for most teams; it's listed for completeness.

## What about the asset zips themselves?

Even if `registry.json` is public, the **asset URLs** still need to be reachable. Options:

- **Public GitHub Release assets** — easiest, but anyone with the URL can download
- **Private S3 with presigned URLs** — rotate the URLs by updating `registry.json` periodically
- **Authenticated proxy** as in Option 2 — gives you full control

Clubhouse always verifies sha256, so an attacker who finds an asset URL can't swap in a malicious zip — they'd need to compromise both the URL host and the registry.

## Recommended baseline

For most internal use cases:

- Public marketplace repo (this template)
- Public GitHub Release assets
- Don't publicize the marketplace URL outside your org

That's enough security for the threat model of "we don't want our internal tools listed in the public Workshop browser." It's not enough if your plugins contain secrets or proprietary code — in which case you want Option 2 or 3.
