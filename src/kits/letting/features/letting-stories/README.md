# letting-stories: owner stories (Signature)

A page of owners' stories: the home and service, a title, before / what we did / since, the owner's own figures,
and the owner (as they agree to be named) with the month. **On a client site every story must be real**: each needs
`consent: true` (the owner agreed in writing to its publication), a `date` (YYYY-MM) and the owner's name or
initials; the settings check refuses a story without them. On a demo the page says the owners and figures are
fictional, and each story is marked so. Settings (`stories`): `title`, `intro`, `items`:
`{ title, home, service, before, did, after, figures: [{ value, label }], owner, date, consent }`.
