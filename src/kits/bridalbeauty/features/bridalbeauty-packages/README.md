# For the bride

| | |
|---|---|
| Feature id | `bridalbeauty-packages` |
| Plan | starter |
| Config | `packages`: `{ message, bride: [{ id, name, text, minutes, price }], party: [{ id, name, one, text, minutes, price }], extras?: [{ id, name, text, price, from? }], note? }`; heading in `sections.packages` |

`one` is the name for one person ("Bridesmaid", "Mother"): the morning numbers each chair with it ("Bridesmaid 1") and
a quote for one person uses it ("1 mother"). Extras (up to 10) have an `id` so a guide page can point at the price. On
the bridal page, the second artist's fee is listed from `morning.secondArtist`, not typed again as an extra.

Each bridal service includes the trial (say so in `text`), with the minutes in the chair and the artist's price. The
party services are per person. The cover's "Trial and wedding day" line, the start time and the party quote all use
these prices and minutes, so they never disagree. Extras show on the bridal page.
