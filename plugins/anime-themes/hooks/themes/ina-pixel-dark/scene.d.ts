import type { Ending, Insets, Scene } from '../../../types'
import type { Hold } from './held.js'

export type { Grip, Hold } from './held.js'

/**
 * The whole backdrop for a scene state, as SVG markup. Asleep or waiting, Ina
 * does not move. `insets` keep the sprites clear of the app's side panels;
 * `hold` is what the corner tentacles hold, `HOLD` unless given; `festive`
 * dresses it for Christmas.
 */
export function draw(scene: Scene, insets?: Insets, hold?: Hold, festive?: boolean): string

/** Whether a session started at `ms` (epoch milliseconds), with this id, is festive: November or December, and one id in two. */
export function festiveSession(ms: number, id: string): boolean

/** What the corner tentacles hold, rolled once as the theme loads. */
export const HOLD: Hold

export const ASLEEP: Scene

// Each change takes an `id` naming it (a turn's, an agent's, a tool call's),
// which also picks the lines Ina says next.

/** The main agent starts a turn; with `now` (`$.clock.now()`), it opens with a show. */
export function wake(scene: Scene, id: string, now?: number): Scene
/** Work landed (a commit, a deploy, a merge) at `now`: Ina puts on a show, if she is at work and none is on. */
export function cheer(scene: Scene, id: string, now: number): Scene
/** When the scene's show ends, in milliseconds; `undefined` with none. */
export function showEnds(scene: Scene): number | undefined
/** A show is long over: it leaves the scene, settled as by any change. */
export function rest(scene: Scene): Scene
/** `after`, a change made from `before` at `now`, with any show still playing carried on into it. */
export function carry(before: Scene, after: Scene, now: number): Scene
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
/** Characters of Ina's lines the pixel font cannot draw: empty when every line can be drawn. */
export function missingGlyphs(): string[]
/** The markup of one of Ina's speech bubbles, as `draw` places it. */
export function speechMarkup(text: string, lift?: number): string
