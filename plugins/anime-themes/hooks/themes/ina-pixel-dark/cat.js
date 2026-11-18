// Cat Ina: Ninyomanyo Ninya'nis, Ina with cat ears, on about one wake in five.
// Her lines and how she nyanifies everyone else's, her look, and her CSS.

import { both, grid, line, plot, px, round, rows } from './pixels.js'

/** What she blurts as she wakes, greets Ao-chan with, and says as she goes. */
export const CAT_WAKE = 'INYA?!?'
export const CAT_AO = 'AO-NYAN!!'
export const CAT_BYE = 'BYE NYA~'

/** Her own lines, mixed in with Ina's usual ones while she works. */
export const CAT_SAY = [
  "IT IS I,\nNINYOMANYO\nNINYA'NIS!",
  'INYA, INYA, INYA',
  'TAKONYACHI!',
  'NYA-T IS THIS?',
  'PURR PURR~',
  'PAWS FOR A BREAK~',
  'HISSS... A BUG!',
  'KNEADING\nTHE CODE~',
  'LOVE THE FLOOR,\nINYA~',
]

/** A shared line as cat Ina says it: every NA a NYA, and so on. */
export const nyan = text =>
  text.replaceAll('AO-CHAN', 'AO-NYAN').replaceAll('WAH', 'NYAH').replaceAll('NA', 'NYA').replaceAll('NO', 'NYO')

// Her look: cat ears over the tufts at the top corners of Ina's head, a
// surprised face as she wakes, whiskers once she is herself, and a summoning
// circle turned into a heart. All in the head's own grid (42 x 32, its middle
// at 21, 16), as `scene.js` draws it. Nothing reaches above y = -2: her speech
// bubbles end there.

const W = 42
const flip = sprite => sprite.map(row => [...row].reverse().join(''))

// The left ear, tipped a little outward; the right is its mirror.
const EAR = [
  '..oo......',
  '..ohoo....',
  '.ohIhhoo..',
  '.ohIIhhhoo',
  '.ohIIIhhho',
  'ohhIIIhhhh',
  'ohhhIhhhhh',
]
const EAR_AT = [3, -2]
const EARS =
  `<g class="ce"><g class="cl">${px(EAR, ...EAR_AT)}</g>` +
  `<g class="cr">${px(flip(EAR), W - EAR_AT[0] - EAR[0].length, EAR_AT[1])}</g></g>`

// Surprised: round eyes over her own, and a little "o".
const WIDE = ['.ooo.', 'owwwo', 'owewo', 'owwwo', '.ooo.']
const SURPRISE = px(WIDE, 11, 16) + px(WIDE, 26, 16) + px(['sseess', 'seppes', 'sseess'], 18, 22)
// Herself: whiskers on her cheeks.
const WHISKERS = ['ee...', '..eee', 'ee...']
const CAT_FACE = px(WHISKERS, 4, 21) + px(flip(WHISKERS), W - 9, 21)

/** Everything cat Ina wears over Ina's head: ears, and her two faces. */
export const CAT_HEAD = `<g class="ch"><g class="cs">${SURPRISE}</g><g class="cf">${CAT_FACE}</g></g>${EARS}`

// Sparkles round her head as the ears come and go.
const SPARK = ['..w..', '..E..', 'wEwEw', '..E..', '..w..']
export const CAT_SPARKS = `<g class="csp">${[[-6, 2], [43, 4], [-9, 22], [46, 22], [8, -9], [30, -9]]
  .map(([x, y]) => px(SPARK, x, y))
  .join('')}</g>`

/**
 * The summoning circle as a heart: a double outline, rune ticks in a band
 * inside it, and a charm on the lower left where Ao-chan rests.
 */
export const HEART = (() => {
  const [cx, cy, sx, sy] = [21, 16, 3.2, 2.9]
  const pad = 60
  const cells = grid(2 * pad + 1, 2 * pad + 1)
  const at = (t, grow = 0, [x0, y0, kx, ky] = [cx, cy, sx, sy]) => {
    const x = 16 * Math.sin(t) ** 3
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)

    return [pad + x0 - cx + (kx + grow) * x, pad + y0 - cy - (ky + grow) * (y + 2.5)]
  }
  const outline = (grow, color, k) => {
    for (let i = 0; i < 720; i++) {
      plot(cells, ...at((i * Math.PI) / 360, grow, k), color)
    }
  }

  outline(0, 'f')
  outline(-0.22, 'F')
  outline(-0.85, 'f')
  // Rune ticks in the band between the outlines.
  for (let tick = 0; tick < 36; tick++) {
    const t = (tick * Math.PI) / 18 + 0.05

    line(cells, at(t, -0.42), at(t, -0.62), tick % 3 === 1 ? 'E' : 'F')
  }
  // Ao-chan's charm.
  line(cells, at(-2.25, 0), [pad - 33, pad + 19], 'F')
  round(cells, pad - 33, pad + 19, 2, 'E', far => far < 1.6)

  return px(rows(cells), cx - pad, cy - pad)
})()

