# Today's board as a picture

| | |
|---|---|
| Feature id | `stalls-board` |
| Plan | signature |
| Config | uses `menu` (with `stalls-menu`, which it needs) |

"Save the board" under the menu draws the board as a 1080 × 1350 PNG (the shape Instagram and TikTok show whole): the
stall's name, the chosen or next stop, up to six items with prices and allergen codes, today's sold-out lines and the
allergen key, in the page's own fonts and colours (`--board-*` tokens from the look). It downloads to the phone, ready
to post. Nothing leaves the browser. The button sits in the menu's markup; this folder holds the script.

Registered in `src/kits/stalls/kit.js`.
