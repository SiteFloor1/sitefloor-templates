# Feature: fleet-page (hire kit)

The fleet as ONE page of the plan however many cars (`collection: true`; owner's rule, 29 Oct 2026): the fleet index
(`/fleet`), a page per class (`/fleet/<class>`) and a page per car (`/cars/<car>`), all made from the client's Sheet.
**Plan:** Plus. With `--links html` (file previews) the folders are flattened (`fleet-suv.html`, `cars-bmw-m5.html`).

- **Fleet index:** every car, with filters for class, seats (2+, 4+, 5+, 7+), power (300+ to 750+ bhp) and budget (the
  from price up to £300 to £2,000). The filters are plain radio buttons and CSS does the filtering (`kit.css`), so they
  work without JavaScript. The script adds search by make and model, sort by price, the count and "free on my dates"
  (the shared date picker; a car is hidden if any of those days is taken on the Sheet; an unreadable Sheet filters
  nothing and says so). Signature adds the spec dial (`spec-dial`).
- **Class pages:** the class's own night photograph (`fleet.classes[].photo`, `photoTall`), the first car large with its
  rules, the rest in the grid, links to the other classes. The volume of a 300-car fleet lives here.
- **Car pages:** the gallery (whole car and the details), make, model, trim, year, the client's spec (power, 0–62,
  seats, boot, gearbox, fuel) only when given, interior and colours, every rule (deposit and when it's returned, driver
  age, licence years and points, insurance and excess and any reduction, mileage and extra-mile price, fuel or charge
  policy, late return, delivery), then the dates and quote (`hire-quote`), the driver checker (`driver-check`), the
  first ten minutes (`first-ten`), what to bring and the driver form, and compare (`compare`).

Config: `fleet` (from the Sheet), `fleetPage` `{ kicker, title, intro?, description? }`.
