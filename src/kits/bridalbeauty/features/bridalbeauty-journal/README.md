# bridalbeauty-journal

The artist's own pieces (skin before the day, making makeup last, choosing a look), set like a magazine's contents
page; each piece is its own page with the same blocks as the guide pages.

| | |
|---|---|
| Plan | Plus (the journal counts as one page) |
| Config | `journal`: `{ title, intro, items: [{ slug, title, line, minutes?, photo, blocks }] }` |
| Pages | `journal.html` and `journal-<slug>.html` |

- `line` is the sentence search results show (up to 160 characters) and the piece's standfirst.
- Blocks as in `bridalbeauty-guides`. Skin advice is preparation for makeup, never treatment: say when to ask a
  clinician, as the skin page does.
- No dates on pieces: the demo would date, and a client's undated piece doesn't look abandoned.
