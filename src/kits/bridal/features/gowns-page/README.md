# gowns-page (bridal kit, Plus)

Every gown large on its own page (`gowns.html`), and four of them on the home page (`home: true`, the first four).
The finder narrows the rail by silhouette, neckline, sleeve and designer, offering only choices the salon's gowns
use and disabling any that would leave nothing. "Ask to try" sends that gown on WhatsApp. A designer's link
(`gowns.html#studio-morrell`) opens with that designer chosen. Without JavaScript, every gown shows.

```json
"gownsPage": { "kicker": "The gowns", "title": "Every gown in the salon", "intro": "…" },
"gowns": {
  "message": "Hello Wexley.",
  "items": [{ "id": "ottilie", "name": "Ottilie", "house": "studio-morrell", "fabric": "Silk mikado", "silhouette": "ballgown",
    "neckline": "strapless", "sleeve": "none", "price": 6400, "home": true,
    "views": [{ "label": "Front", "src": "img/g-ottilie-front.webp", "width": 900, "height": 1125, "alt": "…" }] }]
}
```
Words: `silhouette` (column, a-line, ballgown, fit-and-flare, sheath, two-piece), `neckline` (strapless, square,
v-neck, high, bateau, scoop, off-shoulder, sweetheart), `sleeve` (none, straps, short, long). `price` in whole
pounds, or `null` for "Price on request". Every gown, house and price is the salon's own. Home heading:
`sections.gowns`. Extra views power the mirror (Signature).
