import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'

import { lands } from './themes/ina-pixel-dark'
import { ASLEEP, HOLD, ask, carry, cheer, doze, draw, festiveSession, join, leave, missingGlyphs, rest, resume, speechMarkup, wake } from './themes/ina-pixel-dark/scene.js'
import { BAUBLE_SIZE, XMAS_CAT, XMAS_SAY, XMAS_SHOW, XMAS_WAKE } from './themes/ina-pixel-dark/xmas.js'
import { showParts } from './themes/ina-pixel-dark/special.js'
import { CAT_SAY } from './themes/ina-pixel-dark/cat.js'
import { rollHold, tentacles } from './themes/ina-pixel-dark/held.js'
import { px, pxr, spine, tentacle, curls } from './themes/ina-pixel-dark/pixels.js'
import type { Scene } from '../types'

const BACKDROP = {
  plugin: 'anime-themes',
  surface: 'desktop',
  component: 'Backdrop',
  props: { scene: 'ina', plugin: 'anime-themes', glass: false },
} as const

// How the scene draws one takodachi, and one takodachi's WAH.
const TAKO = '<use href="#tako"/>'
const ECHO = '<use href="#wah"'
const count = (text: string, part: string) => text.split(part).length - 1
// The subagents' takodachis: not counting any a corner tentacle holds.
const takos = (svg: string) => count(svg, TAKO) - count(svg, 'class="hold"')

// What the corner tentacles hold: nothing, or a takodachi each, wrapped.
const NONE = { high: 'none', low: 'none' } as const
const WRAP = { high: 'wrap', low: 'wrap' } as const

const DONE = { durationMs: 1, isAborted: false, reason: 'answer' } as const

