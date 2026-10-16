# REMI art style guide

Goal: a believable classic Game Boy (DMG) with a Flash-game party mood. If it would not fit on a 1989 LCD, it does not go on the screen.

## Screen palette (only these 4 colours inside the LCD)

| Idx | Hex | Use |
|---|---|---|
| 0 | `#0f380f` | outlines, text, darkest shapes |
| 1 | `#306230` | shadows, mid fills, UI bars |
| 2 | `#8bac0f` | light fills, highlights |
| 3 | `#9bbc0f` | LCD background |

No other colours on the canvas. No alpha, no gradients, no glow. Flash/invert effects swap palette indexes (e.g. 0 and 3), never add colours.

## Body colours (sampled from assets/reference-gameboy.png)

| Part | Hex |
|---|---|
| Body light grey | `#d6d6d6` |
| Body highlight | `#fafafa` |
| Body shade grey | `#ababab` |
| Bezel / D-pad dark grey | `#808080` |
| Outline | `#000000` |
| A/B buttons magenta | `#e94567` (shade `#ba3b64`, highlight `#fc9dbd`) |
| Power dot red | `#cd466f` |
| Reference LCD green (for comparison only) | `#95ab58` |

The shell is CSS and may use these greys and magentas. Keep the same hard 1 px dark outline and chunky pixel shading as the reference. No soft shadows, no blur.

## Pixel grid rules

- Screen is 160x144 internal pixels. Never draw at another resolution.
- Scale only by integer factors (2x, 3x, 4x ...). Pick the biggest that fits the viewport. Use `image-rendering: pixelated`.
- Everything snaps to whole pixels. No half-pixel positions, no rotation, no sub-pixel movement.
- 1 px outlines in colour 0. No anti-aliasing, no smoothing, no gradients, no drop shadows (use a 1 px colour-1 offset if depth is needed).
- Sprites live on a 16x16 grid (small) or 32x32 (logo). Leave a 1 px transparent margin where possible.
- Draw every sprite with its own colour-0 outline so it reads on any background index.
- Layout: 8 px tile grid, 1 tile = 8x8. The screen is 20 x 18 tiles. Text rows sit on tile rows.
- Centre titles. Use 1 px lines for dividers. Prefer fades and palette steps over boxes.

## Bitmap font

- 5x7 glyphs on a 6x8 cell (1 px letter gap, 1 px line gap). Uppercase A-Z, 0-9 and `! ? . , : - + / ' %` only.
- No lowercase. No italics, bold or scaling by non-integers. Big text = the same font at exactly 2x.
- Always colour 0 on colour 3 (or 3 on 0 when inverted). Never colour 2 for text, it is too faint.
- Max 14 characters per line (84 px at 6 px per char, leaves a 38 px side margin each side on 160). Break longer copy over lines.
- Balanced lines, no one-word orphans.

## Animation rules

- Frame based: 2 to 4 frames per animation, fixed frame time (about 100 to 150 ms). No tweening, no easing curves.
- Snappy: things appear in 1 step, move in whole-pixel jumps, and hold. Shake = 2 frame offset of 1 to 2 px.
- Allowed effects: blink (toggle every 2 to 4 frames), palette invert flash (1 to 2 frames), step wipe, drop-in with a bounce of 1 to 2 steps, scrolling by 1 or 2 px per frame.
- Boot logo: REMI drops in from the top in steps, bounces once, then holds with "PRESS START" blinking.
- Wheel/roulette: constant steps that slow down by stretching frame time, with one tick per slice.
- Nothing should loop faster than 8 flashes per second.

## Sound style

- Web Audio square waves only (optionally 25 percent pulse via a custom periodic wave). No samples, no reverb.
- Short: beeps 40 to 120 ms, jingles under 1 second.
- Event map: move = high short blip, confirm = two rising notes, spin tick = very short low click, win = rising 3 note arpeggio, "drink" = descending 4 note jingle, bomb tick = dry blip that speeds up, explosion = noise-like fast random pitch burst.
- Master volume low (about 0.1 gain). Audio unlocks on first START press.

## Tone of on-screen copy

- ALL CAPS, short, cheeky. Max 14 characters per line.
- Imperative and punchy: `P3 DRINKS 2`, `SIP HAPPENS`, `NICE ONE!`, `TOO SLOW!`, `BOTTOMS UP`.
- Results always name the player and the amount: `P2 GIVES 3`.
- No emoji, no unicode glyphs, no long sentences, no em-dashes. Humour comes from brevity, not extra words.
- Never shame or push a player to drink more. Water and skipping are always allowed (see GAMES.md).

## Sprite list (assets/)

Source of truth is `assets/build-sprites.py` (ASCII pixel maps). Re-run it to regenerate.

| File | Size | Notes |
|---|---|---|
| sprites.svg | 160x52 | all sprites on one sheet, groups have ids |
| sprites/logo.svg | 32x32 | REMI boot logo |
| sprites/mug.svg | 16x16 | beer mug |
| sprites/bomb.svg | 16x16 | BOMB minigame |
| sprites/card-back.svg | 16x16 | HIGHER OR LOWER |
| sprites/skull.svg | 16x16 | "DRINK" result |
| sprites/player-1..8.svg | 16x16 | one per player: hair, spikes, cap, beanie, bob, mohawk, shades, crown |

To use in canvas, load the SVG into an `Image` and `drawImage` at integer scale with `imageSmoothingEnabled = false`.
