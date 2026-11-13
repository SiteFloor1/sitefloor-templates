# Feature: deposit-status (hire kit)

Where's my deposit (`/deposit`, unlisted). **Plan:** Plus. Free on the page count, like Plan your visit: an unlisted
utility page reached only by the link the business sends (`/deposit?ref=DH-4821`). Kept out of the sitemap, `noindex`.

The status comes from the client's Sheet **by reference only** (never a name): held, car checked or returned, with the
date. A held or checked deposit must have been updated within `staleAfterHours`, or the page says "ask us"; a returned
one is final. Refreshes every 20 seconds while open.

**Deposits tab** (published as CSV): exactly `ref,status,date,updated_at`; `status` is `held`, `checked` or `returned`.
**A published tab is public:** anyone who finds its address can download all of it. Keep names, phone numbers and
notes on a separate tab that is NOT published, and never use a name as the reference. If the published tab has any
other column, the page refuses it and says "ask us" until it's fixed. Config: `hire.deposits` `{ source, csvUrl, staleAfterHours, example? }`
(`example` on demos only), `depositPage` (page copy). Logic written fresh in the hire kit (`lib/sheet.js`); nothing is
imported from the car studio kit.
