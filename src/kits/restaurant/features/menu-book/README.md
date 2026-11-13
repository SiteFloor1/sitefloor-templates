# The Menu Book (Plus)

A bound menu on the page (a leather cover with the restaurant's name in foil). Tap it, or any "Open the menu" link, and it
opens full screen and turns its pages like paper: drag a page across, swipe, tap the arrows or use the arrow keys. One page
at a time on a phone, a two-page spread on wide screens. The cover opens by itself; with "reduce motion" pages change
without turning.

Pages are set from `menu` (a welcome page with the sittings, the restaurant's statement and the diet key, then each
sitting's sections, then the drinks and a back cover with the address), laid out in the browser so they fit the screen.
Today's specials (from `specials`/`tonight`) appear on a slip inside the cover. A restaurant that has its own designed
menu can use that instead: `menuBook.pages`, one picture per page.

```json
"menuBook": {
  "cover": { "title": "Saffron & Ash", "subtitle": "Charcoal grill · Manchester" },
  "pages": [{ "src": "img/menu-1.webp", "width": 1240, "height": 1754, "alt": "Page 1 of the menu: starters" }]
}
```
`cover` and `pages` are optional. Section copy: `sections.menuBook` (`kicker`, `title`, `intro`). If `menu-pdf` is on, the
PDF download sits beside "Open the menu".

**Polaroids.** A dish with a photo (`pass` from The Pass, or its own `photo: { src, width, height, alt }`) has a small
camera beside its name in the book. Tap it (or Enter on it) and the photo drops onto the page like a polaroid, at a slight
angle, captioned with the dish; tap anywhere or press Escape to lift it away. The photo loads only then.

**The season on the cover.** With `seasonal` on, the active season's name is foil-stamped on the cover and the look
recolours the leather for its tint (Maison and Carte: deep red and gold for `festive`, brown and amber for `autumn`, and so
on). Both are set by the inline head script before the first paint, so the cover never changes colour in front of you.

**In the hero.** A look can put the closed book in its hero (`heroParts: ["menu-book"]`, Maison does); the hero then
includes this file with `mbHero` set, which renders the book alone, and the home page doesn't show the section again.

Without JavaScript the book is a link to the menu (the menu page if `menu-page` is on). Open at `#menu-book` to start
with the book open. Nothing loads until it's opened, apart from the cover (CSS and an SVG grain).
