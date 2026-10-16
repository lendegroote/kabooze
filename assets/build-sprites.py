#!/usr/bin/env python3
"""Builds assets/sprites.svg (sheet) + assets/sprites/*.svg from ASCII pixel maps.
Digits 0-3 = DMG palette dark to light, '.' = transparent. Run: python3 assets/build-sprites.py"""
import os
PAL = ['#0f380f', '#306230', '#8bac0f', '#9bbc0f']
HERE = os.path.dirname(os.path.abspath(__file__))

MUG = """
................
..0000000000....
..0333333330....
..0333333330000.
..0222222220..0.
..0222222220..0.
..0221222220..0.
..0222212220..0.
..0222222220..0.
..0222222220000.
..0222222220....
..0222222220....
..0222222220....
..0222222220....
..0000000000....
................""".split()

BOMB = """
...........3.3..
............3...
...........00...
..........0.....
.......0000.....
....00000000....
...0111111110...
..011311111110..
..013111111110..
..011111111110..
..011111111110..
..011111111110..
...0111111110...
....00000000....
................
................""".split()

SKULL_CORE = """
....00000000....
...0333333330...
..033333333330..
..033333333330..
..030033330030..
..030033330030..
..033333003333..
...0333333330...
....03030303....
....00000000....""".split()
SKULL = ['.' * 16] * 3 + SKULL_CORE + ['.' * 16] * 3

def card():
    g = [['.'] * 16 for _ in range(16)]
    for y in range(1, 15):
        for x in range(3, 13):
            edge = y in (1, 14) or x in (3, 12)
            inner = y in (2, 13) or x in (4, 11)
            g[y][x] = '0' if edge else '3' if inner else ('1' if (x + y) % 2 == 0 else '2')
    return [''.join(r) for r in g]

BASE = """
................
................
................
.....000000.....
....02222220....
....02222220....
....02022020....
....02222220....
....02200220....
.....000000.....
......0220......
....00000000....
...0111111110...
..011111111110..
..011211121110..
..000000000000..""".split()
# per-player hair/hat rows 0-5 overrides, plus shirt row 14 accent
HAIR = [
 {2:"....00000000....",3:"...0000000000...",4:"...0022222200..."},
 {1:"....0.0..0.0....",2:"....0.0000.0....",3:"....00000000....",4:"....01222210...."},
 {2:"....00000000....",3:"..000000000000..",4:"....02222220...."},
 {0:".......00.......",1:"......0330......",2:"....00000000....",3:"....01111110....",4:"....02222220...."},
 {2:"....00000000....",3:"...0000000000...",4:"...0002222000...",5:"...0002222000...",6:"...0002022020..."},
 {0:".......00.......",1:".......00.......",2:"......0000......",3:".....000000.....",4:"....02222220...."},
 {6:"....00000000....",},
 {1:"....0.0..0.0....",2:"....00000000....",3:"....03333330....",4:"....02222220...."},
]
def player(i):
    g = [list(r) for r in BASE]
    for y, row in HAIR[i].items():
        assert len(row) == 16, (i, y, row)
        g[y] = list(row)
    if i == 6:  # glasses over eyes
        g[6] = list("....00000000....")
    if i == 4:
        g[6] = list("....02022020....")
    if i % 2:
        g[13] = list("..012121212120..")
    return [''.join(r) for r in g]

LOGO_LETTERS = {
 'R': ["11110","10001","10001","11110","10100","10010","10001"],
 'E': ["11111","10000","10000","11110","10000","10000","11111"],
 'M': ["10001","11011","10101","10101","10001","10001","10001"],
 'I': ["11111","00100","00100","00100","00100","00100","11111"],
}
def logo():
    g = [['.'] * 32 for _ in range(32)]
    for x in range(2, 30):
        g[8][x] = '1'; g[22][x] = '1'
    for x in range(4, 28):
        g[9][x] = '2'; g[21][x] = '2'
    x0 = 4
    for ch in "REMI":
        for dy, r in enumerate(LOGO_LETTERS[ch]):
            for dx, c in enumerate(r):
                if c == '1':
                    g[12 + dy][x0 + dx] = '0'
        x0 += 6
    return [''.join(r) for r in g]

SPRITES = {'logo': logo(), 'mug': MUG, 'bomb': BOMB, 'card-back': card(), 'skull': SKULL}
for i in range(8):
    SPRITES[f'player-{i+1}'] = player(i)

def rects(rows, ox=0, oy=0):
    out = []
    for y, r in enumerate(rows):
        x = 0
        while x < len(r):
            c = r[x]
            if c == '.':
                x += 1; continue
            x2 = x
            while x2 < len(r) and r[x2] == c:
                x2 += 1
            out.append(f'<rect x="{ox+x}" y="{oy+y}" width="{x2-x}" height="1" fill="{PAL[int(c)]}"/>')
            x = x2
    return '\n'.join(out)

def svg_one(name, rows):
    w, h = len(rows[0]), len(rows)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w*8}" height="{h*8}" viewBox="0 0 {w} {h}" '
            f'shape-rendering="crispEdges" style="image-rendering:pixelated"><title>{name}</title>\n{rects(rows)}\n</svg>\n')

for name, rows in SPRITES.items():
    assert all(len(r) == len(rows[0]) for r in rows) and len(rows) == len(rows[0]), (name, [len(r) for r in rows])
    open(os.path.join(HERE, 'sprites', name + '.svg'), 'w').write(svg_one(name, rows))

# sheet: logo 32x32 left, others on a 16px grid with 4px gutter
W, H = 160, 36 + 16
parts = [f'<rect width="{W}" height="{H}" fill="{PAL[3]}"/>']
parts.append(f'<g id="logo">{rects(SPRITES["logo"], 0, 0)}</g>')
order = ['mug', 'bomb', 'card-back', 'skull']
for k, n in enumerate(order):
    parts.append(f'<g id="{n}">{rects(SPRITES[n], 36 + k * 20, 0)}</g>')
for i in range(8):
    parts.append(f'<g id="player-{i+1}">{rects(SPRITES[f"player-{i+1}"], (i % 8) * 20, 36)}</g>')
sheet = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W*6}" height="{H*6}" viewBox="0 0 {W} {H}" '
         f'shape-rendering="crispEdges" style="image-rendering:pixelated">\n' + '\n'.join(parts) + '\n</svg>\n')
open(os.path.join(HERE, 'sprites.svg'), 'w').write(sheet)
print('ok', len(SPRITES), 'sprites')
