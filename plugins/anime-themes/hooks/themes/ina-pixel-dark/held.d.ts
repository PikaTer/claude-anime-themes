/** What one corner tentacle holds: nothing, a takodachi wrapped in its tip, or one riding it. */
export type Grip = 'none' | 'wrap' | 'ride'
/** What the tentacle from the top (`high`) and the one from the bottom (`low`) hold. */
export type Hold = { high: Grip; low: Grip }

/** Each tentacle rolled on its own: one in five wrap, one in five ride, otherwise nothing. */
export function rollHold(random?: () => number): Hold

/**
 * Both tentacles as `hold` has them, as markup in Ina's units from their corners.
 * A held takodachi bobs only while Ina is `awake`, and has cat ears with `ears`.
 */
export function tentacles(hold: Hold, how?: { awake?: boolean; ears?: boolean }): { high: string; low: string }
