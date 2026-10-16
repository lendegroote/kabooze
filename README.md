# KABOOZE

A browser party drinking game styled as a classic Game Boy, with a Flash-game vibe. One device is passed around the table (pass-and-play), for 2 to 8 players. Roulette picks the next thing: a minigame (QUICK DRAW, STOP THE BAR, HIGHER OR LOWER, BOMB) or a card (DRINK 2, GIVE 3, WATERFALL ...). Drink responsibly, water counts, skipping is always fine.

## Run

```
python3 -m http.server 8080
```

Open http://localhost:8080 (vanilla HTML/CSS/JS, no build step).

## Controls

| Game Boy | Keyboard | Touch |
|---|---|---|
| D-pad | Arrow keys | tap D-pad |
| A | X | tap A |
| B | Z | tap B |
| START | Enter | tap START |
| SELECT (back to roulette) | Shift | tap SELECT |

## Files

```
index.html, style.css, js/   the app (owner: p2 build agent)
assets/                      art: reference-gameboy.png, sprites.svg, sprites/*.svg,
                             build-sprites.py (regenerates sprites)   (owner: p3)
docs/STYLE.md                art style guide                          (owner: p3)
docs/GAMES.md                game rules, slices, house rules, ideas   (owner: p3)
README.md                                                              (owner: p3)
briefs/                      agent briefs (manager)
```

## Who owns what

- Manager agent: briefs, review, final say.
- p2 (build): `index.html`, `style.css`, `js/`.
- p3 (style + docs): `docs/`, `README.md`, `assets/` (except `reference-gameboy.png`).

Style rules live in `docs/STYLE.md`, game rules in `docs/GAMES.md`.

## Concept v2 (KABOOZE)

- Flow: title, PLAYERS count (2-8), per player setup (name, secret answer to a random question, selfie turned into an 8-bit avatar), ROUND 1 SNAKE WHO-IS-IT, ROUND 2 stub (coming soon).
- Snake: one shared snake, slow. Eat the apple to get a random fact (not your own), steer into the avatar you think owns it. Right: that player drinks 1, snake grows, PASS TO <NAME>. Wrong: NOPE, keep steering. Wall or self hit: drink 2, snake resets, pass.
- The bomb: one hidden fuse (30-90 s) runs through the whole game, ticks speed up near the end. Whoever holds the phone when it blows gets the CHALLENGE ROULETTE (12 slices in `data/questions.js`: cards plus the four minigames), then the game continues with a new fuse. The minigames are only reachable this way.
- Controls: D-pad / arrow keys or swipe on the screen to steer. A = confirm, B = back (on setup screens, in-game B asks "QUIT GAME?"), tap "< BACK" on screen.
- Screen: 112x100 px, 16-colour palette, per-player colours on avatars. Rendering pauses when the tab is hidden, idle screens redraw only on input or at 2-4 fps.
- Files added: `js/game.js` (flow, snake, bomb), `js/avatar.js` (selfie to avatar), `data/questions.js` (25 questions, 12 roulette slices).
