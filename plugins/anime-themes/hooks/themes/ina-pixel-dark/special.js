// The shows Ina puts on when work lands: a commit, a deploy, a merge. Nerd Ina
// wins another gold trophy, or Ao-chan rises over her for world domINAtion;
// Frieren Ina casts Zoltraak. Every takodachi reacts. Ina's parts are in the
// head's own grid (42 x 32, its middle at 21, 16), a takodachi's in its 24 x 20
// grid, as `scene.js` draws them. Everything is timed from `--x`, the moment
// the show starts, which is negative when a redraw comes in partway through.

import { AO_AT, AO_CLOSED, AO_OPEN } from './ao.js'
import { aoCat } from './cat.js'
import { grid, line, mirror, plot, px, round, rows } from './pixels.js'
import { XMAS_SHOW, aoRibbon, presentArt } from './xmas.js'

/** How long a show lasts, in seconds. */
export const SHOW = 7

/** What Ina says in each show. `{` and `}` mark letters drawn in Ao-chan's pink. */
export const SHOW_SAY = {
  trophy: "ANOTHER\nGOLD TROPHY\nFOR NINOMAE\nINA'NIS!",
  ao: 'WORLD\nDOM{INA}TION',
  zoltraak: 'ZOLTRAAK!!!',
}
/** What cat Ina says in hers: her own name, and a world domination of love. */
export const SHOW_SAY_CAT = {
  trophy: "ANOTHER\nGOLD TROPHY\nFOR NINYOMANYO\nNINYA'NIS!",
  ao: 'WORLD\nDOM{INYA}TION',
}

/** A moment of the show, `s` seconds in. */
const at = s => `calc(var(--x) + ${s}s)`
/** The same, a takodachi's own beat later. */
const atk = s => `calc(var(--x) + ${s}s + var(--k))`

// The gold trophy, over Ina's head: a cup with handles, a gem in the middle,
// and a plaque on its foot.
const TROPHY = mirror([
  '....oooooooo',
  '...oJJJJJJJJ',
  '.ooojjjjjjjj',
  'oJJojjjjjjjY',
  'oJ.ojjjjjjYJ',
  'oJ.ojjjjjjYJ',
  'oJ.ojjjjjjjY',
  '.oJojjjjjjjj',
  '..oojjjjjjjj',
  '....ojjjjjjj',
  '.....ojjjjjj',
  '......oojjjj',
  '........ojjj',
  '.........ojj',
  '.........ojj',
  '........ojJj',
  '.......ojjjj',
  '......oooooo',
  '.....oqqqqqq',
  '.....oqqYYYY',
  '.....oqqqqqq',
  '....oooooooo',
  '....oqqqqqqq',
  '....oooooooo',
])
const TRO_AT = [9, -28]
// Festive, the present stands this much higher: Ina's Santa hat reaches up to meet it.
const PRESENT_LIFT = 4
const TROPHY_ART = px(TROPHY, ...TRO_AT) + px(['w', 'w', 'w', 'w'], TRO_AT[0] + 5, TRO_AT[1] + 3) + px(['w'], TRO_AT[0] + 6, TRO_AT[1] + 2)
// Cat Ina's: gold cat ears on its rim.
const CUP_EAR = ['o...', 'oo..', 'oJo.', 'ojjo']
const CUP_EARS = `<g class="v-cup">${px(CUP_EAR, TRO_AT[0] + 5, TRO_AT[1] - 4)}${px(CUP_EAR.map(row => [...row].reverse().join('')), TRO_AT[0] + 15, TRO_AT[1] - 4)}</g>`

// Rays round it, in two frames a little turned from each other.
const RAY_C = [21, -20]
function sunburst(turn) {
  const c = 31
  const cells = grid(2 * c + 1, 2 * c + 1)
  const wedge = Math.PI / 4

  for (let y = 0; y <= 2 * c; y++) {
    for (let x = 0; x <= 2 * c; x++) {
      const far = Math.hypot(x - c, y - c)
      const off = (((Math.atan2(y - c, x - c) - turn) % wedge) + wedge) % wedge

      if (far > 12 && far < c && Math.abs(off - wedge / 2) < 0.11) {
        cells[y][x] = far < 21 ? 'J' : 'Y'
      }
    }
  }

  return px(rows(cells), RAY_C[0] - c, RAY_C[1] - c)
}

