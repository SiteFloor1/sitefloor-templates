# bespoke (jeweller kit, Plus)

The Bespoke page (`/bespoke`): the house's own process, step by step down one hairline, each with its timing
("Week 1", "Weeks 2–4"…) and the overall timing in the house's words; the commission deposit through the client's own
Stripe Payment Link (with `pay-link`; worded as a deposit, never a payment for the piece); a brief sent on WhatsApp
(the piece, metal, budget band, a stone in mind, wanted by, the story); and a past commission (`sketch-to-ring`). Without `sketch-to-ring`, the home page shows the bench photograph,
one line and the way in (`bespoke/home.njk`).
Config `bespoke`: `title`, `intro`, `timing`, `steps` ([{ `title`, `text`, `when` }]), `brief` (`kinds`, `metals`,
`budgets`), optional `deposit` ({ `text`, `pay`: a payLinks id }), `photo`, `description`.
