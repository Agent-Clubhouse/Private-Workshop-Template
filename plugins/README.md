# plugins/

This folder is optional. Use it if you want to keep plugin source code colocated with the registry (mirrors the layout of the [public Workshop](https://github.com/Agent-Clubhouse/Clubhouse-Workshop/tree/main/plugins)).

```
plugins/
├── my-plugin/
│   ├── manifest.json
│   ├── src/
│   ├── dist/main.js
│   └── package.json
└── another-plugin/
    └── ...
```

You don't have to use this layout — `registry.json` only cares about the **release asset URL**, which can point at a zip anywhere on the internet. Many teams keep plugin source in separate repos.

If you do colocate, build each plugin with its own `npm run build`, then zip + upload to a GitHub Release in this repo as described in [docs/ADDING-PLUGINS.md](../docs/ADDING-PLUGINS.md).
