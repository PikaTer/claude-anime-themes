import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, ThemeResult } from 'claude-code'

import type { Choice } from '../types'
import { DEFAULT, THEMES, find, registerThemes, startThemes } from './themes'
import type { Theme } from './themes/theme.js'

const COMMAND = 'anime-theme'
const PANE = 'anime-themes'
/** What is kept when the person turns the themes off. */
const OFF = 'off'
const HELP = [
  'Pick one in a panel, with a live preview: `/anime-theme`',
  'Preview one, then keep or undo it: `/anime-theme preview <theme>`',
  'Switch and keep it: `/anime-theme <theme>`',
  "Back to the app's own look: `/anime-theme off`",
].join('\n')

// What is kept, and the theme being previewed. The kept one is also stored, for
// the next session. A preview is not: it lives here, and a new session starts on
// what was kept.
const choice = atom({ plugin: 'anime-themes', key: 'choice' } as const, { kept: DEFAULT, trying: null } as Choice)

// Where a client draws no theme (the terminal, an editor), say why nothing changed.
const note = (result: ThemeResult) => (result.isDrawn ? '' : ` Nothing is drawn here: ${result.reason}`)

/** The id kept for this person: a theme, `off`, or the default when none is kept or the one kept is gone. */
async function kept($: EngineInterface) {
  const id = await $.store.get('theme')

  return id === OFF || (typeof id === 'string' && find(id) !== undefined) ? (id as string) : DEFAULT
}

/** The theme being previewed, if there is one. */
async function previewed($: EngineInterface) {
  const { trying } = await read($, choice)

  return trying === null ? undefined : find(trying)
}

/** Puts the kept theme on screen, or the app's own look where none is kept. */
async function showKept($: EngineInterface) {
  const theme = find(await kept($))

  return theme === undefined ? $.theme.clear() : $.theme.set(theme.look)
}

/** Puts a theme up live. Nothing is stored. */
async function preview($: EngineInterface, theme: Theme) {
  await update($, choice, now => ({ ...now, trying: theme.id }))

  return $.theme.set(theme.look)
}

/** Keeps a theme for later sessions, on screen or not. */
async function keep($: EngineInterface, theme: Theme) {
  await $.store.set('theme', theme.id)
  await update($, choice, () => ({ kept: theme.id, trying: null }))
}

/** Switches to a theme and keeps it. */
async function apply($: EngineInterface, theme: Theme) {
  await keep($, theme)

  return $.theme.set(theme.look)
}

/** Turns the themes off, and keeps that. */
async function turnOff($: EngineInterface) {
  await $.store.set('theme', OFF)
  await update($, choice, () => ({ kept: OFF, trying: null }))

  return $.theme.clear()
}

/** Drops a preview and puts back what was kept. Resolves to the preview's theme, or `undefined` where there was none. */
async function revert($: EngineInterface) {
  const theme = await previewed($)

  if (theme === undefined) {
    return undefined
  }
  await update($, choice, now => ({ ...now, trying: null }))
  await showKept($)

  return theme
}

async function list($: EngineInterface) {
  const id = await kept($)
  const trying = await previewed($)
  const rows = THEMES.map(theme => {
    const marks = [theme.id === id ? 'kept' : '', theme === trying ? 'previewing' : ''].filter(Boolean)

    return `- **${theme.id}**${marks.length > 0 ? ` (${marks.join(', ')})` : ''}: ${theme.blurb}`
  })

  return [`**Anime themes**${id === OFF ? ' (off)' : ''}`, ...rows, '', HELP].join('\n')
}

