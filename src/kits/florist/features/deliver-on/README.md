# deliver-on (florist kit, Starter)

Choose the day: a date field in this week's band. The date is checked against the florist's own `delivery.cutoffs`
(a day with `null` has no deliveries), `delivery.closed` and bank holidays (when `bankHolidays` is `"closed"`), up to
90 days ahead. Today only works before today's cut-off, and when a postcode is typed, that area's own cut-off
(`deliveryAreas`). The day is checked again when the order is sent, so "today" never goes on an order after the cut-off. A good day goes on the WhatsApp order as `For: Fri 6 Nov`;
any other day says why and adds nothing. Logic: `deliveryOn` in `src/kits/florist/lib/delivery.js` (unit tested).
No settings of its own: it uses `delivery`. Needs `this-week` and `same-day`.
