# Travel by postcode

| | |
|---|---|
| Feature id | `bridalbeauty-travel` |
| Plan | plus |
| Config | `travel`: `{ message, base, free: [districts], zones: [{ districts, fee }], note }`; heading in `sections.travel` |

The bride types the postcode she's getting ready at. Its district (the part before the space) is free when it's in
`free`, the zone's fee when it's in a zone, and anywhere else asks for a quote. A district ending in `*` covers a whole
area (`"CR*"` is every Croydon district). Fees are the artist's own for the wedding morning; say in `note` what they
cover (parking, the congestion charge, the trial).
