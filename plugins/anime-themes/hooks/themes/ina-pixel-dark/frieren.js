// Frieren Ina: Ina in Frieren's cosplay, summoned on one wake in four. Her
// parts drawn over Ina's own head, her faces and lines, Fern's staff for the
// takodachis, and the summoning's light, motes and tentacles. All of it is in
// the head's own grid (42 x 32, its middle at 21, 16), as `scene.js` draws it.

import { both, curls, px, tentacle } from './pixels.js'

const W = 42

/** What she says as the circle wakes Ina, and as she leaves. */
export const FR_WAKE = 'WAH?!?'
export const FAREWELL = 'SEE YOU AGAIN\nIN 100 YEARS~'

/** Her own lines, mixed in with Ina's usual ones while she works. */
export const FR_SAY = [
  'WHAT IN THE WORLD\nIS DOOM?',
  'くらいよー！\nこわいよー！',
  'YAMETE YO~',
  'MIMIC? MIMIC!',
  'JUST ONE MORE\nCHEST~',
  "TAKODACHIS,\nDON'T BE MAD~",
  'ONLY 10 YEARS?\nSHORT~',
  'AO-CHAN GET!',
]

/** Kana for 暗いよー！怖いよー！, seven rows tall: five would not read. */
export const KANA = {
  く: '...x./..x../.x.../x..../.x.../..x../...x.',
  ら: '.x.../..xx./x..../x.xx./xx..x/....x/.xxx.',
  い: 'x...../x...x./x....x/x....x/x...../x.x.../.x....',
  よ: '..x../..xxx/..x../..x../.xxx./x.x.x/.xx..',
  こ: '...../.xxx./....x/...../...../x..../.xxxx',
  わ: '.x..../xxxx../.x.xx./.xx..x/xx...x/.x..x./.x.x..',
  ー: '...../...../...../xxxxx/...../...../.....',
  '！': 'x/x/x/x/x/./x',
}

// Twin tails, tied high and hanging past her shoulders, orange at the tips.
const TAIL = (() => {
  const body = Array.from({ length: 36 }, (_, y) => {
    const sway = Math.round(Math.sin(y / 5) * 1.2) + 1

    return `${'.'.repeat(sway)}${y % 9 === 2 ? 'ohHhho' : 'ohhhho'}${'.'.repeat(3 - sway)}`
  })

  return [...body, '..oyyYo.', '..oyyyo.', '...oyo..', '....o...']
})()
const TIE = ['.oo.', 'ojjo', 'oJjo', '.oo.']

// Long elf ears, pointing out and up, over the small ear of Ina's own head.
const EAR = [
  'oo.............',
  'osoo...........',
  '.ossoo.........',
  '.osbssoo.......',
  '..osbbsssoooo..',
  '...osbbbsssssso',
  '....oosbbssssss',
  '......oosssssso',
  '........oooooo.',
]
const EARRING = ['.j.', '.r.', 'rRr', 'rrr', '.r.']

// The white collar, gold-edged, with the red gem in the middle.
const COLLAR = [
  '..oooooooooooooo..',
  '.ojjjjjjjjjjjjjjo.',
  '.owwwwwjjjjwwwwwo.',
  '.owwwwjrRrrjwwwwo.',
  '.owwwwjrrrrjwwwwo.',
  '.owwwwwjjjjwwwwwo.',
  '.ojJJJJJJJJJJJJjo.',
  '..oooooooooooooo..',
]

// Her three faces: deadpan, smug, and scribbled-shut with a cat mouth.
const FACES = {
  plain: both(['oooo', 'wnne', 'nnne', '.nn.'], 11, 16, W) + px(['ee'], 20, 23),
  smug: both(['.ooo', 'oonn', '.wne', '..oo'], 11, 17, W) + px(['e....e', '.eeee.'], 18, 22),
  cute: both(['.eee', 'eeee', 'eee.'], 11, 18, W) + px(['e.e.e', '.e.e.'], 19, 22),
}

/** Everything Frieren Ina wears over Ina's head, and her face: the tails go behind it. */
export const frierenBack = () => both(TAIL, -6, 6, W) + both(TIE, -3, 4, W)
export const frierenFront = face =>
  both(EAR, -10, 11, W) + both(EARRING, -3, 20, W) + px(COLLAR, 12, 30) + (FACES[face] ?? FACES.plain)

