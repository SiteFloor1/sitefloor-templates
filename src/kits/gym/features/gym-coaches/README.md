# The coaches

| | |
|---|---|
| Feature id | `gym-coaches` |
| Plan | plus and above (a page: `coaches.html`) |
| Config | `coaches` `{ title, intro, items: [{ id, name, photo, role, qualifications: [...], text }] }` |

Each coach's portrait, role and a few words on how they coach, the classes they take this week and their
qualifications as on their certificates. The week is read from the timetable by the coach's name
(`timetable.weekly[].coach`), so it can't drift from it: the check refuses a coach whose name isn't on the timetable.
The gym uses this instead of the shared `team` page, which knows nothing of a timetable.
