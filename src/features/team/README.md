# Team page

| | |
|---|---|
| Feature id | `team` |
| Plan | plus and above |
| Config | `staff` (`name`, `role`, `speciality`, `years?`, `days?`, `photo?`, `bio?`, `quote?`, `knownFor?`), `team` (page copy, optional `hiring`; `showcase: true` for trades where people book the business, not a person, with optional `bookLine` and `yearsLabel`) |
| Files | `team.njk`, `team.css` |

## How it works
A whole page (`team.html`). One profile per staff member with a WhatsApp "Book with …" link, or, with `team.showcase`, profiles only and one booking line for the business (car studios: you book the job, not the person).

## When something is missing or fails
—

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.
