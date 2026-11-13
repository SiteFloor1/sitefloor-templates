# Feature: late-night (bakery kit, Starter)

A night band: "Open until 1am tonight" from the shop's hours, last orders (`lastOrders` minutes before closing,
counting down in the final hour, then "last orders have been taken"), whether there are seats inside now (from the
`bakes` sheet, only while fresh and open), dine-in and delivery lines, and the week's hours. Without JavaScript: the
week and last orders as a rule.

```json
"lateNight": { "lastOrders": 30, "dineIn": "Forty seats over two floors.", "note": "Delivery until we close." }
```

Heading: `sections.lateNight`.
