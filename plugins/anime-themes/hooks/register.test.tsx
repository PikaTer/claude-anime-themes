import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'

import { ASLEEP, doze, draw, join, leave, wake } from './themes/ina-pixel-dark/scene.js'

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
  on('theme.clear', () => {
    clears += 1

    return { value: { isDrawn: false, reason: 'cleared' } }
  })
  const start = () => $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  // Nothing kept: a session starts on the default, and says so.
  await start()
  expect(sets.length).toBe(1)
  expect(sets[0]?.backdrop?.scene).toBe('ina')
  expect((await typed($, '')).text).toMatch(/\*\*ina-pixel-dark\*\* \(kept\)/)

  // A preview goes up at once and writes nothing.
  expect((await typed($, 'preview ina')).text).toContain('Previewing Ina pixel dark')
  expect(sets.length).toBe(2)
  expect(held.get('theme')).toBeUndefined()
  expect((await typed($, '')).text).toContain('previewing')

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
  expect((await typed($, 'revert')).text).toContain("Back to the app's own look")
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
      props: { command: 'anime-theme', args: '', text: '**Anime themes**', isErrored: false },
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
