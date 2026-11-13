# The salon plan

| | |
|---|---|
| Feature id | `salon-plan` |
| Plan | signature |
| Config | `salonPlan`: `photo`, `spots` (`id`, `label`, `x`, `y` as percent from the left and top of the photo, `note?`), `note?`; `sections.salonPlan` |
| Needs | `table-request` (the choice goes with it) |

## How it works
A photograph of the room with its places marked: the velvet sofa, under the glass roof, beside the piano. Choosing
one puts "Where: Under the glass roof. A preference; we'll do our best." on the table request. Choosing it again
clears it. The site never promises a table; the café replies to confirm.

## Needs from the café
One wide photograph of the room and where each place is on it. Running cost £0.

## When something is missing or fails
Without JavaScript the places are listed under the photograph.
