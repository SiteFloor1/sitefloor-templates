# Packages (WVID-1)

| | |
|---|---|
| Feature id | `wf-packages` |
| Plan | starter and above |
| Config | `packages`: `items` (each `{ id, name, price, hours, films, photographs?, text? }`: `price` in whole pounds or `null` for "price on request"; `films` a list such as `["A five-minute film", "The full ceremony and speeches"]`, `[]` for photographs only), `deposit` (how the date is secured, in the studio's words), optional `note`. Heading in `sections.packages` |
| Files | `wf-packages.njk`, `wf-packages.css` |

Rows, not cards: the package's name and price on one line, the hours and what's in it beneath. Every figure is the
studio's own. With `wf-packages-page` on, the look moves this section off the home page onto Packages.
