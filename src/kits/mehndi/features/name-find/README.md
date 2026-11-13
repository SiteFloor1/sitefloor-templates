# Name find

| | |
|---|---|
| Feature id | `name-find` |
| Plan | starter and above |
| Config | `hero.palm` (a photo of a real finished hand, `{ src, width, height, alt }`), `hero.find` (`x`, `y`: where the name is, percent across and down the photo; `width`: the ring's width in percent; `line`: what "Show me" says, e.g. "There, across the base of the fingers.") |

## How it works
The palm sits in a case (`partials/name-case.njk`; the look places it, in its hero and on the personal details page).
A magnifier follows the pointer or the finger (2.6× the photo, drawn from the same image, so nothing else loads).
"Show me" rings the name and swaps the line under the buttons to `hero.find.line`; pressed again, it hides it.
Keyboard: the case takes focus and shows the magnifier over the name.

## When something is missing or fails
Without JavaScript the photo shows on its own, with its alt text, and "Show me" stays hidden. The ring's place is the
artist's own: check it on a phone after changing the photo.

Registered in `src/kits/mehndi/kit.js`. Add to a site by listing the id in `features` in its `site.json`.
