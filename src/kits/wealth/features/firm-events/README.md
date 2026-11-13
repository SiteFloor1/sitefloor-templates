# Events (Signature)

Seminars and next-generation evenings, soonest first: date, time, place, a short summary, "Reply to attend" (a
pre-written email to `reply`, or the firm's own form link) and "Add to calendar" (a calendar file made on the page,
times in UTC). Past events drop off by themselves.

The firm publishes them like insights, from its own Google Sheet; a row shows only once compliance has ticked it,
named the approver and dated it, and never if it promises a return (COBS 4.2):

| Title | Kind | Date | Start | End | Place | Summary | Reply | Approved | Approved by | Approved on |
|---|---|---|---|---|---|---|---|---|---|---|

```json
"events": { "title", "intro", "reply": "events@firm.co.uk", "source": "sheet", "csvUrl": "https://docs.google.com/spreadsheets/d/e/…/pub?output=csv", "items": [] }
```

`source: "site"` writes events into `items` (each with `approvedBy` and `approvedOn`); a demo uses `"simulated"` with
a `sample` CSV.
