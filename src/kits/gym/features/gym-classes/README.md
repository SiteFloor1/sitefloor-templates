# Class finder (GYM-4)

| | |
|---|---|
| Feature id | `gym-classes` |
| Plan | plus and above (a page: `classes.html`) |
| Config | `classFinder` `{ title, intro, goals: [{ id, label }], levels: [{ id, label }] }`, and on each class in `classTypes.items`: `goals` (ids) and `level` (an id) |

Three plain choices: what the class is for (the club's own goals), who it suits (the club's own levels) and the time of
day (before ten, ten to four, after four, from the timetable). The number of classes that fit is set large; each class
shows every time it runs this week, with its coach, and "Book in the app". Pressing a choice again lets it go.

The build writes every class and time, so the page works without JavaScript (everything shows) and nothing moves when
the script starts. A class that isn't on this week's timetable says so instead of disappearing. The matching rule is
`classMatches` in `src/kits/gym/lib/club.js` (unit-tested).
