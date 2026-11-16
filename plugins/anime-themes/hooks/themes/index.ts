import type { EngineInterface, Register } from 'claude-code'

import { ina, registerIna, startIna } from './ina-pixel-dark'
import type { Theme } from './theme.js'

/**
 * Every theme the switcher offers, in the order it lists them. To add one: write
 * `themes/<id>/index.tsx` exporting a `Theme` and its `register<Name>`, then list
 * the theme here and call its register in `registerThemes`.
 */
export const THEMES: readonly Theme[] = [ina]

/** Adds each theme's own hooks. */
export const registerThemes: Register = (on, options) => {
  registerIna(on, options)
}

/** Each theme's part of a session starting. */
export async function startThemes($: EngineInterface) {
  await startIna($)
}

/** What a session starts on until the person picks. */
export const DEFAULT = 'ina-pixel-dark'

/** The theme a name or alias picks, ignoring case; a name that picks none is `undefined`. */
export const find = (name: string): Theme | undefined => {
  const word = name.trim().toLowerCase()

  return THEMES.find(theme => theme.id === word || theme.aliases.includes(word))
}
