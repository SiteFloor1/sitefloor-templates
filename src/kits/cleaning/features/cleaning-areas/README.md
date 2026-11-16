# Do you clean in my postcode (cleaning kit, Starter)

The company's postcode districts (`areas.districts`, e.g. `["SW4", "SW11"]`; "SW1" covers SW1A–SW1Y), listed, and a
check that answers yes or not yet. With `cleaning-free-days` (Plus) the yes adds the next free day in that district.

```json
"areas": { "districts": ["SW4", "SW11"], "places": ["Clapham", "Battersea"], "days": { "source": "sheet", "csvUrl": "https://docs.google.com/spreadsheets/…/pub?output=csv", "staleAfterDays": 3 } }
```
