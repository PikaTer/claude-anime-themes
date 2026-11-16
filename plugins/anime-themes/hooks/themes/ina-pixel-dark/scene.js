// The pixel art, the scene's SVG and the scene's state changes. Pure: no `$`.
// Sprites are text grids, one character a pixel, so they can be redrawn by hand.

const PAL = {
  o: '#1b1430', // outline
  h: '#5d4b8a', // hair
  H: '#8a76bd', // hair light
  d: '#463769', // hair dark
  s: '#ffeadf', // skin
  b: '#f9a9b0', // blush
  y: '#f6a440', // orange
  Y: '#ffd27f', // orange light
  w: '#ffffff',
  e: '#2b2045', // eyes, ink
  p: '#e8789a', // mouth
  t: '#7a67a8', // takodachi
  T: '#a08fca', // takodachi light
  g: '#8d93ab', // laptop
  G: '#c6cbdd', // laptop light
  k: '#c98a45', // cookie
  K: '#6e4525', // chocolate chip
  z: '#b9a6ee', // zzz, stars
  m: '#2a1f4e', // sigil
  M: '#43317a', // sigil light
  q: '#a8662a', // sigil and sucker orange
  u: '#271c4b', // tentacle
  U: '#3f2f78', // tentacle light
  x: '#2b2045', // text
}

/** Rows of pixels to one `<path>` per color, each run of a row one rectangle. */
function px(rows, ox = 0, oy = 0) {
  const paths = {}

  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; ) {
      const color = row[x]
      let run = 1

      while (row[x + run] === color) {
        run++
      }
      if (color !== '.') {
        paths[color] = `${paths[color] ?? ''}M${x + ox} ${y + oy}h${run}v1h-${run}z`
      }
      x += run
    }
  })

  return Object.entries(paths)
    .map(([color, d]) => `<path fill="${PAL[color]}" d="${d}"/>`)
    .join('')
}

const mirror = rows => rows.map(row => row + [...row].reverse().join(''))
/** One sprite at `x`, and its mirror image on the other side of a `width` wide sprite. */
const both = (rows, x, y, width) =>
  px(rows, x, y) + px(rows.map(row => [...row].reverse().join('')), width - x - rows[0].length, y)

// Ina's head, left half: 42 x 32 once mirrored.
const HEAD = mirror([
  '......oooo...........',
  '.....ohhhho..........',
  '....ohHhhhho.........',
  '....ohHhhhhho.ooooooo',
  '....ohhhhhhhhohhhhhhh',
  '.....ohhhhhhhhhhhhhhh',
  '....ohhhhhhhhhhhHHHHh',
  '....ohhhhhhhhhhHhhhhh',
  '...ohhhhhhhhhhhhhhhhh',
  '...ohhhhhhhhhhhhhhhhh',
  '...ohhhhhhhhdhhhhhdhh',
  '...ohhhhhhhhdhhhhhdhh',
  '...ohhhhhhhhdhhhhhdhh',
  '...ohhhhhhhhohhhhhohh',
  '...ohhhhhooosooooosoo',
  'oooohhhhossssssssssss',
  'osssohhhossssssssssss',
  '.osbsohhossssssssssss',
  '..ossohhossssssssssss',
  '...ooohhossssssssssss',
  '...ohhhhossssssssssss',
  '...ohhhhosbbbssssssss',
  '...ohhhhosbbbssssssss',
  '...ohhhhossssssssssss',
  '...ohhhhhosssssssssss',
  '...ohhhhhhossssssssss',
  '...ohyyhhhhoossssssss',
  '...oyyYyhho.oooosssss',
  '...oyYyyho......ooooo',
  '...oyyyyo............',
  '....oyyo.............',
  '.....oo..............',
])
const W = 42

const AHOGE = px(['.oo.', 'ohho', '.oho'], 20, 0)
const CLOSED = both(['eeeee', 'eeeee'], 11, 18, W)
const HALF = both(['eeeee', '.eee.', '.eee.'], 11, 18, W)
const EYE = ['wee', 'eee', 'eee', 'eHe']
const OPEN = px(EYE, 12, 17) + px(EYE, 27, 17)
const MOUTH = px(['e.ee.e', '.e..e.'], 18, 22)
const MOUTH_OPEN = px(['seeees', 'seppes', 'sseess'], 18, 22)
const BRIDGE = px(['oooooooo'], 17, 18)
const SWIRL_A = ['.ooooo.', 'owwwwwo', 'owooowo', 'owowowo', 'owowwwo', 'owooooo', '.ooooo.']
const SWIRL_B = ['.ooooo.', 'ooooowo', 'owwwowo', 'owowowo', 'owooowo', 'owwwwwo', '.ooooo.']
const lenses = rows => px(rows, 10, 15) + px(rows, 25, 15)

