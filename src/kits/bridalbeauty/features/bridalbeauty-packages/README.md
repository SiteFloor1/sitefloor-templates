# For the bride

| | |
|---|---|
| Feature id | `bridalbeauty-packages` |
| Plan | starter |
| Config | `packages`: `{ message, bride: [{ id, name, text, minutes, price }], party: [{ id, name, text, minutes, price }], extras?: [{ name, text, price, from? }], note? }`; heading in `sections.packages` |

Each bridal service includes the trial (say so in `text`), with the minutes in the chair and the artist's price. The
party services are per person. The cover's "Trial and wedding day" line, the start time and the party quote all use
these prices and minutes, so they never disagree. Extras show on the bridal page.
