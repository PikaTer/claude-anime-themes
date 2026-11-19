// Christmas Ina: in November and December, one session in two dresses the
// scene for Christmas, whichever Ina wakes. A Santa hat for her and the
// takodachis (or now and then antlers), a ribbon for Ao-chan, holly on the
// circle, snow, festive lines, and a present for the trophy. Ina's parts are
// in the head's own grid (42 x 32, its middle at 21, 16), a takodachi's in its
// 24 x 20 grid, as `scene.js` draws them.

import { mirror, px, pxr } from './pixels.js'

/** Whether a session started at `ms` (epoch milliseconds) is a festive one: `roll` is its id's hash. */
export const festiveAt = (ms, roll) => {
  const month = new Date(ms).getMonth()

  return (month === 10 || month === 11) && roll % 2 === 0
}

/** Lines mixed into everyone's while she works, and cat Ina's own. */
export const XMAS_SAY = [
  'MERRY\nCHRISTMAS!',
  'HO HO HO~',
  'JINGLE BELLS,\nJINGLE TAKOS~',
  'LET IT SNOW~',
  'COOKIES FOR\nSANTA?',
  'WRAPPING\nPRESENTS~',
  'TAKO CLAUS IS\nCOMING~',
  'NICE LIST,\nRIGHT?',
]
export const XMAS_CAT = ['MERRY\nNYASMAS~', 'JINGLE PAWS~', 'HO HO HO, NYA~', 'LET IT SNYOW~', 'NYAUGHTY\nOR NICE?']
/** Extra wake lines for nerd Ina. */
export const XMAS_WAKE = ['HO HO HO!', 'MERRY\nCHRISTMAS!']
/** The present show's line, hers and cat Ina's. */
export const XMAS_SHOW = { nerd: "A PRESENT\nFOR NINOMAE\nINA'NIS!", cat: "A PRESENT\nFOR NINYOMANYO\nNINYA'NIS!" }

// How far her speech bubbles rise to clear the hat.
export const XMAS_LIFT = 5

// The Santa hat, its fur brim over the top of her head and its tip drooping to
// the right, the pompom on her right tuft. Nothing above y = -6.
const HAT = [
  '.......oooooo.......................',
  '.....ooRRrrrroooo...................',
  '....oRRrrrrrrrrrroo.................',
  '....oRrrrrrrrrrrrrroo...............',
  '...oRrrrrrrrrrrrrrrrroo.............',
  '...oRrrrrrrrrrrrrrrrrrrooo..........',
  '..oRrrrrrrrrrrrrrrrrrrrWWroo........',
  '.owwwwwwwwwwwwwwwwwwwwwwwoWro.......',
  'owwwwwwwwwwwwwwwwwwwwwwwwwoWroooo...',
  'owZwwwZwwwwZwwwwwZwwwwZwwwooowwwwo..',
  '.oZZZZZZZZZZZZZZZZZZZZZZZo.owwwwwwo.',
  '..ooooooooooooooooooooooo..owwZwwwo.',
  '...........................oZwwZwo..',
  '............................ooooo...',
]
export const SANTA_HAT = `<g class="xhat">${pxr(HAT, 8, -6)}</g>`

// A takodachi's halo, without it: its first four rows, which the hat or the
// antlers take.
export const HALO_ROWS = 4

// A takodachi's hat, on its head where the halo was, the pompom to its right.
const TAKO_HAT = [
  '........oooo............',
  '.......oRrrroooo........',
  '......oRrrrrrrrroo.oooo.',
  '.....oRrrrrrrrrrrrrowwo.',
  '....owwwwwwwwwwwwwwowwo.',
  '....oZwZwwZwwZwwZwZo.oo.',
]
// Antlers and a red nose, for about one in four.
const ANTLER = ['....k.k.....', '....kk..k...', '.....kkk....', '.......k....']
// Holly sprigs, for the circle's outer ring.
const HOLLY = ['DD.....DD', 'DSD...DSD', '.DSD.DSD.', '..DrRrD..', '...rrr...']
// Ao-chan wrapped as a present: a ribbon round her cover, crossing above her
// eye, and a bow where it crosses, from the book's top-left corner.
const BOW = ['.oo...oo.', 'oRroooRro', 'orrRrRrro', '.ooorooo.', '...oro...']
const RIBBON =
  '<path fill="#ff8a96" d="M13 5h1v18h-1zM3 7h14v1h-14z"/><path fill="#d8344a" d="M14 5h1v18h-1zM3 8h14v1h-14z"/>' + px(BOW, 10, 5)

