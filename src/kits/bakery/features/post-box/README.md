# Posted boxes (Plus)

For shops that post chocolates across the UK. Lists the boxes it posts and what posting costs, and works out live
"Order by 12pm Thursday, usually with them Friday" from the days it posts and its cut-off. A send day must be a
posting day the shop is open (its `hours`, closures included) and not a bank holiday; arrival skips Sundays, bank
holidays (the shop's region) and 25–26 December. The page says "usually" because no courier promises the next day;
`service` names the one the shop uses. The customer picks a box, adds who it's for, the address and a card, and sends it on WhatsApp
for the shop to confirm and take payment as it usually does.

```json
"post": {
  "price": 4.95,
  "days": ["tue", "thu", "sat"],
  "cutoff": "12:00",
  "service": "Royal Mail Tracked 24",
  "boxes": [{ "name": "A box of six", "price": 12 }, { "name": "A box of twelve", "price": 22 }],
  "note": "Packed cold in summer."
}
```

The address goes in the WhatsApp message only; the site stores nothing.
