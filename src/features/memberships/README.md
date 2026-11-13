# Memberships

| | |
|---|---|
| Feature id | `memberships` |
| Plan | plus and above |
| Config | `memberships`: `compareService` (a `services` id), `plans` (1–4: `name`, `price` a month, `cuts` a month or `"unlimited"`, optional `includes`, `featured`), `terms`, optional `join` (WhatsApp message); `sections.memberships` |
| Files | `memberships.njk`, `.css`, `.js`; maths in `src/core/lib/savings.js` |

## How it works
"I get a cut every N weeks" (1–8) shows what that costs a month paying each time, and for every plan what it costs
and the saving (or the extra), with "Best for you" on the plan that saves most. Cuts beyond a plan's allowance are
counted at the normal price. Every number comes from the shop's own prices. Join buttons open WhatsApp with the plan
name; the site does not take payments.

## When something is missing or fails
Without JavaScript the plans show the 3-week example.

## Notes
`terms` must say how to cancel and the minimum term (UK consumer rules for subscriptions). Registered in `src/features/registry.js`.