// The baubles on the tentacles, each on a gold hook: red, gold, blue and
// silver, a highlight and a shaded side. A sprite is 5 x 8 (the hook's pixel on
// its top middle), drawn once and set where the tentacles hang it.
export const BAUBLE_SIZE = [5, 8]
const BAUBLE = ['..J..', '..j..', '..J..', '.111.', '1h111', '11112', '11122', '.222.']
const BAUBLE_COLORS = [['r', 'R', 'W'], ['J', 'X', 'j'], ['Q', 'B', 'O'], ['Z', 'w', 'g']]
export const BAUBLES = BAUBLE_COLORS.length
const BAUBLE_DEFS = BAUBLE_COLORS.map(
  ([body, light, shade], i) =>
    `<g id="bb${i}">${px(BAUBLE.map(row => row.replaceAll('1', body).replaceAll('h', light).replaceAll('2', shade)))}</g>`,
).join('')
export const XMAS_DEFS =
  `<g id="xh">${pxr(TAKO_HAT)}</g><g id="xa">${px(mirror(ANTLER))}${px(['rR', 'rr'], 11, 10)}</g>` +
  `<g id="hl">${px(HOLLY)}</g><g id="xr">${RIBBON}</g>${BAUBLE_DEFS}`
export const SIGIL_HOLLY = [-2.2, 3.5, 0.75, -0.6]
  .map(angle => `<use href="#hl" x="${Math.round(21 + 47 * Math.cos(angle)) - 4}" y="${Math.round(16 + 47 * Math.sin(angle)) - 2}"/>`)
  .join('')
/** Ao-chan's ribbon on the book whose top-left corner is `at`. */
export const aoRibbon = ([x, y]) => `<use href="#xr" class="xr" x="${x}" y="${y}"/>`

// The present that stands in for the gold trophy: a red box, a gold ribbon
// and bow. Its foot where the trophy's is.
const PRESENT = mirror([
  '.......oo...',
  '......oJJo..',
  '.....oJjjJo.',
  '.....ojjjjoo',
  '......oojjJj',
  'oooooooooojJ',
  'oRRRRRRRRRjJ',
  'orrrrrrrrrjJ',
  'oWWWWWWWWWjJ',
  'oooooooooojJ',
  '.oRrrrrrrrjJ',
  '.oRrrrrrrrjJ',
  '.oRrrrrrrrjJ',
  '.oRrrrrrrrjJ',
  '.oJJJJJJJJJJ',
  '.ojjjjjjjjjj',
  '.oRrrrrrrrjJ',
  '.oRrrrrrrrjJ',
  '.oRrrrrrrrjJ',
  '.oWWWWWWWWjJ',
  '.ooooooooooo',
])
export const presentArt = ([x, y]) => px(PRESENT, x, y + 24 - PRESENT.length)

// A snowflake, for the sky's marks.
export const SNOWFLAKE = ['....z....', '.z..z..z.', '..z.z.z..', '...zzz...', 'zzzzzzzzz', '...zzz...', '..z.z.z..', '.z..z..z.', '....z....']

// The snow: faint flakes falling slowly from the top of the window to its foot,
// each on a clock of its own. Small, dim and slow, so no spot swings light and
// dark often enough to trip the desktop app's flash guard; fainter still where
// the conversation's words sit, as the marks are. They fall only while Ina is
// up; otherwise each holds still where it is. A redraw starts each one again
// from its own spot, as it does each mark's blink.
export const SNOW = `<g class="sn">${Array.from({ length: 24 }, (_, i) => {
  const x = (i * 37 + 11) % 100
  const y = (i * 53 + 7) % 100
  const period = 16 + ((i * 7) % 9)

  return `<rect x="${x}%" y="${y}%" width="3" height="3"${x > 24 && x < 72 ? ' opacity=".5"' : ''} style="--y:${y}vh;--p:${period}s;--t:-${(i * 5.3) % period | 0}s"/>`
}).join('')}</g>`

export const XMAS_CSS = `
.sn{fill:#e8e4f5;opacity:.4}
.sn rect{animation:snow var(--p) linear var(--t) infinite paused}
.wake .sn rect,.work .sn rect{animation-play-state:running}
@keyframes snow{from{transform:translateY(calc(-1 * var(--y) - 6px))}to{transform:translateY(calc(100vh - var(--y)))}}
`.replaceAll('\n', '')
