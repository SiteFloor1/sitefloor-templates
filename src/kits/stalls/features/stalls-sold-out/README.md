# Sold out today

| | |
|---|---|
| Feature id | `stalls-sold-out` |
| Plan | signature |
| Config | `soldOut`: `source` ("sheet", or "simulated" on demos), `csvUrl` |

## How it works
The stall keeps a Google Form on its phone (item, from a list of its menu; the Form records the time). Its responses
sheet is published as CSV with the columns `date`, `item`, `time`. Every menu on the page strikes today's sold-out
items through: "Sold out today at 15:40. Back next stop." Matching is by the item's name.

## When something is missing or fails
Only rows dated today count, so nothing ever carries over. An unreadable sheet strikes nothing. A site using the
sheet allows `docs.google.com` in its security policy.

Registered in `src/kits/stalls/kit.js`; the demo's sample in `src/demo/stalls-sold-out-provider.js`.
