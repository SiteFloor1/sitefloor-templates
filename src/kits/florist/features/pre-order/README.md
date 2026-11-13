# pre-order (florist kit, Plus, home section `preorder`)

Pre-order windows for the big days. Each window has the florist's own dates: `opens` (when it appears at the top of
the home page), `orderBy` (the last day to order, shown) and `day` (the delivery day). A short menu of up to four
pieces at their prices (the settings refuse a `day` the florist doesn't deliver on: a day with no cut-off, a closed date or a bank holiday they close on); each opens WhatsApp with its name and price. Only an open window shows; the browser hides it
after the order-by date even if the site hasn't been rebuilt. `occasion` links a window to an occasion page, which
then shows its order-by date.

```json
"preorder": { "windows": [{ "id": "valentines", "title": "Valentine's Day", "occasion": "valentines",
  "opens": "2027-01-18", "orderBy": "2027-02-11", "day": "2027-02-13", "line": "…", "message": "Hello <your shop>, a Valentine's pre-order:",
  "items": [{ "id": "dozen", "name": "A dozen red roses", "price": 95, "photo": { … } }] }] }
```
