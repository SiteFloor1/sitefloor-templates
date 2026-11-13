# Waitlist

| | |
|---|---|
| Feature id | `waitlist` |
| Plan | plus and above (needs `spaces-left`) |
| Config | `waitlist.message` with `{class}`, `{day}` and `{time}`, e.g. "Hello, please add me to the waitlist for {class} on {day} at {time}." |
| Files | `waitlist.njk` (one line under the week), `.js`, `.css`; the links are drawn by the timetable |

## How it works
When the studio's sheet says a class is full, its Book link becomes "Waitlist": one tap opens WhatsApp with the
message filled in. The studio decides who gets a place that frees up; the site promises nothing more.

## When something is missing or fails
No places known, no waitlist links: classes show Book as usual.
