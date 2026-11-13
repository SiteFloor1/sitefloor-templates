# Chair board (barber)

| | |
|---|---|
| Feature id | `chair-board` |
| Plan | signature and above. **Optional:** only for shops that take walk-ins and will keep it updated. Shops that book everything through Booksy or Fresha don't need it |
| Config | `staff`, `chairBoard` (`source`: `sheet` with `csvUrl`, `staleAfterMinutes`), `sections.chairs` |
| Files | `chair-board.njk`, `chair-board.css`, `chair-board.js` |

## How it works
`chair-board.js` asks a provider for data every minute. Client sites use `sheet-provider.js`, which reads the shop's published Google Sheet (columns `barber,status,free_at,updated_at`). Demo sites use the simulated provider in `src/demo/`. It shares the board with build-your-cut (earliest slot).

## The sheet
Columns `barber,status,free_at,updated_at`. `updated_at` can be ISO with an offset (`2026-10-22T15:12:00Z`) or the shop's local time as a UK-locale Google Sheet writes it (`22/10/2026 16:12:00`). US-style dates are rejected, not guessed.

Each barber's row is judged on its own:
- `free`: live for `staleAfterMinutes` (default 20) after it was set.
- `busy` with `free_at`: live until `free_at` (up to 2 hours after it was set), so a barber sets it once when starting a cut and doesn't touch it mid-cut. A `free_at` that has passed is never offered.
- `off`: live for the rest of the day it was set.

Anything older, from before today, in the future, or unreadable shows as "No live update" with no time.

## When something is missing or fails
Fails closed: if the sheet is unreachable, slow (6 s), has the wrong columns or no live rows at all, the board is hidden and a "message us" fallback shows. Times are never shown unless current.

## Setting it up for a shop (Google Form, about 15 minutes, on the shop's own Google account)
Barbers update their card from a form on their phone. The form stamps the time itself, so nobody types a timestamp.
1. Google Forms → blank form, titled "Chair board".
2. Question **Barber**: multiple choice, one option per barber, spelled exactly as in `staff` in `site.json`.
3. Question **Status**: multiple choice: `Free`, `Busy`, `Off today`.
4. Question **Free at**: Time (not required). Answered only when busy: "free again at".
5. Responses tab → Link to Sheets → create a new spreadsheet.
6. In that spreadsheet: File → Share → Publish to web → choose the "Form responses 1" tab and "Comma-separated values (.csv)" → Publish. Copy the link.
7. Put the link in `chairBoard.csvUrl`. Send each barber the form link to add to their phone's home screen.
8. Test before launch: submit "Free" for one barber and check the live site within 5 minutes (Google can take a few minutes to republish).

Each barber's newest answer counts. "Free" lasts 20 minutes (`staleAfterMinutes`); "Busy" lasts until its time; "Off today" lasts the day. Each card shows when it was last updated.

## Notes
Setting up the sheet for a client: File → Share → Publish to web → the sheet tab → CSV, then paste the link into `chairBoard.csvUrl`. Barbers update their row from their phone.

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.
