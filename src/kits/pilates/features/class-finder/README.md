# Find your first class

| | |
|---|---|
| Feature id | `class-finder` |
| Plan | plus and above (needs `timetable`) |
| Config | `classFinder`: the class id the studio chooses for `new`, `slower`, `steady`, `faster`, and optional `pregnancy` (leave out if no pregnancy class; the question is then not asked); `sections.classFinder` |
| Files | `class-finder.njk`, `.js`, `.css`; the choice is `findClass` in `src/kits/pilates/lib/classes.js` |

## How it works
Three taps: done reformer before, the pace you'd like, pregnant or postnatal. A pregnancy answer wins, then "never",
then the pace. It names the studio's class, its line, and its next three times with places (when known) and Book.

## When something is missing or fails
Without JavaScript it names the first-class class and the questions do nothing.
