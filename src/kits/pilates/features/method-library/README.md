# The method library (Signature showpiece)

| | |
|---|---|
| Feature id | `method-library` |
| Plan | signature |
| Config | `method`: `kicker`, `title`, `intro`, `items` (2–24 `{ id, name, line, text, works, springs, easier, harder, classes (class ids), photo }`) |
| Files | `method-library.njk` (the library page), `exercise.njk` (one exercise), `.css`; pages `method.njk` and `exercise.njk` (`exercise-<id>.html`) |

## How it works
"What will I actually do?" answered exercise by exercise: a photograph, what it works, the usual springs, an easier and
a harder version, and the classes it comes up in (linked to the class pages). Every word is the studio's; springs vary
between machines, so the page says the teacher sets them. Good for search: each exercise is its own page. Counts as
one page however many exercises there are.