// Sparkles round the trophy, and confetti falling from the top of the window.
const SPARK = ['.w.', 'wYw', '.w.']
const SPARKS = [[1, -31], [37, -29], [-1, -14], [40, -12], [19, -39], [30, -37], [8, -38]]
  .map(([x, y], i) => `<g class="v-sp" style="--k:${(i * 0.37).toFixed(2)}s">${px(SPARK, x, y)}</g>`)
  .join('')
const CONFETTI = Array.from({ length: 20 }, (_, i) => {
  const x = -50 + ((i * 37) % 100)
  const y = -74 - ((i * 23) % 44)
  const color = ['#f2d37e', '#ffd27f', '#e8789a', '#b9a6ee', '#ffffff'][i % 5]

  return `<rect class="v-cf" x="${x}" y="${y}" width="2" height="${i % 3 ? 1 : 2}" fill="${color}" style="--k:${((i * 0.17) % 1.3).toFixed(2)}s"/>`
}).join('')

// Ao-chan, up over Ina's head: from her mark on the circle she flies up there,
// throws herself open, and burns with a dark aura.
const BOOK_AT = [12, -30]
const FLY = [AO_AT[0] - BOOK_AT[0], AO_AT[1] - BOOK_AT[1]]
const BOOK_C = [BOOK_AT[0] + 9, BOOK_AT[1] + 12]
// Her eye on the open page.
const PAGE_EYE = [BOOK_AT[0] + 10, BOOK_AT[1] + 13.5]

function aura(phase) {
  const [rx, ry, cx, cy] = [12, 15, 30, 42]
  const cells = grid(61, 66)

  for (let y = 0; y < 66; y++) {
    for (let x = 0; x < 61; x++) {
      const dx = (x - cx) / rx
      const dy = (y - cy) / ry
      const far = Math.hypot(dx, dy)
      const angle = Math.atan2(dy, dx)
      // Tongues all round, licking highest upward.
      const reach = 1.22 + 0.17 * Math.sin(5 * angle + phase) + 0.1 * Math.sin(13 * angle - 2 * phase) + 0.6 * Math.max(0, -Math.sin(angle)) ** 2

      if (far > 0.8 && far < reach) {
        cells[y][x] = far > reach - 0.09 ? 'l' : far > reach - 0.2 ? 'A' : 'N'
      }
    }
  }
  // Embers off the tips.
  for (let i = 0; i < 9; i++) {
    const angle = -Math.PI * (0.1 + (0.8 * ((i * 5 + phase * 3) % 9)) / 8)
    const far = 1.7 + ((i * 3) % 4) * 0.12

    plot(cells, cx + rx * far * Math.cos(angle), cy + ry * far * Math.sin(angle), i % 2 ? 'P' : 'R')
  }

  return px(rows(cells), BOOK_C[0] - cx, BOOK_C[1] - cy)
}

// Nerd Ina's lenses glare red while Ao-chan rules.
const GLARE = ['.ooooo.', 'oPPPPPo', 'oPwPPPo', 'oPPPPPo', 'oPPPPPo', 'oPPPPPo', '.ooooo.']
const RED_LENSES = px(GLARE, 10, 15) + px(GLARE, 25, 15)

// With cat Ina, Ao-chan's show turns to love: a heart of pink light round her
// in place of the dark aura, beating in two frames, small hearts rising off it,
// and Ina blushing.
const HEARTLET = ['.E.E.', 'EEEEE', '.EEE.', '..E..']
function heartAura(beat) {
  const [w, h, cx, cy] = [61, 66, 30, 40]
  const cells = grid(w, h)
  const inside = (x, y, k) => {
    const dx = (x - cx) / (15 * k)
    const dy = -(y - cy) / (15 * k) + 0.25

    return (dx * dx + dy * dy - 1) ** 3 - dx * dx * dy ** 3 <= 0
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (inside(x, y, 1.45 + beat) && !inside(x, y, 1.05 + beat)) {
        cells[y][x] = inside(x, y, 1.38 + beat) ? (inside(x, y, 1.2 + beat) ? 'f' : 'F') : 'E'
      }
    }
  }

  return px(rows(cells), BOOK_C[0] - cx, BOOK_C[1] - cy)
}
const RISING = [[-14, -16], [44, -20], [-8, -34], [50, -36], [6, -44], [34, -46], [20, -52]]
  .map(([x, y], i) => `<g class="v-ht" style="--k:${(i * 0.23).toFixed(2)}s">${px(HEARTLET, x, y)}</g>`)
  .join('')
const BLUSH = px(['E.E.E', '.E.E.'], 9, 22) + px(['E.E.E', '.E.E.'], 28, 22)