const ZZZ =
  `<g class="z1">${px(['zzz', '.z.', 'zzz'], 0, 5)}</g>` +
  `<g class="z2">${px(['zzzz', '..z.', '.z..', 'zzzz'], -6, 0)}</g>` +
  `<g class="z3">${px(['zzzzz', '...z.', '..z..', '.z...', 'zzzzz'], -13, -6)}</g>`

// A 3 x 5 pixel font, wider where a letter needs it: all anyone here ever says.
const FONT = Object.fromEntries(
  Object.entries({
    A: '.x./x.x/xxx/x.x/x.x',
    B: 'xx./x.x/xx./x.x/xx.',
    C: '.xx/x../x../x../.xx',
    D: 'xx./x.x/x.x/x.x/xx.',
    E: 'xxx/x../xx./x../xxx',
    F: 'xxx/x../xx./x../x..',
    G: '.xx/x../x.x/x.x/.xx',
    H: 'x.x/x.x/xxx/x.x/x.x',
    I: 'xxx/.x./.x./.x./xxx',
    J: '..x/..x/..x/x.x/.x.',
    K: 'x.x/xx./x../xx./x.x',
    L: 'x../x../x../x../xxx',
    M: 'x...x/xx.xx/x.x.x/x...x/x...x',
    N: 'x..x/xx.x/x.xx/x..x/x..x',
    O: '.x./x.x/x.x/x.x/.x.',
    P: 'xx./x.x/xx./x../x..',
    Q: '.x./x.x/x.x/xx./.xx',
    R: 'xx./x.x/xx./x.x/x.x',
    S: '.xx/x../.x./..x/xx.',
    T: 'xxx/.x./.x./.x./.x.',
    U: 'x.x/x.x/x.x/x.x/xxx',
    V: 'x.x/x.x/x.x/x.x/.x.',
    W: 'x...x/x...x/x.x.x/xx.xx/x...x',
    X: 'x.x/x.x/.x./x.x/x.x',
    Y: 'x.x/x.x/.x./.x./.x.',
    Z: 'xxx/..x/.x./x../xxx',
    '!': 'x/x/x/./x',
    '?': 'xx./..x/.x./.../.x.',
    '.': '././././x',
    ',': '../../../.x/x.',
    "'": 'x/x/././.',
    '-': '../../xx/../..',
    '~': '...../.x.../x.x.x/...x./.....',
    ' ': '../../../../..',
  }).map(([char, glyph]) => [char, glyph.split('/')]),
)

/** One line of text as five rows of pixels. */
function letters(text) {
  const out = ['', '', '', '', '']

  for (const char of text) {
    ;(FONT[char] ?? FONT[' ']).forEach((row, y) => {
      out[y] += (out[y] === '' ? '' : '.') + row
    })
  }

  return out
}

/** A speech bubble's rows for one or more lines, its tail `fromRight` of its right edge. */
function bubble(text, fromRight) {
  const lines = text.split('\n').map(letters)
  const width = Math.max(...lines.map(line => line[0].length))
  const body = lines.flatMap((line, i) => [...(i > 0 ? [''] : []), ...line])
  const tail = Math.max(1, Math.min(width, width + 4 - fromRight))

  return [
    `.${'w'.repeat(width + 2)}.`,
    'w'.repeat(width + 4),
    ...body.map(row => `ww${row.padEnd(width, '.').replaceAll('.', 'w')}ww`),
    'w'.repeat(width + 4),
    `.${'w'.repeat(width + 2)}.`,
    `${'.'.repeat(tail)}www`,
    `${'.'.repeat(tail + 1)}w`,
  ]
}

/** Ina's bubble: above her head, its right edge kept inside the window. */
function speech(text) {
  const rows = bubble(text, 17)

  return px(rows, 44 - rows[1].length, -1 - rows.length)
}

