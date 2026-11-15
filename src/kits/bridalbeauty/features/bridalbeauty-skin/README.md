# Skin prep, counted down

| | |
|---|---|
| Feature id | `bridalbeauty-skin` |
| Plan | signature |
| Config | `skin`: `{ message, steps: [{ id, label, daysBefore, text }], note }`; `skinPage`: `{ kicker, title, intro }` |

Her wedding date gives each step its day, in the artist's own words (the trial window, nothing new on her face, brows,
the night before, the morning); steps already past are marked, and the rest go into her calendar as all-day reminders.
This is the artist's advice on preparing skin for makeup, not medical advice: `note` must say that treatments are a
question for a clinician (the config check refuses a note that doesn't).
