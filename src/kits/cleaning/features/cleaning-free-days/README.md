# Next free days (cleaning kit, Plus)

The postcode check's yes adds the next free day in that district, from the company's Google Sheet published as CSV:
`district,date,updated_at` (one row per free day; `updated_at` is when the row was last checked). The sheet is read
once; if its newest `updated_at` is older than `areas.days.staleAfterDays`, or it can't be read, the answer is "ask us
for the next free day", never a date. Demos use a simulation (`source: "simulated"`, refused on client sites).