// What Ina says, by what just happened. Upper case: the font has no other.
const SAY = {
  // While she works, between her WAHs.
  work: ['HUMU HUMU', 'INA INA INA~', 'TAKO TIME!', 'COMFY~', 'WAH~', 'DOODLE DOODLE', 'AO-CHAN, HELP!', "THAT'S INA-FF", 'TENTACLES, GO!', 'HEHE~', 'COOKIE BREAK?', 'WAH-T IS THIS?'],
  wake: ['WAH?!', "I'M UP! I'M UP!", 'TAKO TIME!', 'OKAY, INA TIME~'],
  join: ['HI, TAKO!', 'HELP ARRIVED~', 'WAH! A TAKO!', 'TAKODACHI!'],
  leave: ['THANKS, TAKO!', 'GOOD TAKO~', 'BYE BYE~', 'NICE WORK!'],
  // A question is up for the person, and after they answer it.
  wait: ['PSST!\nPICK ONE~', 'INA NEEDS YOU!', 'WAH?\nYOUR CALL~'],
  back: ['OKAY!', 'GOT IT~', 'HUMU, OKAY!'],
  // The turn ended: on a question, done, interrupted, or on an error.
  ask: ['YOUR TURN~', 'WAH?\nYOUR MOVE~', 'INA IS\nWAITING~'],
  done: ['ALL DONE!', 'DONE! WAH~', 'NAP TIME~', 'COOKIES NOW?', 'GG, TAKODACHI!'],
  stop: ['EH?! OKAY...', 'WAH?!\nSTOPPED?', 'HUMU... OKAY'],
  oops: ['UH OH...', 'WAH... OOPS', 'AO-CHAN?!'],
}

const LOOP = 24

/** What Ina says in a scene: `once` at a moment, on a `loop`, or to `stay`. */
function lines({ ina, cue, seed }) {
  const pick = pool => pool[seed % pool.length]
  const once = (pool, at) => ({ text: pick(pool), at, kind: 'once' })
  const stay = pool => ({ text: pick(pool), at: 0.1, kind: 'stay' })

  if (ina === 'wait') {
    return [stay(SAY.wait)]
  }
  if (ina === 'sleep' || ina === 'doze') {
    return cue === 'ask' ? [stay(SAY.ask)] : ina === 'doze' ? [once(SAY[cue] ?? SAY.done, 0.1)] : []
  }
  const first = ina === 'wake' ? [once(SAY.wake, 0.6)] : SAY[cue] ? [once(SAY[cue], 0.2)] : []
  const a = seed % SAY.work.length
  const b = (a + 1 + ((seed >>> 8) % (SAY.work.length - 1))) % SAY.work.length

  return [
    ...first,
    { text: 'WAH!', at: 4, kind: 'loop' },
    { text: SAY.work[a], at: 12, kind: 'loop' },
    { text: SAY.work[b], at: 20, kind: 'loop' },
  ]
}

// The background's larger shapes are plotted, not typed: too big for a grid by hand.
const grid = (width, height) => Array.from({ length: height }, () => Array(width).fill('.'))
const rows = cells => cells.map(row => row.join(''))

function plot(cells, x, y, color) {
  const row = cells[Math.round(y)]

  if (row !== undefined && Math.round(x) >= 0 && Math.round(x) < row.length) {
    row[Math.round(x)] = color
  }
}

function line(cells, [x0, y0], [x1, y1], color) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))

  for (let i = 0; i <= steps; i++) {
    plot(cells, x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps, color)
  }
}

/** Every pixel `test` accepts by its distance from a centre. */
function round(cells, cx, cy, reach, color, test) {
  for (let y = Math.floor(cy - reach); y <= cy + reach; y++) {
    for (let x = Math.floor(cx - reach); x <= cx + reach; x++) {
      if (test(Math.hypot(x - cx, y - cy))) {
        plot(cells, x, y, color)
      }
    }
  }
}

// A summoning circle behind Ina's head: rings, rune ticks, a triangle.
const SIGIL = (() => {
  const c = 48
  const cells = grid(2 * c + 1, 2 * c + 1)
  const at = (radius, angle) => [c + radius * Math.cos(angle), c + radius * Math.sin(angle)]
  const ring = (radius, color) => round(cells, c, c, radius + 1, color, far => Math.abs(far - radius) < 0.5)

  ring(47, 'm')
  ring(40, 'M')
  ring(38, 'm')
  ring(26, 'm')
  for (let tick = 0; tick < 24; tick++) {
    const angle = (tick * Math.PI) / 12

    line(cells, at(tick % 2 ? 42 : 43, angle), at(tick % 2 ? 45 : 44, angle), tick % 6 === 3 ? 'q' : 'M')
  }
  const corners = [0, 1, 2].map(i => at(38, -Math.PI / 2 + (i * 2 * Math.PI) / 3))

  corners.forEach((corner, i) => line(cells, corner, corners[(i + 1) % 3], 'M'))
  corners.forEach(([x, y]) => round(cells, x, y, 2, 'q', far => far < 1.6))

  // Centred on the head's middle, which is 21, 16 in its own grid.
  return px(rows(cells), 21 - c, 16 - c)
})()

