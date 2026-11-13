# Prices and service information (free page)

SRA Transparency Rules rule 1: for each listed service the firm offers, the price or basis, VAT, disbursements, what is and isn't included, stages, timescale, who does the work and their experience.

## Config

```json
"pricing": { "title", "intro", "vatRegistered": true, "updated": "YYYY-MM", "services": [{ "service": "probate", "name", "price": { "fixed" } | { "from", "to" } | { "hourly" }, "basis", "includes": [], "excludes": [], "disbursements": [{ "name", "amount": 0 | null, "vat": false, "note" }], "stages": [], "timescale", "team": ["<person id>"], "experience" }], "other" }
```

Every figure is the firm's own. Prices are entered before VAT; the page adds VAT at 20% when `vatRegistered`. Service ids are in src/kits/law/lib/sra.js.

Markup is neutral and styled with tokens; each look restyles it (and may override it in `src/looks/<look>/features/`).
