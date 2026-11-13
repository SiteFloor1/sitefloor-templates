# When someone has died (Plus, page `when-someone-dies`)

The first steps in order with gov.uk links; suggested reminder days from a chosen start date, as one calendar file. Reminders are not deadlines; each step states the real rule.

## Config

```json
"bereavement": { "title", "intro", "help", "checked": "YYYY-MM", "steps": [{ "id", "title", "text", "remindDays": 1, "link": { "label", "url": "https://www.gov.uk/…" } }] }
```

Markup is neutral and styled with tokens; each look restyles it.