// Cat ears for a takodachi that joins her, on its head beside its halo, in
// its own 24 x 20 grid.
const TAKO_EAR = ['.o...', '.oo..', '.oIo.', 'otIto']
export const TAKO_EARS = `<g id="cear">${both(TAKO_EAR, 5, 1, 24)}</g>`

// Ao-chan's cat ears on her top edge, and a tail curling up from her top-right
// corner, away from the conversation, in two frames to sway. `at` is the book's
// top-left corner, as `ao.js` places her.
const AO_EAR = ['o.....', 'oo....', 'oIo...', 'oIIoo.', 'oIIiio', 'oiiiii']
const TAIL_A = ['.ooo..', 'oiiio.', 'oiooio', 'oio.o.', 'oio...', '.oio..', '..oio.', '..oio.', '.oio..', '.oio..', '..oio.', '..oio.']
const TAIL_B = ['..ooo.', '.oiiio', '.oiooo', '.oio..', '..oio.', '..oio.', '..oio.', '..oio.', '.oio..', '.oio..', '..oio.', '..oio.']
export const aoCat = ([x, y]) =>
  `<g class="ac">${px(AO_EAR, x + 1, y - 5)}${px(flip(AO_EAR), x + 11, y - 5)}` +
  `<g class="at1">${px(TAIL_A, x + 15, y - 9)}</g><g class="at2">${px(TAIL_B, x + 15, y - 9)}</g></g>`

// Her CSS, drawn only while she is out. At rest she is simply there: ears up,
// whiskers on, the heart behind her; and dozing, at rest, she is regular Ina
// again, so with motion reduced nothing of hers is left over a sleeping Ina. Waking, she is surprised, sparkles
// twinkle, an ear pops up, then the other, and the circle turns into the
// heart; dozing, it all goes back the other way. Everything steps slowly, so
// nothing trips the desktop app's flash guard.
export const CAT_CSS = `
.cs,.csp{opacity:0}
.c.wake .sigil{opacity:0;animation:on 1.3s,cout .8s steps(4) 1.3s}
.c.wake .heart{animation:cin .8s steps(4) 1.3s backwards,pulse 4s steps(4) 2.1s infinite}
.c.work .heart{animation:pulse 4s steps(4) infinite}
.c.wake .cs{animation:on 1.8s .4s}
.c.wake .cf{animation:off 2.2s}
.c.wake .csp{animation:twinkle .9s steps(3) 1s 2}
.c.wake .cl{animation:cup .4s steps(4) 1.3s backwards}
.c.wake .cr{animation:cup .4s steps(4) 1.7s backwards}
.c.doze .csp{animation:twinkle .9s steps(3) calc(var(--h) + 1.7s) 2}
.c.doze .cr{opacity:0;animation:on calc(var(--h) + 1.8s),cdown .4s steps(4) calc(var(--h) + 1.8s)}
.c.doze .cl{opacity:0;animation:on calc(var(--h) + 2.1s),cdown .4s steps(4) calc(var(--h) + 2.1s)}
.c.doze .heart{opacity:0;animation:on calc(var(--h) + 2s),cout .8s steps(4) calc(var(--h) + 2s)}
.c.doze .sigil{animation:dim .6s steps(4) var(--d) backwards,cin .8s steps(4) calc(var(--h) + 2s) backwards}
.c.doze .cf{opacity:0;animation:on calc(var(--h) + 2.8s)}
.at2{opacity:0}
.c.wake .at1,.c.work .at1{animation:flip 1.6s steps(1) infinite}
.c.wake .at2,.c.work .at2{animation:flip 1.6s steps(1) -.8s infinite}
@keyframes cin{from{opacity:0}}
@keyframes cout{from{opacity:1}to{opacity:0}}
@keyframes cup{from{transform:translateY(4px);opacity:0}}
@keyframes cdown{from{opacity:1}to{transform:translateY(4px);opacity:0}}
`.replaceAll('\n', '')
