# gifts (jeweller kit, Plus)

The Gifts page (`/gifts`): the pieces the house marks as gifts (`gift: true`, with a price) grouped by the price bands
it sets ("Under £500", "£500 to £2,000"…), each band named large with its pieces in a row; the house's wrapping words
with its box; a pointer to "Drop a hint"; the gift card (`vouchers`) and the anniversary reminder. A band with no
pieces isn't shown; a piece on request isn't banded. Config `gifts`: `title`, `intro`, `bands` ([{ `label`, `min`,
`max` }]), `wrapping`, optional `description`.
