# Your week (PIL-6)

| | |
|---|---|
| Feature id | `your-week` |
| Plan | plus and above (needs `timetable`) |
| Config | none; uses `timetable` and the studio's address |
| Files | `your-week.njk`, `.js`, `.css`; the calendar file is made by `weekIcs` in `src/kits/pilates/lib/classes.js` |

## How it works
Each class in the week gets a tick box. "Add to my calendar" saves one `.ics` file with every ticked class at the
studio's own time (time zone included) and its address. It books nothing; the Book links do that.

## When something is missing or fails
Without JavaScript there are no tick boxes and the button stays disabled.
