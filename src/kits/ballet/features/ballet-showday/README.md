# Show day by code

| | |
|---|---|
| Feature id | `ballet-showday` |
| Plan | signature |
| Config | `showDay`: `source` ("sheet", or "simulated" on demos), `csvUrl`, `staleAfterDays?` (default 14), `show?` (a show id), `text`, `message`, `photo?`; `showDayPage` `{ kicker, title, intro }` |
| Files | `ballet-showday.njk` (the show-day page), `ballet-showday.css`, `ballet-showday.js`, `sheet-provider.js`; demo rows in `src/demo/ballet-showday-provider.js` |

## How it works
The school keeps one sheet, a row per class, and gives each class's parents its code (in the class WhatsApp group):

```
code,class,arrive,door,costume,hair,collect,notes,updated_at
LB-TUE,Little ballet (Tuesday),1.15pm,Stage door on Mill Lane,Pink tutu (we bring it),Bun,4.30pm at the foyer,,2026-11-30 18:00
```

The parent types the code; the page shows arrival, stage door, costume, hair, collection and notes for that class.

## Rules
- A code, not a password: the published sheet can be read by anyone with its address. Never put children's names,
  medical notes or anything private in it.
- Fails closed: an unreadable sheet or a missing column says the sheet can't be read and points to the school. Each
  row is judged by its own `updated_at` (date and time): unreadable, more than ten minutes in the future or older than
  `staleAfterDays`, and that class's code isn't found, however fresh the other rows are.
