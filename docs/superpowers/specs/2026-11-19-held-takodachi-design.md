# Takodachis held by Ina's tentacles — design

## Intent

The `ina-pixel-dark` backdrop has two still tentacles on the right edge, one
hanging from the top and one rising from the bottom, each ending in a small curl.
Now and then, when the theme loads, a tentacle holds a takodachi instead. It's for
fun and variety, like the marks that get shuffled across the sky.

## Goals

- Each tentacle is rolled on its own when the theme loads: about 1 in 5 it wraps a
  takodachi (look B), about 1 in 5 it carries one (look C), otherwise it's left as
  it is today. So both, one or neither can hold a takodachi, and the two can use
  different looks.
- **B: wrapped.** The tentacle keeps its curve, then its tip loops round a
  takodachi the usual size (4 px pixels, like the ones on the left) instead of
  curling up empty.
- **C: riding / hanging.** The tentacle stays as it is today. On the bottom one, a
  takodachi sits on top of the arch. On the top one, it hangs under the arch by
  its two raised arms.
- The held takodachi bobs like the others.
- With cat Ina out, held takodachis get cat ears like the ones that join her.

## Non-goals

- Held takodachis don't come or go, don't say WAH, and don't join in shows. Zoltraak
  doesn't aim at them. They aren't counted as subagents.
- No re-roll on wake: the roll lasts until the theme is loaded again.
- No change to the takodachis on the left or to the tentacles' shape when nothing
  is held.

## Anti-goals

- Nothing may trip the desktop app's flash guard. The bob is the existing one-pixel
  step, so this should pass; it gets checked with `tools/flash-check`, including a
  new case with both tentacles holding one.
- The scene must stay under its 131,072-character limit in its worst case. The
  wrapped tentacles cost roughly 1 KB more than today's, and there is only about
  1.3 KB of headroom, so the worst case is measured with both tentacles wrapped. If
  it doesn't fit, the extra is trimmed elsewhere before this lands.

## Approaches

- **A: wrapped, with a big takodachi** (5 px pixels, like the tentacle). Not picked.
- **B: wrapped, usual size.** Picked.
- **C: riding / hanging, with the tentacle unchanged.** Picked. Known rough edges
  seen in the mockups, accepted: on the top tentacle the takodachi's halo sits
  behind the tentacle, and at small window heights the bottom one overlaps the
  summoning circle's lower edge.

Picked: B and C, each by its own random chance.

## Left to the builder

- Where the roll lives (a module-level roll like the marks' shuffle), and how tests
  force each look so size and flash checks can cover them.
- Exact loop placement and radius (the mockup used radius 10.5, switching from the
  usual curve at step 62 on the bottom tentacle and step 36 on the top one).
- Whether the held takodachi is drawn in front of or behind the summoning circle.
