# this-week (florist kit, Starter)

This week's flowers: the arrangement's name, stems and prices by size, under the look's hero photograph, with one
button that sends the order on WhatsApp (size, the card if `card-composer` is on, the postcode if typed). The week's
colour, taken from the flowers, frames the page: the look reads `--week`, `--week-deep` (the button, white text,
always AA) and `--week-wash` (the band). Built into the page, so the first paint is already in the week's colour.

Live: with `studioSheet.source: "sheet"`, rows `week,<field>,<value>` in the florist's Sheet change it without a
rebuild: `name`, `stems`, `colour` (#RRGGBB), `colour_name`, `photo` (the id of one of `week.photos`) and
`price_<size id>`. Each field is checked; anything unreadable keeps the built value.

```json
"week": {
  "name": "Coral rose, blush carnation and calla", "stems": "…", "colour": "#E0725C", "colourName": "coral",
  "dots": ["#EBC6C3", "#C98448"], "message": "Hello <your shop>, I'd like this week's flowers:",
  "sizes": [{ "id": "medium", "label": "Medium", "price": 65 }],
  "photos": [{ "id": "mantel", "src": "img/week-mantel.webp", "width": 1716, "height": 965, "alt": "…", "phone": { … } }],
  "photo": "mantel"
}
```
