# Events page

| | |
|---|---|
| Feature id | `events` |
| Plan | plus and above (page `events`) |
| Config | `events`: `kicker`, `title`, `intro?`, `items` (`id`, `title`, `date`, `start`, `end?`, `price?` a head, `text`, `photo?`, `book?`) |
| Files | `events.njk`, `events.css`, `events.js`; calendar file in `src/kits/restaurant/lib/events.js` |

## How it works
Upcoming events in date order. Past ones are left out when the site is built and hidden by the browser after their day (a page can be older than today). **Add to calendar** downloads an .ics with times in UTC; **Book on WhatsApp** fills in the event and date.
