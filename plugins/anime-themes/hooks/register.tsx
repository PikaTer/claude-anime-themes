import type { EngineInterface, Register, ThemeResult } from 'claude-code'

import { DEFAULT, THEMES, find, registerThemes, startThemes } from './themes'
import type { Theme } from './themes/theme.js'

const COMMAND = 'anime-theme'
/** What is stored when the person turns the themes off. */
const OFF = 'off'
const HELP = [
  'Preview one live, then keep or undo it: `/anime-theme preview <theme>`',
  'Switch and keep it: `/anime-theme <theme>`',
  "Back to the app's own look: `/anime-theme off`",
].join('\n')

// A theme the person is only trying. It lives in this module, so a reload drops
// it and a session never starts on a preview.
let trying: Theme | undefined

// Where a client draws no theme (the terminal, an editor), say why nothing changed.
const note = (result: ThemeResult) => (result.isDrawn ? '' : ` Nothing is drawn here: ${result.reason}`)

/** The id kept for this person: a theme, `off`, or the default when none is kept or the one kept is gone. */
async function kept($: EngineInterface) {
  const id = await $.store.get('theme')

  return id === OFF || (typeof id === 'string' && find(id) !== undefined) ? (id as string) : DEFAULT
}

/** Puts the kept choice back on screen. */
async function settle($: EngineInterface) {
  const theme = find(await kept($))

  if (theme === undefined) {
    return `Back to the app's own look.${note(await $.theme.clear())}`
  }

  return `Back to ${theme.label}.${note(await $.theme.set(theme.look))}`
}

async function keep($: EngineInterface, theme: Theme) {
  trying = undefined
  await $.store.set('theme', theme.id)

  return `Kept ${theme.label}.`
}

async function list($: EngineInterface) {
  const id = await kept($)
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
      description: 'Switch the anime theme, or preview one first',
      argumentHint: `[${THEMES.map(theme => theme.id).join('|')} | preview <theme> | keep | revert | off]`,
    })
    const theme = find(await kept($))

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

    if (word === '' || word === 'list') {
      return { text: await list($) }
    }

    if (word === 'keep') {
      return { text: trying === undefined ? 'Nothing to keep: you are not previewing a theme.' : await keep($, trying) }
    }

    if (word === 'revert') {
      if (trying === undefined) {
        return { text: 'Nothing to revert: you are not previewing a theme.' }
      }
      trying = undefined

      return { text: await settle($) }
    }

    if (word === OFF || word === 'default') {
      trying = undefined
      await $.store.set('theme', OFF)

      return { text: `Themes off: the app's own look.${note(await $.theme.clear())}` }
    }

    const previewing = word === 'preview'
    const name = previewing ? rest.join(' ') : e.args
    const theme = find(name)

    if (theme === undefined) {
      const names = THEMES.map(one => one.id).join(', ')

      return { text: name.trim() === '' ? `Name a theme to preview: ${names}.` : `No theme called "${name.trim()}". Themes: ${names}.` }
    }

    if (!previewing) {
      await keep($, theme)

      return { text: `${theme.label}, kept.${note(await $.theme.set(theme.look))}` }
    }

    trying = theme
    const shown = note(await $.theme.set(theme.look))
    // Ask while it is on screen. A dismissed or unavailable dialog leaves the preview up.
    const answer = await $.ui.ask(`Keep ${theme.label}?`, ['Keep', 'Revert']).catch(() => undefined)

    if (answer === 'Keep') {
      return { text: `${await keep($, theme)}${shown}` }
    }

    if (answer === 'Revert') {
      trying = undefined

      return { text: await settle($) }
    }

    return { text: `Previewing ${theme.label}.${shown} Keep it with \`/anime-theme keep\`, undo with \`/anime-theme revert\`.` }
  })

  // The list shows each theme's colors as a strip beside its words.
  on('ui.render', { component: 'CommandOutput', props: { command: COMMAND } }, async ($, e, next) => {
    const args = e.props.args.trim().toLowerCase()

    if (e.props.isErrored || (args !== '' && args !== 'list')) {
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
