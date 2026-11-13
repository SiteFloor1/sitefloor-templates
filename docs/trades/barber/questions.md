# Barbers: customer questions

What this trade's customers ask before they get in touch (kit `barber`). How to read it and the questions every trade gets: [`docs/CUSTOMER-QUESTIONS.md`](../../CUSTOMER-QUESTIONS.md).

## Barbers
| Question | Answered by |
|---|---|
| Do you cut Afro and textured hair? Curly? Straight and fine? | team filters (`team.filters`, `staff[].tags`) and the generated "who's best for…" question; a direct line in questions |
| Who should I book for a skin fade / beard / kids? | team filters; `team` "known for" |
| Is anyone free now? Can I walk in? | `chair-board` (walk-in shops); questions |
| How much will my cut cost with extras? How long? | `build-your-cut`; `price-page` times |
| What age do you cut kids from? Do you do first haircuts? | questions; team filter "Kids" |
| Which fade suits my face? What do I ask for? | `style-guide` |
| Can you copy a photo I bring? | questions; `work` (show it's been done before) |
| Do you do line designs / hot towel shaves / eyebrows? | `price-list` |
