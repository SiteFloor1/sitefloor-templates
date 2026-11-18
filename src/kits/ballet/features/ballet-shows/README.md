# Shows and tickets

| | |
|---|---|
| Feature id | `ballet-shows` |
| Plan | signature |
| Config | `shows`: `photo`, `items` `[{ id, name, date, time, venue, address?, running?, filming, text?, tickets: { url, label?, opens?, soldOut? } }]`, `note?`; `showsPage` `{ kicker, title, intro }` |
| Files | `ballet-shows.njk` (the shows page), `ballet-shows.css` |

## What it does
Each show: the date, the name, curtain-up, the venue, the running time and the school's filming rule, then its own
ticket page (TicketSource, Eventbrite, the theatre's box office). Before `tickets.opens` it says "Tickets from …". With
`ballet-year` on, shows also run round the home page's ring.

## Rules
- Tickets are sold on the school's own page; the site only links to it.
- "Sold out" appears only when the school sets `soldOut`; the site never guesses.
