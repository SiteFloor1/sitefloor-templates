# lookbook (Signature) → `lookbook.html`
The season's campaign as a printed book: a cover (wordmark, title, season, the first look), then spread by spread (two
portrait looks face each other across the fold; a landscape look takes a spread), each page numbered with its look's
caption and the pieces worn; a back page; then a contact sheet that jumps to any look. The rail scrolls sideways with
the arrows, the keys or a swipe; nothing is tied to the page scroll. Each look's marks (`pieces[].x/y` in % of the
photo) open a slip: the piece, its price, what's left (from the sheet) and a link to it. Links to `#look-7` open the book there.

`lookbook = { title, season, credit?, looks: [{ photo, caption?, pieces?: [{ id, x, y }] }] }`, four or more looks.
