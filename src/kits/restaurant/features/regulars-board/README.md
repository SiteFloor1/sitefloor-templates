# The regulars' board

| | |
|---|---|
| Feature id | `regulars-board` |
| Plan | plus (add-on on any plan) |
| Config | the specials sheet's `board` rows: `board,Guest roaster,,Larkhill: a washed Ethiopian on filter,<time>`; needs `specials`; `sections.board` |
| Files | `regulars-board.njk`, `.css`, `.js` |

## How it works
Cards pinned behind the counter, from the café's own sheet: the label (Guest roaster, On the stereo, Dog of the week,
anything) and the text, each saying when it was pinned. The newest card for each label wins; cards drop off after seven
days (the one kind of row that isn't "today only"). Up to six show.

## When something is missing or fails
No cards, or the sheet can't be read: "Ask us what's on the board this week."
