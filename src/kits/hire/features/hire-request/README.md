# Feature: hire-request (hire kit)

The request on the home page (`#request`). **Plan:** Starter.

Choose a car (grouped by class), the dates and a delivery postcode (or "collect"); the site writes it into a WhatsApp
message with the dates in full, never "this weekend", and the line "I understand this is a request until you confirm."
The site never says booked, confirmed or reserved. Without JavaScript the button opens WhatsApp with the general message.

Config: `sections.request` `{ title, intro? }`, optional `messages.requestNote` (the line beside the button).
