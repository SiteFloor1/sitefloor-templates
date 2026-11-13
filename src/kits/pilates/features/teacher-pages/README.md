# Teacher pages

| | |
|---|---|
| Feature id | `teacher-pages` |
| Plan | signature (needs `team`) |
| Config | `teacherPages.items`: `{ id, name (exactly as in staff), line, training (their words, short lines), private? }`; photo, role and bio come from `staff` |
| Files | `teacher-page.njk`, `teacher-pages.njk` (no home section), `.css`; pages `src/kits/pilates/pages/teacher.njk` (`teacher-<id>.html`) |

## How it works
A page per teacher: their photograph and words, their training, the classes they teach each week (read from the
timetable, so it never disagrees with it), and "A private session with …" on WhatsApp when they teach them. The team
page links to each. Counts as one page however many teachers there are.
