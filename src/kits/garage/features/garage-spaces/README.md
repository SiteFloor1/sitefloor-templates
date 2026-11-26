# garage-spaces (Starter)

Spaces free and prices (PARK-1). Reads `hall.rows[].bays[]`: each bay's `n`, `width` (m), `free` (true/false),
`price` (a month, £) and `charger` (kW). The free bays are listed with size, charger and price; under them, how many
bays there are and the price range. With no free bay, the waiting list link (`messages.waitlist`).
The client updates `free` when a bay is let or freed; the page never says a bay is free unless the list does.

**Live (optional):** `liveBays`: `{ "source": "sheet", "csvUrl": "<the sheet's published CSV link>", "staleHours": 24 }`.
The sheet has one row per bay with `bay`, `status` (`free` or `let`) and `updated_at` (e.g. `2026-11-18 08:40`). The
page reads it every five minutes, shows "Updated 08:40", and the picker, the drawn plan, the hall from above and the
night route all follow it. It fails closed: an unknown or repeated bay, an unreadable row, or any row older than
`staleHours` (or dated ahead) hides the free bays table, turns every free count into "Ask us first" and says "The free bays can't be confirmed right now. Ask us before you come." A demo
uses `"source": "simulated"` (its own list, updated a few minutes ago); a client's can't.

**Coming free (optional column):** a `free_from` column holds the date a let bay is expected back (`2026-12-14`,
`14/12/2026`, or with a time). The page lists the next three ("Coming free: bay 12 from 14 December and bay 5 from
2 January.") and, when no free bay takes the visitor's car, the picker names the first returning bay that does and offers
the waiting list. A past date, or one more than six months away, is ignored; an unreadable one fails the sheet like any
other bad row. Leave the cell blank when there's no date.
