# Feature: hire-quote (hire kit)

The dates and the quote on each car's page. **Plan:** Plus. Needs `fleet-page` and the shared `date-range`.

- **Calendar:** the shared date-range picker with the client's rules (`hire.dates`); days this car is taken come from
  the availability Sheet. An unreadable or old Sheet blocks nothing and says "ask us"; the client checks every request.
- **The quote, every part shown:** the weekend rate when the client's weekend rule fits the dates (`hire.rates.weekend`),
  otherwise whole months, whole weeks and the days left over at the car's own rates (priced on `periods`, the days on
  the UK wall clock); delivery and collection for the postcode's zone, or meet-and-greet at a named airport
  (`meet-greet`); extras per day or per hire; extra miles beyond what's included, if the customer says how far.
  A rate the car doesn't have is never assumed: the page says "ask us". The deposit is listed apart (it's returned).
- **The request:** WhatsApp, with the dates in full, every part and its price, the reference and "I understand this is
  a request until you confirm". The deposit button (`pay-link`, a deposit with `"holds": "request"`) carries the same
  reference to Stripe (`client_reference_id`). Never "booked", "confirmed" or "reserved".
- **Without JavaScript:** the rate table and a WhatsApp request.
