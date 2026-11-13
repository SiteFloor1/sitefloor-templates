# The afternoon tea page

| | |
|---|---|
| Feature id | `tea-page` (page `afternoon-tea`) |
| Plan | plus |
| Config | `teaPage`: `kicker`, `title`, `intro?`; uses `tea` and `tableRequest` |

## How it works
A page of its own for afternoon tea: the spread and the request card, then whichever of Your table, the salon plan,
the seasonal stands and the tea sommelier are on. A look can move those off the home page when this page is on
(`look.json` → `onPages`), so each appears once. Your table isn't moved: a look may keep it on the home page as its
showpiece and on this page too (Salon does), each with its own request card.
