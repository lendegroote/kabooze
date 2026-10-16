# KABOOZE

A savage pass-the-phone party drinking game with a hidden bomb, shown on a CRT-green Game Boy. 2 to 8 players, one phone, no build step (vanilla HTML/CSS/JS).

Play: https://lendegroote.github.io/kabooze/

Water counts. Know your limit.

## Flow (v3)

1. TITLE, START, HOW TO PLAY.
2. SETUP A: add players (name + selfie). The selfie opens the camera with a live green dither preview (falls back to a photo picker if the camera is not available).
3. SETUP B: the phone goes around. Each player gets a savage WHO-question about the table and taps one other player. Reroll button for the question. Nobody sees whose answer is whose.
4. ROUND 1 WHO SAID IT: the screen shows "question > picked player". The current player guesses who gave that answer. Right: that person drinks 1 and plays next. Wrong: guesser drinks 1 and is locked out for 3 seconds (the bomb keeps ticking).
5. ROUND 2 MOST LIKELY TO: 3 prompts, everyone votes in private, bar chart reveal, the top player drinks as many sips as votes.
6. Loop with new questions, or finish with the drinks tally.
7. THE BOMB: one hidden fuse (random 90 to 180 s) runs through the whole game. The top bar shows a mm:ss countdown (turns red-orange and blinks in the last 10 s). The tick speeds up as the fuse burns and the music speeds up a bit. When it blows, the holder of the phone gets KABOOM and the ROULETTE (personal only: DRINK 2/3, SHOT, TRUTH, DARE, CONFESS, DOUBLE NEXT ROUND, SAFE, and a rare 4% BUY A ROUND).

## Controls

On the phone only MENU, BACK, FULL and text inputs (and the camera SNAP button) are touch. Everything in the game is the on-screen Game Boy: D-pad moves a highlighted option (inverted colours + blinking arrow), A confirms, B goes back. Big invisible hit areas, haptic tick on press.

| Game Boy | Keyboard |
|---|---|
| D-pad | Arrow keys |
| A | X |
| B | Z |
| Menu | Enter |
| SFX on/off | Shift |

The menu has RESUME, RESTART, GO BACK TO START (asks "SURE? GAME IS LOST", players stay saved), SFX and MUSIC toggles. FULL = Fullscreen API; on iPhone Safari it shows a tip to add the page to the home screen (manifest + apple meta make it launch full screen).

## Run locally

```
python3 -m http.server 8080
```

Open http://localhost:8080. Camera needs https or localhost (GitHub Pages is https).

## Files

```
index.html, style.css          shell, CRT + Game Boy styling, retro desk background
js/app.js                      all screens, bomb fuse, roulette, controls, camera
js/data.js                     questions, prompts, roulette slices, truths, dares
js/audio.js                    Web Audio SFX + original oompah chiptune loop
js/avatar.js, js/font.js       selfie to green dither avatar, 5x7 bitmap font
manifest.json, assets/         web app manifest, icons, pressstart2p font, references
briefs/                        agent briefs (manager)
```

js/main.js, js/game.js and data/questions.js are leftovers of the old Snake version and are unused.
