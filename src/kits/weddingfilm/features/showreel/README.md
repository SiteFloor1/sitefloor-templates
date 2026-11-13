# The film in chapters (WVID-6, showpiece)

| | |
|---|---|
| Feature id | `showreel` (needs `hero-film`) |
| Plan | signature |
| Config | `chapters`: `length` (the hero film's length in seconds) and `items`, two to six `{ title, at }` (`at` = seconds into the film; the first is 0) |
| Files | `showreel.njk` (included by the look's hero), `.js`, `.css` |

The hero film's chapters, printed under it like a cinema programme (I The lake, II First look…). Each chapter is a
button: tap to go there; the current one is marked and its line fills as it plays. "Watch full screen" makes the film
and the programme fill the screen; on an iPhone it opens the phone's own player.

Cut the wide and tall films at the same chapter times. A tap plays the film even with reduced motion, because the
visitor asked for it.
