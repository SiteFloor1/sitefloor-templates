# The timetable page

| | |
|---|---|
| Feature id | `gym-week` |
| Plan | plus and above (a page) |
| Config | `timetablePage` (`title`, `intro`), with the timetable, the classes and `busy` |
| Files | `gym-week.njk`, `.js`, `.css`; `busyDay` in `src/kits/gym/lib/gym.js` |

A day at a time, today first: the day's classes with "Book in the app", and how busy the club usually is hour by hour,
drawn as fine rules against the day's busiest hour, with the hour now marked on today. Always "usually": the club's own
averages, never presented as live.
