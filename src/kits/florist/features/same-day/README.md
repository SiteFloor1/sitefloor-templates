# same-day (florist kit, Starter)

The same-day line under this week's flowers, from the florist's own settings only: before today's cut-off it counts
down ("Order in the next 2 h 14 min for delivery today"); after it, or on a closed day, it names the next delivery
day. "Do you deliver to my postcode?" checks the outward code against the florist's districts ("SW1" covers SW1A
but never SW10). Bank holidays count as closed when `bankHolidays` is "closed". The look's phone bar can show the
same state in an element with `data-sd-bar`.

```json
"delivery": {
  "zones": ["SW1", "SW3", "SW5"], "areas": "and Chelsea Harbour",
  "cutoffs": { "mon": "13:00", "tue": "13:00", "wed": "13:00", "thu": "13:00", "fri": "13:00", "sat": "11:00", "sun": null },
  "closed": ["2026-12-25"], "bankHolidays": "closed", "fee": 12,
  "collect": "Or collect from the studio until 6pm."
}
```

`delivery.dates` holds one-off cut-offs for single dates (`{ "2026-12-24": "11:00" }`, or `null` for no deliveries that day). The countdown, the next delivery day, the postcode check and choose the day all use them.
