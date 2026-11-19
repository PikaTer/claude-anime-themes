# Tentacle baubles — design

## Intent

In a festive (Christmas) session, hang round Christmas baubles on Ina's two
corner tentacles, so they join the hats, holly and snow. It's for fun, like the
rest of Christmas Ina.

## Goals

- Only in festive scenes (`draw(..., festive = true)`); plain sessions are unchanged.
- About 4 to 5 baubles per tentacle (the high one is shorter, so nearer 4), in
  red, gold, blue and silver, each on a small gold hook, hanging down the screen
  from the tentacle's lower edge. Round, with a highlight and a shaded side (as in
  the mockup, option B).
- They follow whichever art the tentacle has: bare, riding a takodachi, or
  wrapped round one.
- Baubles are still. No motion.

## Non-goals

- No string lights, no twinkle, no tinsel (options A and C were not picked).
- No change to the tentacles' shape or to how they hold takodachis.
- No new roll: the baubles are always there in a festive scene, in fixed places.

## Anti-goals

- Nothing may cover a held takodachi or its hat. Baubles skip the stretch where a
  tentacle wraps a takodachi, and a riding takodachi stays in front.
- Nothing may trip the desktop app's flash guard. Static art can't, but the
  festive tentacle cases in `tools/flash-check` still run as the check.
- The scene must stay under 131,072 characters in its worst case, festive and
  plain (about 5 KB of headroom today).

## Approaches

- **Baubles on fixed spots along each tentacle's curve** (picked): each of the
  four bauble colours is drawn once in `<defs>`, and each placement is a `<use>`
  with an x and y, so the cost per bauble is small. Spots are worked out once
  from the tentacle's spine, as `held.js` already does for the wrap.
- **Per-pixel art for every bauble**: the mockup did this, and it came to about
  4.5 KB. Too much of the headroom. Not picked.
- **Baubles as part of the tentacle's own pixel rows**: simplest, but it bakes
  them into plain sessions too, and they'd get cut by the tentacle's grid. Not picked.

## How it's built

- `xmas.js` gets the bauble sprites (one `<g>` per colour, joined to `XMAS_DEFS`)
  and a function that lays them along a spine: every so many steps from the root,
  from whichever edge faces down the screen, skipping the tip and, for a wrapped
  tentacle, the loop.
- `held.js`'s `tentacles()` already takes `festive`; each tentacle's art gets its
  baubles added, before the takodachi where one rides (so it stays in front).
- Positions are computed once at load, not per draw.

## Left to the builder

- Exact spacing, colour order and which side each hangs from, tuned against the
  mockup (spacing about 14 steps along the curve, first one about 12 steps from
  the root).
- Checking the worst-case size, festive and plain, as in `register.test.tsx`, and
  adding a festive-with-baubles case to `tools/flash-check/cases.mjs`.
- A test that baubles appear only when festive.
