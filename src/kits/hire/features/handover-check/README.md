# Feature: handover-check (hire kit, Signature)

The handover checklist (`/handover-check`, unlisted, free on the page count). **Plan:** Signature (any plan as an add-on).
The business sends the link at the handover: `…/handover-check?ref=DH-4821&car=bmw-m5`.

- **At collection, and again at return,** the customer and the driver go round the car together: each of the client's
  panels (`hire.check.panels`, 3–20, in the client's words) marked with what was seen or left as "nothing seen", the
  fuel or charge in eighths, the mileage on the dash. "Record this moment" dates it on the business's clock.
- **What changed:** with both moments recorded, the page lists new or changed marks, fuel down and miles driven, in
  plain words. It records what was seen; it never judges damage or decides a deposit.
- **Kept on the customer's phone** (local storage, per reference and car); nothing is sent anywhere until they tap
  "Send it to us on WhatsApp" (the whole record as text) or "Save a copy" (a dated text file). Photos of marks go in the
  same chat. If the phone won't store, the record lasts for the visit and can still be sent.
- **Without JavaScript:** the panel list and a line saying the business records it with them.

Config: `hire.check` `{ panels, message }`, `checkPage` (page copy). The lines it writes are tested in
`tests/unit/hire.test.js`.
