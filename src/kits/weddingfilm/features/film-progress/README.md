# Your film's progress (WVID-8, showpiece)

| | |
|---|---|
| Feature id | `film-progress` (page `your-film`, unlisted: kept out of search and the sitemap; reached by the link the studio sends) |
| Plan | signature |
| Config | `progress`: `title`, optional `intro`, `source` (`"sheet"`, or `"simulated"` on demos only), `csvUrl`, optional `staleAfterHours` (default 72); `example` (a code to try) on demos only |
| Files | `film-progress.njk`, `.js`, `.css`, `sheet-provider.js`; parsing in `src/kits/weddingfilm/lib/couples.js`; demo data in `src/demo/film-progress-provider.js` |

## The studio's sheet
One row per couple, by code (never names):

    code,wedding,stage,trailer,photographs,note,updated_at
    LARCH0619,2027-06-19,colour,delivered,2027-08-07,Your album proofs are with you.,2026-11-03 09:10

`stage` is `footage`, `edit`, `colour`, `sound` or `delivered`; a word the page doesn't know counts as `footage`, so
the page never says the film is further on than the studio wrote. `trailer` and `photographs` (optional column) are
each `delivered`, the expected date, or blank.

**The sheet is public.** It is published as CSV and its address is in the page, so anyone can download every row.
That's why it holds codes, dates and stages only: never names, and never links. A sheet with a link in any cell
(`://`, `www.` or a web address; an email address such as hello@studio.example counts too) is refused as unreadable, for every couple until it's removed, so a film or gallery link can't leak by mistake. The studio
sends the film and gallery to the couple directly (WhatsApp or email); the page says so. Keep notes general
("Your album proofs are with you"), never personal.

## How it works
The studio sends `…/your-film.html#LARCH0619`; the code after `#` never reaches a server. The couple see their
wedding date, five stages on one line (done, now, next), the trailer and photographs as delivered or due on a date,
the studio's note, and a line saying the film and photographs arrive directly. The code can also be typed.

## When something is missing or fails
An unknown code, a code shorter than six, an unreadable sheet, a sheet with a link in it, an `updated_at` more than
ten minutes in the future (a typo), or one not updated in `staleAfterHours`: the page says why and shows nothing else.