/**
 * A tentacle rising from the foot of its grid and turning left by `bend`, a
 * function of how far along it is (0 to 1): its rows and the column of its root.
 */
function tentacle(length, bend, thick = 4.2, [body, light, sucker] = 'uUq') {
  const spine = []
  let x = 0
  let y = 0

  for (let i = 0; i < length; i++) {
    const t = i / length
    const heading = -Math.PI / 2 - bend(t)

    spine.push({ x, y, heading, thick: (thick - 1) * (1 - t) + 1 })
    x += Math.cos(heading)
    y += Math.sin(heading)
  }
  const left = Math.floor(Math.min(...spine.map(at => at.x - at.thick)))
  const top = Math.floor(Math.min(...spine.map(at => at.y - at.thick)))
  const cells = grid(Math.ceil(Math.max(...spine.map(at => at.x + at.thick))) - left + 1, 1 - top)

  spine.forEach(at => {
    at.x -= left
    at.y -= top
  })
  spine.forEach(at => round(cells, at.x, at.y, at.thick, body, far => far < at.thick))
  spine.forEach((at, i) => {
    const side = (reach, turn) => [at.x + reach * Math.cos(at.heading + turn), at.y + reach * Math.sin(at.heading + turn)]

    plot(cells, ...side(at.thick - 1.6, Math.PI / 2), light)
    if (i % 6 === 2 && at.thick > 2) {
      plot(cells, ...side(at.thick - 1.6, -Math.PI / 2), sucker)
    }
  })

  return { rows: rows(cells), root: -left }
}

// A sway, then a curl that tightens to the tip.
const curls = (sway, curl) => t => sway * Math.sin(t * 5) + curl * t ** 3
const low = tentacle(110, curls(0.4, 7))
const high = tentacle(70, curls(0.35, 8))
const TENTACLE_LOW = px(low.rows, -low.root - 7, -low.rows.length)
const TENTACLE_HIGH = px(high.rows.toReversed(), -high.root - 7, 0)

// Stars and small geometry, scattered the same way every time.
const SPARKS = [
  ['.z.', 'zzz', '.z.'],
  ['..z..', '..z..', 'zzzzz', '..z..', '..z..'],
  ['..z..', '.z.z.', 'z...z', '.z.z.', '..z..'],
  ['..y..', '.y.y.', 'yyyyy'],
  ['z'],
]
const SPARK_DEFS = SPARKS.map((spark, i) => `<g id="s${i}" transform="scale(3)">${px(spark)}</g>`).join('')
const STARS = (() => {
  let seed = 7
  // A small generator of its own, so the sky is the same at every draw.
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  let stars = ''

  for (let i = 0; i < 46; i++) {
    const x = random() * 100
    const y = random() * 96
    const kind = Math.floor(random() * SPARKS.length)
    // Faint where the conversation's words sit.
    const opacity = x > 24 && x < 72 ? 0.16 : 0.3 + random() * 0.4

    stars += `<use href="#s${kind}" x="${x.toFixed(1)}%" y="${y.toFixed(1)}%" opacity="${opacity.toFixed(2)}"${i % 2 ? ` class="tw${i % 3}"` : ''}/>`
  }

  return stars
})()

const HEAD_ART =
  `${AHOGE}${px(HEAD)}<g class="closed">${CLOSED}</g><g class="half">${HALF}</g><g class="open">${OPEN}</g>${MOUTH}`
const GLASSES = `<g class="glasses">${BRIDGE}<g class="sa">${lenses(SWIRL_A)}</g><g class="sb">${lenses(SWIRL_B)}</g></g>`

/** How one of Ina's lines plays: a looping, a one-time, or a standing style. */
const plays = (slot, delay, loop, once) =>
  slot.kind === 'loop' ? `animation:${loop} ${LOOP}s steps(1) ${delay}s infinite` : slot.kind === 'once' ? `animation:${once} ${delay}s` : ''

