# Feature: chauffeur-page (hire kit)

The chauffeur page (`/chauffeur`). **Plan:** Plus.

What the service covers (`hire.chauffeur.services`: hourly, airport transfers, weddings and events…), the cars with a
chauffeur (`fleet.cars[].chauffeur`: the client's hourly rate and minimum hours; chauffeur-only cars and self-drive cars
that also come with a driver) and a quote request on WhatsApp: pick-up, drop-off, date and time, hours, passengers and
car. A request, never a booking. Signature adds the journey planner (`journey-planner`).

Config: `chauffeurPage` `{ kicker, title, intro?, description?, photo?, photoTall? }`, `hire.chauffeur`
`{ services: [{ title, text }], stepMinutes, message }` (`stepMinutes`: how the client bills part hours, 15/30/60).
