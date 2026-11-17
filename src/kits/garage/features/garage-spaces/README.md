# garage-spaces (Starter)

Spaces free and prices (PARK-1). Reads `hall.rows[].bays[]`: each bay's `n`, `width` (m), `free` (true/false),
`price` (a month, £) and `charger` (kW). The free bays are listed with size, charger and price; under them, how many
bays there are and the price range. With no free bay, the waiting list link (`messages.waitlist`).
The client updates `free` when a bay is let or freed; the page never says a bay is free unless the list does.