test('Ina sleeps still, works the main turn, waits on a question, and each subagent brings a takodachi', async ($, on) => {
  mock.store(on)
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('theme.set', () => ({ value: { isDrawn: true, requestId: 'backdrop' } }))
  on('command.register', (_, e) => ({ value: { command: e.name } }))
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('turn.complete', (_, e) => ({ text: e.answer }))

  const source = async () => {
    const ui = await $.ui.mount(BACKDROP)
    const svg = await ui.find({ type: 'Svg' })
    await ui.unmount()

    return String(svg?.props.source)
  }
  let held = ''

  // The question stays up while the test looks at the scene.
  on('tool.call', async () => {
    held = await source()

    return { result: {} }
  })

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const asleep = await source()
  expect(asleep).toContain('class="sleep"')
  // Idle costs nothing: asleep, no rule and no element of the scene animates.
  expect(asleep).not.toMatch(/\.sleep[^{]*\{[^}]*animation/)
  expect(asleep).not.toMatch(/style="animation/)
  expect(takos(asleep)).toBe(0)

  await $.turn.start({ text: 'hi', turnId: 't1' })
  expect(await source()).toContain('class="wake"')

  await $.turn.start({ text: 'dig', turnId: 't2', agentId: 'a1' })
  await $.turn.start({ text: 'dig', turnId: 't3', agentId: 'c' })
  const busy = await source()
  // The wake transition is not replayed by a later redraw.
  expect(busy).toContain('class="work"')
  expect(takos(busy)).toBe(2)
  // Both takodachis answer each WAH of hers: the looping one at least.
  expect(count(busy, ECHO)).toBeGreaterThan(1)
  expect(count(busy, ECHO) % 2).toBe(0)

  await $.tool.call({ tool: 'AskUserQuestion', questions: [] })
  expect(held).toContain('class="wait"')
  // Waiting, she says one standing line and does not move.
  expect(held.split('class="wait"').at(-1)).not.toMatch(/animation:(say|on|yap)/)
  expect(await source()).toContain('class="work"')

  await $.turn.complete({ ...DONE, answer: 'found it', turnId: 't2', agentId: 'a1' })
  expect(await source()).toMatch(/class="out x-/)
  await $.turn.complete({ ...DONE, answer: 'found it', turnId: 't3', agentId: 'c' })
  await $.turn.complete({ ...DONE, answer: 'Shall I go on?', turnId: 't1' })
  const dozing = await source()
  expect(dozing).toContain('class="doze"')
  // A takodachi that left is gone by the next redraw.
  expect(takos(dozing)).toBe(0)
  // The turn ended on a question: her line stands while she sleeps.
  expect(dozing).toContain('class="say" style="opacity:1"')
})

test('the sprites stand clear of the side panels, as /ina-insets says, and at the edges on a phone', async ($, on) => {
  mock.store(on)
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('theme.set', () => ({ value: { isDrawn: true, requestId: 'backdrop' } }))
  on('command.register', (_, e) => ({ value: { command: e.name } }))

  const source = async (surface: 'desktop' | 'mobile') => {
    const ui = await $.ui.mount({ ...BACKDROP, surface })
    const svg = await ui.find({ type: 'Svg' })
    await ui.unmount()

    return String(svg?.props.source)
  }
  const start = () => $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  // The person types `/ina-insets` and its arguments.
  const typed = (args: string) =>
    $.command.run({ command: 'ina-insets', args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 80 } })

  await start()
  expect(await source('desktop')).toContain('<svg x="300">')
  expect(await source('desktop')).toContain('translate(-345 0)')
  expect(await source('mobile')).toContain('<svg x="0">')
  expect(await source('mobile')).toContain('translate(0 0)')

  expect((await typed('120 40')).text).toContain('120px')
  expect(await source('desktop')).toContain('<svg x="120">')
  expect(await source('desktop')).toContain('translate(-40 0)')

  // Words are not pixels: nothing moves, and she says how it is used.
  expect((await typed('wide')).text).toContain('Usage')
  expect(await source('desktop')).toContain('<svg x="120">')

  // The next session starts where this one left them.
  await start()
  expect(await source('desktop')).toContain('translate(-40 0)')
})

test("Ina's marks are scattered once and hold still as the scene changes", () => {
  const marks = (svg: string) => svg.match(/<use href="#[mM]\d[^>]*>/g) ?? []
  const asleep = marks(draw(ASLEEP))
  const awake = marks(draw(join(wake(ASLEEP, 't'), 'a1')))

  expect(asleep.length).toBeGreaterThan(15)
  expect(awake).toEqual(asleep)
  // More than one kind of mark, at more than one size.
  expect(new Set(asleep.map(mark => mark.slice(0, 15))).size).toBeGreaterThan(3)
})

test('takodachis keep to the left, apart, and the scene fits its limit', () => {
  const ids = Array.from({ length: 14 }, (_, i) => `agent-${i * 7919}`)
  const busy = ids.reduce(join, wake(ASLEEP, 't'))

  expect(new Set(busy.takos.map(tako => tako.cell)).size).toBe(14)
  for (const tako of busy.takos.slice(0, 8)) {
    expect(tako.x).toBeLessThan(40)
    expect(tako.y).toBeGreaterThan(10)
    expect(tako.y).toBeLessThan(66)
  }
  expect(new Set(busy.takos.map(tako => tako.enter)).size).toBeGreaterThan(2)
  // Every way in and every way out at once, each WAH answered, both corner
  // tentacles wrapping a takodachi: still under an Svg's limit.
  const going = ids.reduce(leave, busy)
  expect(draw({ ...going, takos: [...busy.takos.map(tako => ({ ...tako, phase: 'in' as const })), ...going.takos] }, undefined, WRAP).length).toBeLessThan(131072)
  expect(doze(going, 't', 'done').takos).toEqual([])
  // Frieren Ina leaving, her staffed takodachis all coming and going too.
  // Frieren Ina and Ao-chan leaving together.
  const staffed = ids.reduce(join, wake(ASLEEP, BOTH))
  const parting = doze(ids.reduce(leave, staffed), 'd', 'ask')
  expect(
    draw({ ...parting, takos: [...staffed.takos.map(tako => ({ ...tako, phase: 'in' as const })), ...parting.takos] }, undefined, WRAP).length,
  ).toBeLessThan(131072)
  // Cat Ina dozing mid-way through Ao-chan's love show, her eared takodachis all coming and going.
  const T = 100000
  const eared = ids.reduce(join, wake(ASLEEP, CAT_AO))
  const loving = cheer(ids.reduce(leave, eared), 'land', T)
  const purring = carry(loving, doze(loving, 'd', 'ask'), T + 1000)
  expect(purring.special?.kind).toBe('ao')
  expect(purring.form).toBe('cat')
  expect(
    draw({ ...purring, takos: [...eared.takos.map(tako => ({ ...tako, phase: 'in' as const })), ...purring.takos] }, undefined, WRAP).length,
  ).toBeLessThan(131072)
})

// Turn ids, and the first of them that summons Frieren Ina.
const TURNS = Array.from({ length: 400 }, (_, i) => `turn-${i}`)
const FRIEREN = TURNS.find(id => wake(ASLEEP, id).form === 'frieren') ?? 'none'
// Turn ids that bring Ao-chan: with nerd Ina, and with Frieren Ina.
const AO = TURNS.find(id => wake(ASLEEP, id).ao && wake(ASLEEP, id).form === 'nerd') ?? 'none'
const BOTH = TURNS.find(id => wake(ASLEEP, id).ao && wake(ASLEEP, id).form === 'frieren') ?? 'none'
// Turn ids that summon cat Ina: alone, and with Ao-chan.
const CAT = TURNS.find(id => wake(ASLEEP, id).form === 'cat' && !wake(ASLEEP, id).ao) ?? 'none'
const CAT_AO = TURNS.find(id => wake(ASLEEP, id).form === 'cat' && wake(ASLEEP, id).ao) ?? 'none'

test('cat Ina comes up on about one wake in five, never as Frieren', () => {
  const woke = TURNS.map(id => wake(ASLEEP, id))
  const cats = woke.filter(scene => scene.form === 'cat')

  expect(cats.length).toBeGreaterThan(50)
  expect(cats.length).toBeLessThan(115)
  expect(woke.filter(scene => scene.form === 'frieren').length).toBeGreaterThan(60)
  expect(CAT).not.toBe('none')
  expect(CAT_AO).not.toBe('none')
  // The other tests' turns never summon her.
  for (const id of ['t', 't1', 't2', 't3', 'next']) {
    expect(wake(ASLEEP, id).form).not.toBe('cat')
  }
})

test("cat Ina stays the turn, her takodachis have ears, and she's gone after she dozes", () => {
  const cat = wake(ASLEEP, CAT)

  expect(resume(ask(cat, 'q'), 'q').form).toBe('cat')
  expect(wake(cat, 'again').form).toBe('cat')
  expect(join(cat, 'a').takos[0]).toMatchObject({ ears: true, staff: false })
  expect(join(wake(ASLEEP, 't'), 'a').takos[0]?.ears).toBe(false)
  expect(join(wake(ASLEEP, FRIEREN), 'a').takos[0]?.ears).toBe(false)
  expect(join(doze(cat, 'd', 'done'), 'a').form).toBe('nerd')
  // A prompt's show waits for her arrival, and is never Zoltraak.
  expect(wake(ASLEEP, CAT, 1000).special).toMatchObject({ at: 5000 })
  expect(wake(ASLEEP, CAT, 1000).special?.kind).not.toBe('zoltraak')
})

test('cat Ina says her own lines and nyanifies the shared ones', () => {
  const cat = wake(ASLEEP, CAT)

  expect(draw(cat)).toContain(speechMarkup('INYA?!?'))
  expect(draw(cat)).toContain(speechMarkup('NYAH!'))
  expect(draw(cat)).not.toContain(speechMarkup('WAH!'))
  // Her takodachis answer each NYAH with one of their own.
  expect(draw(join(cat, 'a'))).toContain('href="#nyah"')
  expect(draw(join(cat, 'a'))).not.toContain('href="#wah"')
  expect(draw(wake(ASLEEP, CAT_AO))).toContain(speechMarkup('AO-NYAN!!'))
  for (const cue of ['done', 'stop', 'oops', 'ask'] as const) {
    expect(draw(doze(cat, 'd', cue))).toContain(speechMarkup('BYE NYA~'))
  }
  expect(draw(doze(wake(ASLEEP, CAT_AO), 'd', 'done'))).not.toContain(speechMarkup('BYE BYE,\nAO-CHAN~'))
  // Over many seeds her work lines include hers and nyanified shared ones, never a raw "INA".
  const said = Array.from({ length: 200 }, (_, i) => draw({ ...cat, ina: 'work', seed: (i * 2654435761) >>> 0 }))
  expect(said.some(svg => svg.includes(speechMarkup('PURR PURR~')))).toBe(true)
  expect(said.some(svg => svg.includes(speechMarkup('LOVE THE FLOOR,\nINYA~')))).toBe(true)
  expect(said.some(svg => svg.includes(speechMarkup('INYA INYA INYA~')))).toBe(true)
  expect(said.some(svg => svg.includes(speechMarkup('INA INA INA~')))).toBe(false)
  expect(said.some(svg => svg.includes(speechMarkup('NYAH-T IS THIS?')))).toBe(false)
  // Nobody else is nyanified.
  expect(draw(wake(ASLEEP, 't'))).toContain(speechMarkup('WAH!'))
  expect(draw(join(wake(ASLEEP, 't'), 'a'))).toContain('href="#wah"')
  expect(draw(wake(ASLEEP, 't'))).not.toContain('id="nyah"')
})

test("the scene draws cat Ina's transformation, and none of it for anyone else", () => {
  const cat = wake(ASLEEP, CAT)
  const css = (svg: string) => svg.match(/<style>(.*?)<\/style>/)?.[1] ?? ''

  for (const part of ['class="ch"', 'class="ce"', 'class="heart"', 'class="sigil"', 'class="cs"', 'class="csp"']) {
    expect(draw(cat)).toContain(part)
  }
  expect(draw(cat)).not.toContain('class="glasses"')
  expect(draw(cat)).toContain('class="wake c"')
  // One ear, then the other.
  expect(css(draw(cat))).toMatch(/\.c\.wake \.cl\{[^}]*1\.3s/)
  expect(css(draw(cat))).toMatch(/\.c\.wake \.cr\{[^}]*1\.7s/)
  // At rest: her heart, no round circle, and nothing of hers moves on a question.
  const held = draw(ask(cat, 'q'))
  expect(held).toContain('class="heart"')
  expect(held).not.toContain('class="sigil"')
  expect(css(held)).not.toMatch(/\.c\.wait [^{]*\{[^}]*animation/)
  // Redrawn mid-arrival, she is simply there.
  expect(draw(join(cat, 'a'))).toContain('class="work c"')
  expect(draw(join(cat, 'a'))).not.toContain('class="sigil"')
  expect(draw(join(cat, 'a'))).not.toContain('class="csp"')
  // Dozing, the round circle comes back, hidden till the heart turns into it: its
  // fade-in comes after the doze's dimming, whose own fill would show it at once.
  expect(draw(doze(cat, 'd', 'done'))).toContain('class="sigil"')
  expect(css(draw(doze(cat, 'd', 'done')))).toMatch(/\.c\.doze \.sigil\{animation:dim [^}]*,cin /)
  // Never for nerd or Frieren Ina.
  for (const svg of [draw(wake(ASLEEP, 't')), draw(wake(ASLEEP, FRIEREN)), draw(ASLEEP)]) {
    for (const part of ['class="ch"', 'class="heart"', '.cl{']) {
      expect(svg).not.toContain(part)
    }
  }
})

test('cat ears for her takodachis and for Ao-chan, who also gets a tail', () => {
  const cat = join(wake(ASLEEP, CAT_AO), 'a')

  expect(draw(cat)).toContain('href="#cear"')
  expect(draw(cat)).toContain('id="cear"')
  expect(draw(cat)).toContain('class="ac"')
  expect(draw(join(wake(ASLEEP, AO), 'a'))).not.toContain('class="ac"')
  expect(draw(join(wake(ASLEEP, 't'), 'a'))).not.toContain('id="cear"')
  // An eared takodachi outlives her turn into Frieren's: still eared, still drawn.
  const next = wake(doze(cat, 'd', 'done'), FRIEREN)
  expect(next.form).toBe('frieren')
  expect(next.takos[0]?.ears).toBe(true)
  expect(draw(next)).toContain('id="cear"')
  expect(draw(next)).toContain('href="#cear"')
})

test("cat Ina's shows: a cat-eared trophy, and Ao-chan's show turned to love", () => {
  const T = 100000
  const cat = join(wake(ASLEEP, CAT), 'a')
  const trophy = TURNS.find(id => cheer(cat, id, T).special?.kind === 'trophy') ?? 'none'
  const tro = draw(cheer(cat, trophy, T))

  expect(tro).toContain('class="v-cup"')
  // Her lines for the shows, in place of nerd Ina's.
  const say = (kind: 'trophy' | 'ao', cat: boolean) => showParts(kind, { say: (text: string) => `[${text}]`, mouth: '', nerd: !cat, cat }).front
  expect(say('trophy', true)).toContain("[ANOTHER\nGOLD TROPHY\nFOR NINYOMANYO\nNINYA'NIS!]")
  expect(say('ao', true)).toContain('[WORLD\nDOM{INYA}TION]')
  expect(say('trophy', false)).toContain("[ANOTHER\nGOLD TROPHY\nFOR NINOMAE\nINA'NIS!]")
  const love = draw(cheer(join(wake(ASLEEP, CAT_AO), 'a'), 'x', T))
  for (const part of ['class="v-ht"', 'href="#v-he"', 'class="ac"', 'class="v-lv"']) {
    expect(love).toContain(part)
  }
  for (const part of ['href="#v-tf"', 'class="v-red"', 'class="v-aura"']) {
    expect(love).not.toContain(part)
  }
  // Nerd Ina's shows are untouched.
  const nerd = draw(cheer(join(wake(ASLEEP, AO), 'a'), 'x', T))
  expect(nerd).toContain('class="v-aura"')
  expect(nerd).toContain('href="#v-tf"')
  expect(nerd).not.toContain('class="v-ht"')
  expect(draw(cheer(join(wake(ASLEEP, 't'), 'a'), trophy, T))).not.toContain('class="v-cup"')
})

test("cat Ina's exit leaves her at rest as regular Ina, and her lines keep clear", () => {
  const cat = wake(ASLEEP, CAT)
  const css = (svg: string) => svg.match(/<style>(.*?)<\/style>/)?.[1] ?? ''
  const dozing = css(draw(doze(cat, 'd', 'done')))

  // Unanimated (reduced motion), a dozing cat Ina is regular Ina: no heart, no ears.
  expect(dozing).toMatch(/\.c\.doze \.heart\{opacity:0;/)
  expect(dozing).toMatch(/\.c\.doze \.cl\{opacity:0;/)
  expect(dozing).toMatch(/\.c\.doze \.cr\{opacity:0;/)
  expect(dozing).not.toMatch(/forwards/)
  // Its ears still step down from up: the drop starts from shown, not from that rest.
  expect(dozing).toMatch(/@keyframes cdown\{from\{opacity:1\}/)
  // On a question she says "YOUR TURN~" back as regular Ina, a while before her eyes close.
  const asked = draw(doze(cat, 'd', 'ask'))
  const lull = Number(asked.match(/--d:([\d.]+)s/)?.[1])
  const said = Number(asked.match(/class="say" style="opacity:1;animation:off ([\d.]+)s"/)?.[1])
  expect(said).toBeGreaterThan(2.8)
  expect(lull - said).toBeGreaterThanOrEqual(2)
  // Her love line stands above Ao-chan's ears and tail, as nerd Ina's stands above her book.
  const foot = (cat: boolean) => Number(showParts('ao', { say: (_: string, bottom: number) => `[${bottom}]`, mouth: '', nerd: !cat, cat }).front.match(/\[(-?\d+)\]/)?.[1])
  expect(foot(false) - foot(true)).toBeGreaterThanOrEqual(6)
  // None of her lines is wider than the theme's widest before her.
  for (const line of CAT_SAY) {
    for (const row of line.split('\n')) {
      expect(row.length).toBeLessThanOrEqual('WHAT IN THE WORLD'.length)
    }
  }
})

test('cat Ina keeps her heart circle inside its budget', () => {
  const svg = draw({ ...wake(ASLEEP, CAT), ina: 'work' })
  const at = svg.indexOf('class="heart"')

  expect(at).toBeGreaterThan(0)
  expect(svg.indexOf('</g>', at) - at).toBeLessThan(9000)
})

test('Ao-chan comes on about one wake in five, with either Ina', () => {
  const came = TURNS.filter(id => wake(ASLEEP, id).ao)

  expect(came.length).toBeGreaterThan(50)
  expect(came.length).toBeLessThan(115)
  expect(AO).not.toBe('none')
  expect(BOTH).not.toBe('none')
  // The other tests' turns come without her.
  for (const id of ['t', 't1', 't2', 't3', FRIEREN]) {
    expect(wake(ASLEEP, id).ao).toBe(false)
  }
})

test('Ao-chan stays the whole turn and is gone after Ina dozes', () => {
  const on = wake(ASLEEP, AO)

  expect(resume(ask(on, 'q'), 'q').ao).toBe(true)
  expect(leave(join(on, 'a'), 'a').ao).toBe(true)
  expect(wake(on, 'again').ao).toBe(true)
  expect(doze(on, 'd', 'done').ao).toBe(true)
  expect(join(doze(on, 'd', 'done'), 'a').ao).toBe(false)
})

test('the scene draws Ao-chan arriving, resting and leaving, and Ina greets her', () => {
  const on = wake(ASLEEP, AO)
  // Ao-chan's own group: from her tag to the Z's that follow it.
  const hers = (svg: string) => svg.split('class="ao"')[1]?.split('class="zzz"')[0] ?? ''

  expect(draw(on)).toContain('class="ao"')
  expect(draw(on)).toContain('class="ao-in"')
  expect(draw(on)).toContain(speechMarkup('AO-CHAN!!'))
  expect(draw(wake(ASLEEP, BOTH))).toContain(speechMarkup('AO-CHAN GET!'))
  expect(draw(wake(ASLEEP, BOTH))).toContain('class="fh"')
  // A takodachi joining mid-arrival: she is there, at rest.
  const joined = draw(join(on, 'a'))
  expect(joined).toContain('class="ao-on"')
  expect(joined).not.toContain('class="ao-in"')
  // She holds still on a question.
  const held = hers(draw(ask(on, 'q')))
  expect(held).toContain('ao-on')
  expect(held).not.toMatch(/animation/)
  // She leaves as Ina dozes, and Ina sees her off, unless a question is waiting.
  expect(draw(doze(on, 'd', 'done'))).toContain('class="ao-out"')
  expect(draw(doze(on, 'd', 'done'))).toContain(speechMarkup('BYE BYE,\nAO-CHAN~'))
  expect(draw(doze(on, 'd', 'ask'))).not.toContain(speechMarkup('BYE BYE,\nAO-CHAN~'))
  // Never without her roll, and gone once Ina sleeps.
  for (const svg of [draw(wake(ASLEEP, 't')), draw(ASLEEP), draw(join(doze(on, 'd'), 'a'))]) {
    expect(svg).not.toContain('class="ao"')
    expect(svg).not.toContain(speechMarkup('AO-CHAN!!'))
  }
})

test('Ao-chan glows in, blinks from the start, and keeps her sparkles off the bubble', () => {
  const svg = draw(wake(ASLEEP, AO))
  const css = svg.match(/<style>(.*?)<\/style>/)?.[1] ?? ''

  // The glow and motes are beside her rising book, not in it.
  expect(css).toMatch(/\.ao \.ag\{animation/)
  expect(css).toMatch(/\.ao \.am\{animation/)
  // A turn with nothing else happening stays a wake: she blinks and glances in it.
  expect(css).toMatch(/\.ao-in \.ak\{animation:[^}]*aoblink/)
  expect(css).toMatch(/\.wake \.agl\{animation/)
  // The flutter lives in a <use>d copy: styled on its own.
  expect(css).toMatch(/(^|\})\.af\{animation/)
  // The head bobs from 1.2 s; nerd Ina hops once more for her, over it. One
  // hop, and none for Frieren or cat Ina, whose transformations are busy enough:
  // more trips the desktop app's flash guard, which holds the scene still.
  expect(css).toMatch(/\.a\.wake:not\(\.f\):not\(\.c\) \.head\{animation:bob 1s steps\(1\) 1\.2s infinite,hop \.3s steps\(3\) calc\(var\(--a\) \+ \.4s\)\}/)
  expect(svg.indexOf('class="asp"')).toBeLessThan(svg.indexOf(speechMarkup('AO-CHAN!!')))
  // Her glow stays about her own width.
  expect(svg).toMatch(/class="ag"[^>]*rx="10"/)
})

test("Ao-chan's lines come up while she is out, and only then", () => {
  const hers = ['READ ALONG,\nAO-CHAN~', 'WHICH PAGE,\nAO-CHAN?', 'NO PEEKING,\nAO-CHAN!', 'AO-CHAN SAYS HI~']
  const said = (scene: ReturnType<typeof wake>) => hers.some(line => draw(scene).includes(speechMarkup(line)))
  const turns = TURNS.slice(0, 120)
  const with_ = turns.map(id => ({ ...wake(ASLEEP, AO), seed: Number(id.slice(5)) * 2654435761 >>> 0 }))

  expect(with_.filter(said).length).toBeGreaterThan(30)
  expect(with_.filter(said).length).toBeLessThan(90)
  expect(turns.map(id => wake(ASLEEP, id)).filter(scene => !scene.ao).some(said)).toBe(false)
})

test('Frieren Ina comes up on about one wake in four, with every face', () => {
  const summoned = TURNS.map(id => wake(ASLEEP, id)).filter(scene => scene.form === 'frieren')

  expect(summoned.length).toBeGreaterThan(60)
  expect(summoned.length).toBeLessThan(140)
  expect(new Set(summoned.map(scene => scene.face)).size).toBe(3)
  // The other tests' turns stay nerd Ina's.
  expect(wake(ASLEEP, 't').form).toBe('nerd')
  expect(wake(ASLEEP, 't1').form).toBe('nerd')
})

test('her hair ends are rolled as she wakes, any of six alike, and kept till she next wakes', () => {
  const woke = TURNS.map(id => wake(ASLEEP, id))
  const kinds = ['classic', 'flick', 'curl', 'long', 'split', 'flared'] as const

  for (const kind of kinds) {
    const count = woke.filter(scene => scene.hair === kind).length
    expect(count).toBeGreaterThan(40)
    expect(count).toBeLessThan(100)
  }
  // Each draws its own head, for nerd and Frieren Ina alike.
  const drawn = kinds.map(kind => draw({ ...wake(ASLEEP, 't'), hair: kind }))
  expect(new Set(drawn).size).toBe(kinds.length)
  const fr = wake(ASLEEP, FRIEREN)
  expect(draw({ ...fr, hair: 'flick' })).not.toBe(draw({ ...fr, hair: 'curl' }))

  // Through a turn, a question, a takodachi and her dozing off, they stay.
  const one = woke.find(scene => scene.hair !== 'classic') ?? woke[0]
  const later = doze(join(resume(ask(wake(one, 'more'), 'q'), 'q'), 'a'), 'd', 'done')
  expect(later.hair).toBe(one.hair)
  expect(join(later, 'b').hair).toBe(one.hair)
})

test("Frieren's turn keeps her through questions, and the next change after she dozes is regular Ina", () => {
  const fr = wake(ASLEEP, FRIEREN)
  const asked = resume(ask(fr, 'q'), 'q')

  expect(asked.form).toBe('frieren')
  expect(asked.face).toBe(fr.face)
  expect(wake(fr, 'again')).toMatchObject({ form: 'frieren', face: fr.face })
  const after = join(doze(fr, 'd', 'done'), 'a')
  expect(after.form).toBe('nerd')
  expect(after.takos[0]?.staff).toBe(false)
})

test("takodachis that join Frieren Ina carry Fern's staff", () => {
  expect(join(wake(ASLEEP, FRIEREN), 'a').takos[0]?.staff).toBe(true)
  for (const id of TURNS.slice(0, 40)) {
    const scene = wake(ASLEEP, id)
    expect(join(scene, 'a').takos[0]?.staff).toBe(scene.form === 'frieren')
  }
})

test('every line Ina says has a glyph for every character', () => {
  expect(missingGlyphs()).toEqual([])
})

test("the scene draws Frieren Ina's summon-in and summon-out", () => {
  const fr = wake(ASLEEP, FRIEREN)
  const nerd = wake(ASLEEP, 't')

  expect(draw(fr)).toContain('class="fh"')
  expect(draw(fr)).toContain('class="fx"')
  expect(draw(fr)).not.toContain('class="glasses"')
  expect(draw(doze(fr, 'd', 'done'))).toContain('class="cover"')
  for (const svg of [draw(nerd), draw(doze(nerd, 'd', 'done'))]) {
    expect(svg).not.toContain('class="fh"')
    expect(svg).not.toContain('class="fx"')
    expect(svg).not.toContain('class="cover"')
  }
})

test('the scene is left to the app in the terminal', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>engine</Text>
  })

  const ui = await $.ui.mount({ ...BACKDROP, surface: 'terminal' })
  expect((await ui.find({ type: 'Text' }))?.text).toBe('engine')
  await ui.unmount()
})

// A store in memory the test can read back, which `mock.store` does not give.
const memory = (on: Parameters<typeof mock.store>[0], entries: Record<string, unknown> = {}) => {
  const held = new Map(Object.entries(entries))
  on('store.get', (_, e) => ({ value: held.get(e.key) }))
  on('store.set', (_, e) => {
    held.set(e.key, e.value)

    return { value: undefined }
  })
  on('store.delete', (_, e) => {
    held.delete(e.key)

    return { value: undefined }
  })
  on('store.keys', () => ({ value: [...held.keys()] }))

  return held
}

// What the person types for `/anime-theme`.
const typed = ($: Engine, args: string) =>
  $.command.run({ command: 'anime-theme', args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 80 } })

test('/anime-theme previews a theme without keeping it, and keep, revert and off settle it', async ($, on) => {
  const held = memory(on)
  const sets: { backdrop?: { scene?: string } }[] = []
  let clears = 0
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('command.register', (_, e) => ({ value: { command: e.name } }))
  on('theme.set', (_, e) => {
    sets.push(e)

    return { value: { isDrawn: true, requestId: 'backdrop' } }
  })
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('theme.clear', () => {
    clears += 1

    return { value: { isDrawn: false, reason: 'cleared' } }
  })
  const start = () => $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  // Nothing kept: a session starts on the default, and says so.
  await start()
  expect(sets.length).toBe(1)
  expect(sets[0]?.backdrop?.scene).toBe('ina')
  expect((await typed($, 'list')).text).toMatch(/\*\*ina-pixel-dark\*\* \(kept\)/)

  // A preview goes up at once and writes nothing.
  expect((await typed($, 'preview ina')).text).toContain('Previewing Ina pixel dark')
  expect(sets.length).toBe(2)
  expect(held.get('theme')).toBeUndefined()
  expect((await typed($, 'list')).text).toContain('previewing')

  expect((await typed($, 'keep')).text).toContain('Kept Ina pixel dark')
  expect(held.get('theme')).toBe('ina-pixel-dark')
  expect((await typed($, 'keep')).text).toContain('Nothing to keep')
  expect((await typed($, 'revert')).text).toContain('Nothing to revert')

  // A name that is no theme changes nothing.
  expect((await typed($, 'nope')).text).toContain('No theme called "nope"')
  expect((await typed($, 'preview')).text).toContain('Name a theme')
  expect(sets.length).toBe(2)

  // Off clears the theme, is kept, and the next session starts without one.
  expect((await typed($, 'off')).text).toContain("app's own look")
  expect(clears).toBe(1)
  expect(held.get('theme')).toBe('off')
  await start()
  expect(sets.length).toBe(2)

  // Naming a theme switches to it and keeps it; reverting a preview returns to what was kept.
  expect((await typed($, 'ina')).text).toContain('kept')
  expect(sets.length).toBe(3)
  await typed($, 'off')
  await typed($, 'preview ina')
  expect((await typed($, 'revert')).text).toContain('Dropped the preview of Ina pixel dark')
  expect(clears).toBe(3)

  // A kept theme that no longer exists falls back to the default.
  held.set('theme', 'gone')
  await start()
  expect(sets.at(-1)?.backdrop?.scene).toBe('ina')
})

test('the dialog after a preview keeps or reverts it', async ($, on) => {
  const held = memory(on)
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('command.register', (_, e) => ({ value: { command: e.name } }))
  on('theme.set', () => ({ value: { isDrawn: true, requestId: 'backdrop' } }))
  on('theme.clear', () => ({ value: { isDrawn: false, reason: 'cleared' } }))
  let answer = 'Keep'
  on('tool.call', { tool: 'AskUserQuestion' }, (_, e) => ({
    result: { questions: e.questions, answers: { [e.questions[0]?.question ?? '']: answer } },
  }))
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  answer = 'Revert'
  expect((await typed($, 'preview ina')).text).toContain('Back to Ina pixel dark')
  expect(held.get('theme')).toBeUndefined()

  answer = 'Keep'
  expect((await typed($, 'preview ina')).text).toContain('Kept Ina pixel dark')
  expect(held.get('theme')).toBe('ina-pixel-dark')
})

for (const surface of ['terminal', 'desktop'] as const) {
  test(`the theme list is drawn with a strip of each theme's colors on the ${surface}`, async ($, on) => {
    on('ui.render', ($, e) => {
      const { Text } = $.ui.resolve(e)

      return <Text>engine's own row</Text>
    })
    const ui = await $.ui.mount({
      plugin: 'anime-themes',
      surface,
      component: 'CommandOutput',
      props: { command: 'anime-theme', args: 'list', text: '**Anime themes**', isErrored: false },
    })
    // First comes the strip, led by the theme's darkest color, then the engine's own row.
    expect((await ui.find({ type: 'Text' }))?.props.color).toBe('#07050c')
    expect(await ui.find({ text: "engine's own row" })).toBeDefined()
    await ui.unmount()

    // A preview's own answer is left as the engine draws it.
    const plain = await $.ui.mount({
      plugin: 'anime-themes',
      surface,
      component: 'CommandOutput',
      props: { command: 'anime-theme', args: 'preview ina', text: 'Previewing', isErrored: false },
    })
    expect((await plain.find({ type: 'Text' }))?.text).toBe("engine's own row")
    await plain.unmount()
  })
}

test('a bare /anime-theme opens the picker, and lists the themes where it cannot', async ($, on) => {
  memory(on)
  const opened: { id: string; title?: string; focus?: true; closeOnEscape?: true }[] = []
  let isPlaced = true
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('command.register', (_, e) => ({ value: { command: e.name } }))
  on('theme.set', () => ({ value: { isDrawn: true, requestId: 'backdrop' } }))
  on('ui.open', (_, e) => {
    opened.push(e)

    return { value: isPlaced ? { isPlaced } : { isPlaced, reason: 'no surface draws panes' } }
  })
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  const text = (await typed($, '')).text
  expect(opened).toHaveLength(1)
  expect(opened[0]).toMatchObject({ id: 'anime-themes', title: 'Anime themes', focus: true, closeOnEscape: true })
  expect(text).toContain('preview a theme in the panel')

  isPlaced = false
  const fallback = (await typed($, '')).text
  expect(fallback).toContain('**ina-pixel-dark**')
  expect(fallback).toContain('no surface draws panes')
})

const PICKER = {
  plugin: 'anime-themes',
  component: 'Pane',
  requestId: 'anime-themes',
  props: { title: 'Anime themes', isFocused: false, bodyColumns: 60, placement: 'dock', scroll: { offset: 0, bodyRows: 20 }, view: {} },
} as const

for (const surface of ['terminal', 'desktop'] as const) {
  test(`the picker previews, reverts, applies and closes with its buttons on the ${surface}`, async ($, on) => {
    const held = memory(on)
    const sets: unknown[] = []
    let clears = 0
    const closed: string[] = []
    on('session.start', (_, e) => ({ cwd: e.cwd }))
    on('command.register', (_, e) => ({ value: { command: e.name } }))
    on('theme.set', (_, e) => {
      sets.push(e)

      return { value: { isDrawn: true, requestId: 'backdrop' } }
    })
    on('theme.clear', () => {
      clears += 1

      return { value: { isDrawn: false, reason: 'cleared' } }
    })
    on('ui.close', (_, e) => {
      closed.push(e.id)

      return { value: undefined }
    })
    await $.session.start({ cwd: '/', surface, isInteractive: true })
    expect(sets).toHaveLength(1)

    const ui = await $.ui.mount({ ...PICKER, surface })
    const words = async (pattern: RegExp) => (await ui.find({ type: 'Text', text: pattern }))?.text
    expect(await words(/Nothing is saved/)).toBeDefined()
    expect(await ui.find({ type: 'Button', key: 'revert' })).toBeUndefined()

    // Preview: on screen at once, nothing stored, and the panel says so.
    await ui.press({ key: 'preview-ina-pixel-dark' })
    expect(sets).toHaveLength(2)
    expect(held.get('theme')).toBeUndefined()
    expect(await words(/Previewing Ina pixel dark/)).toBeDefined()

    // Revert puts back what was kept, and the button goes.
    await ui.press({ key: 'revert' })
    expect(sets).toHaveLength(3)
    expect(await ui.find({ type: 'Button', key: 'revert' })).toBeUndefined()

    // Closing with a preview up undoes it.
    await ui.press({ key: 'preview-ina-pixel-dark' })
    await ui.press({ key: 'close' })
    expect(sets).toHaveLength(5)
    expect(held.get('theme')).toBeUndefined()
    expect(closed).toEqual(['anime-themes'])

    // Apply keeps the theme and closes the panel.
    await ui.press({ key: 'apply-ina-pixel-dark' })
    expect(held.get('theme')).toBe('ina-pixel-dark')
    expect(closed).toEqual(['anime-themes', 'anime-themes'])

    // Off clears the theme and keeps that for the next session.
    await ui.press({ key: 'off' })
    expect(clears).toBe(1)
    expect(held.get('theme')).toBe('off')
    await ui.unmount()
  })
}

// A clock time for the shows, in milliseconds.
const T = 1_000_000
// What a show draws, and a takodachi's part in it.
const SHOWN = /class="v-|href="#v-/
const after = (scene: Scene, change: (scene: Scene) => Scene, ms: number) => carry(scene, change(scene), ms)
const crew = (scene: Scene) => ['a1', 'b22', 'c333'].reduce((now, id) => after(now, next => join(next, id), T), scene)

test('work landing puts on a show: Zoltraak for Frieren Ina, Ao-chan while she is out, else mostly a gold trophy', () => {
  const nerd = wake(ASLEEP, 't')
  const kinds = TURNS.map(id => cheer(nerd, id, T).special?.kind)
  const trophies = kinds.filter(kind => kind === 'trophy').length

  // Ao-chan comes for one in three of nerd Ina's shows, and stays the turn.
  expect(trophies).toBeGreaterThan(220)
  expect(trophies).toBeLessThan(320)
  expect(kinds.filter(kind => kind === 'ao').length).toBe(TURNS.length - trophies)
  const summoned = TURNS.find(id => cheer(nerd, id, T).special?.kind === 'ao') ?? 'none'
  expect(cheer(nerd, summoned, T).ao).toBe(true)
  expect(cheer(wake(ASLEEP, AO), 'x', T).special?.kind).toBe('ao')
  expect(cheer(wake(ASLEEP, FRIEREN), 'x', T).special?.kind).toBe('zoltraak')
  expect(cheer(wake(ASLEEP, BOTH), 'x', T).special?.kind).toBe('zoltraak')
  // Only while she works, and never over a show that is on.
  expect(cheer(ASLEEP, 'x', T)).toBe(ASLEEP)
  const held = ask(nerd, 'q')
  expect(cheer(held, 'x', T)).toBe(held)
  const on = cheer(nerd, 'x', T)
  expect(on.special).toMatchObject({ at: T + 200, now: T })
  expect(cheer(on, 'y', T + 3000)).toBe(on)
  expect(cheer(on, 'y', T + 8000).special?.at).toBe(T + 8200)
})

test('a show runs on through the turn and ends on time, on a question, or with the next turn', () => {
  const on = cheer(wake(ASLEEP, 't'), 'x', T)
  const joined = after(on, now => join(now, 'a'), T + 1000)
  const dozing = after(joined, now => doze(now, 'd', 'done'), T + 2000)

  expect(joined.special).toEqual({ ...on.special, now: T + 1000 })
  expect(dozing.special?.now).toBe(T + 2000)
  expect(carry(on, on, T + 500).special?.now).toBe(T + 500)
  expect(after(on, now => leave(now, 'a'), T + 7300).special).toBeNull()
  expect(after(on, now => ask(now, 'q'), T + 1000).special).toBeNull()
  expect(after(dozing, now => wake(now, 'next'), T + 3000).special).toBeNull()
  // A turn opened on landing work: the show waits for her greeting.
  expect(wake(ASLEEP, 't', T).special?.at).toBe(T + 3100)
  expect(wake(ASLEEP, FRIEREN, T).special).toMatchObject({ kind: 'zoltraak', at: T + 4000 })
  // Long over, the show leaves, and what it held up has played: nothing plays again.
  expect(rest(dozing)).toMatchObject({ ina: 'sleep', special: null })
  expect(rest(wake(ASLEEP, 't', T))).toMatchObject({ ina: 'work', special: null })
  const rested = draw(rest(joined))
  expect(rested).not.toMatch(SHOWN)
  expect(rested).not.toContain('class="in e-')
  expect(rested).not.toMatch(/class="say" style="animation:on/)
})

test('each show draws its stage and every takodachi its part, and holds back her lines and her doze', () => {
  const trophy = TURNS.find(id => cheer(wake(ASLEEP, 't'), id, T).special?.kind === 'trophy') ?? 'none'
  const shows = [
    [cheer(crew(wake(ASLEEP, 't')), trophy, T), 'class="v-tro"', 'href="#v-sg"'],
    [cheer(crew(wake(ASLEEP, AO)), 'x', T), 'class="v-fly"', 'href="#v-tf"'],
    [cheer(crew(wake(ASLEEP, FRIEREN)), 'x', T), 'class="v-mc"', 'href="#v-br"'],
  ] as const

  for (const [scene, stage, part] of shows) {
    const svg = draw(scene)

    expect(svg).toContain(stage)
    expect(svg).toContain(` s-${scene.special?.kind}"`)
    expect(count(svg, part)).toBe(3)
    expect(svg).toContain('class="v-say"')
    // Her WAH waits till the show is over: 4 s, after 0.2 + 7.
    expect(svg).toContain('animation:say 24s steps(1) 11.2s infinite')
    expect(svg).not.toContain('animation:say 24s steps(1) 4s infinite')
    for (const [other] of shows.filter(([, otherStage]) => otherStage !== stage)) {
      expect(svg).not.toContain(` s-${other.special?.kind}"`)
    }
  }
  const [[on]] = shows
  // Picked up partway through on a redraw, and gone once it is over.
  expect(draw(after(on, now => join(now, 'z'), T + 3200))).toContain('--x:-3.00s')
  expect(draw({ ...on, special: on.special && { ...on.special, now: T + 7300 } })).not.toMatch(SHOWN)
  // She dozes off once it ends: her line and her lull wait for it.
  expect(draw(after(on, now => doze(now, 'd', 'done'), T + 2000))).toContain('--h:5.2s')
  // Never without a show, asleep, or on a question.
  for (const scene of [wake(ASLEEP, 't'), ASLEEP, ask(on, 'q'), rest(after(on, now => doze(now, 'd'), T))]) {
    expect(draw(scene)).not.toMatch(SHOWN)
  }
})

test('every show fits the limit with Frieren Ina, Ao-chan and every takodachi coming and going', () => {
  const ids = Array.from({ length: 14 }, (_, i) => `agent-${i * 7919}`)

  for (const id of ['t', AO, BOTH, CAT, CAT_AO]) {
    const busy = ids.reduce(join, wake(ASLEEP, id))
    const shown = cheer(busy, 'x', T)
    const going = after(shown, now => ids.reduce(leave, now), T + 500)
    const parting = after(going, now => doze(now, 'd', 'ask'), T + 1000)
    const svg = draw({ ...parting, takos: [...busy.takos.map(tako => ({ ...tako, phase: 'in' as const })), ...going.takos] }, undefined, WRAP)

    expect(svg).toMatch(SHOWN)
    // With room to spare: the marks are shuffled at random, a few hundred characters either way.
    expect(svg.length).toBeLessThan(131072 - 500)
  }
  // Cat Ina waking to a prompt's love show, her eared takodachis all coming in.
  const prompted = wake(ASLEEP, CAT_AO, T)
  const crowd = ids.reduce(join, prompted)
  const svg = draw({ ...prompted, takos: crowd.takos.map(tako => ({ ...tako, phase: 'in' as const })) }, undefined, WRAP)
  expect(prompted.special?.kind).toBe('ao')
  expect(svg).toContain('class="v-ht"')
  expect(svg.length).toBeLessThan(131072)
})

test('commits, deploys and merges count as work landing; reading about them does not', () => {
  for (const command of ['git commit -m "x"', 'git add . && git commit', 'git log -1 && git commit --amend', 'git merge main', 'gh pr merge 12 --squash', 'vercel deploy --prod', 'npm run deploy']) {
    expect(lands('Bash', { command })).toBe(true)
  }
  for (const command of ['git log', 'git merge-base main HEAD', 'echo emerge', 'ls', 'cat deploy.yml', 'ls deploy/', 'git log --grep=merge', 'grep -rn commit src']) {
    expect(lands('Bash', { command })).toBe(false)
  }
  for (const tool of ['mcp__vercel__deploy_to_vercel', 'mcp__vercel__create_deployment', 'mcp__github__merge_pull_request']) {
    expect(lands(tool, {})).toBe(true)
  }
  for (const tool of ['mcp__vercel__get_deployment', 'mcp__vercel__list_deployments', 'mcp__vercel__cancel_deployment', 'Read', 'Edit']) {
    expect(lands(tool, {})).toBe(false)
  }
})

test('a prompt about committing and a commit that ran each put on a show, which leaves once it is over', async ($, on) => {
  mock.store(on)
  const clock = mock.clock(on, { now: T })
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('theme.set', () => ({ value: { isDrawn: true, requestId: 'backdrop' } }))
  on('command.register', (_, e) => ({ value: { command: e.name } }))
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('classic.PostToolUse', () => ({}))

  const source = async () => {
    const ui = await $.ui.mount(BACKDROP)
    const svg = await ui.find({ type: 'Svg' })
    await ui.unmount()

    return String(svg?.props.source)
  }
  const ran = (command: string, id: string) =>
    $.classic.PostToolUse({ tool_name: 'Bash', tool_input: { command }, tool_response: {}, tool_use_id: id })

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.turn.start({ text: 'Looks good, commit it', turnId: 't1' })
  const opening = await source()
  expect(opening).toMatch(/class="wake[^"]* s-(trophy|ao)"/)
  // A commit while the show plays changes nothing: no redraw to play her wake again.
  await clock.advance(2000)
  await ran('git commit -m "Ship it"', 'u0')
  expect(await source()).toBe(opening)
  // Over, and Ina has had her say: the show leaves, and the wake is played.
  await clock.advance(20_000)
  const quiet = await source()
  expect(quiet).not.toMatch(SHOWN)
  expect(quiet).toContain('class="work')

  await ran('git status', 'u1')
  expect(await source()).not.toMatch(SHOWN)
  await ran('git commit -m "Ship it"', 'u2')
  expect(await source()).toMatch(/class="work[^"]* s-(trophy|ao)"/)
})

test('Zoltraak fires at the takodachis, or at the sky with none on screen, and holds its aim once fired', () => {
  const alone = cheer(wake(ASLEEP, FRIEREN), 'x', T)
  const company = cheer(crew(wake(ASLEEP, FRIEREN)), 'x', T)

  expect(alone.special?.aim).toBe('up')
  expect(company.special?.aim).toBe('left')
  expect(draw(alone)).toContain('class="v-beam v-sky"')
  expect(draw(company)).toContain('class="v-beam"')
  expect(draw(company)).not.toContain('class="v-beam v-sky"')
  // A takodachi that comes while it charges draws its aim; one that comes after it fired does not.
  expect(after(alone, now => join(now, 'a'), T + 1000).special?.aim).toBe('left')
  expect(after(alone, now => join(now, 'a'), T + 3000).special?.aim).toBe('up')
  // The last takodachi leaving while it charges turns it to the sky; a takodachi on its way out does not count.
  const leaving = ['a1', 'b22', 'c333'].reduce((now, id) => after(now, next => leave(next, id), T + 500), company)
  expect(leaving.special?.aim).toBe('up')
  // The other shows take no aim.
  expect(cheer(wake(ASLEEP, 't'), 'x', T).special?.aim).toBeUndefined()
})

test('each tentacle is rolled on its own: one in five wrap, one in five ride', () => {
  const seq = (...xs: number[]) => () => xs.shift() ?? 0.9
  expect(rollHold(seq(0.1, 0.3))).toEqual({ high: 'wrap', low: 'ride' })
  expect(rollHold(seq(0.21, 0.41))).toEqual({ high: 'ride', low: 'none' })
  expect(rollHold(seq(0.6, 0.19))).toEqual({ high: 'none', low: 'wrap' })
  const rolls = Array.from({ length: 4000 }, () => rollHold())
  for (const grip of ['wrap', 'ride'] as const) {
    for (const side of ['high', 'low'] as const) {
      const share = rolls.filter(roll => roll[side] === grip).length / 4000
      expect(share).toBeGreaterThan(0.17)
      expect(share).toBeLessThan(0.23)
    }
  }
})

test('a wrapped tentacle curls round its takodachi; a ridden one is unchanged', () => {
  const bare = tentacles(NONE)
  const ride = tentacles({ high: 'ride', low: 'ride' })
  const wrap = tentacles(WRAP)

  expect(bare.high + bare.low).not.toContain('class="hold"')
  expect(ride.high).toContain(bare.high)
  expect(ride.low).toContain(bare.low)
  expect(wrap.high).not.toContain(bare.high)
  expect(wrap.low).not.toContain(bare.low)
  for (const part of [ride.high, ride.low, wrap.high, wrap.low]) {
    expect(count(part, 'class="hold"')).toBe(1)
    expect(count(part, TAKO)).toBe(1)
  }
  // Wrapped, shrunk to a takodachi's usual size; riding, Ina's own.
  expect(wrap.low).toContain('class="hk"')
  expect(ride.low).not.toContain('class="hk"')
})

test('the tentacles hold what was rolled when the theme loaded, and nothing else changes', () => {
  expect(draw(ASLEEP)).toBe(draw(ASLEEP, undefined, HOLD))
  const crowd = ['a1', 'a2', 'a3'].reduce(join, { ...wake(ASLEEP, 't'), ina: 'work' as const })
  const held = draw(crowd, undefined, WRAP)
  const bare = draw(crowd, undefined, NONE)

  expect(count(held, 'class="hold"')).toBe(2)
  expect(count(draw(crowd, undefined, { high: 'ride', low: 'none' }), 'class="hold"')).toBe(1)
  expect(count(bare, 'class="hold"')).toBe(0)
  // Not a subagent's: the takodachis on the left and their WAHs are as with none held.
  expect(count(held, TAKO)).toBe(crowd.takos.length + 2)
  expect(takos(held)).toBe(takos(bare))
  expect(count(held, ECHO)).toBe(count(bare, ECHO))
})

test('held takodachis bob while Ina is up, hold still asleep, and wear cat ears with cat Ina', () => {
  const held = (svg: string) => svg.slice(svg.indexOf('class="hold"'), svg.indexOf('class="hold"') + 200)

  expect(held(draw(ASLEEP, undefined, WRAP))).not.toContain('class="bob"')
  expect(held(draw({ ...wake(ASLEEP, 't'), ina: 'work' }, undefined, WRAP))).toContain('class="bob"')
  const cat = draw({ ...wake(ASLEEP, CAT), ina: 'work' }, undefined, WRAP)
  expect(cat).toContain('id="cear"')
  expect(count(cat, '<use href="#cear"/>')).toBe(2)
  expect(draw({ ...wake(ASLEEP, 't'), ina: 'work' }, undefined, WRAP)).not.toContain('#cear')
  // Nothing held, no ears drawn for it.
  expect(draw({ ...wake(ASLEEP, CAT), ina: 'work' }, undefined, NONE)).not.toContain('id="cear"')
})

test('relative paths draw the very pixels plain ones do', () => {
  // Every pixel a run of `h` rectangles covers, by color.
  const cells = (svg: string) =>
    [...svg.matchAll(/fill="([^"]+)" d="([^"]+)"/g)].flatMap(([, fill, d]) => {
      const out: string[] = []
      let [x, y] = [0, 0]
      for (const [, op, a, b] of d.matchAll(/([Mmhvz])(-?\d*)(?: (-?\d+))?/g)) {
        if (op === 'M') [x, y] = [Number(a), Number(b)]
        if (op === 'm') [x, y] = [x + Number(a), y + Number(b)]
        if (op === 'h' && Number(a) > 0) for (let i = 0; i < Number(a); i++) out.push(`${fill} ${x + i} ${y}`)
      }
      return out
    }).sort()
  const { rows } = tentacle(110, curls(0.4, 7))

  expect(cells(pxr(rows, -60, -110))).toEqual(cells(px(rows, -60, -110)))
  expect(cells(pxr(rows, -60, -110)).length).toBeGreaterThan(500)
  expect(pxr(rows, -60, -110).length).toBeLessThan(px(rows, -60, -110).length * 0.9)
})

test('a wrapped takodachi keeps whole pixels, on a desktop and on a phone', () => {
  const svg = draw({ ...wake(ASLEEP, 't'), ina: 'work' }, undefined, WRAP)
  const phone = svg.slice(svg.indexOf('@media (max-width:700px)'))
  const scale = (css: string) => Number(css.match(/\.hk\{transform:scale\(([\d.]+)\)\}/)?.[1])

  // Ina's pixels are 5 wide, 3 on a phone: the takodachi's must come out 4 and 2, as on the left.
  expect(Math.round(5 * scale(svg) * 100) / 100).toBe(4)
  expect(Math.round(3 * scale(phone) * 100) / 100).toBe(2)
  expect(count(svg, 'class="hk"')).toBe(2)
  expect(svg).not.toContain('scale(.8)"')
})

// Christmas Ina. Times in the middle of a month, so no time zone moves them.
const DEC = Date.UTC(2026, 11, 15)
const NOV = Date.UTC(2026, 10, 15)
const OCT = Date.UTC(2026, 9, 15)
const JAN = Date.UTC(2027, 0, 15)
const SESSIONS = Array.from({ length: 400 }, (_, i) => `session-${i * 104729}`)
const MERRY = SESSIONS.find(id => festiveSession(DEC, id)) ?? 'none'
const PLAIN = SESSIONS.find(id => !festiveSession(DEC, id)) ?? 'none'

test('one session in two is festive, only in November and December, and the same session always rolls the same', () => {
  const festive = SESSIONS.filter(id => festiveSession(DEC, id)).length

  expect(festive).toBeGreaterThan(160)
  expect(festive).toBeLessThan(240)
  for (const id of SESSIONS) {
    expect(festiveSession(NOV, id)).toBe(festiveSession(DEC, id))
    expect(festiveSession(OCT, id)).toBe(false)
    expect(festiveSession(JAN, id)).toBe(false)
  }
})

test('a festive scene dresses everyone for Christmas, whichever Ina is out, and a plain one draws none of it', () => {
  const crowd = (id: string) => {
    const busy = Array.from({ length: 8 }, (_, i) => `agent-${i}`).reduce(join, wake(ASLEEP, id))

    return { ...busy, ina: 'work' as const, takos: busy.takos.map(tako => ({ ...tako, phase: 'on' as const })) }
  }
  const RIDE = { high: 'ride', low: 'ride' } as const

  for (const id of ['t', AO, BOTH, CAT_AO]) {
    const scene = crowd(id)
    const merry = draw(scene, undefined, RIDE, true)
    const plain = draw(scene, undefined, RIDE)

    // Her hat, the holly, the snow and the snowflakes, every takodachi's hat or antlers.
    expect(merry).toContain('class="xhat"')
    expect(merry).toContain('class="sn"')
    expect(merry).toContain('href="#m5"')
    expect(count(merry, '<use href="#xh"/>') + count(merry, '<use href="#xa"/>')).toBe(takos(merry) + 2)
    expect(count(merry, '<use href="#xa"/>')).toBeGreaterThan(0)
    // Ao-chan's ribbon, wherever she is out.
    expect(merry.includes('class="xr"')).toBe(scene.ao)
    for (const part of ['class="xhat"', 'class="sn"', '#m5', '#xh', '#xa', 'class="xr"']) {
      expect(plain).not.toContain(part)
    }
    // Christmas costs little: the halos go, for the hats.
    expect(merry.length).toBeLessThan(plain.length + 10_000)
  }
  // Cat Ina's ears go in front of her hat.
  const cat = draw(crowd(CAT), undefined, NONE, true)
  expect(cat.indexOf('class="xhat"')).toBeLessThan(cat.indexOf('class="ce"'))
  // Holly on the round circle.
  expect(draw(crowd('t'), undefined, NONE, true)).toMatch(/<g class="sigil">(?:(?!<\/g>).)*<use href="#hl"/)
})

test('festive lines come up, cat Ina has her own, and every one fits a bubble', () => {
  const said = (id: string) =>
    TURNS.flatMap(turn => {
      const svg = draw({ ...wake(ASLEEP, id), ina: 'work', seed: Number(turn.replace(/\D/g, '')) * 2654435761 }, undefined, NONE, true)

      return [...svg.matchAll(/class="say"/g)].length > 0 ? [svg] : []
    })
  const has = (svgs: string[], line: string) => svgs.some(svg => svg.includes(speechMarkup(line, 5)))

  expect(XMAS_SAY.some(line => has(said('t'), line))).toBe(true)
  expect(XMAS_CAT.some(line => has(said(CAT), line))).toBe(true)
  expect(XMAS_SAY.some(line => has(said(CAT), line))).toBe(false)
  expect(missingGlyphs()).toEqual([])
  for (const line of [...XMAS_SAY, ...XMAS_CAT, ...XMAS_WAKE, ...Object.values(XMAS_SHOW)]) {
    for (const row of line.split('\n')) {
      expect(row.length).toBeLessThanOrEqual('WHAT IN THE WORLD'.length)
    }
  }
  // Her bubbles stand clear of the hat.
  expect(speechMarkup('HI', 5)).not.toBe(speechMarkup('HI'))
})

test('a festive gold trophy show is a present, with its own line', () => {
  const nerd = TURNS.map(id => cheer(wake(ASLEEP, 't'), id, T)).find(scene => scene.special?.kind === 'trophy')
  const cat = TURNS.map(id => cheer(wake(ASLEEP, CAT), id, T)).find(scene => scene.special?.kind === 'trophy')

  expect(draw(nerd!, undefined, NONE, true)).toContain('class="v-tro"')
  const say = (_: string, bottom: number) => `[${_}|${bottom}]`
  expect(showParts('trophy', { say, mouth: '', nerd: true, festive: true }).front).toContain(XMAS_SHOW.nerd)
  expect(showParts('trophy', { say, mouth: '', nerd: false, cat: true, festive: true }).front).toContain(XMAS_SHOW.cat)
  expect(showParts('trophy', { say, mouth: '', nerd: true }).front).not.toContain('PRESENT')
  expect(draw(cat!, undefined, NONE, true)).toContain('class="v-tro"')
})

test('a festive Zoltraak beam is Christmas colored and sparkles, a plain one is neither', () => {
  const say = (_: string, bottom: number) => `[${_}|${bottom}]`
  const plain = showParts('zoltraak', { say, mouth: '', nerd: false })
  const merry = showParts('zoltraak', { say, mouth: '', nerd: false, festive: true })
  const sky = showParts('zoltraak', { say, mouth: '', nerd: false, aim: 'up', festive: true })

  expect(plain.back).toContain('fill="#c39cf2" opacity="0.9"')
  expect(plain.back).not.toContain('v-bs')
  expect(plain.defs).not.toContain('v-bk0')
  expect(merry.back).not.toContain('fill="#c39cf2" opacity="0.9"')
  expect(merry.back).toContain('fill="#ff5468" opacity="0.9"')
  expect(merry.back).toContain('class="v-bs"')
  expect(sky.back).toContain('class="v-bs"')
  expect(merry.defs).toContain('id="v-bk0"')
  expect(merry.css).toContain('.v-bs{')
  expect(plain.css).not.toContain('.v-bs{')
})

test('the festive present stands higher than the trophy, and its line with it', () => {
  const say = (_: string, bottom: number) => `[${_}|${bottom}]`
  const present = showParts('trophy', { say, mouth: '', nerd: true, festive: true })
  const trophy = showParts('trophy', { say, mouth: '', nerd: true })
  const foot = (parts: { front: string }) => Number(/\|(-?\d+)\]/.exec(parts.front)![1])

  expect(foot(present)).toBeLessThan(foot(trophy))
  expect(present.back).not.toBe(trophy.back)
})

test('nerd Ina can wake with the all-day greeting, plain or festive', () => {
  const greeting = 'GOOD MORNING,\nAFTERNOON,\nEVENING!'
  const woken = (festive: boolean) => TURNS.map(id => draw(wake(ASLEEP, id), undefined, NONE, festive))

  expect(woken(false).some(svg => svg.includes(speechMarkup(greeting)))).toBe(true)
  // Festive, her bubbles stand higher over the hat.
  expect(woken(true).some(svg => svg.includes(speechMarkup(greeting, 5)))).toBe(true)
  expect(missingGlyphs()).toEqual([])
})

test('festive, every show still fits the limit with every takodachi coming and going', () => {
  const ids = Array.from({ length: 14 }, (_, i) => `agent-${i * 7919}`)

  for (const id of ['t', AO, BOTH, CAT, CAT_AO]) {
    const busy = ids.reduce(join, wake(ASLEEP, id))
    const shown = cheer(busy, 'x', T)
    const going = after(shown, now => ids.reduce(leave, now), T + 500)
    const parting = after(going, now => doze(now, 'd', 'ask'), T + 1000)
    const svg = draw({ ...parting, takos: [...busy.takos.map(tako => ({ ...tako, phase: 'in' as const })), ...going.takos] }, undefined, WRAP, true)

    expect(svg).toMatch(SHOWN)
    expect(svg).toContain('class="xhat"')
    expect(svg.length).toBeLessThan(131072 - 500)
  }
})

test('a session starts festive or plain by its id and the month, and stays so through a reload', async ($, on) => {
  mock.store(on)
  mock.clock(on, { now: DEC })
  let session = MERRY
  on('session.id', () => ({ value: session }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('theme.set', () => ({ value: { isDrawn: true, requestId: 'backdrop' } }))
  on('command.register', (_, e) => ({ value: { command: e.name } }))

  const source = async () => {
    const ui = await $.ui.mount(BACKDROP)
    const svg = await ui.find({ type: 'Svg' })
    const alt = String(svg?.props.alt)
    await ui.unmount()

    return { svg: String(svg?.props.source), alt }
  }
  const start = () => $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  await start()
  expect((await source()).svg).toContain('class="xhat"')
  expect((await source()).alt).toContain('Santa hat')
  await start()
  expect((await source()).svg).toContain('class="xhat"')
  session = PLAIN
  await start()
  expect((await source()).svg).not.toContain('class="xhat"')
  expect((await source()).alt).not.toContain('Santa hat')
})

test('a session whose time or id cannot be read is plain', async ($, on) => {
  mock.store(on)
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('theme.set', () => ({ value: { isDrawn: true, requestId: 'backdrop' } }))
  on('command.register', (_, e) => ({ value: { command: e.name } }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount(BACKDROP)
  const svg = await ui.find({ type: 'Svg' })
  await ui.unmount()
  expect(String(svg?.props.source)).not.toContain('class="xhat"')
})

test("tentacle's pixels do not change with its spine exported", () => {
  // A small string hash (djb2) of the rows and root.
  const sha = (art: unknown) => [...JSON.stringify(art)].reduce((h, c) => (Math.imul(h, 33) + c.charCodeAt(0)) >>> 0, 5381)

  expect(sha(tentacle(110, curls(0.4, 7)))).toBe(2742944041)
  expect(sha(tentacle(70, curls(0.35, 8)))).toBe(219256011)
  expect(sha(tentacle(40, t => 3 * t))).toBe(3869605043)
})

test("spine walks the tentacle's curve", () => {
  const walk = spine(110, curls(0.4, 7))

  expect(walk.length).toBe(110)
  expect(walk[0]).toMatchObject({ i: 0, x: 0, y: 0, thick: 4.2 })
  expect(walk.at(-1)!.thick).toBeLessThan(1.1)
  for (let i = 1; i < 20; i++) {
    expect(walk[i].y).toBeLessThan(walk[i - 1].y)
  }
})

test('a festive scene defines four baubles once each, and a plain one none', () => {
  const scene = { ...wake(ASLEEP, 't'), ina: 'work' as const }
  const merry = draw(scene, undefined, NONE, true)
  const plain = draw(scene, undefined, NONE)

  for (const id of ['bb0', 'bb1', 'bb2', 'bb3']) {
    expect(count(merry, `id="${id}"`)).toBe(1)
    expect(plain).not.toContain(`id="${id}"`)
  }
  expect(merry).not.toContain('id="bb4"')
})

// The baubles a tentacle's markup hangs, as boxes in its own frame.
const baublesIn = (part: string) => [...part.matchAll(/<use href="#bb(\d)" x="(-?\d+)" y="(-?\d+)"\/>/g)].map(([, color, x, y]) => ({ color: +color, x: +x, y: +y }))
const [BAUBLE_W, BAUBLE_H] = BAUBLE_SIZE
type Box = [number, number, number, number]
const meets = (bauble: { x: number; y: number }, [x0, y0, x1, y1]: Box) =>
  bauble.x < x1 && bauble.x + BAUBLE_W > x0 && bauble.y < y1 && bauble.y + BAUBLE_H > y0
// The held takodachi's box: its 24 x 20 where it rides, centred on the loop where it is wrapped.
const heldBox = (part: string): Box => {
  const [, x, y] = part.match(/class="hold" transform="translate\((-?\d+) (-?\d+)\)"/)!.map(Number)

  return part.includes('class="hk"') ? [x - 12, y - 11, x + 12, y + 9] : [x, y, x + 24, y + 20]
}

test('festive bare tentacles hang four or five baubles each, and a plain scene none', () => {
  const merry = tentacles(NONE, { festive: true })

  expect(baublesIn(merry.low).length).toBeGreaterThanOrEqual(4)
  expect(baublesIn(merry.low).length).toBeLessThanOrEqual(6)
  expect(baublesIn(merry.high).length).toBeGreaterThanOrEqual(3)
  expect(baublesIn(merry.high).length).toBeLessThanOrEqual(5)
  // All four colours turn up, and a plain scene has none.
  expect(new Set(baublesIn(merry.low).map(bauble => bauble.color)).size).toBe(4)
  expect(baublesIn(tentacles(NONE).low + tentacles(NONE).high)).toEqual([])
})

test('baubles keep apart along a tentacle', () => {
  for (const part of Object.values(tentacles(NONE, { festive: true }))) {
    const hung = baublesIn(part)

    hung.forEach((a, i) =>
      hung.slice(i + 1).forEach(b => expect(meets(b, [a.x, a.y, a.x + BAUBLE_W, a.y + BAUBLE_H])).toBe(false)),
    )
  }
})

test('baubles leave a held takodachi clear, wrapped or riding', () => {
  for (const hold of [WRAP, { high: 'ride', low: 'ride' }, { high: 'wrap', low: 'ride' }, { high: 'ride', low: 'wrap' }] as const) {
    const arms = tentacles(hold, { festive: true })

    for (const part of [arms.high, arms.low]) {
      const box = heldBox(part)

      expect(baublesIn(part).length).toBeGreaterThan(0)
      for (const bauble of baublesIn(part)) {
        expect(meets(bauble, box)).toBe(false)
        // Nor on the loop that circles a wrapped one.
        if (part.includes('class="hk"')) {
          expect(Math.hypot(bauble.x + BAUBLE_W / 2 - (box[0] + 12), bauble.y + BAUBLE_H / 2 - (box[1] + 11))).toBeGreaterThan(14)
        }
      }
    }
  }
})

test('a takodachi riding the low tentacle stays in front of its baubles', () => {
  const { low } = tentacles({ high: 'none', low: 'ride' }, { festive: true })

  expect(baublesIn(low).length).toBeGreaterThan(0)
  expect(low.lastIndexOf('<use href="#bb')).toBeLessThan(low.indexOf('class="hold"'))
})

test('a festive scene hangs baubles on its tentacles, and a plain scene draws none', () => {
  const scene = ['a1', 'a2', 'a3'].reduce(join, { ...wake(ASLEEP, 't'), ina: 'work' as const })
  const merry = draw(scene, undefined, NONE, true)

  expect(count(merry, '<use href="#bb')).toBeGreaterThanOrEqual(6)
  expect(count(merry, '<use href="#bb')).toBeLessThanOrEqual(12)
  expect(draw(scene, undefined, NONE)).not.toContain('#bb')
  // A tentacle holding a takodachi has fewer, but the takodachi's hat is still there.
  expect(count(draw(scene, undefined, WRAP, true), '<use href="#bb')).toBeGreaterThan(0)
})
