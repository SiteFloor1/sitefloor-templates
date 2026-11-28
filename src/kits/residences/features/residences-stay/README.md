# residences-stay: the stay bar (Signature)

Under the hero photograph: a home (from the sheet) and a length of stay, from the operator's stops in nights to a
long let. A short stay shows one total, every mandatory fee in it (nightly rate with service and VAT, the cleaning
charge once). A long let is a rolling tenancy with no end date, so it is priced by the month: the rent and the most
the deposit can be under the Tenant Fees Act, with links to GOV.UK and the date checked (`lib/rules.js`). Every card
on the page re-prices to the same stay. Reserve opens WhatsApp with the home and the stay.

## Settings (`stay` in site.json)
| Key | |
|---|---|
| `stops` | nights for the slider's stops, ascending, 1–89 (the long let is added after them) |
| `start` | the stop it opens on (0-based; `stops.length` is the long let) |
| `home` | the ref of the home it opens on |

A stale sheet disables it and says to ask.
