# Exams

| | |
|---|---|
| Feature id | `ballet-exams` |
| Plan | plus and above |
| Config | `exams`: `text` (the school's words on exams), `board?` (only if the school names one, in its words), `photo?`, `items` `[{ id, date, label, classes: [class ids] }]`; `examsPage` `{ kicker, title, intro }` |
| Files | `ballet-exams.njk` (the exams page), `ballet-exams.css`, `ballet-exams.js` |

## What it does
The school's words on exams, then each exam date with the classes sitting it, and "Add exam dates to my calendar" (one
.ics). With `ballet-year` on, the exam dates also run round the home page's ring.

## Rules
- Never name an exam board (RAD, ISTD, IDTA, BBO…) unless the school does: `board` is empty by default.
- On a demo the dates move ahead with the year's (`src/demo/dates.js`).
