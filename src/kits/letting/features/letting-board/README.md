# letting-board: homes free now (every plan)

The agent's free homes, from its own Google Sheet, read on the visitor's phone: a list under the hero and a card for
each home with its rent, size, deposits within the Tenant Fees Act caps, council tax band, EPC and the rest of its
material information, and "Book a viewing" (WhatsApp, with the home's name, ref and rent).

## Settings (`homes` in site.json)
| Key | |
|---|---|
| `source` | `"sheet"` on a client site (`"simulated"` on a demo) |
| `csvUrl` | the sheet's published CSV link (File → Share → Publish to web → CSV) |
| `staleAfterHours` | after this long without an update nothing is shown as free (1–72, default 36) |
| `hero` | the building the home page shows (its id) |
| `buildings` | `{ id, name, kind, model?, floors: [{ id, label, note?, units: [refs] }] }`; `model` (`mansion`, `terrace`, `tower`) for the 3D illustration |
| `viewing` | the start of the WhatsApp message |

## The sheet
One row per home: `ref,building,floor,name,status,rent_pcm,beds,baths,size_m2,available_from,council_tax,epc,furnished,parking,broadband,mobile,heating,outside,pets,notes,updated_at`.
`status` is `available`, `let agreed` or `let`. A home is only shown as free with a whole-pound rent, a council tax
band (A–H) and an EPC rating (A–G). `updated_at` as `2026-11-15 09:15` (UK time) or ISO.

## Fails closed
A sheet that can't be read in 6 seconds, has no readable `updated_at`, or is older than `staleAfterHours` lists
nothing and says to call. On the demo, add `#stale` to the address to see it.
