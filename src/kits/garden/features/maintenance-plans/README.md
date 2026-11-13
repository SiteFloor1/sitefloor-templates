# Maintenance plans

| | |
|---|---|
| Feature id | `maintenance-plans` (page `maintenance.html`) |
| Plan | signature |
| Config | `maintenance`: `kicker`, `title`, `intro`, `message` (the WhatsApp opening line), `tasks` (twelve lists, January first: what a visit does that month), `plans`: `id`, `name`, `visits` (months 1–12), `price` (the studio's own, or `null` to price after a visit), `per` (`visit`, `month` or `year`), optional `text`; optional `note` |
| Files | `maintenance-plans.njk`, `.css`, `.js` |

## How it works
Choose a plan and its year shows as twelve columns: the months it visits are marked and list what the studio does
then (from the month's tasks). The plan's price shows only if the studio publishes one. "Ask about a plan" takes the
plan, a rough size and the postcode into the WhatsApp message. On phones the year runs down the page. Without
JavaScript every plan's year shows, one after another.
