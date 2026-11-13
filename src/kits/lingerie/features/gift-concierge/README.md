# gift-concierge (lingerie kit, Signature)

For the man buying: her birthday, your anniversary (he picks the day and month) and the shop's fixed dates
(Valentine's…) go into his own calendar in one file: each date every year, and reminders the shop's chosen number of
days before (separate all-day events, because many calendars drop alarms from imported files). A second action sends
the dates to the shop on WhatsApp so it can plan ahead. Nothing is stored on the site or sent until he chooses.

```json
"concierge": { "leads": [21, 7], "dates": [{ "id": "birthday", "label": "Her birthday" }, { "id": "anniversary", "label": "Our anniversary" }, { "id": "valentines", "label": "Valentine's Day", "md": "02-14" }] }
```
Heading: `sections.concierge`. Logic: `src/kits/lingerie/lib/gifts.js` (29 February falls on the 28th in other years).
