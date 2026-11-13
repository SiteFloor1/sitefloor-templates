# Range pages (weddings, celebrations, corporate, dessert tables)

| | |
|---|---|
| Feature ids | `weddings-page`, `celebrations-page`, `corporate-page`, `dessert-tables-page` (pages `weddings`, `celebrations`, `corporate`, `dessert-tables`) |
| Plan | signature (needs `commissions`) |
| Config | `ranges.weddings`, `ranges.celebrations`, `ranges.corporate`, `ranges.dessertTables`: `title`, `intro`, `kinds` (which cakes from `pieces.items` it shows), `prices[]` (`label`, `from` in whole pounds), optional `notes[]`, `photo`, `topic` (shows the `questions` with that topic) |
| Files | `range.njk` (shared), one small `.njk` and `.css` per page; the shared styles are in `src/kits/cakes/kit.css` |

Each range page shows the studio's own prices for the range, its cakes of those kinds, notes (minimum order,
invoicing a company, pieces per guest) and the questions on that topic, then Order a cake (or a message).
Validation refuses a range with no cake of its kinds and no photo.