function ina(scene, said) {
  const bubbles = said
    .map(slot => `<g class="say" style="${plays(slot, slot.at, 'say', 'on 2.4s') || 'opacity:1'}">${speech(slot.text)}</g>`)
    .join('')
  // Her mouth moves with each line; a standing line is spoken once, as she dozes.
  const mouths = said
    .map(slot => plays(slot, slot.at, 'yap', 'yap1 1.6s steps(1)') || (scene.ina === 'doze' ? `animation:yap1 1.6s steps(1) ${slot.at}s` : ''))
    .map(style => (style === '' ? '' : `<g class="mo" style="${style}">${MOUTH_OPEN}</g>`))
    .join('')

  return (
    `<g class="sigil">${SIGIL}</g><g class="zzz">${ZZZ}</g>${bubbles}` +
    `<g class="head">${HEAD_ART}${mouths}${GLASSES}</g>`
  )
}

// A takodachi, left half: 24 x 20 once mirrored, its halo first.
const TAKO =
  px(
    mirror([
      '.......yyyyy',
      '.....yy.....',
      '.......yyyyy',
      '............',
      '.......ooooo',
      '.....oottttt',
      '....otTTtttt',
      '...otTtttttt',
      '.oottttttttt',
      'ottttttttttt',
      'ottttttttttt',
      '.oottttttttt',
      '...otttttttt',
      '...otttttttt',
      '...otttttttt',
      '...otttttttt',
      '...otttttttt',
      '...otttttttt',
      '...ottottott',
      '....oo.oo.oo',
    ]),
  ) +
  both(['eeee'], 6, 11, 24) +
  px(['e.ee.e', '.e..e.'], 9, 12) +
  both(['yy'], 5, 13, 24)

const ARM = ['oo', 'TT', 'TT']
const LAPTOP =
  px(
    [
      'oooooooooooooo',
      'oGGGGGGGGGGGGo',
      'oggggggggggggo',
      'ogggggyygggggo',
      'oggggggggggggo',
    ],
    5,
    15,
  ) +
  px(['oooooooooooooooo', 'oGGGGGGGGGGGGGGo', 'oooooooooooooooo'], 4, 20) +
  `<g class="al">${px(ARM, 6, 13)}</g><g class="ar">${px(ARM, 16, 13)}</g>`

const COOKIE =
  `<g class="crumb">${px(['k'], 7, 15)}${px(['k'], 16, 14)}</g>` +
  `<g class="cookie">${px(['.kkk..', 'kkKk..', 'kkkkkk', 'kKkkKk', 'kkkKkk', '.kkkk.'], 9, 14)}${px(ARM, 7, 16)}${px(ARM, 15, 16)}</g>`

// What a takodachi comes and goes with. Each is drawn around its 24 x 20 grid.

// A small summoning circle on the ground under it, motes rising.
const RING = (() => {
  const cells = grid(35, 22)
  const oval = (rx, ry, color, step) => {
    for (let angle = 0; angle < 360; angle += step) {
      plot(cells, 17 + rx * Math.cos((angle * Math.PI) / 180), 17 + ry * Math.sin((angle * Math.PI) / 180), color)
    }
  }

  oval(16, 4, 'z', 2)
  oval(11, 2.5, 'y', 3)
  oval(13.5, 3.3, 'w', 45)
  ;[[6, 9], [27, 6], [12, 2], [22, 11], [17, 5], [3, 13], [30, 12]].forEach(([x, y]) => plot(cells, x, y, 'Y'))

  return px(rows(cells), -5, 2)
})()

// A tentacle from the left edge, its tip curled around the takodachi.
const GRAB = (() => {
  // Straight for `reach`, then most of a circle of `radius` around the takodachi.
  const [reach, radius, wrap] = [78, 13, 56]
  const { rows: up, root } = tentacle(reach + wrap, t => Math.max(0, t * (reach + wrap) - reach) / radius, 3.4, 'dhy')
  // Laid on its side: what rose now reaches right, the root at the left.
  const across = [...up[0]].map((_, x) => up.map(row => row[x]).reverse().join(''))

  // The circle's middle on the takodachi's own, 12, 11.
  return px(across, 12 - reach, 11 - (root - radius))
})()

// A puff of ink, small then large.
const puff = (discs, x, y) => {
  const cells = grid(26, 24)

  discs.forEach(([cx, cy, r]) => round(cells, cx, cy, r, 'h', far => far < r))
  discs.forEach(([cx, cy, r]) => round(cells, cx, cy, r, 'd', far => far < r - 1.6))

  return px(rows(cells), x, y)
}
const INK =
  `<g class="i1">${puff([[12, 12, 4], [8, 14, 3], [16, 11, 3]], -1, -1)}</g>` +
  `<g class="i2">${puff([[12, 11, 7], [5, 14, 5], [20, 13, 5], [8, 6, 4], [17, 5, 4], [13, 18, 4]], -1, -1)}</g>`

