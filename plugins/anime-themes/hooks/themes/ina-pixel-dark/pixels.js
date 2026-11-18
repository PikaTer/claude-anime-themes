// The pixel art toolkit: the palette, sprites from text grids, and plotted shapes.
// Sprites are text grids, one character a pixel, so they can be redrawn by hand.

export const PAL = {
  o: '#1b1430', // outline
  h: '#5d4b8a', // hair
  H: '#8a76bd', // hair light
  d: '#463769', // hair dark
  s: '#ffeadf', // skin
  b: '#f9a9b0', // blush
  y: '#f6a440', // orange
  Y: '#ffd27f', // orange light
  w: '#ffffff',
  e: '#2b2045', // eyes, ink
  p: '#e8789a', // mouth
  t: '#7a67a8', // takodachi
  T: '#a08fca', // takodachi light
  g: '#8d93ab', // laptop
  G: '#c6cbdd', // laptop light
  k: '#c98a45', // cookie
  K: '#6e4525', // chocolate chip
  z: '#b9a6ee', // zzz, Ina's marks
  m: '#2a1f4e', // sigil
  M: '#43317a', // sigil light
  q: '#a8662a', // sigil and sucker orange
  u: '#271c4b', // tentacle
  U: '#3f2f78', // tentacle light
  x: '#2b2045', // text
  r: '#d8344a', // Frieren's gem and earrings
  R: '#ff8a96', // gem light
  j: '#c9963c', // gold trim
  J: '#f2d37e', // gold light
  v: '#5b3a24', // Fern's staff, wood
  V: '#8d5f39', // wood light
  l: '#8e5fd0', // Fern's ribbon
  L: '#c39cf2', // ribbon light, sparkle
  n: '#7c6aa8', // Frieren's iris
  a: '#4a3d66', // Ao-chan's cover
  A: '#2e2547', // her spine
  i: '#7a6aa0', // her cover's line-work
  P: '#e24d78', // her eye
  C: '#f4ead2', // her pages
  c: '#b7a98a', // the words on them
  B: '#9fd8ff', // Zoltraak's light, a takodachi's sweat
  N: '#0d0716', // Ao-chan's dark aura
}

/** Rows of pixels to one `<path>` per color, each run of a row one rectangle. */
export function px(rows, ox = 0, oy = 0) {
  const paths = {}

  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; ) {
      const color = row[x]
      let run = 1

      while (row[x + run] === color) {
        run++
      }
      if (color !== '.') {
        paths[color] = `${paths[color] ?? ''}M${x + ox} ${y + oy}h${run}v1h-${run}z`
      }
      x += run
    }
  })

  return Object.entries(paths)
    .map(([color, d]) => `<path fill="${PAL[color]}" d="${d}"/>`)
    .join('')
}

export const mirror = rows => rows.map(row => row + [...row].reverse().join(''))
/** One sprite at `x`, and its mirror image on the other side of a `width` wide sprite. */
export const both = (rows, x, y, width) =>
  px(rows, x, y) + px(rows.map(row => [...row].reverse().join('')), width - x - rows[0].length, y)

// The background's larger shapes are plotted, not typed: too big for a grid by hand.
export const grid = (width, height) => Array.from({ length: height }, () => Array(width).fill('.'))
export const rows = cells => cells.map(row => row.join(''))

export function plot(cells, x, y, color) {
  const row = cells[Math.round(y)]

  if (row !== undefined && Math.round(x) >= 0 && Math.round(x) < row.length) {
    row[Math.round(x)] = color
  }
}

export function line(cells, [x0, y0], [x1, y1], color) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))

  for (let i = 0; i <= steps; i++) {
    plot(cells, x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps, color)
  }
}

/** Every pixel `test` accepts by its distance from a centre. */
export function round(cells, cx, cy, reach, color, test) {
  for (let y = Math.floor(cy - reach); y <= cy + reach; y++) {
    for (let x = Math.floor(cx - reach); x <= cx + reach; x++) {
      if (test(Math.hypot(x - cx, y - cy))) {
        plot(cells, x, y, color)
      }
    }
  }
}

/**
 * A tentacle rising from the foot of its grid and turning left by `bend`, a
 * function of how far along it is (0 to 1): its rows and the column of its root.
 * It narrows from `thick` at the root to `tip` at the end.
 */
export function tentacle(length, bend, thick = 4.2, [body, light, sucker] = 'uUq', tip = 1) {
  const spine = []
  let x = 0
  let y = 0

  for (let i = 0; i < length; i++) {
    const t = i / length
    const heading = -Math.PI / 2 - bend(t)

    spine.push({ x, y, heading, thick: (thick - tip) * (1 - t) + tip })
    x += Math.cos(heading)
    y += Math.sin(heading)
  }
  const left = Math.floor(Math.min(...spine.map(at => at.x - at.thick)))
  const top = Math.floor(Math.min(...spine.map(at => at.y - at.thick)))
  const cells = grid(Math.ceil(Math.max(...spine.map(at => at.x + at.thick))) - left + 1, 1 - top)

  spine.forEach(at => {
    at.x -= left
    at.y -= top
  })
  spine.forEach(at => round(cells, at.x, at.y, at.thick, body, far => far < at.thick))
  spine.forEach((at, i) => {
    const side = (reach, turn) => [at.x + reach * Math.cos(at.heading + turn), at.y + reach * Math.sin(at.heading + turn)]

    plot(cells, ...side(at.thick - 1.6, Math.PI / 2), light)
    if (i % 6 === 2 && at.thick > 2) {
      plot(cells, ...side(at.thick - 1.6, -Math.PI / 2), sucker)
    }
  })

  return { rows: rows(cells), root: -left }
}

// A sway, then a curl that tightens to the tip.
export const curls = (sway, curl) => t => sway * Math.sin(t * 5) + curl * t ** 3
