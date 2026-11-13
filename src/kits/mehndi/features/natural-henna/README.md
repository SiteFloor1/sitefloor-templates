# Natural henna

| | |
|---|---|
| Feature id | `natural-henna` |
| Plan | starter and above |
| Config | `natural`: `paste` (what the artist's paste is made of, in their words), `stain` (how it develops), `patch?` (their patch test offer); heading in `sections.natural` |

## How it works
One plain section: what's in the paste, how the stain goes on dark, comes off orange and deepens, and the NHS line on
"black henna" (PPD), linked to the NHS page with the day it was last checked. The NHS line is the kit's own
(`NHS_PPD` in `lib/mehndi.js`), the same on every client site, and only changes when someone checks the page again.

## When something is missing or fails
Nothing is live. No medical advice beyond what the NHS page says; the paste's recipe is the artist's.

Registered in `src/kits/mehndi/kit.js`. Add to a site by listing the id in `features` in its `site.json`.