// Zoltraak: a magic circle over Frieren Ina's head, struck by lightning, that
// charges and fires a beam across the whole window.
const ZC = [21, -24]
function magicCircle(turn) {
  const c = 18
  const cells = grid(2 * c + 1, 2 * c + 1)
  const point = (radius, angle) => [c + radius * Math.cos(angle + turn), c + radius * Math.sin(angle + turn)]
  const ring = (radius, color) => round(cells, c, c, radius + 1, color, far => Math.abs(far - radius) < 0.5)

  ring(17, 'w')
  ring(15, 'B')
  ring(9, 'L')
  for (let tick = 0; tick < 16; tick++) {
    plot(cells, ...point(16, (tick * Math.PI) / 8), tick % 2 ? 'L' : 'w')
  }
  for (let rune = 0; rune < 12; rune++) {
    plot(cells, ...point(12, (rune * Math.PI) / 6 + 0.26), 'B')
  }
  for (const start of [-Math.PI / 2, Math.PI / 2]) {
    const corners = [0, 1, 2].map(i => point(15, start + (i * 2 * Math.PI) / 3))

    corners.forEach((corner, i) => line(cells, corner, corners[(i + 1) % 3], 'L'))
  }
  round(cells, c, c, 3, 'w', far => far < 2.5)

  return px(rows(cells), ZC[0] - c, ZC[1] - c)
}

// Lightning from above the window's top down to the circle's rim.
function bolt(from, to, jag) {
  const points = Array.from({ length: 13 }, (_, i) => {
    const t = i / 12
    const sway = i === 0 || i === 12 ? 0 : (((i * jag) % 9) - 4) * 1.6

    return `${Math.round(from + (to[0] - from) * t + sway)},${Math.round(-230 + (to[1] + 230) * t)}`
  }).join(' ')

  return (
    `<polyline points="${points}" fill="none" stroke="#9fd8ff" stroke-width="3" stroke-linejoin="bevel"/>` +
    `<polyline points="${points}" fill="none" stroke="#ffffff" stroke-width="1" stroke-linejoin="bevel"/>`
  )
}
const BOLTS =
  `<g class="v-z1">${bolt(-8, [13, ZC[1] - 15], 7)}</g>` +
  `<g class="v-z2">${bolt(52, [31, ZC[1] - 14], 5)}</g>`

// Motes drawn into the circle's heart as it charges.
const CHARGE = Array.from({ length: 12 }, (_, i) => {
  const angle = (i * Math.PI) / 6
  const reach = 22 + (i % 3) * 5

  return (
    `<rect class="v-in" x="${ZC[0]}" y="${ZC[1]}" width="1" height="1" fill="${i % 2 ? '#9fd8ff' : '#ffffff'}" ` +
    `style="--dx:${Math.round(reach * Math.cos(angle))}px;--dy:${Math.round(reach * Math.sin(angle))}px;--k:${((i * 0.07) % 0.4).toFixed(2)}s"/>`
  )
}).join('')

/** When the beam fires, seconds into the show: its aim is settled from then on. */
export const FIRE = 2.6

// The beam, out of the circle's heart: off the window's left edge at the
// takodachis, or, with none on screen, straight up off its top.
const beam = ([thick, color, opacity]) => ({
  left: `<rect x="-900" y="${ZC[1] - thick / 2}" width="${900 + ZC[0]}" height="${thick}" fill="${color}" opacity="${opacity}"/>`,
  up: `<rect x="${ZC[0] - thick / 2}" y="-900" width="${thick}" height="${900 + ZC[1]}" fill="${color}" opacity="${opacity}"/>`,
})
const RAYS = [[18, '#9fd8ff', 0.35], [10, '#c39cf2', 0.9], [4, '#ffffff', 1]].map(beam)
// Festive, the beam is Christmas green round red round warm white, and sparkles
// in red, green and gold twinkle along it.
const RAYS_XMAS = [[18, '#4fd18a', 0.35], [10, '#ff5468', 0.9], [4, '#fff2c4', 1]].map(beam)
const BEAM_SPARK = ['R', 'S', 'J'].map((color, i) => `<g id="v-bk${i}">${px([`.${color}.`, `${color}w${color}`, `.${color}.`])}</g>`).join('')
// Along the beam every so far, a little to one side of it and the other.
const BEAM_SPARKS = aim =>
  Array.from({ length: 14 }, (_, i) => {
    const along = 24 + i * 52 + (i % 3) * 9
    const across = [-9, 7, -3, 10, -8, 3, 9][i % 7]
    const [x, y] = aim === 'up' ? [ZC[0] + across, ZC[1] - along] : [ZC[0] - along, ZC[1] + across]

    return `<use href="#v-bk${i % 3}" class="v-bs" x="${x - 1}" y="${y - 1}" style="--k:${((i * 0.19) % 0.9).toFixed(2)}s"/>`
  }).join('')
