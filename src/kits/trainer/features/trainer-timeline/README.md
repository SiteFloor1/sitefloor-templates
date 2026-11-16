# trainer-timeline (Signature, PT-6)

Your twelve weeks: choose how often (the first month's `often` choices), the first session's date and time (starts
from the diary's earliest open hour when there is one). The twelve weeks lay out under the trainer's `phases`, every
session dated; bank holidays (from the studio's postcode, `core/lib/bank-holidays.js`) and days the studio is closed
(`hours.exceptions` with no hours) are struck through and not booked, and so is any session outside that weekday's
opening hours (`hours.weekly`: a Sunday when the studio is shut, 19:00 on a Saturday that closes at 14:00). The summary gives the finish date and the cost
from `firstMonth.prices.session`; "Save every session" downloads one .ics (UTC times); "Send this plan" writes the
WhatsApp message. Nothing about outcomes: phases name what the training is, never what it will do.
Lives on the Prices page when `trainer-prices` is on.

```json
"timeline": {
  "title": "Your twelve weeks", "intro": "…", "message": "Hello, I'd like to plan twelve weeks:",
  "phases": [{ "from": 1, "to": 4, "name": "Foundations", "text": "…" }, { "from": 5, "to": 8, … }, { "from": 9, "to": 12, … }]
}
```
The phases must follow on from week 1 to week 12.
