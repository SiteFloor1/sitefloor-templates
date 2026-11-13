# Monthly edit

| | |
|---|---|
| Feature id | `monthly-edit` |
| Plan | plus and above |
| Config | `edit` (`month` "YYYY-MM", `message`, `sets`: 3–4 `{ id, name, kind, text?, minutes, price, from?, photo }`); `sections.edit` |

## How it works
Three or four sets for the month, large, on the look's one deep band, each with its time, price and request.

## When something is missing or fails
Shown from a month before its month until two weeks after it ends (build date); outside that it is left out, so last season never reads as new.

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.