const BEAM = (aim, festive = false) =>
  `<g class="v-beam${aim === 'up' ? ' v-sky' : ''}"><g class="v-bj">${(festive ? RAYS_XMAS : RAYS).map(ray => ray[aim]).join('')}</g></g>` +
  (festive ? BEAM_SPARKS(aim) : '') +
  `<circle class="v-muz" cx="${ZC[0]}" cy="${ZC[1]}" r="11" fill="#ffffff"/>`

// The takodachis' parts. Sunglasses, over their eyes.
const SHADES = px(['oooooooooooooooo', '.oeeeeo..oeeeeo.', '..oeeo....oeeo..'], 4, 10)
const SHADES_GLINT = px(['w.', '.w'], 7, 11) + px(['w.', '.w'], 15, 11)
// Terror: eyes wide, mouth a-wobble, sweat flying, and a "!!".
const EYE_WIDE = pupil => ['.wwww.', 'wwwwww', pupil, '.wwww.']
const DROP = ['.B.', 'BBB', 'BwB', '.B.']
const FEAR =
  px(EYE_WIDE('wwewww'), 5, 8) +
  px(EYE_WIDE('wwweww'), 13, 8) +
  px(['tttttt', 'tttttt'], 9, 12) +
  px(['.e.e.e', 'e.e.e.'], 9, 12) +
  px(DROP, 20, 2) +
  px(DROP, 1, 4)
const ALARM = px(['y.y', 'y.y', 'y.y', '...', 'y.y'], 19, -7)
// Smitten: heart eyes, and a heart over them in place of the "!!".
const HEART_EYES = px(HEARTLET, 5, 9) + px(HEARTLET, 14, 9)
const LOVE = px(HEARTLET, 18, -6)
// Both arms thrown up: in worship, or holding up a barrier.
const ARMS_UP = px(['.oo', 'oTo', 'oTo', 'oTo', 'oTo', 'oTo'], 0, 2) + px(['oo.', 'oTo', 'oTo', 'oTo', 'oTo', 'oTo'], 21, 2)
// A magic barrier, as Fern raises one: a flat honeycomb of glass held up in
// front of the takodachi, flat-topped hexagons with thin bright edges, the
// glass between them a pale teal you can see through. Drawn as shapes, not
// pixels: at this size pixel hexagons come out round. Each cell pops up on its
// own (`--c`), one after another from the left.
const BARRIER = (() => {
  const R = 6
  const H = (R * Math.sqrt(3)) / 2
  const cells = []

  for (let q = -4; q <= 4; q++) {
    for (let r = -5; r <= 5; r++) {
      const [x, y] = [1.5 * R * q, H * (2 * r + q)]

      // Round the takodachi and a little toward Ina, its middle off so the
      // panel's edge is ragged. None reaches past x = -3: the takodachis'
      // layer cuts there, and the leftmost of them stand at x = 3.
      if (Math.hypot((x - 2) / 21, (y - 1) / 18) <= 1 && 15 + x - R > -3) {
        cells.push([15 + x, 9 + y])
      }
    }
  }
  const corners = ([cx, cy], reach) =>
    [0, 1, 2, 3, 4, 5].map(i => `${(cx + reach * Math.cos((i * Math.PI) / 3)).toFixed(2)},${(cy + reach * Math.sin((i * Math.PI) / 3)).toFixed(2)}`).join(' ')

  return cells
    .sort(([ax, ay], [bx, by]) => ax - bx || ay - by)
    .map(
      (cell, i) =>
        `<g class="v-hx" style="--c:${(i * 0.035).toFixed(3)}s">` +
        `<polygon points="${corners(cell, R)}" fill="${i % 3 ? '#8fe6e0' : '#9fd8ff'}" fill-opacity="${i % 2 ? '.36' : '.26'}" stroke="#9fd8ff" stroke-opacity=".5" stroke-width="1.3"/>` +
        `<polygon points="${corners(cell, R)}" fill="none" stroke="#ffffff" stroke-width=".55"/>` +
        '</g>',
    )
    .join('')
})()

