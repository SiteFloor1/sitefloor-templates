# commission (tailor kit, Signature)

Your commission, by code. The client types the code on their order card (or opens the link `…/#CODE` the house sends)
and sees the coat's stage as the house's own photographs: done, the current stage (stitched underneath), and still to
come; the next fitting with "Add to calendar" (a timed event); the cloth, which opens in the cloth book's weave.

The house's Google Sheet, published as CSV, may hold only these columns:

```
code,stage,next_fitting,cloth,updated_at
FL4K7M2Q,forward,2026-11-12 11:00,midnight,2026-11-03 16:20
```
A random 8–12 character code (letters and numbers), a stage id from `commission.stages`, the next fitting (or empty),
a cloth id from the cloth book (or empty) and when the row was updated. Never a name, measurement or note: a published
sheet is public. Anything in any other column, headed or not, makes the whole sheet refused, and the page says to call.
Unknown, stale (older than `staleAfterDays`) or unreadable says to call.

```json
"commission": { "source": "sheet" | "simulated", "csvUrl": "https://docs.google.com/spreadsheets/d/e/…/pub?output=csv",
  "staleAfterDays": 14, "fittingMinutes": 60, "stages": ["cut", "baste", "forward", "finished"], "example": "<demo only>" }
```
Each stage is a `process.steps` id and needs that step's `photo`. Heading: `sections.commission`.


Optional, shared with `wedding-order`: `"fittingReminder": { "at": "18:00", "items": ["the shoes and shirt you'll wear with it", "your order card"], "weddingSteps": ["baste", "forward"] }`.
The calendar file then carries an alarm at that time the evening before (the house's time zone), with "Bring …" in
the house's words. The calendar shows it; nothing is sent from the site. Some calendars use their own reminders.
