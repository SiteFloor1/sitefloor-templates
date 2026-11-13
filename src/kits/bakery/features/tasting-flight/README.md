# tasting-flight (bakery kit, Signature)

The visitor picks `flight.size` of the shop's chocolates (the same pieces and photos as the box). The page lays them
out in the order to taste them, lightest first, with the shop's one line on each: a card to keep, or to screenshot
and send. When it's complete, "Order this flight" sends it to the shop on WhatsApp with a collection time.

## Config
```json
"flight": { "size": 5, "price": 12, "payLink": "flight", "note": "Taste them in this order, a sip of water between." }
```
Each piece needs, on its menu item: `"box": true`, a `tile`, `"notes"` (one line, e.g. "Raspberry first, then
white chocolate") and `"tasteOrder"` (1 is tasted first; lighter and fruitier pieces low, dark and bitter high).
Sold-out pieces (today's sheet) can't be chosen. Logic: `lib/box.js` (`flightOrder`, `flightText`; unit-tested).
