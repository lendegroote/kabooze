# REMI games and rules

Pass-and-play on one device. 2 to 8 players (P1 to P8). Player order is fixed, one roulette spin per turn.

## House rules (show once at boot or in the README)

- Drink responsibly. 1 drink amount = 1 sip, nobody has to finish a glass.
- Water counts. Sipping water is a valid drink.
- Skip is always allowed: SELECT returns to the roulette, and any player can say "skip" and pass without penalty.
- Stop when you are done. Never push anyone. Not for under-age players.
- The device holder reads the result out loud.

## Roulette

A spin lands on one slice. Slices are equally likely (10 slices, 4 minigames plus 6 cards).

| Slice | Effect |
|---|---|
| QUICK DRAW | minigame |
| STOP THE BAR | minigame |
| HIGHER OR LOWER | minigame |
| BOMB | minigame |
| DRINK 2 | active player drinks 2 |
| GIVE 3 | active player hands out 3 sips, split as they like |
| EVERYONE DRINKS | all players drink 1 |
| WATERFALL | everyone starts drinking, active player first; each next player may stop only after the one before stopped |
| MAKE A RULE | active player invents a rule until the next MAKE A RULE comes up (break it = drink 1) |
| SAFE! | nothing happens, relief |

Controls: A spins, A continues, B on a result goes back.

## Minigames

All run 10 to 30 seconds and end with a result line like `P3 DRINKS 2`.

### QUICK DRAW
- 2 players: the active player (A button) vs the next player (B button).
- Wait a random 2 to 5 seconds. When "DRINK!" flashes, press first.
- First press wins, loser drinks 2.
- Pressing early = that player drinks 2 (false start).

### STOP THE BAR
- A marker sweeps back and forth over a bar with a small target zone.
- Press A to stop it.
- In the zone: safe. Dead centre (perfect): give 2. Miss: drink 2.

### HIGHER OR LOWER
- A card from 1 to 13 is shown. D-pad up = next is higher, down = lower.
- Right: streak +1 and the next card comes. Equal number counts as wrong for lower and higher alike.
- Wrong: drink as many sips as the streak (minimum 1). Streak ends.
- Active player may stop with B after any right guess and give the streak count as sips instead of risking it (idea, only if p2 adds it).

### BOMB
- A hidden countdown of 5 to 20 seconds ticks (tick speeds up near the end).
- The holder presses A and passes the device to the next player.
- Whoever holds it when it explodes drinks 3.

## Drink amount summary

| Event | Amount |
|---|---|
| DRINK 2 | 2 |
| GIVE 3 | give 3 |
| EVERYONE DRINKS | 1 each |
| WATERFALL | until the chain ends |
| QUICK DRAW loss or false start | 2 |
| STOP THE BAR miss / perfect | 2 / give 2 |
| HIGHER OR LOWER wrong | streak (min 1) |
| BOMB explode | 3 |
| MAKE A RULE broken | 1 |

## 6 ideas for later minigames

1. **TAP RACE**: mash A for 5 seconds, lowest count drinks 2.
2. **MEMORY SIMON**: repeat a growing chirp and colour sequence with the D-pad, first mistake drinks.
3. **ODD ONE OUT**: grid of identical sprites with one different, first to find it with the cursor gives 2.
4. **NEVER HAVE I**: show a cheeky prompt, anyone who did it drinks 1 (copy deck of 50 prompts).
5. **SLOT MACHINE**: 3 reels of mugs/skulls/bombs, 3 skulls = everyone drinks, 3 mugs = give 5.
6. **RHYME TIME**: show a word, players take turns saying rhymes while a hidden timer runs, whoever stalls drinks 2.
