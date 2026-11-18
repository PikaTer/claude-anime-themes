import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'

import { lands } from './themes/ina-pixel-dark'
import { ASLEEP, ask, carry, cheer, doze, draw, join, leave, missingGlyphs, rest, resume, speechMarkup, wake } from './themes/ina-pixel-dark/scene.js'
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
  expect(asleep).not.toContain(TAKO)

  await $.turn.start({ text: 'hi', turnId: 't1' })
  expect(await source()).toContain('class="wake"')

  await $.turn.start({ text: 'dig', turnId: 't2', agentId: 'a1' })
  await $.turn.start({ text: 'dig', turnId: 't3', agentId: 'c' })
  const busy = await source()
  // The wake transition is not replayed by a later redraw.
  expect(busy).toContain('class="work"')
  expect(count(busy, TAKO)).toBe(2)
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
  expect(dozing).not.toContain(TAKO)
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
  // Every way in and every way out at once, each WAH answered: still under an Svg's limit.
  const going = ids.reduce(leave, busy)
  expect(draw({ ...going, takos: [...busy.takos.map(tako => ({ ...tako, phase: 'in' as const })), ...going.takos] }).length).toBeLessThan(131072)
  expect(doze(going, 't', 'done').takos).toEqual([])
  // Frieren Ina leaving, her staffed takodachis all coming and going too.
  // Frieren Ina and Ao-chan leaving together.
  const staffed = ids.reduce(join, wake(ASLEEP, BOTH))
  const parting = doze(ids.reduce(leave, staffed), 'd', 'ask')
  expect(
    draw({ ...parting, takos: [...staffed.takos.map(tako => ({ ...tako, phase: 'in' as const })), ...parting.takos] }).length,
  ).toBeLessThan(131072)
})

// Turn ids, and the first of them that summons Frieren Ina.
const TURNS = Array.from({ length: 400 }, (_, i) => `turn-${i}`)
const FRIEREN = TURNS.find(id => wake(ASLEEP, id).form === 'frieren') ?? 'none'
// Turn ids that bring Ao-chan: with nerd Ina, and with Frieren Ina.
const AO = TURNS.find(id => wake(ASLEEP, id).ao && wake(ASLEEP, id).form === 'nerd') ?? 'none'
const BOTH = TURNS.find(id => wake(ASLEEP, id).ao && wake(ASLEEP, id).form === 'frieren') ?? 'none'

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
  // hop, and none for Frieren Ina, whose summoning is busy enough: more trips
  // the desktop app's flash guard, which holds the scene still.
  expect(css).toMatch(/\.a\.wake:not\(\.f\) \.head\{animation:bob 1s steps\(1\) 1\.2s infinite,hop \.3s steps\(3\) calc\(var\(--a\) \+ \.4s\)\}/)
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

  for (const id of ['t', AO, BOTH]) {
    const busy = ids.reduce(join, wake(ASLEEP, id))
    const shown = cheer(busy, 'x', T)
    const going = after(shown, now => ids.reduce(leave, now), T + 500)
    const parting = after(going, now => doze(now, 'd', 'ask'), T + 1000)
    const svg = draw({ ...parting, takos: [...busy.takos.map(tako => ({ ...tako, phase: 'in' as const })), ...going.takos] })

    expect(svg).toMatch(SHOWN)
    expect(svg.length).toBeLessThan(131072)
  }
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