// The summoning: a glow, a column of light with sparkles round it, and motes
// rising off the circle. `.fx` carries the moment it starts as `--s`.
const SPARKLE = ['..w..', '..L..', 'wLwLw', '..L..', '..w..']
const MOTES = Array.from({ length: 22 }, (_, i) => {
  const angle = Math.PI * (0.05 + 0.9 * ((i * 7) % 22) / 21)
  const reach = 30 + ((i * 5) % 17)
  const x = Math.round(21 + reach * Math.cos(angle))
  const y = Math.round(16 + reach * Math.sin(angle) * 0.9)
  const color = ['#ffd27f', '#b9a6ee', '#ffffff'][i % 3]
  const size = i % 4 === 0 ? 2 : 1

  return `<rect class="pt" x="${x}" y="${y}" width="${size}" height="${size}" fill="${color}" style="--k:${((i * 0.29) % 0.9).toFixed(2)}s"/>`
}).join('')

export const summonFx = (start, beam) =>
  `<g class="fx" style="--s:${start}s">` +
  '<radialGradient id="flare"><stop offset="0" stop-color="#e6dcff" stop-opacity=".85"/><stop offset=".55" stop-color="#9b7fe0" stop-opacity=".35"/><stop offset="1" stop-color="#9b7fe0" stop-opacity="0"/></radialGradient>' +
  '<circle class="fl" cx="21" cy="16" r="62" fill="url(#flare)"/>' +
  (beam
    ? '<g class="beam"><rect x="3" y="-140" width="36" height="210" fill="#b9a6ee" opacity=".55"/><rect x="13" y="-140" width="16" height="210" fill="#ffffff" opacity=".9"/></g>' +
      `<g class="sp">${[0, 1, 2, 3, 4, 5, 6, 7]
        .map(i => px(SPARKLE, Math.round(19 + 33 * Math.cos((i * Math.PI) / 4)), Math.round(14 + 30 * Math.sin((i * Math.PI) / 4))))
        .join('')}</g>`
    : '') +
  MOTES +
  '</g>'

// Tentacles that rise out of the circle's foot, over her, and sink again: the
// clip is the circle's lower edge, so they come out of it and go back in.
// Seven across the circle, shorter further out: the edge pair and the inner
// pair curl in towards her, the pair between them away. Each is drawn on the
// left and mirrored across her middle, the outer ones first, behind, and plain:
// the scene has a size limit. A dark rim a pixel wide sets each apart.
const ARMS = [
  // [root, length, sway, curl, thickness, tip, colors]: a curl over 0 turns left.
  [-14, 70, 0.3, -4.5, 6, 1.5, 'uuq'],
  [-2, 82, -0.25, 4, 7, 2, 'uuq'],
  [10, 86, 0.25, -2.6, 9, 4, 'uUq'],
]
function arm(root, length, sway, curl, thick, tip, colors) {
  const at = (width, tip, colors) => {
    const { rows, root: from } = tentacle(length, curls(sway, curl), width, colors, tip)

    return px(rows, root - from, 66 - rows.length)
  }

  return at(thick + 1, tip + 1, 'ooo') + at(thick, tip, colors)
}
const COVER_ART =
  ARMS.map((pair, i) => `<g id="arm${i}">${arm(...pair)}</g><use href="#arm${i}" transform="matrix(-1 0 0 1 43 0)"/>`).join('') +
  arm(21, 84, 0.2, 0.6, 12, 7, 'uUq')
export const COVER =
  '<clipPath id="cv"><rect x="-80" y="-120" width="200" height="184"/></clipPath>' +
  `<g clip-path="url(#cv)"><g class="cover">${COVER_ART}</g></g>`

// Fern's staff: a long wooden staff, a ring at its head round a gem, purple
// ribbon tied under it. Held at a takodachi's right, in its 24 x 20 grid.
const STAFF_ROWS = [
  '...vvv..',
  '..vV.Vv.',
  '.vV.L.Vv',
  '.vV...Vv',
  '..vV.Vv.',
  '...vVv..',
  '....vV..',
  '..lllll.',
  '.lLlvVLl',
  '.l..vV.l',
  'l...vV..',
  '....vV..',
  ...Array.from({ length: 26 }, (_, i) => (i === 17 || i === 18 ? 'ooTTvV..' : '....vV..')),
  '....oo..',
]
export const STAFF = px(STAFF_ROWS, 18, -16)
/** Now and then a glint off the staff's gem. */
export const GLINT = px(['.L.', 'LwL', '.L.'], 21, -15)
