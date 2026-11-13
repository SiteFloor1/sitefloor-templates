# Takeaway (order for collection)

| | |
|---|---|
| Feature id | `order` |
| Plan | plus and above (page `takeaway`) |
| Config | `order`: `kicker`, `title`, `intro?`, `message`, `readyMinutes` (soonest collection), `daysAhead?`, `deposit?`, `note?`; dishes with `takeaway: true` (and optional `leadDays`, `photo`) |
| Files | `order.njk`, `order.css`, `order.js`; totals and message in `src/kits/restaurant/lib/order.js` |

## How it works
Steppers on every takeaway dish, a tray with a running total (in pence, so it never rounds wrong), the allergens in
the order, a collection time from now + `readyMinutes` to last orders, a name and notes, then **Send the order** on
WhatsApp. The FSA asks for allergen information before a distance order and again at collection, so the tray and the
message both list the order's allergens, and the message asks the restaurant to confirm them. Payment is taken at
collection; the site takes none. The delivery apps sit underneath when `delivery` is on.

## Cakes to order
With `order.daysAhead` set and a `[data-od-day]` choice in the markup (the Salon look has one), the order collects on a
day: the first day offered is today plus the longest `leadDays` in the order (the kitchen's notice for that cake), then
every open day up to `daysAhead`; times run every 30 minutes while the shop is open. With `order.deposit`
(`{ from, amount, link }`), an order of `from` pounds or more shows "Pay the £20 deposit by card", the shop's own Stripe
Payment Link set to that amount, and the WhatsApp message says the deposit is being paid online. The site never takes
or sees a payment.
