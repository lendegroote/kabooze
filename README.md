# KABOOZE

Een gemeen Vlaams drinkspel voor aan tafel, met een verborgen bom. 2 tot 8 spelers, 1 gsm, geen build (gewone HTML/CSS/JS). Groen CRT-scherm in een dun pixel-Game Boy-kader.

Speel: https://lendegroote.github.io/kabooze/

Water telt mee. Ken je limiet.

## Spelverloop

1. TITEL: START, HOE SPEEL JE.
2. SPELERS: naam + selfie (camera met live groene dither, of fotokiezer als de camera niet lukt).
3. GEHEIMEN (per speler, in het geheim, de gsm gaat rond): duid iemand aan bij een vraag, biecht 1 ding (overslaan mag) en neem 1 foto met een willekeurige opdracht (overslaan mag). Geheimen en foto's blijven alleen in de localStorage van dit toestel.
4. RONDES in willekeurige volgorde, elk ongeveer 5 beurten: WIE ZEI DIT, WIE ZOU HET EERST, HETE PATAT, DIT OF DAT, IK HEB NOG NOOIT, WIE HEEFT DIT GEBIECHT, WIENS FOTO IS DIT. Fout raden = 1 drinken + 3 seconden geblokkeerd, juist raden = die persoon drinkt 2 (of 1) en krijgt de gsm.
5. DE BOM: 1 verborgen lont (90 tot 180 s), met een mm:ss-aftelling bovenaan (rood en knipperend in de laatste 10 s). De lont staat stil terwijl iemand typt, foto's neemt of in het geheim stemt, en loopt bij het doorgeven en raden. Bij KABOOM draait de houder van de gsm aan het ROULETTE-wiel (alleen voor jezelf, 4% kans op TRAKTEER EEN RONDE).
6. Na alle rondes: nog een ronde of stoppen (tabel met slokken).

## Bediening

Alles is aanraken. Op laptop mag het toetsenbord: pijltjes + X (bevestigen), Z (terug), Enter (menu), Shift (geluid). Het menu (bovenaan) heeft DOORGAAN, OPNIEUW BEGINNEN, TERUG NAAR START, GELUID, MUZIEK, INHOUD en VOLLEDIG SCHERM (op iPhone: zet de pagina op je startscherm, dan start hij volledig scherm via manifest.json).

## Inhoud

`data/content.json` is de bron (stabiele ids, Vlaams, HOOFDLETTERS). `js/content-fallback.js` is een gegenereerde kopie. Aanpassen: `python3 scripts/build-content.py`. `content.html` (menu, INHOUD) toont alles, met zoeken en VERWIJDER/ONGEDAAN per item. Verwijderde ids staan in localStorage `kabooze_removed`; KOPIEER VERWIJDERDE LIJST om ze definitief uit de repo te schrappen.

## Lokaal draaien

```
python3 -m http.server 8080
```

Camera werkt alleen via https of localhost (GitHub Pages is https).

## Bestanden

```
index.html, style.css          app-shell, CRT + Game Boy-kader, bureau-achtergrond
js/app.js                      alle schermen, bom, roulette, camera, rondes
js/data.js                     laadt content (fetch + inline fallback), verwijderde ids
js/content-fallback.js         gegenereerd uit data/content.json
js/audio.js                    Web Audio effecten + oorspronkelijke chiptune
js/avatar.js, js/font.js       selfie en foto naar groene dither, 5x7 bitmaplettertype
content.html, js/content.js    inhoudslijst met zoeken en verwijderen
manifest.json, assets/         web app manifest, icoontjes, lettertype
```

js/main.js, js/game.js en data/questions.js zijn restanten van de oude Snake-versie en worden niet gebruikt.
