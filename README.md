# claude-anime-themes

A Claude Code plugin marketplace of anime-inspired themes. One plugin, `anime-themes`, holds every theme and a command to switch between them.

| Theme | What it is |
| --- | --- |
| `ina-pixel-dark` | Purple on black, with a pixel Ina who naps while idle, works in nerd glasses, and a takodachi for every subagent. On one turn in four a summoning circle brings Frieren Ina instead, and her takodachis carry Fern's staff. On about one turn in six, Ina wakes with an "INYA?!?" and turns into cat Ina, Ninyomanyo Ninya'nis: cat ears pop up, the circle turns into a heart, she says everything nyanified, and her takodachis and Ao-chan get cat ears too. On one turn in five Ao-chan, Ina's grimoire, rises out of the circle to keep her company. When work lands (a commit, a deploy or a merge, asked for or run), Ina puts on a show: another gold trophy as the takodachis put on sunglasses, Ao-chan rising for world domINAtion as they cower and bow (or, with cat Ina, rising in hearts for world domINYAtion as they swoon with heart eyes), or, from Frieren Ina, Zoltraak while they raise magic barriers |

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

Type `/anime-theme` in any session. It opens a panel with every theme, each with a strip of its colors and two buttons:

- **Preview** puts the theme up live. Nothing is saved yet.
- **Apply** keeps the theme for later sessions and closes the panel.
- **Revert** (shown while previewing) goes back to what you had. **Off** returns to the app's own look and stays that way. **Close**, or Esc, closes the panel and undoes a preview you did not apply.

The same actions work as typed commands:

| Command | What it does |
| --- | --- |
| `/anime-theme` | Opens the picker panel |
| `/anime-theme list` | Lists the themes, each with a strip of its colors, and which one is kept |
| `/anime-theme preview <theme>` | Puts the theme up live, then asks Keep or Revert in a dialog |
| `/anime-theme <theme>` | Switches to the theme and keeps it for later sessions |
| `/anime-theme keep`, `/anime-theme revert` | Settle a preview that is still up |
| `/anime-theme off` | Back to the app's own look, and stays that way |

A preview never outlives its session: reload or restart and you are on the kept theme again. Where no panel can open, such as a headless run, `/anime-theme` prints the list instead. (The terminal opens the panel too, but only the desktop and mobile apps draw the theme itself.) Ina's sprites have their own command, `/ina-insets <left> <right>`, to stand clear of the side panels.

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
