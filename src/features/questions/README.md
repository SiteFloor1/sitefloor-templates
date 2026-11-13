# Before you come in (questions)

| | |
|---|---|
| Feature id | `questions` |
| Plan | starter and above |
| Config | `questions`: `[{ topic, q, a, home? }]`, `sections.questions` |
| Files | `questions.njk`, `questions.css` |

## How it works
The questions customers ask a business before their first visit, answered where they look. Lines with `home: true` show on the home page (up to six); the Plan your visit page shows every question grouped by `topic`. Write answers in the shop's voice, short and specific: the street to park on, the bus numbers, whether they take cards.

If the team page has filters (e.g. hair types), a question answering "who's best for…" is added automatically from the staff list, so it can never go out of date.

Start from the trade's list in `docs/CUSTOMER-QUESTIONS.md`.

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.
