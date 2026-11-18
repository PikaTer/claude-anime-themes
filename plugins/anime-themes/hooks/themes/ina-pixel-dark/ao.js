// Ao-chan: Ina's grimoire, who comes along on one wake in five. A thick book,
// purple cover, a pink eye in its line-work, cream pages edged in gold, and the
// orange band with a tiny Ina on it. She rests on the summoning circle's
// lower-left mark, in the head's own grid (42 x 32, its middle at 21, 16), as
// `scene.js` draws it.

import { px } from './pixels.js'

/** What Ina says as Ao-chan comes, as Frieren Ina says it, and as she goes. */
export const AO_HI = 'AO-CHAN!!'
export const AO_GET = 'AO-CHAN GET!'
export const AO_BYE = 'BYE BYE,\nAO-CHAN~'

/** Lines for Ao-chan, mixed into Ina's while she is out. */
export const AO_SAY = ['READ ALONG,\nAO-CHAN~', 'WHICH PAGE,\nAO-CHAN?', 'NO PEEKING,\nAO-CHAN!', 'AO-CHAN SAYS HI~']

// Where the book stands: on the circle's lower-left mark, clear of Frieren Ina's
// twin tail (x from -6) and elf ear.
export const AO_AT = [-27, 19]
const AT = AO_AT

// The cover: line-work round the pink eye.
const EYE = ['aaPPPPaa', 'aPaaaaPa', 'PaaPPaaP', 'PaaPPaaP', 'aPaaaaPa', 'aaPPPPaa']
const COVER = [
  'aaaaaaaaaaaaaa',
  'aiiiiiiiiiiiia',
  'aiaaaaiiaaaaia',
  'aiaaiiaaiiaaia',
  'aiaiaaaaaaiaia',
  ...EYE.map((row, i) => (i === 1 || i === 4 ? `aii${row}iia` : `aia${row}aia`)),
  'aiaiaaaaaaiaia',
  'aiaaiiaaiiaaia',
  'aiaaaaiiaaaaia',
]
// The orange band, a few marks for its words and a tiny Ina at the right.
const BAND = ['YYYYYYYhYYYYhY', 'yxxyxyyhhhhhhy', 'yyyyyyyhewewhy', 'yxyxxyyhwwwwhy']
const TOP = ['.oooooooooooooooo.', 'oCCCCCCCCCCCCCCCCo', 'occcccccccccccccco', 'ojJjJjJjJjJjJjJjjo', 'oooooooooooooooooo']
// The spine on the left, banded twice.
const spine = (row, i) => `o${i === 2 || i === 11 ? 'i' : 'A'}o${row}o`
export const AO_CLOSED = [...TOP, ...[...COVER, ...BAND].map(spine), 'oooooooooooooooooo']

// Her eye shut, and glancing either way: drawn over the eye.
const EYE_AT = [AT[0] + 6, AT[1] + TOP.length + 5]
const BLINK = px(['aaaaaaaa', 'aaaaaaaa', 'aPPPPPPa', 'aaPPPPaa', 'aaaaaaaa', 'aaaaaaaa'], ...EYE_AT)
const LOOK_L = px(['PPPaaaaP', 'PPPaaaaP'], EYE_AT[0], EYE_AT[1] + 2)
const LOOK_R = px(['PaaaaPPP', 'PaaaaPPP'], EYE_AT[0], EYE_AT[1] + 2)

// Open: the cover thrown up over her top, her first page showing with a little
// eye drawn on it, and a page fluttering at its corner. No further left or down
// than the closed book.
const PAGE = [
  'CCCCCCCCCCCCCC',
  'CccccCCCccccCC',
  'CCCCCCCCCCCCCC',
  'CcccCCCCcccccC',
  'CCCCCCCCCCCCCC',
  'CccccccCCcccCC',
  'CCCCCCCCCCCCCC',
  'CCCCCPPPPCCCCC',
  'CCCCPCPPCPCCCC',
  'CCCCCPPPPCCCCC',
  'CCCCCCCCCCCCCC',
  'CcccCCCcccccCC',
  'CCCCCCCCCCCCCC',
  'CccccccCCcccCC',
  'CCCCCCCCCCCCCC',
  'CcccccCCccccCC',
  'CCCCCCCCCCCCCC',
  'CCCCCCCCCCCCCC',
]
const LID = ['..oooooooooooooo..', '.oaiaaaaaaaaaaiao.', '.oaiaaaaaaaaaaiao.', '.oaiiiiiiiiiiiiao.', 'oooooooooooooooooo']
export const AO_OPEN = [...LID, ...PAGE.map(spine), 'oooooooooooooooooo']
const FLUTTER = px(['....oo', '..ooCo', '.oCCCo', 'oCCCo.'], AT[0] + 12, AT[1] + 4)

