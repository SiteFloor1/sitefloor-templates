# Car hire: playbook

What to build for this trade (kit `hire`). The ground rules and the steps for a new kit: [`docs/TRADE-PLAYBOOK.md`](../../TRADE-PLAYBOOK.md).

## Car hire (kit `hire`, look `datum`, demo Datum Hire) — built 29 Oct 2026
- Customer questions: "Car hire" in `docs/CUSTOMER-QUESTIONS.md`. Fleet from one Google Sheet per client (one row per car),
  imported at build with `src/kits/hire/tools/import-fleet.js`; live availability and deposits from the same Sheet.
- The fleet (index + class pages + car pages) counts as ONE page of the plan; unlisted utility pages (deposit status,
  handover checklist) are free. Plus = Home, Fleet, Chauffeur, Weddings, Long-term.
- Honesty: requests and deposits only; every rule and price from the client; laws from gov.uk with the date checked
  (DVLA check code: 21 days, checked 29 Oct 2026).
