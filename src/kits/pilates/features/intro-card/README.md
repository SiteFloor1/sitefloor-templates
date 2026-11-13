# Intro card (PIL-5)

| | |
|---|---|
| Feature id | `intro-card` |
| Plan | plus and above |
| Config | `introCard`: `text`, `classes` (holes on the card), optional `days`, `price` (the studio's own, whole pounds), `payLink` (the studio's Stripe Payment Link; a test link on demos), `note`, `photo`; `sections.introCard.title` is the card's title |
| Files | `intro-card.njk`, `.css` |

## How it works
The intro offer drawn as a class card with one hole per class (the studio punches one at each visit). "Buy the
card" opens the studio's own Stripe page. No price is shown unless the studio gives one.
