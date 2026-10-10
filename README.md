# claude-mods

Hunter's Claude Code mods, served as the `hunters-mods` plugin marketplace.

## Install

In a Claude Code terminal session:

```
/plugin marketplace add hmcdaniel03/claude-mods
/plugin install model-badge@hunters-mods
```

The first line adds this repository as a marketplace; the second installs a mod from it. Swap `model-badge` for any mod below.

## Mods

| Mod | What it does |
| --- | --- |
| [model-badge](plugins/model-badge) | Compact badge with the current model and effort in the footer's right corner |

## Contributing a mod

1. Add the mod in its own directory under `plugins/<mod-name>/`, with its `.claude-plugin/plugin.json` named `<mod-name>`.
2. Add an entry to `.claude-plugin/marketplace.json`:

   ```json
   { "name": "<mod-name>", "source": "./plugins/<mod-name>", "description": "<one line>" }
   ```

3. Check it: `claude plugin validate ./plugins/<mod-name>`, `claude plugin validate .` and `claude plugin test ./plugins/<mod-name>`.
4. Add the mod to the table above and open a pull request.

## License

[MIT](LICENSE)
