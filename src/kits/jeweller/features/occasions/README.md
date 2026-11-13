# occasions (jeweller kit, Plus)

The Occasions page (`/occasions`): the occasion on now (or the next) leads, its name very large with its dates, the
house's line and its pieces; the others follow, soonest first. Past ones drop off at build time and again in the
browser, so the page stays right between builds. Dates come from the client (`npm run seasons` suggests them:
Valentine's, Mother's Day, Eid, Diwali and Dhanteras, proposal season at Christmas and New Year…).
Config `occasions`: `title`, `intro`, `items` ([{ `id`, `name`, `from`, `to`, `line`, optional `pieces` }]); otherwise
pieces join an occasion with `occasions: ["<id>"]`.
