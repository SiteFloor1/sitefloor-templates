# Where she'll go next

| | |
|---|---|
| Feature id | `ballet-path` (needs `ballet-classes`) |
| Plan | signature |
| Config | `path`: `text` (the school's words on moving up, e.g. "Usually, when her teacher says she's ready"); classes' `ages` |
| Files | `ballet-path.njk` (on the classes page), `ballet-path.css`, `ballet-path.js`; logic `pathFrom` in `lib/ballet.js` |

## What it does
Answers "where is this going?" From the child's age now (tapped), the classes she would usually move through, year by
year: "Ages 3–4 Little ballet, Ages 5–6 Ballet one…". Where two classes take the same age (a boys' class beside the main
one), the main line follows the first class listed.

## Rules
- Never a promise: the words say "usually", and `text` gives the school's own rule. No grades or pointe ages unless the
  school writes them.
