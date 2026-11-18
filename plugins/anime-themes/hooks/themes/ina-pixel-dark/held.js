// Ina's two corner tentacles, one hanging from the top and one rising from the
// bottom. Now and then one holds a takodachi: wrapped in its tip, or riding it.

import { curls, px, pxr, tentacle } from './pixels.js'

/** What each tentacle holds, rolled on its own: one in five wrap, one in five ride. */
export function rollHold(random = Math.random) {
  const grip = () => {
    const roll = random()

    return roll < 0.2 ? 'wrap' : roll < 0.4 ? 'ride' : 'none'
  }
  const high = grip()

  return { high, low: grip() }
}

// Each tentacle: how long, how it sways and curls, and where a wrapped tip leaves
// that curve to loop round a takodachi.
const LOW = { length: 110, bend: curls(0.4, 7), from: 62 }
const HIGH = { length: 70, bend: curls(0.35, 8), from: 36 }
// The loop's radius, and how far round it the tip goes.
const RADIUS = 10.5
const AROUND = 5.4

// Rows to markup with the root at the right edge, 7 in: rising from the foot,
// or hung from the top.
const rising = ({ rows, root }) => pxr(rows, -root - 7, -rows.length)
const hanging = ({ rows, root }) => pxr(rows.toReversed(), -root - 7, 0)

/** A tentacle that leaves its curve at `from` to loop round, and the loop's middle in its own steps. */
function wrapping({ length, bend, from }) {
  const steps = from + Math.round(RADIUS * AROUND)
  const turn = t => {
    const i = t * steps

    return i < from ? bend(i / length) : bend(from / length) + (i - from) / RADIUS
  }
  // The spine as `tentacle` walks it, to find where the loop is.
  let [x, y, heading] = [0, 0, 0]

  for (let i = 0; i <= from; i++) {
    heading = -Math.PI / 2 - turn(i / steps)
    if (i < from) {
      x += Math.cos(heading)
      y += Math.sin(heading)
    }
  }

  return { art: tentacle(steps, turn), x: x + RADIUS * Math.cos(heading - Math.PI / 2), y: y + RADIUS * Math.sin(heading - Math.PI / 2) }
}

const lowWrap = wrapping(LOW)
const highWrap = wrapping(HIGH)
const ART = {
  low: rising(tentacle(LOW.length, LOW.bend)),
  high: hanging(tentacle(HIGH.length, HIGH.bend)),
  lowWrap: rising(lowWrap.art),
  highWrap: hanging(highWrap.art),
}
// Where each held takodachi goes, in whole pixels of Ina's. Wrapped, its middle
// (12, 11 of its 24 x 20 grid) sits on the loop's, shrunk by the scene's `.hk`
// to its usual size; riding, it is Ina's size, sat on the low arch or hung from
// the high one.
const AT = {
  lowWrap: `translate(${Math.round(lowWrap.x - 7)} ${Math.round(lowWrap.y - 1)})`,
  highWrap: `translate(${Math.round(highWrap.x - 7)} ${Math.round(-highWrap.y)})`,
  lowRide: 'translate(-54 -72)',
  highRide: 'translate(-39 28)',
}
// The hanging takodachi's arms, raised to hold on.
const ARMS_UP = px(['TT', 'TT', 'oo'], 6, 1) + px(['TT', 'TT', 'oo'], 16, 1)

/**
 * Both tentacles as `hold` has them, in Ina's units from their corners. A held
 * takodachi bobs only while Ina is `awake`, and has cat ears with `ears`.
 */
export function tentacles(hold, { awake = false, ears = false } = {}) {
  const tako = (at, extra = '') => {
    const body = `<use href="#tako"/>${ears ? '<use href="#cear"/>' : ''}${extra}`

    return `<g class="hold" transform="${at}">${awake ? `<g class="on"><g class="bob">${body}</g></g>` : body}</g>`
  }
  const wrapped = at => tako(at).replace(/^(<g[^>]*>)(.*)<\/g>$/, '$1<g class="hk"><g transform="translate(-12 -11)">$2</g></g></g>')
  const low = { none: ART.low, wrap: wrapped(AT.lowWrap) + ART.lowWrap, ride: ART.low + tako(AT.lowRide) }
  const high = { none: ART.high, wrap: wrapped(AT.highWrap) + ART.highWrap, ride: tako(AT.highRide, ARMS_UP) + ART.high }

  return { high: high[hold.high], low: low[hold.low] }
}
