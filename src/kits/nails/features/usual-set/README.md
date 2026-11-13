# Your usual

| | |
|---|---|
| Feature id | `usual-set` |
| Plan | plus and above |
| Config | `yourUsual` (`message`) |

## How it works
When a visitor taps a Book or "Ask for" on a shade or set, the phone remembers what it was (this browser only). Next visit, one line offers it again; "Forget it" clears it.

## When something is missing or fails
Hidden unless something is remembered; storage off simply means the line never shows.

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.
