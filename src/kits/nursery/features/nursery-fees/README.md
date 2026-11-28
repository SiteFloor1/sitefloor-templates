# Fees

| | |
|---|---|
| Feature id | `nursery-fees` |
| Plan | starter and above |
| Config | `fees`: `rate` (£ an hour, for the week tool), `weeksOpen`, `sessions` (`full`, and `am`/`pm` if offered: `{ label, from, to, hours }`), `items` (headline rates `{ label, price, per }`), `includes` (what every price includes), `extras?` (`{ label, price, per, optional: true, instead? }`), `note?`, `checked?`; `funding`: `text` (the nursery's words), `checked` (YYYY-MM-DD), `stretched` |
| Files | `nursery-fees.njk`, `rates.njk`, `funding.njk`, `nursery-fees.css` |

## Rules
- Every headline price includes everything compulsory (CMA): a compulsory charge goes into the price, never into the
  extras. The checks refuse an extra that isn't `optional: true`.
- The DfE's statutory guidance says charges alongside funded hours must be voluntary, so every extra is shown as
  optional, never a condition of a place or of funded hours, with what a family can do instead (send a packed lunch).
- Funded hours: the nursery's own words, the two gov.uk pages linked, and the date the words were checked. We never
  say who is eligible.
