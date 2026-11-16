import { expect, mock, test } from 'claude-code/testing'

import { ASLEEP, doze, draw, join, leave, wake } from './scene.js'

const BACKDROP = {
  plugin: 'ina-pixel-dark',
  surface: 'desktop',
  component: 'Backdrop',
  props: { scene: 'ina', plugin: 'ina-pixel-dark', glass: false },
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
  on('command.register', () => ({ value: { command: 'ina-insets' } }))
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
  on('command.register', () => ({ value: { command: 'ina-insets' } }))

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
