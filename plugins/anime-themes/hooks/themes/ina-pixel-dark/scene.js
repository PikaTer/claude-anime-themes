// The pixel art, the scene's SVG and the scene's state changes. Pure: no `$`.

import { both, curls, grid, line, mirror, plot, px, round, rows, tentacle } from './pixels.js'
import { COVER, FAREWELL, FR_SAY, FR_WAKE, GLINT, KANA, STAFF, frierenBack, frierenFront, summonFx } from './frieren.js'
import { AO_BYE, AO_CSS, AO_DEFS, AO_GET, AO_HI, AO_SAY, AO_SPARKS, aoChan } from './ao.js'
import { FIRE, SHOW, SHOW_SAY, showParts, takoShow } from './special.js'
import { CAT_AO, CAT_BYE, CAT_CSS, CAT_HEAD, CAT_SAY, CAT_SPARKS, CAT_WAKE, HEART, nyan } from './cat.js'

// Ina's head, left half: 42 x 32 once mirrored, down to where her hair hangs
// free of her cheeks. Its ends are one of HAIR's.
const CROWN = [
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
]
// The ends of her hair, orange-tipped, each its own first 12 columns, then
// her cheek and chin's. One is picked each time she wakes.
const CHEEK = ['sssssssss', 'sssssssss', 'ossssssss', 'oooosssss', '....ooooo']
const HAIR = {
  classic: ['...ohhhhhoss', '...ohhhhhhos', '...ohyyhhhho', '...oyyYyhho.', '...oyYyyho..', '...oyyyyo...', '....oyyo....', '.....oo.....'],
  flick: ['...ohhhhhoss', '...ohhhhhhos', '...ohyyhhhho', '..oyyYyhho..', '.oyYyyyho...', 'oyyyyoo.....', 'oyyo........', '.oo.........'],
  curl: ['...ohhhhhoss', '...ohhhhhhos', '...ohyyhhhho', '...oyyYyhho.', '....oyYyyyo.', '.....oyyyyyo', '......oyyyo.', '.......ooo..'],
  long: ['...ohhhhhoss', '...ohhhhhhos', '...ohhhhhhho', '...ohhhhhho.', '...ohhhhho..', '...ohyyyho..', '...oyyYyyo..', '...oyYyyyo..', '....oyyyo...', '.....ooo....'],
  split: ['...ohhhhhoss', '...ohhhhhhos', '...ohyyhhhho', '...oyyYyhho.', '...oyYyyyo..', '...oyyoyyo..', '....oo.oo...'],
  flared: ['...ohhhhhoss', '...ohhhhhhos', '...ohyyhhhho', '..oyyYyyhho.', '.oyYyyyyyo..', '.oyyyyyyyo..', '..ooooooo...'],
}
const HEADS = Object.fromEntries(
  Object.entries(HAIR).map(([kind, ends]) => [kind, px(mirror([...CROWN, ...ends.map((end, i) => end + (CHEEK[i] ?? '.........'))]))]),
)
const HAIRS = Object.keys(HAIR)
const headOf = hair => HEADS[hair] ?? HEADS.classic
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
    0: 'xxx/x.x/x.x/x.x/xxx',
    1: '.x./xx./.x./.x./xxx',
    2: 'xx./..x/.x./x../xxx',
    3: 'xx./..x/.x./..x/xx.',
    4: 'x.x/x.x/xxx/..x/..x',
    5: 'xxx/x../xx./..x/xx.',
    6: '.xx/x../xx./x.x/.x.',
    7: 'xxx/..x/.x./.x./.x.',
    8: '.x./x.x/.x./x.x/.x.',
    9: '.x./x.x/.xx/..x/xx.',
    ...KANA,
  }).map(([char, glyph]) => [char, glyph.split('/')]),
)

/**
 * One line of text as rows of pixels: five, or seven where it has kana, letters
 * set on the line's foot. Letters between `{` and `}` are drawn in pink.
 */