// Drawn once, while a show plays.
const ART = {
  trophy: { rays: [sunburst(0), sunburst(Math.PI / 8)] },
  ao: { aura: [aura(0), aura(2.4)], love: [heartAura(0), heartAura(0.08)] },
  zoltraak: { circle: [magicCircle(0), magicCircle(Math.PI / 12)] },
}

/**
 * A takodachi's part in a show: `wrap` goes round its body, `on` rides with
 * its bob, and `by` stands beside it.
 */
export function takoShow(kind, cat = false) {
  if (kind === 'ao' && cat) {
    return {
      wrap: body => `<g class="v-sw">${body}</g>`,
      on: '<use href="#v-he" class="v-tf"/><use href="#v-lo" class="v-ex"/><use href="#v-arm" class="v-up"/>',
      by: '',
    }
  }
  return kind === 'trophy'
    ? { wrap: body => body, on: '<use href="#v-sg" class="v-sg"/>', by: '' }
    : kind === 'ao'
      ? {
          wrap: body => `<g class="v-cow">${body}</g>`,
          on: '<use href="#v-tf" class="v-tf"/><use href="#v-ex" class="v-ex"/><use href="#v-arm" class="v-up"/>',
          by: '',
        }
      : { wrap: body => body, on: '<use href="#v-arm" class="v-hold"/>', by: '<use href="#v-br" class="v-br"/>' }
}

// Where each show's line stands: its foot just over what rises above her head.
const LINE_FOOT = { trophy: -29, ao: -31, zoltraak: -42 }
// Shot upward the beam would cross that line, so it stands left of the circle,
// where with no takodachis on screen there is room.
const SKY_LINE = { bottom: ZC[1] + 4, right: ZC[0] - 18 }

/**
 * A show's parts, for `draw` to place: `under` the sprites and `over` them,
 * each across the whole window; `back` of Ina's head and `front` of it; `face`
 * on it, moving with her; `defs` for the takodachis; and its `css`. `say`
 * draws a line in a bubble with its foot at a height, `mouth` is her mouth open.
 * Festive, the trophy is a present, and Ao-chan wears her ribbon.
 */
