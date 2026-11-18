import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, ThemeSetArgs } from 'claude-code'

import type { Ending, Insets } from '../../../types'
import { makeColors } from '../../make-colors.js'
import type { Theme } from '../theme.js'
import { ASLEEP, ask, doze, draw, join, leave, resume, wake } from './scene.js'

const PLUGIN = 'anime-themes'
const SCENE = 'ina'

// Purples taken from Ina's hair on a near-black ground, her orange for warnings.
const { theme, problems } = makeColors({
  label: 'Ina pixel dark',
  only: 'dark',
  roles: { accent: '#9b7fe0', danger: '#e5607a', success: '#6fc48f', warning: '#f6a440', pro: '#d48bd8' },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#07050c',
        'surface-1': '#0e0a17',
        'surface-2': '#140f20',
        'surface-3': '#191327',
        'text-primary': '#ece6fa',
        'text-secondary': '#c5b9e2',
        'text-muted': '#9d90be',
      },
    },
  },
})

const LOOK: ThemeSetArgs = {
  colors: theme,
  overrideColorScheme: 'dark',
  // No blur: it would smear the pixels behind a panel.
  backdrop: { scene: SCENE, glass: { blur: 0, tint: '#07050c', opacity: 0.5 } },
}

const scene = atom({ plugin: 'anime-themes', key: 'ina-scene' } as const, ASLEEP, { shape: 'scene-4' })

// The desktop app draws its sidebar and its right-hand panel over the backdrop:
// the takodachis and Ina stand this far in, past them. `/ina-insets` changes it.
const PANELS: Insets = { left: 300, right: 345 }
const insets = atom({ plugin: 'anime-themes', key: 'ina-insets' } as const, PANELS)
const USAGE = 'Usage: /ina-insets <left> <right>, in pixels from the window edges (0 0 with the side panels closed).'

/** Ina's part of a session starting: asleep, her command, and the insets last set. */
export async function startIna($: EngineInterface) {
  // A reload or a resumed session meets what ran before it: that is over.
  await update($, scene, () => ASLEEP)
  await $.command.register({
    name: 'ina-insets',
    description: 'Move Ina and the takodachis clear of the side panels',
    argumentHint: '<left> <right>',
  })
  const kept = (await $.store.get('ina-insets')) as Partial<Insets> | undefined
  const { left, right } = kept ?? {}

  if (typeof left === 'number' && typeof right === 'number') {
    await update($, insets, () => ({ left, right }))
  }
}

/** Ina's hooks. They run whichever theme is showing; her scene draws only while hers is. */
export const registerIna: Register = on => {
  on('command.run', { command: 'ina-insets' }, async ($, e) => {
    const [left, right] = e.args.trim().split(/\s+/).map(Number)

    if (left === undefined || right === undefined || !(left >= 0) || !(right >= 0)) {
      const now = await read($, insets)

      return { text: `${USAGE} Now: ${now.left} ${now.right}.` }
    }
    await $.store.set('ina-insets', { left, right })
    await update($, insets, () => ({ left, right }))

    return { text: `The takodachis stand ${left}px in from the left, Ina ${right}px in from the right.` }
  })

  // The main loop's turn wakes Ina; a subagent's brings its takodachi.
  on('turn.start', async ($, e, next) => {
    const { agentId } = e
    await update($, scene, now => (agentId === undefined ? wake(now, e.turnId) : join(now, agentId)))

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const { agentId } = e
    // An answer that ends on a question leaves the next move to the person.
    const ending: Ending =
      e.reason === 'aborted' ? 'stop' : e.reason !== 'answer' ? 'oops' : e.answer.trimEnd().endsWith('?') ? 'ask' : 'done'
    await update($, scene, now => (agentId === undefined ? doze(now, e.turnId, ending) : leave(now, agentId)))

    return next(e)
  })

  // A question put to the person mid-turn: Ina holds still until it is answered.
  on('tool.call', { tool: 'AskUserQuestion' }, async ($, e, next) => {
    await update($, scene, now => ask(now, e.tool_use_id))
    try {
      return await next(e)
    } finally {
      await update($, scene, now => resume(now, e.tool_use_id))
    }
  })

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if (e.props.plugin !== PLUGIN || e.props.scene !== SCENE || (e.surface !== 'desktop' && e.surface !== 'mobile')) {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)
    const now = await read($, scene)
    // A phone has no side panels.
    const edges = e.surface === 'mobile' ? undefined : await read($, insets)
    const busy = now.takos.filter(tako => tako.phase !== 'out').length
    const awake = now.ina !== 'sleep' && now.ina !== 'doze'

    return (
      <Svg
        source={draw(now, edges)}
        alt={`A pixel Ina, ${!awake ? 'asleep' : now.ina === 'wait' ? 'waiting for an answer' : now.form === 'frieren' ? 'summoned as Frieren, elf ears and all' : 'working in nerd glasses'}${awake && now.ao ? ', with Ao-chan the grimoire' : ''}${busy > 0 ? `, and ${busy} takodachi at work` : ''}`}
      />
    )
  })
}

export const ina: Theme = {
  id: 'ina-pixel-dark',
  aliases: ['ina'],
  label: 'Ina pixel dark',
  blurb: 'Purple on black, with a pixel Ina who naps while idle, works in nerd glasses (or now and then is summoned as Frieren), now and then with Ao-chan, her grimoire, and a takodachi for every subagent',
  swatch: ['#07050c', '#191327', '#9b7fe0', '#d48bd8', '#f6a440', '#ece6fa'],
  look: LOOK,
  warning: problems.find(line => line.startsWith("Desktop won't paint")),
}
