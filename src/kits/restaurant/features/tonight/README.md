# Right now (live board)

| | |
|---|---|
| Feature id | `tonight` |
| Plan | plus and above |
| Config | `tonight` (same sheet as `specials`); `sections.tonight` |
| Files | `tonight.njk`, `tonight.css`, `tonight.js` |

## How it works
Walk-in tables from the sheet's `tables` row (`free`, `few`, `full`, `bar`), with its note and when it was updated;
**hidden once it's older than `staleAfterMinutes`**, so an old "free now" is never shown. The kitchen line (last orders)
and an "On our way" WhatsApp with the party size. Rows sit on fixed heights, so late data can't move the page.
