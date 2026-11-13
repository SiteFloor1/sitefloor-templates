# gift-a-season (florist kit, Signature)

Gift a season: four, eight or twelve weekly deliveries for someone else. The length, the first delivery (no sooner
than `leadDays`), their postcode and the card go on WhatsApp; the length is paid by the florist's own Stripe Payment
Link. On the home page, or with "Flowers every week" when that page is on.

```json
"giftSeason": { "message": "Hello <your shop>, I'd like to give a season of flowers.", "leadDays": 3, "photo": { … },
  "lengths": [{ "weeks": 4, "price": 240, "payLink": "https://buy.stripe.com/…" }] }
```