// Motes off the mark as she rises, and a glow under her.
const MOTES = Array.from({ length: 9 }, (_, i) => {
  const x = AT[0] + 1 + ((i * 7) % 17)
  const y = AT[1] + 18 + ((i * 5) % 7)

  return `<rect class="am" x="${x}" y="${y}" width="1" height="1" fill="${['#ffd27f', '#b9a6ee', '#ff8ab0'][i % 3]}" style="--k:${((i * 0.13) % 0.5).toFixed(2)}s"/>`
}).join('')
const GLOW =
  '<radialGradient id="aog"><stop offset="0" stop-color="#ff9ac0" stop-opacity=".8"/><stop offset="1" stop-color="#9b7fe0" stop-opacity="0"/></radialGradient>' +
  `<ellipse class="ag" cx="${AT[0] + 9}" cy="${AT[1] + 21}" rx="10" ry="6" fill="url(#aog)"/>`

/** Her open book, drawn once and shown on each of Ina's WAHs. */
export const AO_DEFS = `<g id="aoopen">${px(AO_OPEN, ...AT)}<g class="af">${FLUTTER}</g></g>`

// Sparkles round Ina's head as she greets her.
const SPARK = ['.w.', 'wYw', '.w.']
export const AO_SPARKS = `<g class="asp">${[
  [-5, 1],
  [44, 3],
  [-8, 22],
  [46, 20],
  [6, -4],
  [34, -5],
]
  .map(([x, y]) => px(SPARK, x, y))
  .join('')}</g>`

/**
 * Ao-chan's whole group for a scene: rising out of the mark on a wake, at rest
 * through the turn, sinking back as Ina dozes, and gone while she sleeps. On
 * each of Ina's WAHs she flips open a beat later; `plays` is the scene's own
 * timing for a line, `ink` its puff of ink.
 */
export function aoChan(scene, wahs, { plays, ink }) {
  if (!scene.ao || scene.ina === 'sleep') {
    return ''
  }
  const phase = scene.ina === 'wake' ? 'ao-in' : scene.ina === 'doze' ? 'ao-out' : 'ao-on'
  const flips =
    phase === 'ao-out'
      ? ''
      : wahs.map(slot => `<use href="#aoopen" class="aop" style="${plays(slot, (slot.at + 0.35).toFixed(2), 'flip24', 'on .8s')}"/>`).join('')

  return (
    `<g class="ao">` +
    (phase === 'ao-in' ? `${GLOW}${MOTES}` : '') +
    `<g class="${phase}"><g class="ab">${px(AO_CLOSED, ...AT)}` +
    `<g class="agl">${LOOK_L}</g><g class="agr">${LOOK_R}</g><g class="ak">${BLINK}</g>${flips}</g></g>` +
    (phase === 'ao-out' ? `<g class="ai" transform="translate(${AT[0] - 1} ${AT[1] + 4})">${ink}</g>` : '') +
    `</g>`
  )
}

/** Her CSS: at rest she is simply there; only her coming, going, blinks and flips move. */
export const AO_CSS = `
.agl,.agr,.ak,.aop,.ag,.am,.asp,.ao-out{opacity:0}
.ao-in{animation:aorise .7s steps(7) var(--a) backwards}
.ao-in .ak{animation:on calc(var(--a) + .7s),aoblink 5.2s steps(1) calc(var(--a) + 3s) infinite}
.ao .ag{animation:flare 1.2s steps(6) calc(var(--a) - .2s)}
.ao .am{animation:rise .8s steps(4) calc(var(--a) + var(--k))}
.wake .agl{animation:aolook 9s steps(1) calc(var(--a) + 4.5s) infinite}
.wake .agr{animation:aolook 9s steps(1) calc(var(--a) + 9s) infinite}
.wake .ab,.work .ab{animation:bob 1.3s steps(1) -.5s infinite}
.work .ak{animation:aoblink 5.2s steps(1) infinite}
.work .agl{animation:aolook 9s steps(1) -2s infinite}
.work .agr{animation:aolook 9s steps(1) -6.5s infinite}
.af{animation:flip .3s steps(1) infinite}
.ao-out{animation:on calc(var(--h) + 1s),aosink .6s steps(6) calc(var(--h) + 1s)}
.ao-out .ak{opacity:1;animation:off calc(var(--h) + .6s)}
.ai .i1{animation:on .15s calc(var(--h) + 1s),on .15s calc(var(--h) + 1.45s)}
.ai .i2{animation:on .3s calc(var(--h) + 1.15s)}
.a.wake .asp{animation:twinkle .9s steps(3) calc(var(--a) + .4s) 2}
.a.wake:not(.f):not(.c) .head{animation:bob 1s steps(1) 1.2s infinite,hop .3s steps(3) calc(var(--a) + .4s)}
@keyframes aorise{0%{transform:translateY(10px);opacity:0}15%{opacity:1}60%{transform:translateY(-3px)}80%,to{transform:none}}
@keyframes aosink{from{opacity:1}to{transform:translateY(8px);opacity:0}}
@keyframes aoblink{0%,3%{opacity:1}4%,to{opacity:0}}
@keyframes aolook{0%,12%{opacity:1}13%,to{opacity:0}}
@keyframes flip24{0%{opacity:1}3%,to{opacity:0}}
`.replaceAll('\n', '')
