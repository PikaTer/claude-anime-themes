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
  /** `in` and `out` play once, as the scene is next drawn. */
  phase: 'in' | 'on' | 'out'
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
  takos: Tako[]
}

/** How far in from the window's left and right edges the sprites stand, in pixels. */
export type Insets = { left: number; right: number }

declare module 'claude-code' {
  interface PluginState {
    'anime-themes': { 'ina-scene': Shaped<Scene>; 'ina-insets': Insets }
  }
}
