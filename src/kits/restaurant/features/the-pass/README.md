# The Pass (plates up close)

| | |
|---|---|
| Feature id | `the-pass` |
| Plan | signature (add-on on any plan) |
| Config | `pass`: `dishes` (ids in order), `note?`; each dish's `pass`: `src`, `thumb?` (a small square copy for the rail), `width`, `height`, `alt`, `notes` (1–6 `{ x, y, text }`, x and y from 0 to 1 across and down the photo); `sections.thePass` |
| Files | `the-pass.njk`, `the-pass.css`, `the-pass.js` |

## How it works
The restaurant's photos of its plates, round under a warm lamp, with numbered pins on what's on the plate. Beside
each, a kitchen ticket: the dish, price, the pinned parts, diet marks, spice, the allergens and what to drink with it.
Pins and ticket lines light up together. With The Table's group it says who can eat it.

Only the first plate's photo loads with the page; the others load when picked, and the rail uses small thumbnails.
Photos must be the restaurant's own (or properly licensed); `note` says where they come from when they aren't.
