# The queue now (`popup-line`, Signature)

Staff tap the wait into a Google Form on a phone at the door; the form writes to a sheet the brand publishes as CSV
(columns `minutes`, `updated_at` as "2027-01-09 14:05"). The run shows "Queue about 20 minutes (at 2:05pm)" or "No
queue right now (at 2:05pm)".

```json
"line": { "source": "sheet", "csvUrl": "https://docs.google.com/spreadsheets/d/e/…/pub?output=csv", "staleAfterMinutes": 30 }
```

Fails closed: a row older than `staleAfterMinutes` (default 30), an unreadable sheet, or the pop-up being closed hides
the line. It never guesses a wait. A demo uses `"source": "simulated"`.
