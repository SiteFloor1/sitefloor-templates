# Parties

| | |
|---|---|
| Feature id | `party-booking` |
| Plan | signature and above |
| Config | `parties` (`message`, `occasions`, `min`, `max`, `treatments`: menu item ids, `text`); `sections.parties` |

## How it works
Hen and bridal parties: the occasion, the date, how many, the treatments and a note, gathered into one WhatsApp message. No payment, no account.

## When something is missing or fails
Without JavaScript Send goes with the opening line.

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.
