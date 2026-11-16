# bridalbeauty-guides

Guide pages for the weddings an artist does: weddings abroad, small weddings, Asian bridal, the bridal party,
editorial and events. Each page has its name very large, its line in italic, a photograph if she has one, then blocks.

| | |
|---|---|
| Plan | Plus (each guide counts as a page against the plan) |
| Config | `guides`: `[{ slug, menu, title, description, intro, photo?, blocks }]` |
| Blocks | `text` { heading?, body }, `facts` { heading?, items: [{ label, value }] }, `quote` { heading, text?, lines, note? }, `looks` { heading?, ids }, `questions` { heading?, items: [{ q, a }] }, `list` { heading?, items }, `photo` { src, width, height, alt, caption? }, `ask` { text, message, label? } |
| Pages | `<slug>.html`; the look's menu lists each by `menu` |

- **Worked examples only point at prices stated once elsewhere**, so a guide can never quote a price the bridal page
  doesn't, or keep an old one when she changes it. A `quote` line is one of `{ "package": "bride:<id>" }`,
  `{ "package": "party:<id>", "count": 2 }`, `{ "package": "extra:<id>" }` (a travel day, a mehndi morning: put the
  price in `packages.extras`, which the bridal page lists), `{ "second": true }` (the second artist's fee from
  `morning.secondArtist`) or `{ "travel": "W1" }` (the fee the travel zones give that district). A line with its own
  `name` or `price` is refused. The sum is worked out at build.
- **Looks come from the library** (`looks` block, ids from `looks.items`), with the same "Ask for this look" message.
- 2 to 16 blocks a page; a slug can't take the kit's own pages (bridal, looks, journal…).
