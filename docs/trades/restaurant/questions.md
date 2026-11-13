# Restaurants: customer questions

What this trade's customers ask before they get in touch (kit `restaurant`). How to read it and the questions every trade gets: [`docs/CUSTOMER-QUESTIONS.md`](../../CUSTOMER-QUESTIONS.md).

## Restaurant / café
Allergen facts come from the FSA's allergen guidance for food businesses (gov.uk, checked 27 Oct 2026): food
that isn't prepacked must have allergen information for every item containing any of the 14 allergens; it can
be written, or given by staff with a clear written notice; for orders taken at a distance (online, phone,
WhatsApp) it must be available before the order and again at delivery or collection. Sites show the
restaurant's own allergen chart and never say a dish is "safe" for an allergy.

| Question | Answered by |
|---|---|
| What's on the menu right now? Lunch or dinner? | `menu` (the sitting that's on now, with "kitchen open until…"; the Carte look switches to its evening colours for dinner); `menu-page` (every sitting and the drinks) |
| What's on tonight? Specials? Anything sold out? | `specials` (today's specials and sold-out dishes from the restaurant's sheet; old rows never show); `tonight` |
| Is it halal / vegetarian / vegan / gluten-free? | `menu` diet filters and marks on every dish; `menu.statement` (e.g. "all our meat is halal") |
| What allergens are in it? I have a nut allergy. | `menu` (the 14 allergens on every dish, from the restaurant's chart, with its kitchen statement); `menu-page` allergen chart with "hide dishes containing…" |
| There are 8 of us with different diets. Can everyone eat? | `the-table` (add each guest's diet and allergies; each dish shows who can eat it; request the table with every diet in the message) |
| Can I book a table for 6? Do you take walk-ins? | `table-request` (party size, day, time and notes on WhatsApp); `tonight` (walk-in tables now, from the sheet); questions |
| Can we sit by the window / in a booth / outside? | `the-room` (the dining room drawn from the restaurant's layout; pick an area or table as a request, never a guarantee) |
| What does the dish actually look like? What's in it? | `the-pass` (the restaurant's own photo of the plate, with what's on it marked, allergens, spice and what to drink with it) |
| What should I drink with it? | `pairings` (pick a dish, see the drinks from the restaurant's own list that go with it) |
| Do you do takeaway or delivery? Can I order ahead? | `delivery` (links to the delivery apps the restaurant uses); `order` (build an order with a running total and the allergens in it, sent on WhatsApp for collection) |
| Can I book the whole place / a private room? | `private-dining` (rooms, guest numbers, minimum spend, set menus, enquiry on WhatsApp); `the-room` |
| Anything on? Quiz night, live music, Christmas? | `events` (dated events, add to calendar, book on WhatsApp); `seasonal` |
| Is it child-friendly? High chairs? Kids' menu? | questions; `menu` section for kids |
| Is there parking? Alcohol or BYOB? Corkage? | `visitInfo`; questions |
| Can I buy a gift voucher? | `vouchers` |
