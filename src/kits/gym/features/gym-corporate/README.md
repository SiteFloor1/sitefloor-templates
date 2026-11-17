# Corporate rate (GYM-12)

| | |
|---|---|
| Feature id | `gym-corporate` |
| Plan | plus and above (a page) |
| Config | `corporate`: `title`, `intro`, `rates` (`id`, `name`, `tier` (a membership id), `monthly`, `minimumMonths`, `mandatoryFees`), `companies` (`name`, `rate`), `proof` (how a member shows where they work), `message` (WhatsApp opening line) |
| Files | `gym-corporate.njk`, `.js`, `.css` |

A company typed is matched against the club's own list (case, spacing and "Ltd" don't matter) and its rate is marked.
Every rate is a lawful total with its mandatory fees in, like the memberships. Not on the list: one tap asks the club
on WhatsApp. No lookup service, nothing stored.