export function showParts(kind, { say, mouth, nerd, cat = false, aim = 'left', festive = false }) {
  const present = festive && kind === 'trophy'
  const text = present ? XMAS_SHOW[cat ? 'cat' : 'nerd'] : ((cat ? SHOW_SAY_CAT[kind] : undefined) ?? SHOW_SAY[kind])
  // Cat ears on the trophy, and Ao-chan's ears and tail, push her line up a little.
  const foot = LINE_FOOT[kind] - (cat ? (kind === 'trophy' && !present ? 4 : kind === 'ao' ? 8 : 0) : 0) - (present ? PRESENT_LIFT : 0)
  const ribbon = festive ? aoRibbon(BOOK_AT) : ''
  const line = aim === 'up' ? say(text, SKY_LINE.bottom, SKY_LINE.right) : say(text, foot)
  const talk = `<g class="v-mo">${mouth}</g>`
  const window = (cls, fill) => `<rect class="${cls}" width="100%" height="100%" fill="${fill}"/>`

  if (kind === 'trophy') {
    const [a, b] = ART.trophy.rays

    return {
      under: '',
      over: window('v-fl', '#fff2c4'),
      back:
        '<radialGradient id="v-gg"><stop offset="0" stop-color="#ffd27f" stop-opacity=".75"/><stop offset="1" stop-color="#f6a440" stop-opacity="0"/></radialGradient>' +
        `<circle class="v-glow" cx="${RAY_C[0]}" cy="${RAY_C[1]}" r="38" fill="url(#v-gg)"/>` +
        `<g class="v-rays"><g class="v-r1">${a}</g><g class="v-r2">${b}</g></g>` +
        `<g class="v-tro"><g class="v-hov">${present ? presentArt([TRO_AT[0], TRO_AT[1] - PRESENT_LIFT]) : `${TROPHY_ART}${cat ? CUP_EARS : ''}`}</g></g>${SPARKS}${CONFETTI}`,
      front: `<g class="v-say">${line}</g>`,
      face: talk,
      defs: `<g id="v-sg">${SHADES}<g class="v-gl">${SHADES_GLINT}</g></g>`,
      css: TROPHY_CSS,
    }
  }
  if (kind === 'ao' && cat) {
    const [a, b] = ART.ao.love

    return {
      under: window('v-dim', '#ff4f9a'),
      over: window('v-fl', '#ff8ac4'),
      back:
        '<radialGradient id="v-lg"><stop offset="0" stop-color="#ff8ac4" stop-opacity=".45"/><stop offset="1" stop-color="#ff8ac4" stop-opacity="0"/></radialGradient>' +
        `<circle class="v-lv" cx="21" cy="16" r="58" fill="url(#v-lg)"/>` +
        `<g class="v-fly"><g class="v-hov">` +
        `<circle class="v-glow" cx="${BOOK_C[0]}" cy="${BOOK_C[1]}" r="44" fill="url(#v-lg)"/>` +
        `<g class="v-love"><g class="v-r1">${a}</g><g class="v-r2">${b}</g></g>` +
        `<g class="v-aoc">${px(AO_CLOSED, ...BOOK_AT)}${ribbon}</g>` +
        `<g class="v-aoo">${px(AO_OPEN, ...BOOK_AT)}<circle class="v-eye" cx="${PAGE_EYE[0]}" cy="${PAGE_EYE[1]}" r="3" fill="#ff8ac4"/></g>` +
        `${aoCat(BOOK_AT)}</g></g>${RISING}`,
      front: `<g class="v-say">${line}</g>`,
      face: `${talk}<g class="v-bl">${BLUSH}</g>`,
      defs: `<g id="v-he">${HEART_EYES}</g><g id="v-lo">${LOVE}</g><g id="v-arm">${ARMS_UP}</g>`,
      css: LOVE_CSS,
    }
  }
  if (kind === 'ao') {
    const [a, b] = ART.ao.aura

    return {
      under: window('v-dim', '#000000'),
      over: window('v-fl', '#ff2a5a'),
      back:
        '<radialGradient id="v-ag"><stop offset="0" stop-color="#a0124a" stop-opacity=".9"/><stop offset=".55" stop-color="#4a0b4a" stop-opacity=".55"/><stop offset="1" stop-color="#120618" stop-opacity="0"/></radialGradient>' +
        `<g class="v-fly"><g class="v-hov">` +
        `<circle class="v-glow" cx="${BOOK_C[0]}" cy="${BOOK_C[1]}" r="44" fill="url(#v-ag)"/>` +
        `<g class="v-aura"><g class="v-r1">${a}</g><g class="v-r2">${b}</g></g>` +
        `<g class="v-aoc">${px(AO_CLOSED, ...BOOK_AT)}${ribbon}</g>` +
        `<g class="v-aoo">${px(AO_OPEN, ...BOOK_AT)}<circle class="v-eye" cx="${PAGE_EYE[0]}" cy="${PAGE_EYE[1]}" r="3" fill="#ff2a5a"/></g>` +
        `</g></g>`,
      front: `<g class="v-say">${line}</g>`,
      face: talk + (nerd ? `<g class="v-red">${RED_LENSES}</g>` : ''),
      defs: `<g id="v-tf">${FEAR}</g><g id="v-ex">${ALARM}</g><g id="v-arm">${ARMS_UP}</g>`,
      css: AO_SHOW_CSS,
    }
  }
  const [a, b] = ART.zoltraak.circle

  return {
    under: window('v-dim', '#000000'),
    over: window('v-fl', '#ffffff'),
    back:
      `${BOLTS}<g class="v-mc"><g class="v-r1">${a}</g><g class="v-r2">${b}</g></g>` +
      `<circle class="v-core" cx="${ZC[0]}" cy="${ZC[1]}" r="4" fill="#ffffff"/>${CHARGE}${BEAM(aim, festive)}`,
    front: `<g class="v-say">${line}</g>`,
    face: talk,
    defs: `<g id="v-arm">${ARMS_UP}</g><g id="v-br">${BARRIER}</g>${festive ? BEAM_SPARK : ''}`,
    css: festive ? ZOLTRAAK_CSS + BEAM_SPARK_CSS : ZOLTRAAK_CSS,
  }
}