const WAH_ECHO = (() => {
  const rows = bubble('WAH!', 11)

  // Over its halo, so it stays clear of the takodachi above.
  return px(rows, 12 - Math.floor(rows[1].length / 2), 3 - rows.length)
})()

const DEFS =
  `<g id="tako">${TAKO}</g><g id="ring">${RING}</g><g id="grab">${GRAB}</g><g id="wah">${WAH_ECHO}</g>${SPARK_DEFS}`

const ENTER = ['circle', 'tentacle', 'pop', 'fall', 'ink']
const EXIT = ['circle', 'tentacle', 'ascend', 'ink', 'sink']

function hash(text) {
  let code = 2166136261

  for (const char of text) {
    code = Math.imul(code ^ char.charCodeAt(0), 16777619)
  }

  return code >>> 0
}

/** One takodachi where it sits, with what its coming or going needs, and its WAHs. */
function takodachi(tako, wahs) {
  const how = tako.phase === 'in' ? tako.enter : tako.phase === 'out' ? tako.exit : ''
  const phase = tako.phase === 'in' ? `in e-${how}` : tako.phase === 'out' ? `out x-${how}` : 'on'
  // It answers each of Ina's WAHs a beat later, with a hop.
  const beat = 0.3 + (hash(tako.id) % 5) * 0.12
  const echoes = tako.phase === 'out' ? [] : wahs
  const body = echoes.reduce(
    (inner, slot) => `<g style="${plays(slot, (slot.at + beat).toFixed(2), 'hop24', 'hop .3s steps(3)')}">${inner}</g>`,
    `<g class="bob" style="animation-delay:-${((tako.cell * 0.37) % 1.4).toFixed(2)}s"><use href="#tako"/>${tako.kind === 'cookie' ? COOKIE : LAPTOP}</g>`,
  )

  return (
    `<svg y="${tako.y}%" overflow="visible"><g class="tako-s"><g transform="translate(${tako.x} 0)">` +
    (how === 'circle' ? '<use href="#ring" class="p-ring"/>' : '') +
    `<g class="${phase}">${body}${how === 'tentacle' ? '<use href="#grab" class="arm"/>' : ''}</g>` +
    (how === 'ink' ? INK : '') +
    echoes
      .map(slot => `<use href="#wah" class="say" style="${plays(slot, (slot.at + beat).toFixed(2), 'say', 'on 1.6s')}"/>`)
      .join('') +
    `</g></g></svg>`
  )
}

