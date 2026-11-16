import type { Ending, Insets, Scene } from '../../../types'

/**
 * The whole backdrop for a scene state, as SVG markup. Asleep or waiting, Ina
 * does not move. `insets` keep the sprites clear of the app's side panels.
 */
export function draw(scene: Scene, insets?: Insets): string

export const ASLEEP: Scene

// Each change takes an `id` naming it (a turn's, an agent's, a tool call's),
// which also picks the lines Ina says next.

/** The main agent starts a turn. */
export function wake(scene: Scene, id: string): Scene
/** The main agent's turn ends. */
export function doze(scene: Scene, id: string, cue?: Ending): Scene
/** A question is put to the person mid-turn: Ina holds still until `resume`. */
export function ask(scene: Scene, id: string): Scene
/** The person answered. */
export function resume(scene: Scene, id: string): Scene
/** A subagent starts a run. */
export function join(scene: Scene, id: string): Scene
/** A subagent's run ends. */
export function leave(scene: Scene, id: string): Scene
