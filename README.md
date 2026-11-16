# claude-anime-themes

A Claude Code plugin marketplace of anime-inspired themes. One plugin, `anime-themes`, holds every theme and a command to switch between them.

| Theme | What it is |
| --- | --- |
| `ina-pixel-dark` | Purple on black, with a pixel Ina who naps while idle, works in nerd glasses, and a takodachi for every subagent |

## Requirements

The themes are Claude Code mods (a `hooks.json` that loads a hooks module), so they need a Claude Code release that supports mods, such as the desktop app's current build. Older CLIs reject them as an invalid plugin; update with `claude update`. Themes are drawn by the desktop and mobile apps; the terminal and editors keep their own look.

## Install

At the prompt of a terminal session:

```
/plugin install anime-themes --marketplace PikaTer/claude-anime-themes
```

From a shell:

```bash
claude plugin install anime-themes --marketplace PikaTer/claude-anime-themes
```

Answer `y` to add the marketplace, then pick a scope. The first theme in the list goes up on its own.

## Switching themes

Type `/anime-theme` in any session.

| Command | What it does |
| --- | --- |
| `/anime-theme` | Lists the themes, each with a strip of its colors, and which one is kept |
| `/anime-theme preview <theme>` | Puts the theme up live, then asks Keep or Revert. Nothing is saved until you keep it |
| `/anime-theme <theme>` | Switches to the theme and keeps it for later sessions |
| `/anime-theme keep` | Keeps the theme you are previewing, if the dialog was dismissed |
| `/anime-theme revert` | Goes back to what you had before the preview |
| `/anime-theme off` | Back to the app's own look, and stays that way |

A preview never outlives its session: reload or restart and you are on the kept theme again. Ina's sprites have their own command, `/ina-insets <left> <right>`, to stand clear of the side panels.

## Staying up to date

The plugin carries no pinned `version`, so every commit on `main` is a new version.

- Pull the latest now: `claude plugin marketplace update claude-anime-themes`, then `claude plugin update anime-themes`, then `/reload-plugins`.
- Automatic: in `/plugin`, open the **Marketplaces** tab, select `claude-anime-themes` and enable auto-update. Claude Code then refreshes it at startup.

## Developing

Clone the repo and add the folder as a marketplace, so edits apply without pushing:

```bash
git clone https://github.com/PikaTer/claude-anime-themes.git
claude plugin marketplace add ./claude-anime-themes
claude plugin install anime-themes --marketplace claude-anime-themes
```

Edit `plugins/anime-themes/`, run `/reload-plugins`, and when happy, `git push`. Run the checks with `claude plugin validate plugins/anime-themes` and `claude plugin test plugins/anime-themes`.

### Adding a theme

The session has one theme at a time, and a scene is drawn only for the plugin that set it, so every theme lives inside `anime-themes` rather than in a plugin of its own.

1. Write `plugins/anime-themes/hooks/themes/<id>/index.tsx`. Export a `Theme` (see `themes/theme.d.ts`: `id`, `aliases`, `label`, `blurb`, `swatch`, `look`) and, if it has a scene or commands, a `register<Name>` function with its hooks. Build `look.colors` with `makeColors`, as the Ina theme does.
2. In `hooks/themes/index.ts`, add the theme to `THEMES` and call its register in `registerThemes`.
3. Add it to the table above and run the checks.

## License

See [LICENSE](LICENSE).
