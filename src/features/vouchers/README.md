# Gift vouchers

| | |
|---|---|
| Feature id | `vouchers` |
| Plan | plus and above |
| Config | `vouchers`: `amounts` (1–6 whole pounds), optional `custom` (`min`, `max`), `validMonths`, `howToBuy`, `terms`; `sections.vouchers` |
| Files | `vouchers.njk`, `.css`, `.js`; message in `src/core/lib/vouchers.js` |

## How it works
Pick an amount (or "Other" within the shop's range), add who it's for, who it's from and a short message; the
voucher preview updates as you type. "Order on WhatsApp" opens a message with every detail, e.g.
*Hi, I'd like a £20 gift voucher for Sam, from Alex. Message for the card: "Happy birthday!" How can I pay?*
The site takes no payment and keeps nothing: `howToBuy` says how the shop takes payment and hands it over.

## When something is missing or fails
Without JavaScript the button sends a plain "I'd like a gift voucher" message.

## Notes
Registered in `src/features/registry.js`.
