import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, ThemeSetArgs } from 'claude-code'

import type { Ending, Insets, Scene } from '../../../types'
import { makeColors } from '../../make-colors.js'
import type { Theme } from '../theme.js'
import { ASLEEP, HOLD, ask, carry, cheer, doze, draw, festiveSession, join, leave, rest, resume, showEnds, wake } from './scene.js'

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

const scene = atom({ plugin: 'anime-themes', key: 'ina-scene' } as const, ASLEEP, { shape: 'scene-7' })
// Christmas Ina: in November and December, one session in two, rolled as it starts.
const xmas = atom({ plugin: 'anime-themes', key: 'ina-xmas' } as const, false)

// The desktop app draws its sidebar and its right-hand panel over the backdrop:
// the takodachis and Ina stand this far in, past them. `/ina-insets` changes it.
const PANELS: Insets = { left: 300, right: 345 }
const insets = atom({ plugin: 'anime-themes', key: 'ina-insets' } as const, PANELS)
// Work landing, for a show: said in the person's prompt, or a command or tool
// that just ran. A word, so "emerge" is not "merge"; `git merge-base` only looks.
const SAID = /\b(?:commit|deploy|merg(?:e|ing))/i
const RAN = /(?<![\w./=-])(?:commit|merge|deploy)(?![\w./=-])/i
// A command that only looks: `cat deploy.yml`, `git log --grep merge`.
const LOOKS = /^\s*(?:grep|rg|ag|cat|less|more|head|tail|ls|find|echo|printf|man|which|sed|awk|git\s+(?:log|show|diff|blame|grep|status|branch))\b/
// A tool of a server's that lands work, not one that reads it (`get_deployment`).
const LANDS = /(?:^|__)(?:create_deployment|create_commit|merge_pull_request|(?:deploy|merge|commit)[a-z_]*)$/i

/** Whether a tool call that succeeded landed work: a commit, a deploy or a merge. */
export function lands(tool: string, input: unknown): boolean {
  if (tool === 'Bash') {
    const { command } = (input ?? {}) as { command?: unknown }

    // Each command of a chain on its own: `git add . && git commit`.
    return typeof command === 'string' && command.split(/&&|\|\||[;|\n]/).some(part => !LOOKS.test(part) && RAN.test(part))
  }

  return LANDS.test(tool)
}

// How long after a show ends Ina has surely dozed off, if she was going to.
const AFTER = 6000

/**
 * Changes Ina's scene at the clock's time (`ms`), a show that is playing carried
 * on into it. Where the clock can't be read there are no shows, and the rest goes on.
 */
async function change($: EngineInterface, fn: (now: Scene, ms: number | undefined) => Scene) {
  const ms = await $.clock.now().then(
    time => time,
    () => undefined,
  )
  const before = await read($, scene)

  // Nothing to change: no write, which would redraw and play again what has played.
  if (fn(before, ms) === before) {
    return
  }

  await update($, scene, now => (ms === undefined ? { ...fn(now, undefined), special: null } : carry(now, fn(now, ms), ms)))
  const ends = showEnds(await read($, scene))

  // Once the show, and a doze it held back, are over, it leaves the scene, so a
  // later redraw (a resize, say) does not play it again.
  if (ms !== undefined && ends !== undefined) {
    $.clock.after(Math.max(0, ends + AFTER - ms), async () => {
      if (showEnds(await read($, scene)) === ends) {
        await update($, scene, rest)
      }
    })
  }
}

const USAGE = 'Usage: /ina-insets <left> <right>, in pixels from the window edges (0 0 with the side panels closed).'

/** Ina's part of a session starting: asleep, her command, and the insets last set. */
export async function startIna($: EngineInterface) {
  // A reload or a resumed session meets what ran before it: that is over.
  await update($, scene, () => ASLEEP)
  // Rolled on the session's id, so a reload of the same session rolls the same
  // way. Where the time or the id can't be read, it is not festive.
  const festive = await Promise.all([$.clock.now(), $.session.id()]).then(
    ([ms, id]) => festiveSession(ms, id),
    () => false,
  )
  await update($, xmas, () => festive)
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
    // A prompt about landing work opens the turn with a show.
    await change($, (now, ms) => (agentId === undefined ? wake(now, e.turnId, SAID.test(e.text) ? ms : undefined) : join(now, agentId)))

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const { agentId } = e
    // An answer that ends on a question leaves the next move to the person.
    const ending: Ending =
      e.reason === 'aborted' ? 'stop' : e.reason !== 'answer' ? 'oops' : e.answer.trimEnd().endsWith('?') ? 'ask' : 'done'
    await change($, now => (agentId === undefined ? doze(now, e.turnId, ending) : leave(now, agentId)))

    return next(e)
  })

  // A question put to the person mid-turn: Ina holds still until it is answered.
  on('tool.call', { tool: 'AskUserQuestion' }, async ($, e, next) => {
    await change($, now => ask(now, e.tool_use_id))
    try {
      return await next(e)
    } finally {
      await change($, now => resume(now, e.tool_use_id))
    }
  })

  // Work landed, in the main turn or a subagent's: Ina puts on a show. Only
  // after the call succeeded, and without holding up the tool on its way.
  on('classic.PostToolUse', async ($, e, next) => {
    const result = await next(e)

    if (lands(e.tool_name, e.tool_input)) {
      await change($, (now, ms) => (ms === undefined ? now : cheer(now, e.tool_use_id, ms)))
    }

    return result
  })

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if (e.props.plugin !== PLUGIN || e.props.scene !== SCENE || (e.surface !== 'desktop' && e.surface !== 'mobile')) {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)
    const now = await read($, scene)
    // A phone has no side panels.
    const edges = e.surface === 'mobile' ? undefined : await read($, insets)
    const festive = await read($, xmas)
    const busy = now.takos.filter(tako => tako.phase !== 'out').length
    const awake = now.ina !== 'sleep' && now.ina !== 'doze'
    const shows = { trophy: 'raising a gold trophy', ao: 'with Ao-chan rising over her in a dark aura', zoltraak: 'casting Zoltraak' }
    const showing = now.special === null || now.special === undefined ? '' : `, ${shows[now.special.kind]}`

    return (
      <Svg
        source={draw(now, edges, HOLD, festive)}
        alt={`A pixel Ina, ${!awake ? 'asleep' : now.ina === 'wait' ? 'waiting for an answer' : now.form === 'frieren' ? 'summoned as Frieren, elf ears and all' : now.form === 'cat' ? "transformed into Ninyomanyo Ninya'nis, cat ears and all" : 'working in nerd glasses'}${festive ? ', in a Santa hat' : ''}${awake && now.ao ? ', with Ao-chan the grimoire' : ''}${showing}${busy > 0 ? `, and ${busy} takodachi at work` : ''}`}
      />
    )
  })
}

export const ina: Theme = {
  id: 'ina-pixel-dark',
  aliases: ['ina'],
  label: 'Ina pixel dark',
  blurb: 'Purple on black, with a pixel Ina who naps while idle, works in nerd glasses (or now and then is summoned as Frieren, or turns into cat Ina), now and then with Ao-chan, her grimoire, and a takodachi for every subagent. A commit, deploy or merge gets a show. In November and December, one session in two is Christmas',
  swatch: ['#07050c', '#191327', '#9b7fe0', '#d48bd8', '#f6a440', '#ece6fa'],
  look: LOOK,
  warning: problems.find(line => line.startsWith("Desktop won't paint")),
}
