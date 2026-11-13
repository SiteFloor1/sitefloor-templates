# Give a sitting

| | |
|---|---|
| Feature id | `give-a-sitting` |
| Plan | signature (the Plus plan's gift is `vouchers`) |
| Config | `giveSitting`: `gifts` (`id`, `name`, `price`, `link`: the shop's Stripe Payment Link set to that price), `message`, `validMonths`, `terms`, optional `note`; `sections.giveSitting` |
| Files | `give-a-sitting.njk`, `.css`, `.js`; message `giftMessage` in `src/kits/restaurant/lib/tearoom.js` |

## How it works
Choose what to give (afternoon tea for two, with champagne…), write who it's for, who it's from and a line, and the
card is set in the house style as you type, ready to screenshot and send on. Paying opens the shop's own Stripe
Payment Link for that gift (the site never takes or sees a payment); "Send us the names" opens WhatsApp with the gift
and the card's words, so the shop can write and send the card. Demo sites must use Stripe test-mode links, client
sites live ones (validation checks both).

## Needs from the shop
One Stripe Payment Link per gift, at that price (free to make in Stripe; Stripe's usual card fees apply); the terms in
the shop's words. Running cost £0.

## When something is missing or fails
Without JavaScript each gift is a plain pay link, then a WhatsApp link to send the names.
