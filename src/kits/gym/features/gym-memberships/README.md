# Memberships (GYM-2)

| | |
|---|---|
| Feature id | `gym-memberships` |
| Plan | starter and above |
| Config | `memberships`: `title`, `intro`, `tiers` (`id`, `name`, `monthly`, `minimumMonths` (0 = rolling), `mandatoryFees` (`[{ "name": "Joining fee", "amount": 30 }]` or `[]`), `includes`, optional `line`), optional `note` |
| Files | `gym-memberships.njk`, `.css`; totals in `src/kits/gym/lib/gym.js` (`membershipTotal`, `priceWords`) |

## The law, built in
The DMCC Act 2024 requires the headline price to be the total the member must pay, every mandatory fee in (CMA209,
para 4.4 names joining fees; para 3.21 rules out showing them as separate parts). So the club never types a headline
price: it gives the monthly price, the minimum term and every mandatory fee, and the build writes:
- a contract: "£1,578 for 12 months, joining fee included", the monthly breakdown under it;
- a rolling membership: "£159 the first month, joining fee included" beside "then £129 a month", the same size.
`mandatoryFees` must always be written (`[]` when there are none), so leaving a fee out is never an accident; the build
fails without it. Optional extras (towels, lockers, personal training) are not mandatory and are not added.