function letters(text) {
  let pink = false
  const glyphs = []

  for (const char of text) {
    if (char === '{' || char === '}') {
      pink = char === '{'
      continue
    }
    const glyph = FONT[char] ?? FONT[' ']

    glyphs.push(pink ? glyph.map(row => row.replaceAll('x', 'P')) : glyph)
  }
  const height = Math.max(...glyphs.map(glyph => glyph.length))

  return Array.from({ length: height }, (_, y) =>
    glyphs.map(glyph => glyph[y - height + glyph.length] ?? '.'.repeat(glyph[0].length)).join('.'),
  )
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
export const speechMarkup = speech

/**
 * A show's line: over what rises above Ina's head, its foot at `bottom`, kept
 * to the right like her own lines so it stays clear of the takodachis.
 */
function overHead(text, bottom, right = 44) {
  const rows = bubble(text, 5)

  return px(rows, right - rows[1].length, bottom + 1 - rows.length)
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

/** Two different lines of a pool, picked by `seed`. */
function two(pool, seed) {
  const a = seed % pool.length
  const b = (a + 1 + ((seed >>> 8) % (pool.length - 1))) % pool.length

  return [pool[a], pool[b]]
}

/**
 * What Ina says in a scene: `once` at a moment (for `dur` seconds), on a
 * `loop`, or to `stay` (from `at`, when that is later than the start).
 */
function lines({ ina, cue, seed, form, ao }) {
  const pick = pool => pool[seed % pool.length]
  const once = (pool, at) => ({ text: pick(pool), at, kind: 'once' })
  const stay = (pool, at = 0.1) => ({ text: pick(pool), at, kind: 'stay' })
  const frieren = form === 'frieren'
  const cat = form === 'cat'

  if (ina === 'wait') {
    return [stay(cat ? SAY.wait.map(nyan) : SAY.wait)]
  }
  // Cat Ina's farewell, whatever the ending, as Frieren Ina's is.
  if (ina === 'doze' && cat) {
    return [{ text: CAT_BYE, at: 0.1, kind: 'once' }, ...(cue === 'ask' ? [stay(SAY.ask, 4.6)] : [])]
  }
  // Frieren Ina's farewell, whatever the ending; a question waits for regular Ina.
  if (ina === 'doze' && frieren) {
    return [{ text: FAREWELL, at: 0.1, kind: 'once' }, ...(cue === 'ask' ? [stay(SAY.ask, 4.6)] : [])]
  }
  // Ina sees Ao-chan off, unless a question is waiting.
  if (ina === 'doze' && ao && cue !== 'ask') {
    return [{ text: AO_BYE, at: 0.1, kind: 'once' }]
  }
  if (ina === 'sleep' || ina === 'doze') {
    return cue === 'ask' ? [stay(SAY.ask)] : ina === 'doze' ? [once(SAY[cue] ?? SAY.done, 0.1)] : []
  }
  // Ao-chan wakes nerd Ina; Frieren Ina greets her once the summoning is done.
  const woken = frieren
    ? [{ text: FR_WAKE, at: 0.4, kind: 'once', dur: 1 }, ...(ao ? [{ text: AO_GET, at: 2, kind: 'once', dur: 1.8 }] : [])]
    : cat
      ? [{ text: CAT_WAKE, at: 0.4, kind: 'once', dur: 1 }, ...(ao ? [{ text: CAT_AO, at: 2, kind: 'once', dur: 1.8 }] : [])]
      : ao
      ? [{ text: AO_HI, at: 0.6, kind: 'once' }]
      : [once(SAY.wake, 0.6)]
  const first = ina === 'wake' ? woken : SAY[cue] ? [once(SAY[cue], 0.2)] : []
  // Cat Ina has her own NYA-T IS THIS?: the shared one would come out the same.
  const usual = two(cat ? SAY.work.filter(line => line !== 'WAH-T IS THIS?') : SAY.work, seed)
  // Hers come up two times in three; the shared ones she says nyanified.
  const own = two(cat ? CAT_SAY : FR_SAY, seed >>> 12)
  const speak = cat ? nyan : line => line
  const theirs =
    frieren || cat ? usual.map((line, i) => ((seed >>> (20 + 4 * i)) % 3 < 2 ? own[i] : speak(line))) : usual
  // With Ao-chan out, the second line is for her half the time.
  const said = ao && (seed >>> 28) % 2 === 0 ? [theirs[0], speak(AO_SAY[(seed >>> 16) % AO_SAY.length])] : theirs

  return [
    ...(cat ? first.map(slot => (slot.text === CAT_WAKE || slot.text === CAT_AO ? slot : { ...slot, text: nyan(slot.text) })) : first),
    { text: speak('WAH!'), at: 4, kind: 'loop' },
    { text: said[0], at: 12, kind: 'loop' },
    { text: said[1], at: 20, kind: 'loop' },
  ]
}

/** Characters of Ina's lines the pixel font cannot draw: empty when every line can be drawn. */
export function missingGlyphs() {
  const shared = [...Object.values(SAY).flat(), ...AO_SAY, 'WAH!']
  const all = [...shared, ...shared.map(nyan), ...FR_SAY, FR_WAKE, FAREWELL, AO_HI, AO_GET, AO_BYE, ...CAT_SAY, CAT_WAKE, CAT_AO, CAT_BYE, ...Object.values(SHOW_SAY)]

  return [...new Set(all.join('').replace(/[\n{}]/g, ''))].filter(char => FONT[char] === undefined)
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

const low = tentacle(110, curls(0.4, 7))
const high = tentacle(70, curls(0.35, 8))
const TENTACLE_LOW = px(low.rows, -low.root - 7, -low.rows.length)
const TENTACLE_HIGH = px(high.rows.toReversed(), -high.root - 7, 0)

// Ina's marks, scattered over the sky: a haloed takodachi, a four-point star,
// a heart and a clover, and a small star to fill between them.
const MARKS = [
  [
    '..yyyyyyy..',
    '.y.......y.',
    '..yyyyyyy..',
    '...........',
    '....zzz....',
    '..zzzzzzz..',
    '.zzzzzzzzz.',
    '.zzzzzzzzz.',
    'zzzzzzzzzzz',
    'zzzzzzzzzzz',
    'zzzzzzzzzzz',
    '.zzzzzzzzz.',
  ],
  [
    '......z......',
    '......z......',
    '......z......',
    '.....zzz.....',
    '....zzzzz....',
    '...zzzzzzz...',
    'zzzzzzzzzzzzz',
    '...zzzzzzz...',
    '....zzzzz....',
    '.....zzz.....',
    '......z......',
    '......z......',
    '......z......',
  ],
  [
    '.zzz...zzz.',
    'z...z.z...z',
    'z....z....z',
    'z.........z',
    'z.........z',
    '.z.......z.',
    '..z.....z..',
    '...z...z...',
    '....z.z....',
    '.....z.....',
  ],
  [
    '....zzzzz....',
    '...z.....z...',
    '...z.....z...',
    '.zzz.....zzz.',
    'z...........z',
    'z...........z',
    'z...........z',
    'z...........z',
    'z...........z',
    '.zzz.....zzz.',
    '...z.....z...',
    '...z.....z...',
    '....zzzzz....',
  ],
  ['...z...', '...z...', '..zzz..', 'zzzzzzz', '..zzz..', '...z...', '...z...'],
]
// Each mark small, and once more half again as large.
const MARK_DEFS = MARKS.map(
  (mark, i) => `<g id="m${i}"><g transform="scale(2)">${px(mark)}</g></g><g id="M${i}"><g transform="scale(3)">${px(mark)}</g></g>`,
).join('')
// A new sky each time the theme loads, then the same one at every redraw, so
// the marks hold still as the scene changes. Awake, each comes and goes on a
// clock of its own.
const STARS = (() => {
  const COLUMNS = 7
  const ROWS = 6
  let stars = ''

  // One mark at most to a cell of a loose grid: random, but never in a heap.
  for (let i = 0; i < COLUMNS * ROWS; i++) {
    if (Math.random() < 0.2) {
      continue
    }
    const x = ((i % COLUMNS) + Math.random() * 0.8) * (100 / COLUMNS)
    const y = (Math.floor(i / COLUMNS) + Math.random() * 0.8) * (96 / ROWS)
    const kind = Math.floor(Math.random() * MARKS.length)
    const size = Math.random() < 0.2 ? 'M' : 'm'
    // Faint where the conversation's words sit.
    const opacity = x > 24 && x < 72 ? 0.14 : 0.3 + Math.random() * 0.35
    const period = 4 + Math.random() * 7

    stars +=
      `<use href="#${size}${kind}" x="${x.toFixed(1)}%" y="${y.toFixed(1)}%" opacity="${opacity.toFixed(2)}" class="mk" ` +
      `style="--o:${opacity.toFixed(2)};--p:${period.toFixed(1)}s;--t:-${(Math.random() * period).toFixed(1)}s"/>`
  }

  return stars
})()

const headArt = hair =>
  `${AHOGE}${headOf(hair)}<g class="closed">${CLOSED}</g><g class="half">${HALF}</g><g class="open">${OPEN}</g>${MOUTH}`
const GLASSES = `<g class="glasses">${BRIDGE}<g class="sa">${lenses(SWIRL_A)}</g><g class="sb">${lenses(SWIRL_B)}</g></g>`

/** How one of Ina's lines plays: a looping, a one-time, or a standing style. */
const plays = (slot, delay, loop, once) =>
  slot.kind === 'loop' ? `animation:${loop} ${LOOP}s steps(1) ${delay}s infinite` : slot.kind === 'once' ? `animation:${once} ${delay}s` : ''

/** A line that stays: up at once, or hidden until its moment. */
const stays = slot => (slot.at > 1 ? `opacity:1;animation:off ${slot.at}s` : 'opacity:1')

function ina(scene, said, wahs, parts, hold) {
  const frieren = scene.form === 'frieren'
  const bubbles = said
    .map(slot => `<g class="say" style="${plays(slot, slot.at, 'say', `on ${slot.dur ?? 2.4}s`) || stays(slot)}">${speech(slot.text)}</g>`)
    .join('')
  // Her mouth moves with each line; a standing line is spoken once, as she dozes.
  const mouths = said
    .map(slot => plays(slot, slot.at, 'yap', 'yap1 1.6s steps(1)') || (scene.ina === 'doze' ? `animation:yap1 1.6s steps(1) ${slot.at}s` : ''))
    .map(style => (style === '' ? '' : `<g class="mo" style="${style}">${MOUTH_OPEN}</g>`))
    .join('')

  // Frieren Ina's turn: her head, and regular Ina's, without glasses, for either
  // side of the summoning. The light and the tentacles only as she comes and goes.
  const summoning =
    frieren && scene.ina === 'wake' ? summonFx(0, true) : frieren && scene.ina === 'doze' ? summonFx(2.4 + hold, false) : ''
  // Cat Ina is regular Ina, no glasses, with her ears and faces over her.
  const cat = scene.form === 'cat'
  const heads = frieren
    ? `<g class="nh">${headArt(scene.hair)}</g><g class="fh">${frierenBack()}${AHOGE}${headOf(scene.hair)}${frierenFront(scene.face)}</g>`
    : cat
      ? `<g class="nh">${headArt(scene.hair)}</g>${CAT_HEAD}`
      : `<g class="nh">${headArt(scene.hair)}${GLASSES}</g>`
  // Her heart circle while she is out; the round one only as it turns into it and back.
  const turning = scene.ina === 'wake' || scene.ina === 'doze'
  const circle = cat ? `${turning ? `<g class="sigil">${SIGIL}</g>` : ''}<g class="heart">${HEART}</g>` : `<g class="sigil">${SIGIL}</g>`

  const head = `<g class="head">${heads}${mouths}${parts?.face ?? ''}</g>`

  return (
    `${circle}${summoning}${cat && turning ? CAT_SPARKS : ''}${aoChan(scene, wahs, { plays, ink: INK })}${parts?.back ?? ''}<g class="zzz">${ZZZ}</g>` +
    // Her greeting's sparkles, under the bubbles.
    `${scene.ao && scene.ina === 'wake' ? AO_SPARKS : ''}${bubbles}${parts?.front ?? ''}` +
    `${parts ? `<g class="v-hd">${head}</g>` : head}${frieren && scene.ina === 'doze' ? COVER : ''}`
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

// Over its halo, so it stays clear of the takodachi above.
const echo = text => {
  const rows = bubble(text, 11)

  return px(rows, 12 - Math.floor(rows[1].length / 2), 3 - rows.length)
}
const WAH_ECHO = echo('WAH!')
// Cat Ina's takodachis answer her NYAHs: drawn only while she is out.
const NYAH_ECHO = `<g id="nyah">${echo('NYAH!')}</g>`

const DEFS =
  `<g id="staff">${STAFF}</g><g id="tako">${TAKO}</g><g id="ring">${RING}</g><g id="grab">${GRAB}</g><g id="wah">${WAH_ECHO}</g>${AO_DEFS}${MARK_DEFS}`

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
function takodachi(tako, wahs, show, cat) {
  const how = tako.phase === 'in' ? tako.enter : tako.phase === 'out' ? tako.exit : ''
  const phase = tako.phase === 'in' ? `in e-${how}` : tako.phase === 'out' ? `out x-${how}` : 'on'
  // It answers each of Ina's WAHs a beat later, with a hop.
  const beat = 0.3 + (hash(tako.id) % 5) * 0.12
  const echoes = tako.phase === 'out' ? [] : wahs
  // Its part in a show: any takodachi not on its way out joins in, on its own beat.
  const part = show !== null && tako.phase !== 'out' ? takoShow(show.kind) : null
  const body = echoes.reduce(
    (inner, slot) => `<g style="${plays(slot, (slot.at + beat).toFixed(2), 'hop24', 'hop .3s steps(3)')}">${inner}</g>`,
    `<g class="bob" style="animation-delay:-${((tako.cell * 0.37) % 1.4).toFixed(2)}s">` +
      (tako.staff ? `<use href="#staff"/><g class="glint" style="animation-delay:-${(beat * 4).toFixed(2)}s">${GLINT}</g>` : '') +
      `<use href="#tako"/>${tako.kind === 'cookie' ? COOKIE : LAPTOP}${part?.on ?? ''}</g>`,
  )

  return (
    `<svg y="${tako.y}%" overflow="visible"><g class="tako-s"><g transform="translate(${tako.x} 0)"${part ? ` style="--k:${(beat - 0.3).toFixed(2)}s"` : ''}>` +
    (how === 'circle' ? '<use href="#ring" class="p-ring"/>' : '') +
    `<g class="${phase}">${part ? part.wrap(body) : body}${how === 'tentacle' ? '<use href="#grab" class="arm"/>' : ''}</g>` +
    (part?.by ?? '') +
    (how === 'ink' ? INK : '') +
    echoes
      .map(slot => `<use href="#${cat ? 'nyah' : 'wah'}" class="say" style="${plays(slot, (slot.at + beat).toFixed(2), 'say', 'on 1.6s')}"/>`)
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
.wake .mk,.work .mk{animation:blink var(--p) steps(2) var(--t) infinite}
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
.fh,.fx .pt,.fx .beam,.fx .sp,.fx .fl,.glint{opacity:0}
.f.work .fh,.f.wait .fh{opacity:1}
.f.work .nh,.f.wait .nh{opacity:0}
.f.wake .nh{opacity:0;animation:on 1.3s}
.f.wake .fh{opacity:1;animation:off 1.3s}
.f.doze .fh{animation:on calc(var(--h) + 3.6s)}
.f.doze .nh{animation:off calc(var(--h) + 3.6s)}
.f.wake .sigil{animation:glow .4s steps(4) backwards,pulse 4s steps(4) 2s infinite}
.fx .fl{animation:flare 1.8s steps(6) var(--s)}
.fx .pt{animation:rise 1s steps(5) calc(var(--s) + var(--k)) 2}
.fx .beam{transform-box:fill-box;transform-origin:center;animation:beam .9s steps(6) calc(var(--s) + .9s)}
.fx .sp{animation:twinkle .9s steps(3) calc(var(--s) + 1s)}
.cover{transform:translateY(100px);animation:cover 1.4s steps(7) calc(var(--h) + 3s)}
.glint{animation:glint 2.8s steps(1) infinite}
@keyframes flare{0%{opacity:.3}60%{opacity:1}to{opacity:0}}
@keyframes rise{from{opacity:1}to{transform:translateY(-16px);opacity:0}}
@keyframes beam{0%{opacity:.2;transform:scaleX(.15)}45%{opacity:1;transform:none}to{opacity:0;transform:scaleX(.6)}}
@keyframes twinkle{0%,to{opacity:0}50%{opacity:1}}
@keyframes cover{0%{transform:translateY(100px)}35%,65%{transform:none}to{transform:translateY(100px)}}
@keyframes glint{0%,10%{opacity:1}11%,to{opacity:0}}
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
@keyframes blink{0%,35%,to{opacity:0}45%,85%{opacity:var(--o)}}
${AO_CSS}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
`.replaceAll('\n', '')

/**
 * What Ina says around a show, `hold` seconds from its end: she keeps her lines
 * till it is over, dozing too, and the ones for what just happened are dropped.
 * On a wake her greeting comes first: the show waits for it.
 */
function waiting(said, scene, hold) {
  if (hold === 0) {
    return said
  }
  if (scene.ina === 'doze') {
    return said.map(slot => ({ ...slot, at: slot.at + hold }))
  }

  return said
    .filter(slot => scene.ina === 'wake' || slot.kind !== 'once')
    .map(slot => (slot.kind === 'loop' ? { ...slot, at: slot.at + hold } : slot))
}

/** The show playing in a scene: its kind and `x`, the seconds till it starts (less than 0 once it has); or `null`. */
function playing({ special, ina }) {
  if (special === null || special === undefined || !(ina === 'wake' || ina === 'work' || ina === 'doze')) {
    return null
  }
  const x = (special.at - special.now) / 1000

  return x + SHOW > 0 ? { kind: special.kind, x, aim: special.aim } : null
}

/**
 * The whole backdrop for a scene state. Asleep or waiting, Ina does not move.
 * `left` and `right` are how far in from the window's edges the sprites stand,
 * in pixels: clear of side panels drawn over the backdrop.
 */
export function draw(scene, { left = 0, right = 0 } = {}) {
  const show = playing(scene)
  // A show holds back what she would say over it, and her dozing off.
  const hold = show === null ? 0 : show.x + SHOW
  const said = waiting(lines(scene), scene, hold)
  const wahs = said.filter(slot => slot.kind !== 'stay' && (slot.text.includes('WAH') || slot.text.includes('NYAH')))
  // She finishes her line before she dozes off.
  // Frieren Ina is sent back first, and regular Ina has a moment awake.
  // Cat Ina turns back first too, a little quicker.
  const lull = (scene.form === 'frieren' ? 5 : scene.form === 'cat' ? 4 : scene.cue === 'ask' ? 3 : 2.4) + hold
  const state = `${scene.ina}${scene.form === 'frieren' ? ' f' : scene.form === 'cat' ? ' c' : ''}${scene.ao ? ' a' : ''}${show === null ? '' : ` s-${show.kind}`}`
  const parts = show === null ? null : showParts(show.kind, { say: overHead, mouth: MOUTH_OPEN, nerd: scene.form !== 'frieren', aim: show.aim })
  // When Ao-chan rises: as nerd Ina wakes, or once Frieren or cat Ina is summoned.
  const rises = scene.form === 'nerd' ? 0.2 : 1.9

  // No viewBox on the root: one unit is one CSS pixel, so the sprites keep whole
  // pixels at any window size, pinned to the edges by the nested svgs. The
  // style fills the view where a surface puts the markup in a page of its own.
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style="position:fixed;top:0;left:0;width:100vw;height:100vh${show === null ? '' : `;--x:${show.x.toFixed(2)}s`}" shape-rendering="crispEdges"><style>${CSS}${scene.form === 'cat' ? CAT_CSS : ''}${parts?.css ?? ''}</style>` +
    `<defs><radialGradient id="glow"><stop offset="0" stop-color="#3a2670" stop-opacity=".5"/><stop offset="1" stop-color="#3a2670" stop-opacity="0"/></radialGradient>${DEFS}${scene.form === 'cat' ? NYAH_ECHO : ''}${parts?.defs ?? ''}</defs>` +
    `<rect width="100%" height="100%" fill="#07050c"/>` +
    `<svg x="100%" y="50%" overflow="visible"><circle cx="${-right - 135}" r="1000" fill="url(#glow)"/></svg>` +
    `<g class="${scene.ina}">${STARS}</g>${parts?.under ?? ''}` +
    `<svg x="100%" overflow="visible"><g transform="translate(${-right} 0)"><g class="ina-s">${TENTACLE_HIGH}</g></g></svg>` +
    `<svg x="100%" y="100%" overflow="visible"><g transform="translate(${-right} 0)"><g class="ina-s">${TENTACLE_LOW}</g></g></svg>` +
    // The takodachis' own left edge: what reaches past it is cut, so a tentacle comes out from behind it.
    `<svg x="${left}">${scene.takos.map(tako => takodachi(tako, wahs, show, scene.form === 'cat')).join('')}</svg>` +
    `<svg x="100%" y="50%" overflow="visible"><g transform="translate(${-right} 0)"><g class="ina-s"><g transform="translate(-52 -16)" class="${state}" style="--d:${lull}s;--a:${rises}s;--h:${hold}s">${ina(scene, said, wahs, parts, hold)}</g></g></g></svg>` +
    `${parts?.over ?? ''}</svg>`
  )
}

export const ASLEEP = { ina: 'sleep', cue: 'none', seed: 0, form: 'nerd', face: 'plain', hair: 'classic', ao: false, special: null, takos: [] }

const working = scene => scene.ina === 'wake' || scene.ina === 'work'
const asleep = scene => scene.ina === 'sleep' || scene.ina === 'doze'

// Every change redraws the whole scene, so each one first ends what the last
// began: a transition that played stays played, a takodachi that left is gone,
// a line said once is said. `id` names the change, and so picks the next lines.
const settle = (scene, id) => ({
  ina: scene.ina === 'wake' ? 'work' : scene.ina === 'doze' ? 'sleep' : scene.ina,
  cue: (scene.cue === 'ask' && asleep(scene)) || (scene.cue === 'wait' && scene.ina === 'wait') ? scene.cue : 'none',
  seed: hash(`${scene.seed}${id}`),
  // Frieren Ina leaves as she dozes: what wakes next is regular Ina, or a new roll.
  form: scene.ina === 'doze' ? 'nerd' : scene.form,
  face: scene.ina === 'doze' ? 'plain' : scene.face,
  // Her hair keeps its ends till she next wakes from sleep.
  hair: scene.hair ?? 'classic',
  // Ao-chan goes home as Ina dozes.
  ao: scene.ina === 'doze' ? false : scene.ao,
  // A show runs on through changes only by `carry`.
  special: null,
  takos: scene.takos.filter(tako => tako.phase !== 'out').map(tako => ({ ...tako, phase: 'on' })),
})

const FACES = ['plain', 'smug', 'cute']

/**
 * The main agent starts a turn. From sleep, one wake in four summons Frieren
 * Ina and about one in five cat Ina, Ninyomanyo Ninya'nis, and, on a roll of
 * her own, one in five brings Ao-chan along. Her hair's
 * ends are rolled too, any of six alike. With `now`
 * (milliseconds, `$.clock.now()`'s), the turn opens with a show once she is up.
 */
export function wake(scene, id, now) {
  const next = { ...settle(scene, id), cue: 'none' }

  if (!asleep(scene)) {
    return now === undefined || showing(scene, now) ? { ...next, ina: 'work' } : stage({ ...next, ina: 'work' }, id, now, 0.2)
  }
  const roll = hash(`frieren:${id}`)
  const ao = hash(`ao:${id}`) % 5 === 0
  const hair = HAIRS[hash(`hair:${id}`) % HAIRS.length]
  // Cat Ina on 4 in 15 of the wakes Frieren Ina leaves: about one in five.
  const woke =
    roll % 4 === 0
      ? { ...next, ina: 'wake', form: 'frieren', face: FACES[(roll >>> 8) % FACES.length], hair, ao }
      : { ...next, ina: 'wake', form: (roll >>> 14) % 15 < 4 ? 'cat' : 'nerd', face: 'plain', hair, ao }

  // Her greeting first: Frieren or cat Ina's transformation, or nerd Ina's wake line.
  return now === undefined ? woke : stage(woke, id, now, woke.form === 'nerd' ? 3.1 : 4)
}

/** When the scene's show ends, in milliseconds; `undefined` with none. */
export const showEnds = scene => (scene.special === null || scene.special === undefined ? undefined : scene.special.at + SHOW * 1000)

/**
 * A show is long over: it leaves the scene, settled as by any change, so a
 * later redraw plays nothing again (a wake or doze it held up, a takodachi's coming).
 */
export const rest = scene => settle(scene, 'rest')

/** Whether a show is still on at `now`. */
const showing = (scene, now) => scene.special !== null && scene.special !== undefined && now < scene.special.at + SHOW * 1000

/** Where Zoltraak is shot: at the takodachis on screen, or, with none, at the sky. */
const aimAt = scene => (scene.takos.some(tako => tako.phase !== 'out') ? 'left' : 'up')

/**
 * A show, `delay` seconds from `now`: Zoltraak for Frieren Ina; for nerd or cat Ina,
 * Ao-chan's if she is out, else a gold trophy, Ao-chan coming for it on one in three.
 */
function stage(scene, id, now, delay) {
  const kind = scene.form === 'frieren' ? 'zoltraak' : scene.ao || hash(`show:${id}`) % 3 === 0 ? 'ao' : 'trophy'

  const special = { kind, at: now + delay * 1000, now }

  return { ...scene, ao: scene.ao || kind === 'ao', special: kind === 'zoltraak' ? { ...special, aim: aimAt(scene) } : special }
}

/** Work landed (a commit, a deploy, a merge) at `now`: Ina puts on a show, unless one is on or she is not at work. */
export const cheer = (scene, id, now) =>
  !working(scene) || showing(scene, now) ? scene : stage({ ...settle(scene, id), cue: 'none' }, id, now, 0.2)

/**
 * What a change makes of a show: `after` is the change's scene, made from
 * `before` at `now`. A show runs on to its end through other changes, a doze
 * among them; a question or a new turn ends it.
 */
export function carry(before, after, now) {
  if (after.special !== null && after.special !== undefined && after.special !== before.special) {
    return after
  }
  const show = before.special ?? null
  const on =
    show !== null &&
    now < show.at + SHOW * 1000 &&
    (after.ina === 'wake' || after.ina === 'work' || after.ina === 'doze') &&
    !(asleep(before) && after.ina === 'wake')

  // Zoltraak takes aim again until it fires: a takodachi that came or went changes it.
  const aim = show?.aim !== undefined && now < show.at + FIRE * 1000 ? { aim: aimAt(after) } : {}

  return { ...after, special: on ? { ...show, now, ...aim } : null }
}

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
    // Fern's staff, for any that come while Frieren Ina is out.
    staff: next.form === 'frieren',
    // Cat ears, for any that come while cat Ina is out.
    ears: next.form === 'cat',
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
