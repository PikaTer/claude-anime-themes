export type Tako = {
  /** The subagent's id. */
  id: string
  /** Which spot on the left it took, so no two share one. */
  cell: number
  /** Where it sits: art pixels from the left edge, percent from the top. */
  x: number
  y: number
  kind: 'laptop' | 'cookie'
  /** How it arrives and how it goes. */
  enter: 'circle' | 'tentacle' | 'pop' | 'fall' | 'ink'
  exit: 'circle' | 'tentacle' | 'ascend' | 'ink' | 'sink'
  /** Fern's staff: it joined while Frieren Ina was out. */
  staff: boolean
  /** Cat ears: it joined while cat Ina was out. */
  ears: boolean
  /** `in` and `out` play once, as the scene is next drawn. */
  phase: 'in' | 'on' | 'out'
}

/**
 * A show: a gold trophy or Ao-chan's world domINAtion for nerd Ina, Zoltraak
 * for Frieren Ina. Times are milliseconds, as `$.clock.now()` gives them.
 */
export type Show = {
  kind: 'trophy' | 'ao' | 'zoltraak'
  /** When it starts: after a wake's greeting, it can be ahead of `now`. */
  at: number
  /** When the scene holding it was made, so a redraw picks the show up where it is. */
  now: number
  /** Zoltraak's: at the takodachis, or at the sky when none is on screen. Settled once it fires. */
  aim?: 'left' | 'up'
}

/** How the main turn ended: on a question, done, interrupted, or on an error. */
export type Ending = 'ask' | 'done' | 'stop' | 'oops'

export type Scene = {
  /** `wake` and `doze` are the transitions into `work` and `sleep`; `wait` holds still for the person. */
  ina: 'sleep' | 'wake' | 'work' | 'wait' | 'doze'
  /** What just happened, which picks what she says. */
  cue: 'none' | 'join' | 'leave' | 'wait' | 'back' | Ending
  /** Changes with every change of scene: which of her lines come up. */
  seed: number
  /** Who is out: nerd Ina, Frieren Ina (one wake in four), or cat Ina, Ninyomanyo Ninya'nis (about one in five). */
  form: 'nerd' | 'frieren' | 'cat'
  /** Frieren Ina's face this turn; `plain` for nerd Ina. */
  face: 'plain' | 'smug' | 'cute'
  /** The ends of her hair, rolled as she wakes from sleep and kept till she next does. */
  hair: 'classic' | 'flick' | 'curl' | 'long' | 'split' | 'flared'
  /** Ao-chan, Ina's grimoire, came this turn: one wake in five. */
  ao: boolean
  /** The show Ina puts on as work lands (a commit, a deploy, a merge), while it plays. */
  special: Show | null
  takos: Tako[]
}

/** How far in from the window's left and right edges the sprites stand, in pixels. */
export type Insets = { left: number; right: number }

/** What the switcher holds: the theme kept (an id, or `off`) and the one being previewed. */
export type Choice = { kept: string; trying: string | null }

declare module 'claude-code' {
  interface PluginState {
    'anime-themes': { 'ina-scene': Shaped<Scene>; 'ina-insets': Insets; choice: Choice }
  }
}
