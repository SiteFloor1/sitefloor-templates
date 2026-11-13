# Build set

| | |
|---|---|
| Feature id | `build-set` |
| Plan | signature and above |
| Config | `buildSet` (`message`, `systems`: `{ id, name, minutes, price }`, `lengths`: `{ length, addMinutes, addPrice }`, `finishes`: `{ id, name, addMinutes, addPrice }`, `art?`: `{ level, name, addMinutes, addPrice }`); `sections.buildSet` |

## How it works
System, shape, length, finish, shade and art in; the time and price out from the salon's figures (`lib/menu.js`), sent on WhatsApp with every choice named.

## When something is missing or fails
Without JavaScript Send goes with the menu's message.

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.
