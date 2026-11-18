#!/usr/bin/env node
// Plays Ina's scenes in a headless Chrome and checks none would trip the
// desktop app's flash guard. See README.md.
//
//   node tools/flash-check/check.mjs [--sizes 1280x800,900x650] [--only zoltraak,doze] [--reps 2] [--control]
//   node tools/flash-check/check.mjs --theme <dir with scene.js>

import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { homedir, tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

import { cases } from './cases.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../..')
const THEME = 'plugins/anime-themes/hooks/themes/ina-pixel-dark'
// The last commit whose shows still tripped the guard, and a case of it that did.
const CONTROL = { commit: 'e0fe147~1', cases: ['zoltraak-t3'] }
const ALL_SIZES = ['900x650', '1100x720', '1280x800', '1680x1000']
// Where the sprites stand in from the window's edges, as with the desktop app's panels open.
const INSETS = { left: 300, right: 345 }

const { values: opts } = parseArgs({
  options: {
    theme: { type: 'string', default: join(REPO, THEME) },
    sizes: { type: 'string', default: '1280x800' },
    only: { type: 'string' },
    reps: { type: 'string', default: '1' },
    seconds: { type: 'string', default: '9' },
    control: { type: 'boolean', default: false },
    chrome: { type: 'string', default: process.env.CHROME },
  },
})

/** playwright-core: installed, named by PLAYWRIGHT_CORE, or left in npx's cache. */
function playwright() {
  const require = createRequire(import.meta.url)
  const tries = [process.env.PLAYWRIGHT_CORE, 'playwright-core']
  const npx = join(homedir(), '.npm/_npx')

  if (existsSync(npx)) {
    for (const dir of readdirSync(npx)) {
      tries.push(join(npx, dir, 'node_modules/playwright-core'))
    }
  }
  for (const at of tries.filter(Boolean)) {
    try {
      return require(at)
    } catch {}
  }
  console.error('playwright-core not found. Run once: npx -y playwright-core install chromium   (or set PLAYWRIGHT_CORE to its folder)')
  process.exit(2)
}

async function launch() {
  const { chromium } = playwright()

  for (const how of [{ executablePath: opts.chrome }, {}, { channel: 'chrome' }]) {
    if (how.executablePath === undefined && 'executablePath' in how) {
      continue
    }
    try {
      return await chromium.launch({ ...how, args: ['--enable-gpu-rasterization'] })
    } catch {}
  }
  console.error('No Chrome to drive. Run: npx -y playwright-core install chromium   (or pass --chrome <path>)')
  process.exit(2)
}

/** Serves the page, the detector and the cases' SVGs; returns its address and a way to swap the SVGs. */
async function serve() {
  let svgs = []
  const server = createServer((req, res) => {
    const path = new URL(req.url, 'http://x').pathname
    const svg = path.match(/^\/svg\/(\d+)\.svg$/)
    if (svg) {
      res.writeHead(200, { 'content-type': 'image/svg+xml', 'cache-control': 'no-store' })
      res.end(svgs[Number(svg[1])])
    } else if (path === '/' || path === '/detector.js') {
      res.writeHead(200, { 'content-type': path === '/' ? 'text/html' : 'text/javascript' })
      res.end(readFileSync(join(HERE, path === '/' ? 'page.html' : 'detector.js')))
    } else {
      res.writeHead(404).end()
    }
  })
  await new Promise(done => server.listen(0, '127.0.0.1', done))

  return { url: `http://127.0.0.1:${server.address().port}/`, close: () => server.close(), set: list => (svgs = list) }
}

/** Every case at every size, `reps` times each: the ones that tripped. */
async function run(browser, server, themeDir, names) {
  const tripped = []

  for (const size of opts.sizes === 'all' ? ALL_SIZES : opts.sizes.split(',')) {
    const [width, height] = size.split('x').map(Number)
    const all = await cases(themeDir, { width, height, insets: INSETS })
    const page = await browser.newPage({ viewport: { width, height } })
    await page.goto(server.url)
    await page.waitForFunction(() => window.ready === true)

    for (const name of Object.keys(all).filter(name => names === undefined || names.some(part => name.includes(part)))) {
      const steps = all[name]
      for (let rep = 0; rep < Number(opts.reps); rep++) {
        // Fresh URLs each play, so no image is reused with its animations already running.
        const base = rep * 1000
        server.set(Object.assign([], ...steps.map((step, i) => ({ [base + i]: step.svg }))))
        const plays = steps.map((step, i) => ({ t: step.t, url: `svg/${base + i}.svg` }))
        const seconds = steps.at(-1).t + Number(opts.seconds)
        const result = await page.evaluate(([plays, seconds, width, height]) => window.play(plays, seconds, width, height), [plays, seconds, width, height])
        const trip = Object.entries(result).filter(([, at]) => at !== null)

        console.log(`${size}  ${name.padEnd(20)} ${trip.length === 0 ? 'ok' : `TRIPS ${trip.map(([grid, at]) => `${grid}@${at}s`).join(' ')}`}`)
        if (trip.length > 0) {
          tripped.push(`${size} ${name}`)
        }
      }
    }
    await page.close()
  }

  return tripped
}

const browser = await launch()
const server = await serve()
let failed = false

try {
  if (opts.control) {
    // The checker must still catch what once froze the app, or a pass means nothing.
    const old = mkdtempSync(join(tmpdir(), 'flash-control-'))
    execFileSync('sh', ['-c', `git -C "${REPO}" archive ${CONTROL.commit} ${THEME} | tar -x -C "${old}"`])
    console.log(`control: ${CONTROL.commit}, expected to trip`)
    const caught = await run(browser, server, join(old, THEME), CONTROL.cases)
    rmSync(old, { recursive: true, force: true })
    if (caught.length === 0) {
      console.log('CONTROL MISSED: the checker no longer catches a known freeze')
      failed = true
    }
    console.log('')
  }
  const tripped = await run(browser, server, resolve(opts.theme), opts.only?.split(','))
  if (tripped.length > 0) {
    console.log(`\n${tripped.length} would trip the flash guard:\n  ${tripped.join('\n  ')}`)
    failed = true
  } else {
    console.log('\nnone would trip the flash guard')
  }
} finally {
  await browser.close()
  server.close()
}
process.exit(failed ? 1 : 0)
