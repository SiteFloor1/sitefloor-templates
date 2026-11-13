# Feature: fleet (hire kit)

The fleet on the home page. **Plan:** Starter.

- **The class rail:** the client's classes in rail order (Everyday luxury, Performance, SUV, Supercar, Chauffeur, and
  Tuned with the `tuned-class` feature), each with its count from the data. Each links to its class page when the
  fleet page is on (Plus); on Starter they are labels.
- **The leading class** (`fleet.lead`, the client chooses): one large car (the car with `"lead": true`, else the first)
  and two beside it. The large car's picture fills its column, so the two columns end together (no empty space under the
  lead car). Each shows the model name, the trim line, the "from" price and the client's rules: deposit, driver age,
  licence years and points, insurance excess, miles a day and the extra-mile price, delivery.
- **The range strip** (`fleet.range`, 2–4 car ids from other classes): a quiet row hinting at the rest of the fleet.
- **Free this weekend?** Each self-drive car reads the client's availability Sheet: "free on our calendar" only when
  the Sheet was read and is fresh and neither day is taken; "taken"; otherwise "ask us". Never "free" by default.

Config: `fleet` (see `docs/CONFIG.md`, imported from the client's Sheet with `src/kits/hire/tools/import-fleet.js`),
`hire.availability` (`source`, `csvUrl`, `staleAfterHours`), `sections.fleet` (`title`, `intro`) and optionally
`sections.range.title` and `messages.carRequest` (`{car}` is replaced by the model).

**Availability tab** (published as CSV, and so public): exactly `car,from,to,updated_at`, nothing else (no customer
names: keep those on an unpublished tab; any other column makes every car say "ask us"), one row per hire or blocked spell, dates
`YYYY-MM-DD` with `to` included; `updated_at` is when the row was last touched. The newest `updated_at` must be within
`staleAfterHours`, or every car says "ask us". A row that can't be read blocks the whole tab (we never guess).