// Shared by every show: Ina's line and her mouth, the window's flash and dimming.
//
// The desktop app holds a backdrop still, until its next redraw, once part of it
// flashes: light and dark swapping about four times within a second over more
// than a quarter of a 341 x 256 px patch. So nothing big here swaps that fast,
// counting every layer over the same spot. The rays, aura and circle turn at
// .8s a frame, a glow breathes gently, and the window's flash stays faint against
// the dark sky, once a show. Moving a big sprite fast swaps its edges just the
// same, so Ina's head hops or recoils once rather than shaking.
const BASE_CSS = `
.v-say,.v-mo,.v-fl,.v-dim,.v-glow,.v-sp,.v-cf,.v-sg,.v-tf,.v-ex,.v-up,.v-hold,.v-br{opacity:0}
.v-say{animation:on 4.2s ${at(1.2)}}
.v-mo{animation:yap1 1.6s steps(1) ${at(1.2)} 2}
.v-r1{animation:flip 1.6s steps(1) infinite}
.v-r2{animation:flip 1.6s steps(1) -.8s infinite}
.v-hov{animation:bob 1.2s steps(1) infinite}
@keyframes vrise{from{transform:translateY(24px)}}
@keyframes vsink{from{opacity:1}to{transform:translateY(10px);opacity:0}}
@keyframes vflash{from{opacity:var(--f,.2)}to{opacity:0}}
@keyframes vdark{0%,to{opacity:0}12%,85%{opacity:var(--f,.5)}}
@keyframes vshk{0%,50%{transform:translateX(-1px)}25%,75%{transform:translateX(1px)}}
@keyframes vkick{50%,to{transform:translateX(1px)}}
@keyframes vpop{from{transform:scale(.2)}}
@keyframes vdrop{from{transform:translateY(-14px)}}
@keyframes vlift{to{transform:translateY(-14px);opacity:0}}
@keyframes vblink{0%{opacity:1}50%,to{opacity:0}}
@keyframes vpulse{0%,to{opacity:1}50%{opacity:.85}}
@keyframes vbow{0%,49%{transform:none}50%,to{transform:translateY(3px)}}
@keyframes vfall{from{opacity:1}to{transform:translateY(150px);opacity:1}}
`

const TROPHY_CSS = `${BASE_CSS}
.v-rays,.v-tro{opacity:0}
.v-tro{animation:on 6.2s ${at(0.2)},vrise .8s steps(8) ${at(0.2)} backwards,vsink .6s steps(6) ${at(6.4)}}
.v-glow{animation:on 5.4s ${at(0.9)},vpulse 1.8s steps(4) ${at(0.9)} 3}
.v-rays{animation:on 5.4s ${at(1)}}
.v-fl{--f:.2;animation:vflash .8s steps(4) ${at(1)}}
.v-sp{animation:twinkle .9s steps(3) calc(var(--x) + 1.2s + var(--k)) 5}
.v-cf{animation:vfall 3s steps(15) calc(var(--x) + 1s + var(--k))}
.v-hd{animation:hop .3s steps(3) ${at(1.1)}}
.v-sg{animation:on 5.4s ${atk(1.4)},vdrop .5s steps(4) ${atk(1.4)} backwards,vlift .4s steps(4) ${atk(6.4)}}
.v-gl{animation:vblink 1.2s steps(1) infinite}
`.replaceAll('\n', '')

const AO_SHOW_CSS = `${BASE_CSS}
.v-fly,.v-aura,.v-aoo,.v-red,.v-eye{opacity:0}
.s-ao .ao{animation:off 7s ${at(0)}}
.v-dim{--f:.6;animation:vdark 7s ${at(0)}}
.v-fly{animation:on 7s ${at(0)},vfly .8s steps(8) ${at(0.1)} backwards,vland .8s steps(8) ${at(6.2)}}
.v-glow{animation:on 5.2s ${at(0.9)},vpulse 1.8s steps(4) ${at(0.9)} 3}
.v-aura{animation:on 5.2s ${at(0.9)}}
.v-aoc{animation:off 4.8s ${at(1)}}
.v-aoo{animation:on 4.8s ${at(1)}}
.v-eye{animation:vblink 1s steps(1) ${at(1)} 5}
.v-fl{--f:.2;animation:vflash .8s steps(4) ${at(1)}}
.v-red{animation:on 5.2s ${at(1)}}
.v-hd{animation:vkick .4s steps(1) ${at(1)}}
.v-tf{animation:on 5.8s ${atk(0.6)}}
.v-ex{animation:vblink .3s steps(1) ${atk(0.6)} 5}
.v-cow{animation:vshk .12s steps(1) ${atk(0.6)} 4,vbow .8s steps(1) ${atk(2.2)} 5}
.v-up{animation:vblink .8s steps(1) ${atk(2.2)} 5}
@keyframes vfly{from{transform:translate(${FLY[0]}px,${FLY[1]}px)}}
@keyframes vland{to{transform:translate(${FLY[0]}px,${FLY[1]}px)}}
`.replaceAll('\n', '')

