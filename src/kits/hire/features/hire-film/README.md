# Feature: hire-film (hire kit)

The home hero as a muted film loop of the client's own car. **Plan:** Signature. The still shows first (it's the hero
photo); the film loads only after the page has loaded, never under reduced motion or data saver, and the shared Pause
button stops it (it moves for more than five seconds). Real client sites use the client's own footage; a demo film
animated from one photograph says so in `hire.film.note`.

Config: `hire.film` `{ src (img/….mp4), poster { src, width, height, alt }, note? }`.