export const register: Register = (on, options) => {
  registerThemes(on, options)

  on('session.start', async ($, e, next) => {
    await startThemes($)
    await $.command.register({
      name: COMMAND,
      description: 'Pick an anime theme with a live preview, or switch directly',
      argumentHint: `[${THEMES.map(theme => theme.id).join('|')} | preview <theme> | keep | revert | off | list]`,
    })
    const id = await kept($)
    const theme = find(id)

    // A new session starts on what was kept, never on a preview.
    await update($, choice, () => ({ kept: id, trying: null }))
    // `off` leaves the app's own look; a theme goes up once, from here.
    if (theme !== undefined) {
      await $.theme.set(theme.look)
      if (theme.warning !== undefined) {
        $.ui.toast(theme.warning)
      }
    }

    return next(e)
  })

  on('command.run', { command: COMMAND }, async ($, e) => {
    const [verb = '', ...rest] = e.args.trim().split(/\s+/).filter(Boolean)
    const word = verb.toLowerCase()

    // Bare, it opens the picker, which previews and applies with buttons.
    if (word === '') {
      const opened = await $.ui.open({ id: PANE, title: 'Anime themes', focus: true, closeOnEscape: true, rows: 5 + THEMES.length * 4 })

      if (!opened.isPlaced) {
        return { text: `${await list($)}\n\nThe picker can't open here: ${opened.reason}` }
      }

      return { text: 'Anime themes: preview a theme in the panel, then Apply to keep it. Esc closes the panel and undoes an unapplied preview.' }
    }

    if (word === 'list') {
      return { text: await list($) }
    }

    if (word === 'keep') {
      const theme = await previewed($)

      if (theme === undefined) {
        return { text: 'Nothing to keep: you are not previewing a theme.' }
      }
      await keep($, theme)

      return { text: `Kept ${theme.label}.` }
    }

    if (word === 'revert') {
      const theme = await revert($)

      return { text: theme === undefined ? 'Nothing to revert: you are not previewing a theme.' : `Dropped the preview of ${theme.label}.` }
    }

    if (word === OFF || word === 'default') {
      return { text: `Themes off: the app's own look.${note(await turnOff($))}` }
    }

    const previewing = word === 'preview'
    const name = previewing ? rest.join(' ') : e.args
    const theme = find(name)

    if (theme === undefined) {
      const names = THEMES.map(one => one.id).join(', ')

      return { text: name.trim() === '' ? `Name a theme to preview: ${names}.` : `No theme called "${name.trim()}". Themes: ${names}.` }
    }

    if (!previewing) {
      return { text: `${theme.label}, kept.${note(await apply($, theme))}` }
    }

    const shown = note(await preview($, theme))
    // Ask while it is on screen. A dismissed or unavailable dialog leaves the preview up.
    const answer = await $.ui.ask(`Keep ${theme.label}?`, ['Keep', 'Revert']).catch(() => undefined)

    if (answer === 'Keep') {
      await keep($, theme)

      return { text: `Kept ${theme.label}.${shown}` }
    }

    if (answer === 'Revert') {
      await revert($)
      const back = find(await kept($))

      return { text: back === undefined ? "Back to the app's own look." : `Back to ${back.label}.` }
    }

    return { text: `Previewing ${theme.label}.${shown} Keep it with \`/anime-theme keep\`, undo with \`/anime-theme revert\`.` }
  })

  // Closing the panel, with Esc or its Close button, undoes a preview that was not applied.
  on('ui.close', { id: PANE }, async ($, e, next) => {
    if (e.origin.kind !== 'unload') {
      await revert($)
    }

    return next(e)
  })

  // The picker: each theme with its colors, a Preview and an Apply.
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Text } = $.ui.resolve(e)
    const now = await read($, choice)
    const trying = now.trying === null ? undefined : find(now.trying)

    return (
      <Box flexDirection="column" gap={1}>
        <Text dimColor>
          {trying === undefined
            ? 'Preview puts a theme up live. Nothing is saved until you apply it.'
            : `Previewing ${trying.label}. Apply keeps it; Revert, or closing the panel, undoes it.`}
        </Text>
        {THEMES.map(theme => (
          <Box flexDirection="column">
            <Box>
              {theme.swatch.map(color => (
                <Text color={color}>██</Text>
              ))}
              <Text bold> {theme.label}</Text>
              <Text dimColor>
                {theme.id === now.kept ? '  kept' : ''}
                {theme.id === now.trying ? '  previewing' : ''}
              </Text>
            </Box>
            <Text dimColor>{theme.blurb}</Text>
            <Box gap={1}>
              <Button key={`preview-${theme.id}`} label="Preview" onPress={() => preview($, theme)} />
              <Button
                key={`apply-${theme.id}`}
                label="Apply"
                variant="primary"
                onPress={async () => {
                  await apply($, theme)
                  await $.ui.close({ id: PANE })
                }}
              />
            </Box>
          </Box>
        ))}
        <Box gap={1}>
          {trying !== undefined && <Button key="revert" label="Revert" onPress={() => revert($)} />}
          <Button key="off" label="Off" onPress={() => turnOff($)} />
          <Button
            key="close"
            label="Close"
            role="dismiss"
            onPress={async () => {
              await revert($)
              await $.ui.close({ id: PANE })
            }}
          />
        </Box>
      </Box>
    )
  })

  // The list shows each theme's colors as a strip beside its words.
  on('ui.render', { component: 'CommandOutput', props: { command: COMMAND } }, async ($, e, next) => {
    if (e.props.isErrored || e.props.args.trim().toLowerCase() !== 'list') {
      return next(e)
    }
    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="column">
        {THEMES.map(theme => (
          <Box>
            {theme.swatch.map(color => (
              <Text color={color}>██</Text>
            ))}
            <Text> {theme.id}</Text>
          </Box>
        ))}
        {await next(e)}
      </Box>
    )
  })
}