const CSS = `
.ina-s{transform:scale(5)}.tako-s{transform:scale(4)}
@media (max-width:700px){.ina-s{transform:scale(3)}.tako-s{transform:scale(2)}}
.glasses,.open,.half,.mo,.say,.sb,.out,.p-ring,.i1,.i2{opacity:0}
.sigil{opacity:.5}
.wake .sigil,.work .sigil,.wait .sigil{opacity:1}
.wake .sigil{animation:glow .6s steps(4) backwards,pulse 4s steps(4) 1.2s infinite}
.work .sigil{animation:pulse 4s steps(4) infinite}
.doze .sigil{animation:dim .6s steps(4) var(--d) backwards}
.wake .tw0,.work .tw0{animation:twinkle 2.3s steps(1) infinite}
.wake .tw1,.work .tw1{animation:twinkle 3.1s steps(1) -1s infinite}
.wake .tw2,.work .tw2{animation:twinkle 4.3s steps(1) -2s infinite}
.wake .zzz,.work .zzz,.wait .zzz,.wake .closed,.work .closed,.wait .closed{opacity:0}
.wake .open,.work .open,.wait .open,.wake .glasses,.work .glasses,.wait .glasses{opacity:1}
.wake .zzz{animation:on .3s}
.wake .closed{animation:on .35s}
.wake .open{animation:off .35s}
.wake .glasses{animation:drop .45s steps(5) .5s backwards}
.wake .head{animation:hop .3s steps(3) .3s,bob 1s steps(1) 1.2s infinite}
.work .head{animation:bob 1s steps(1) infinite}
.wake .sa,.work .sa{animation:flip 1.2s steps(1) infinite}
.wake .sb,.work .sb{animation:flip 1.2s steps(1) -.6s infinite}
.doze .glasses{animation:lift .5s steps(5) var(--d) backwards}
.doze .open{animation:on calc(var(--d) + .5s)}
.doze .half{animation:mid 1s steps(1) var(--d) backwards}
.doze .closed{animation:off calc(var(--d) + 1s)}
.doze .z1{animation:off calc(var(--d) + 1.2s)}.doze .z2{animation:off calc(var(--d) + 1.6s)}.doze .z3{animation:off calc(var(--d) + 2s)}
.in .bob,.on .bob{animation:bob 1.4s steps(1) infinite}
.in .al,.on .al{animation:bob .4s steps(1) infinite}
.in .ar,.on .ar{animation:bob .4s steps(1) -.2s infinite}
.in .cookie,.on .cookie{animation:munch .7s steps(1) infinite}
.in .crumb,.on .crumb{animation:flip .7s steps(1) infinite}
.e-pop{animation:pop .5s steps(5) backwards}
.e-fall{animation:fall .7s steps(4) backwards}
.e-circle{animation:pop .5s steps(5) .4s backwards}
.e-ink{animation:off .3s}
.e-tentacle{animation:slide .7s steps(7) backwards}
.e-tentacle .arm{opacity:0;animation:away .5s steps(5) .9s backwards}
.x-sink{animation:sink .5s steps(5)}
.x-ascend{animation:ascend 1s steps(8)}
.x-circle{animation:sink .5s steps(5) .5s backwards}
.x-ink{animation:on .3s}
.x-tentacle{animation:away .6s steps(6) .7s backwards}
.x-tentacle .arm{animation:slide .5s steps(5)}
.p-ring{animation:ring 1.3s steps(1)}
.i1{animation:on .15s,on .15s .45s}
.i2{animation:on .3s .15s}
@keyframes on{from,to{opacity:1}}
@keyframes off{from,to{opacity:0}}
@keyframes mid{0%,49%{opacity:0}50%,to{opacity:1}}
@keyframes flip{0%{opacity:1}50%,to{opacity:0}}
@keyframes say{0%{opacity:1}9%,to{opacity:0}}
@keyframes yap{0%,3%,6%{opacity:1}1.5%,4.5%,8%,to{opacity:0}}
@keyframes yap1{0%,40%,80%{opacity:1}20%,60%,to{opacity:0}}
@keyframes hop24{1%{transform:translateY(-3px)}2%,to{transform:none}}
@keyframes drop{from{transform:translateY(-8px);opacity:0}}
@keyframes lift{from{opacity:1}to{transform:translateY(-8px);opacity:0}}
@keyframes hop{50%{transform:translateY(-3px)}}
@keyframes bob{50%,to{transform:translateY(1px)}}
@keyframes munch{50%,to{transform:translateY(-2px)}}
@keyframes pop{from{transform:translateY(12px);opacity:0}}
@keyframes fall{from{transform:translateY(-40px);opacity:0}55%{transform:none;opacity:1}75%{transform:translateY(-4px)}to{transform:none}}
@keyframes sink{from{opacity:1}to{transform:translateY(12px);opacity:0}}
@keyframes ascend{from{opacity:1}to{transform:translateY(-30px);opacity:0}}
@keyframes slide{from{transform:translateX(-100px)}}
@keyframes away{from{opacity:1}to{transform:translateX(-100px);opacity:1}}
@keyframes ring{0%,30%{opacity:.5}15%,45%{opacity:1}85%{opacity:.5}to{opacity:0}}
@keyframes glow{from{opacity:.5}}
@keyframes dim{from{opacity:1}}
@keyframes pulse{50%{opacity:.7}}
@keyframes twinkle{50%,to{opacity:.08}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
`.replaceAll('\n', '')

/**
 * The whole backdrop for a scene state. Asleep or waiting, Ina does not move.
 * `left` and `right` are how far in from the window's edges the sprites stand,
 * in pixels: clear of side panels drawn over the backdrop.
 */
