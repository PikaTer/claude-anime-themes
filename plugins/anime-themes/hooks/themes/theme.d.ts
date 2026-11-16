import type { ThemeSetArgs } from 'claude-code'

/**
 * One theme the switcher offers. The session has a single theme at a time and a
 * scene is drawn only for the plugin that set it, so every theme lives in this
 * plugin: `look` is what `$.theme.set` is given. A theme with a scene of its own
 * also exports a `register<Name>` function with its hooks (turn events, commands,
 * the `Backdrop` drawing), which `themes/index.ts` calls.
 */
export type Theme = {
  /** What `/anime-theme <id>` names, as it is stored. Letters, digits and `-`. */
  id: string
  /** Other names `/anime-theme` takes for it. */
  aliases: readonly string[]
  /** The name shown in lists. */
  label: string
  /** One line on what it looks like. */
  blurb: string
  /** A few hex colors, drawn as a strip in the list. */
  swatch: readonly string[]
  /** The whole theme, for `$.theme.set`. */
  look: ThemeSetArgs
  /** Set when a client would refuse to paint the colors: shown to the person. */
  warning?: string
}
