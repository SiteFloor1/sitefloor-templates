# Classes (GYM-1)

| | |
|---|---|
| Feature id | `gym-timetable` |
| Plan | starter and above |
| Config | `classTypes.items` (`id`, `name`, `minutes`, `text`, optional `size`), `timetable.weekly` (`{ "mon": [{ "time", "class", "coach", "room", "url" }] }`), `booking` (the club's app: `{ "provider": "other", "name", "url" }`), `sections.timetable` |
| Files | `gym-timetable.njk`, `.js`, `.css`; `src/kits/gym/partials/book.njk` |

## How it works
The rest of today and tomorrow, from the club's timetable, closed days left out. Every class has "Book in the app": the
class's own `url` in the club's app when it has one, otherwise the app (`booking.url`). We never take a booking
ourselves. With `gym-spaces` (Signature) and a fresh sheet, a class shows "4 places left" or "Full"; otherwise nothing.
