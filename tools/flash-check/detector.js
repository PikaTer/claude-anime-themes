// A flash detector modelled on the rule the Claude desktop app holds a
// backdrop still by. Its own code, written from the app's observed behaviour,
// which is not documented and may change:
//
// - A spot of the window "flashes" once its brightness has swung between
//   light and dark four times within a second, each swing at least 0.1 in
//   relative luminance with the darker end under 0.8. Saturated red swings are
//   counted on their own, more strictly.
// - The backdrop trips once flashing spots cover more than a quarter of any
//   patch of the window about 341 x 256 px.
//
// The window is sampled as a coarse grid of cells, each the average of what is
// under it, one sample a frame.

const LINEAR = Float64Array.from({ length: 256 }, (_, i) => {
  const c = i / 255

  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
})

const SWINGS = 4
const WINDOW_MS = 1000

/** One measure tracked per cell: its last turning point, its trend, and when it last swung. */
function track(cells) {
  return {
    turn: new Float64Array(cells).fill(Number.NaN),
    trend: new Int8Array(cells),
    // Whether the turning point was a saturated red: for the red measure.
    hot: new Uint8Array(cells),
    // The times of its last SWINGS swings, newest first.
    times: new Float64Array(cells * SWINGS).fill(-Infinity),
  }
}

/** Feed a cell's new value; `big` says whether going from one value to another is a swing. */
function feed(t, cell, value, hot, now, big) {
  const turn = t.turn[cell]

  if (Number.isNaN(turn)) {
    t.turn[cell] = value
    t.hot[cell] = hot
    return
  }
  const trend = t.trend[cell]
  const way = Math.sign(value - turn)

  if (trend !== 0 && way === trend) {
    // Further the same way: the turning point moves with it.
    t.turn[cell] = value
    t.hot[cell] = hot
  } else if (way !== 0 && big(turn, value, t.hot[cell] || hot)) {
    t.trend[cell] = way
    t.turn[cell] = value
    t.hot[cell] = hot
    const at = cell * SWINGS
    t.times.copyWithin(at + 1, at, at + SWINGS - 1)
    t.times[at] = now
  }
}

const flashing = (t, cell, now) => now - t.times[cell * SWINGS + SWINGS - 1] < WINDOW_MS

const lightSwing = (a, b) => Math.abs(a - b) >= 0.1 && Math.min(a, b) < 0.8
const redSwing = (a, b, hot) => hot && Math.abs(a - b) > 0.0625

/**
 * A detector for a grid of `cols` x `rows` cells sampling a `width` x `height`
 * px window. Call it with each frame's RGBA cells and the time in ms; it says
 * whether the backdrop would be held still.
 */
export function detector({ cols, rows, width, height }) {
  const cells = cols * rows
  const light = track(cells)
  const red = track(cells)
  const pw = Math.max(1, Math.round((341 * cols) / width))
  const ph = Math.max(1, Math.round((256 * rows) / height))
  const sums = new Int32Array((cols + 1) * (rows + 1))

  return (rgba, now) => {
    for (let cell = 0; cell < cells; cell++) {
      const r = LINEAR[rgba[cell * 4]]
      const g = LINEAR[rgba[cell * 4 + 1]]
      const b = LINEAR[rgba[cell * 4 + 2]]
      const all = r + g + b

      feed(light, cell, 0.2126 * r + 0.7152 * g + 0.0722 * b, 0, now, lightSwing)
      feed(red, cell, Math.max(0, r - g - b), all > 0 && r / all >= 0.8 ? 1 : 0, now, redSwing)
    }
    // A summed-area table of flashing cells, then every patch's share.
    const stride = cols + 1

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cell = y * cols + x
        const on = flashing(light, cell, now) || flashing(red, cell, now) ? 1 : 0
        const at = (y + 1) * stride + x + 1

        sums[at] = on + sums[at - 1] + sums[at - stride] - sums[at - stride - 1]
        if (y + 1 >= ph && x + 1 >= pw) {
          const up = at - ph * stride
          const lit = sums[at] - sums[at - pw] - sums[up] + sums[up - pw]

          if (lit > pw * ph * 0.25) {
            return true
          }
        }
      }
    }

    return false
  }
}
