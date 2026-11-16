# claude-anime-themes

A Claude Code plugin marketplace of anime-inspired themes.

| Plugin | What it is |
| --- | --- |
| `ina-pixel-dark` | Purple on black, with a pixel Ina who naps while idle, works in nerd glasses, and a takodachi for every subagent |

## Requirements

The themes are Claude Code mods (a `hooks.json` that loads a hooks module), so they need a Claude Code release that supports mods, such as the desktop app's current build. Older CLIs reject them as an invalid plugin; update with `claude update`.

## Install

At the prompt of a terminal session:

```
/plugin install ina-pixel-dark --marketplace PikaTer/claude-anime-themes
```

From a shell:

```bash
claude plugin install ina-pixel-dark --marketplace PikaTer/claude-anime-themes
```

Answer `y` to add the marketplace, then pick a scope.

## Staying up to date

Plugins here carry no pinned `version`, so every commit on `main` is a new version.

- Pull the latest now: `claude plugin marketplace update claude-anime-themes`, then `claude plugin update ina-pixel-dark`, then `/reload-plugins`.
- Automatic: in `/plugin`, open the **Marketplaces** tab, select `claude-anime-themes` and enable auto-update. Claude Code then refreshes it at startup.

## Developing

Clone the repo and add the folder as a marketplace so edits apply without pushing:

```bash
git clone https://github.com/PikaTer/claude-anime-themes.git
claude plugin marketplace add ./claude-anime-themes
claude plugin install ina-pixel-dark --marketplace claude-anime-themes
```

Edit `plugins/ina-pixel-dark/`, run `/reload-plugins`, and when happy, `git push`.

Adding another theme: create `plugins/<name>/` with `.claude-plugin/plugin.json` and `hooks/`, then add an entry to `.claude-plugin/marketplace.json`.

## License

See [LICENSE](LICENSE).
