# letting-areas: areas (Plus)

An areas page and a page per area (a collection, counted as one page). Each area: its photograph (the client's own;
until then a credited, licensed one of that area only), a line, the agent's notes (`notes`: `label`, `text`, such
as transport, parks, schools, what the homes are like), and the homes free there now from the sheet (the buildings
listed in `buildings`), each opening its card. Fails closed like the board.

Settings (`areas`): `title`, `intro`, `items`: `{ slug, name, line, buildings: [ids], photo: { src, width, height, alt, credit }, notes }`.
Needs `letting-board`.