// The love show: Ao-chan's, gentler. The window blushes faintly instead of
// darkening, the takodachis sway a pixel each way instead of trembling, and Ina
// hops once instead of recoiling.
const LOVE_CSS = `${AO_SHOW_CSS}
.v-love,.v-lv,.v-ht,.v-bl{opacity:0}
.v-dim{--f:.12}
.v-fl{--f:.15}
.v-love{animation:on 5.2s ${at(0.9)}}
.v-lv{animation:on 5.2s ${at(0.9)},vpulse 1.8s steps(4) ${at(0.9)} 3}
.v-ht{animation:vup 1.6s steps(8) calc(var(--x) + 1.2s + var(--k)) 3}
.v-bl{animation:on 5.2s ${at(1)}}
.v-hd{animation:hop .3s steps(3) ${at(1)}}
.v-ex{animation:vblink 1.6s steps(1) ${atk(0.6)} 3}
.v-sw{animation:vsway 1.6s steps(1) ${atk(0.6)} 3}
.v-up{animation:vblink 1.6s steps(1) ${atk(2.2)} 3}
@keyframes vup{from{opacity:1}to{transform:translateY(-16px);opacity:0}}
@keyframes vsway{0%,49%{transform:translateX(-1px)}50%,to{transform:translateX(1px)}}
`.replaceAll('\n', '')

const ZOLTRAAK_CSS = `${BASE_CSS}
.v-mc,.v-z1,.v-z2,.v-core,.v-in,.v-beam,.v-muz{opacity:0}
.v-dim{--f:.4;animation:vdark 6.4s ${at(0)}}
.v-mc{transform-box:fill-box;transform-origin:center;animation:on 5.2s ${at(0.3)},vpop .4s steps(4) ${at(0.3)} backwards,vsink .5s steps(5) ${at(5.5)}}
.v-z1{animation:vblink .4s steps(2) ${at(0.5)},vblink .4s steps(2) ${at(1.7)}}
.v-z2{animation:vblink .4s steps(2) ${at(1)},vblink .4s steps(2) ${at(2.2)}}
.v-fl{--f:.25;animation:vflash .8s steps(4) ${at(2.6)}}
.v-core{transform-box:fill-box;transform-origin:center;animation:on .6s ${at(2)},vpop .6s steps(6) ${at(2)} backwards}
.v-in{animation:vin .6s steps(6) calc(var(--x) + 2s + var(--k))}
.v-beam{transform-box:fill-box;transform-origin:right center;animation:on 2.2s ${at(2.6)},vpop .25s steps(5) ${at(2.6)} backwards,vfade .4s steps(4) ${at(4.8)}}
.v-bj{transform-box:fill-box;transform-origin:center;animation:vjit 1.2s steps(1) infinite}
.v-sky{transform-origin:center bottom;animation:on 2.2s ${at(2.6)},vgrow .25s steps(5) ${at(2.6)} backwards,vfadex .4s steps(4) ${at(4.8)}}
.v-sky .v-bj{animation:vjitx 1.2s steps(1) infinite}
.v-muz{transform-box:fill-box;transform-origin:center;animation:vflash .5s steps(4) ${at(2.6)},vpop .5s steps(4) ${at(2.6)}}
.v-hd{animation:vkick .3s steps(1) ${at(0.5)},hop .3s steps(3) ${at(1.1)},vkick .4s steps(1) ${at(2.6)}}
.v-hold{animation:on 3.6s ${atk(1.9)}}
.v-br{animation:on 3.6s ${atk(1.9)}}
.v-hx{transform-box:fill-box;transform-origin:center;animation:vcell .3s steps(3) calc(var(--x) + 1.9s + var(--k) + var(--c)) backwards}
@keyframes vcell{from{transform:scale(.3);opacity:0}}
@keyframes vin{from{transform:translate(var(--dx),var(--dy));opacity:1}to{opacity:1}}
@keyframes vjit{50%{transform:scaleY(.75)}}
@keyframes vfade{from{opacity:1}to{transform:scaleY(0);opacity:0}}
@keyframes vfadex{from{opacity:1}to{transform:scaleX(0);opacity:0}}
@keyframes vgrow{from{transform:scaleY(0)}}
@keyframes vjitx{50%{transform:scaleX(.75)}}
`.replaceAll('\n', '')

// The festive beam's sparkles twinkle through the beam's life, each on its own beat.
const BEAM_SPARK_CSS = `.v-bs{opacity:0;animation:twinkle .9s steps(3) calc(var(--x) + 2.7s + var(--k)) 2}`
