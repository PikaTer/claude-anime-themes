// Ina's two corner tentacles, one hanging from the top and one rising from the
// bottom. Now and then one holds a takodachi: wrapped in its tip, or riding it.

import { curls, px, pxr, spine, tentacle } from './pixels.js'
import { BAUBLES, BAUBLE_SIZE } from './xmas.js'

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

/** A tentacle that leaves its curve at `from` to loop round, its walk, and the loop's middle in its own steps. */
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

  return { art: tentacle(steps, turn), walk: spine(steps, turn), x: x + RADIUS * Math.cos(heading - Math.PI / 2), y: y + RADIUS * Math.sin(heading - Math.PI / 2) }
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
// Festive: baubles hang down from each tentacle's lower edge, every SPACING
// steps from the FIRST, clear of the root and the tip, and of a held takodachi's
// box (24 x 20 where it rides, centred on the loop where it wraps). A wrapped
// tentacle has them only before its loop. Each is a `<use>` of a sprite drawn once.
const SPACING = 14
const FIRST = 12
const [BAUBLE_W, BAUBLE_H] = BAUBLE_SIZE

/** The baubles for one tentacle's `walk`: `hang` for the one from the top, stopping at step `until`, clear of `avoid` (x0, y0, x1, y1). */
function baubles(walk, { hang, until = Infinity, avoid = null }) {
  // A raw spine point in the art's frame: the art is shifted 7 left of its corner.
  const at = (x, y) => [Math.round(x) - 7, hang ? -Math.round(y) : Math.round(y) - 1]
  // Down the screen, whichever edge of the tentacle faces it.
  const edge = (p, side) => [p.x + side * (p.thick - 0.4) * Math.cos(p.heading + Math.PI / 2), p.y + side * (p.thick - 0.4) * Math.sin(p.heading + Math.PI / 2)]
  const drop = (p, side) => (hang ? -1 : 1) * (edge(p, side)[1] - p.y)

  return walk
    .filter(p => p.t > 0.07 && p.t < 0.86 && p.i >= FIRST && (p.i - FIRST) % SPACING === 0 && p.i < until)
    .map((p, n) => {
      const [x, y] = at(...edge(p, drop(p, 1) > drop(p, -1) ? 1 : -1))

      return { color: (n + 1) % BAUBLES, x: x - Math.floor(BAUBLE_W / 2), y }
    })
    .filter(({ x, y }) => avoid === null || !(x < avoid[2] && x + BAUBLE_W > avoid[0] && y < avoid[3] && y + BAUBLE_H > avoid[1]))
    .map(({ color, x, y }) => `<use href="#bb${color}" x="${x}" y="${y}"/>`)
    .join('')
}

// A held takodachi's box, from where AT puts it.
const rideBox = ([x, y]) => [x, y, x + 24, y + 20]
const wrapBox = ([x, y]) => [x - 12, y - 11, x + 12, y + 9]
const LOW_WALK = spine(LOW.length, LOW.bend)
const HIGH_WALK = spine(HIGH.length, HIGH.bend)
const BAUBLE_ART = {
  low: {
    none: baubles(LOW_WALK, { hang: false }),
    ride: baubles(LOW_WALK, { hang: false, avoid: rideBox([-54, -72]) }),
    wrap: baubles(lowWrap.walk, { hang: false, until: LOW.from, avoid: wrapBox([Math.round(lowWrap.x - 7), Math.round(lowWrap.y - 1)]) }),
  },
  high: {
    none: baubles(HIGH_WALK, { hang: true }),
    ride: baubles(HIGH_WALK, { hang: true, avoid: rideBox([-39, 28]) }),
    wrap: baubles(highWrap.walk, { hang: true, until: HIGH.from, avoid: wrapBox([Math.round(highWrap.x - 7), Math.round(-highWrap.y)]) }),
  },
}

// The hanging takodachi's arms, raised to hold on.
const ARMS_UP = px(['TT', 'TT', 'oo'], 6, 1) + px(['TT', 'TT', 'oo'], 16, 1)

/**
 * Both tentacles as `hold` has them, in Ina's units from their corners. A held
 * takodachi bobs only while Ina is `awake`, has cat ears with `ears`, and a
 * Santa hat when `festive`, which also hangs baubles on the tentacles.
 */
export function tentacles(hold, { awake = false, ears = false, festive = false } = {}) {
  const tako = (at, extra = '') => {
    const body = `<use href="#tako"/>${ears ? '<use href="#cear"/>' : ''}${festive ? '<use href="#xh"/>' : ''}${extra}`

    return `<g class="hold" transform="${at}">${awake ? `<g class="on"><g class="bob">${body}</g></g>` : body}</g>`
  }
  const wrapped = at => tako(at).replace(/^(<g[^>]*>)(.*)<\/g>$/, '$1<g class="hk"><g transform="translate(-12 -11)">$2</g></g></g>')
  // Baubles over the tentacle, but a takodachi riding the low one is over them.
  const hung = (side, grip) => (festive ? BAUBLE_ART[side][grip] : '')
  const low = {
    none: ART.low + hung('low', 'none'),
    wrap: wrapped(AT.lowWrap) + ART.lowWrap + hung('low', 'wrap'),
    ride: ART.low + hung('low', 'ride') + tako(AT.lowRide),
  }
  const high = {
    none: ART.high + hung('high', 'none'),
    wrap: wrapped(AT.highWrap) + ART.highWrap + hung('high', 'wrap'),
    ride: tako(AT.highRide, ARMS_UP) + ART.high + hung('high', 'ride'),
  }

  return { high: high[hold.high], low: low[hold.low] }
}
