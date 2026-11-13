# The films (WVID-3 search by venue, Plus)

| | |
|---|---|
| Feature id | `films-page` (page `films`) |
| Plan | plus and above |
| Config | `films`: `message` (WhatsApp opening for "Ask about a film like this"), `venues` (`{ id, name, area }`), `items` (each `{ id, title, venue, season, text, poster: { src, width, height, alt }, clip: { src, width, height }, watch? }`; `clip` a short `.mp4` of the film, `watch` the whole film on the studio's Vimeo or YouTube). Page head in `filmsPage` |
| Files | `films-page.njk`, `.js`, `.css`; page `src/kits/weddingfilm/pages/films.njk` |

Each wedding's film, the still first: the clip downloads only when its Play is pressed, with sound off and the
player's own controls. Venue chips (shown when there is more than one venue) find films by venue. Venues are named
only with the couple's and the venue's agreement.
