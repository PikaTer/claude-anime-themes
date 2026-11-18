// The scenes to check, drawn by a theme's own `scene.js` as the app would draw
// them at one window size. A case is its steps: the scene at the start, then
// as redrawn by each change `t` seconds in.

import { pathToFileURL } from 'node:url'

const T0 = 10000

export async function cases(themeDir, { width, height, insets }) {
  const S = await import(`${pathToFileURL(`${themeDir}/scene.js`).href}?${Date.now()}`)
  const { ASLEEP, carry, cheer, doze, draw, join, leave, wake } = S
  // `hold` is what the corner tentacles hold, nothing unless a case says, so a
  // case plays the same each run; an older theme's `draw` ignores it.
  const NONE = { high: 'none', low: 'none' }
  const sized = (scene, hold = NONE) => draw(scene, insets, hold).replace('width="100%" height="100%"', `width="${width}" height="${height}"`)
  const out = {}

  const still = (name, scene, hold) => (out[name] = [{ t: 0, svg: sized(scene, hold) }])
  // Each change is made `ms` in and carried on from what was playing, as the app does.
  const changes = (name, start, steps) => {
    let scene = start
    out[name] = [{ t: 0, svg: sized(scene) }]
    for (const [ms, change] of steps) {
      scene = carry(scene, change(scene, ms), ms)
      out[name].push({ t: (ms - T0) / 1000, svg: sized(scene) })
    }
  }
  const first = want => {
    for (let i = 0; i < 2000; i++) {
      const scene = wake(ASLEEP, `check-${i}`)
      if (want(scene)) {
        return scene
      }
    }
    throw new Error('no wake rolled what the case needs')
  }
  const at = (form, ao, takos) => {
    let scene = { ...first(s => s.form === form && s.ao === ao), ina: 'work', cue: 'none', special: null }
    for (let i = 0; i < takos; i++) {
      scene = join(scene, `agent-${i}`)
    }
    return { ...scene, cue: 'none', takos: scene.takos.map(tako => ({ ...tako, phase: 'on' })) }
  }
  const show = (scene, kind) => {
    for (let i = 0; i < 500; i++) {
      const on = cheer(scene, `land-${i}`, T0)
      if (on.special?.kind === kind) {
        return on
      }
    }
    throw new Error(`no ${kind} show for this scene`)
  }

  // Cat Ina, where the theme has her: the control's older theme does not.
  const cat = (() => {
    try {
      return first(s => s.form === 'cat') !== undefined
    } catch {
      return false
    }
  })()
  const forms = cat ? ['nerd', 'frieren', 'cat'] : ['nerd', 'frieren']

  // Waking, with every greeting.
  still('wake-nerd', first(s => s.form === 'nerd' && !s.ao))
  still('wake-ao', first(s => s.form === 'nerd' && s.ao))
  still('wake-frieren', first(s => s.form === 'frieren' && !s.ao))
  still('wake-frieren-ao', first(s => s.form === 'frieren' && s.ao))
  if (cat) {
    still('wake-cat', first(s => s.form === 'cat' && !s.ao))
    still('wake-cat-ao', first(s => s.form === 'cat' && s.ao))
  }
  // A prompt about committing: the show waits for her greeting, and the turn ends mid-show.
  for (const form of forms) {
    let woke
    for (let i = 0; !woke || woke.form !== form; i++) {
      woke = wake(ASLEEP, `prompt-${i}`, T0)
    }
    changes(`wake-${form}-show`, woke, [[T0 + (form === 'nerd' ? 5000 : 6000), s => doze(s, 'end', 'done')]])
  }
  // At work with a crowd, and dozing off: Frieren Ina's tentacles, Ao-chan's leaving.
  still('work-t8', at('nerd', false, 8))
  still('doze-nerd', doze(at('nerd', false, 0), 'end'))
  still('doze-ao', doze(at('nerd', true, 0), 'end'))
  still('doze-frieren', doze(at('frieren', false, 0), 'end'))
  still('doze-frieren-t3', doze(at('frieren', false, 3), 'end'))
  if (cat) {
    still('doze-cat', doze(at('cat', false, 0), 'end'))
    still('doze-cat-t3', doze(at('cat', true, 3), 'end'))
  }
  // Every show, with none, a few and many takodachis.
  for (const takos of [0, 3, 8]) {
    still(`trophy-t${takos}`, show(at('nerd', false, takos), 'trophy'))
    still(`ao-t${takos}`, show(at('nerd', false, takos), 'ao'))
    still(`zoltraak-t${takos}`, show(at('frieren', false, takos), 'zoltraak'))
    if (cat) {
      still(`trophy-cat-t${takos}`, show(at('cat', false, takos), 'trophy'))
      still(`ao-cat-t${takos}`, show(at('cat', false, takos), 'ao'))
    }
  }
  // Both corner tentacles holding a takodachi, bobbing: wrapped, riding, and through a show.
  const WRAP = { high: 'wrap', low: 'wrap' }
  still('held-wrap-work', at('nerd', false, 3), WRAP)
  still('held-ride-work', at(cat ? 'cat' : 'nerd', false, 0), { high: 'ride', low: 'ride' })
  still('held-wrap-trophy', show(at('nerd', false, 3), 'trophy'), WRAP)
  // Zoltraak at the sky, its beam through the high one; Ao-chan's show beside them.
  still('held-wrap-zoltraak', show(at('frieren', false, 0), 'zoltraak'), WRAP)
  still('held-ride-ao', show(at('nerd', false, 0), 'ao'), { high: 'ride', low: 'ride' })
  // Redrawn mid-show: a takodachi joins, another leaves, the turn ends.
  for (const [kind, form] of [['trophy', 'nerd'], ['ao', 'nerd'], ['zoltraak', 'frieren'], ...(cat ? [['trophy', 'cat'], ['ao', 'cat']] : [])]) {
    changes(`${kind}${form === 'cat' ? '-cat' : ''}-redrawn`, show(at(form, false, 2), kind), [
      [T0 + 1000, s => join(s, 'late')],
      [T0 + 1600, s => leave(s, 'agent-0')],
      [T0 + 2200, s => doze(s, 'end', 'done')],
    ])
  }

  return out
}