export function draw(scene, { left = 0, right = 0 } = {}) {
  const said = lines(scene)
  const wahs = said.filter(slot => slot.kind !== 'stay' && slot.text.includes('WAH'))
  // She finishes her line before she dozes off.
  const lull = scene.cue === 'ask' ? 3 : 2.4

  // No viewBox on the root: one unit is one CSS pixel, so the sprites keep whole
  // pixels at any window size, pinned to the edges by the nested svgs. The
  // style fills the view where a surface puts the markup in a page of its own.
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style="position:fixed;top:0;left:0;width:100vw;height:100vh" shape-rendering="crispEdges"><style>${CSS}</style>` +
    `<defs><radialGradient id="glow"><stop offset="0" stop-color="#3a2670" stop-opacity=".5"/><stop offset="1" stop-color="#3a2670" stop-opacity="0"/></radialGradient>${DEFS}</defs>` +
    `<rect width="100%" height="100%" fill="#07050c"/>` +
    `<svg x="100%" y="50%" overflow="visible"><circle cx="${-right - 135}" r="1000" fill="url(#glow)"/></svg>` +
    `<g class="${scene.ina}">${STARS}</g>` +
    `<svg x="100%" overflow="visible"><g transform="translate(${-right} 0)"><g class="ina-s">${TENTACLE_HIGH}</g></g></svg>` +
    `<svg x="100%" y="100%" overflow="visible"><g transform="translate(${-right} 0)"><g class="ina-s">${TENTACLE_LOW}</g></g></svg>` +
    // The takodachis' own left edge: what reaches past it is cut, so a tentacle comes out from behind it.
    `<svg x="${left}">${scene.takos.map(tako => takodachi(tako, wahs)).join('')}</svg>` +
    `<svg x="100%" y="50%" overflow="visible"><g transform="translate(${-right} 0)"><g class="ina-s"><g transform="translate(-48 -16)" class="${scene.ina}" style="--d:${lull}s">${ina(scene, said)}</g></g></g></svg>` +
    `</svg>`
  )
}

export const ASLEEP = { ina: 'sleep', cue: 'none', seed: 0, takos: [] }

const working = scene => scene.ina === 'wake' || scene.ina === 'work'
const asleep = scene => scene.ina === 'sleep' || scene.ina === 'doze'

// Every change redraws the whole scene, so each one first ends what the last
// began: a transition that played stays played, a takodachi that left is gone,
// a line said once is said. `id` names the change, and so picks the next lines.
const settle = (scene, id) => ({
  ina: scene.ina === 'wake' ? 'work' : scene.ina === 'doze' ? 'sleep' : scene.ina,
  cue: (scene.cue === 'ask' && asleep(scene)) || (scene.cue === 'wait' && scene.ina === 'wait') ? scene.cue : 'none',
  seed: hash(`${scene.seed}${id}`),
  takos: scene.takos.filter(tako => tako.phase !== 'out').map(tako => ({ ...tako, phase: 'on' })),
})

/** The main agent starts a turn. */
export const wake = (scene, id) => ({ ...settle(scene, id), ina: asleep(scene) ? 'wake' : 'work', cue: 'none' })

/** The main agent's turn ends: `cue` is `done`, `ask`, `stop` or `oops`. */
export const doze = (scene, id, cue = 'done') =>
  scene.ina === 'sleep' ? settle(scene, id) : { ...settle(scene, id), ina: 'doze', cue }

/** A question is put to the person mid-turn: Ina holds still until `resume`. */
export const ask = (scene, id) => (working(scene) ? { ...settle(scene, id), ina: 'wait', cue: 'wait' } : scene)

/** The person answered. */
export const resume = (scene, id) => (scene.ina === 'wait' ? { ...settle(scene, id), ina: 'work', cue: 'back' } : scene)

/** A subagent starts a run: its takodachi takes a free spot on the left. */
export function join(scene, id) {
  const next = settle(scene, id)

  if (next.takos.some(tako => tako.id === id)) {
    return next
  }
  const code = hash(id)
  const free = cell => !next.takos.some(tako => tako.cell === cell)
  // Two columns of four spots, picked at random; past eight, further columns in order.
  const open = [...Array(8).keys()].filter(free)
  let cell = open[code % open.length]

  for (let more = 8; cell === undefined; more++) {
    cell = free(more) ? more : undefined
  }
  const tako = {
    id,
    cell,
    // Art pixels from the left edge and percent from the top, off the grid by a little.
    x: 3 + Math.floor(cell / 4) * 27 + ((code >>> 4) % 6),
    y: 12 + (cell % 4) * 16 + ((code >>> 8) % 5),
    // One in three brings a cookie.
    kind: (code >>> 12) % 3 === 0 ? 'cookie' : 'laptop',
    enter: ENTER[(code >>> 16) % ENTER.length],
    exit: EXIT[(code >>> 20) % EXIT.length],
    phase: 'in',
  }

  return { ...next, cue: working(next) ? 'join' : next.cue, takos: [...next.takos, tako] }
}

/** A subagent's run ends. */
export function leave(scene, id) {
  const next = settle(scene, id)

  return {
    ...next,
    cue: working(next) ? 'leave' : next.cue,
    takos: next.takos.map(tako => (tako.id === id ? { ...tako, phase: 'out' } : tako)),
  }
}
