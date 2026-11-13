# dessert-box: the box (bakery kit, Signature)

The shop's pick-and-mix counter, online. The visitor:
1. chooses a box (`box.sizes`: 4, 6, 9, 12 or 16 pieces, each at the shop's own flat price);
2. taps chocolates to place them one by one into the box (taps a place to take one out);
3. ties the ribbon when it's full, and writes the card;
4. orders it for collection on WhatsApp, or as a gift: the shop gets the order, and the sender gets a "Send them the
   gift link" message to pass on. The link opens `gift.html`, which shows their box, the card, who it's from and when
   to collect. Everything is in the link itself (nothing is stored); a broken or edited link shows a plain message.

Pieces sold out today (from the `bakes` sheet) can't go in, and come out of an open box if they sell out. If a size
has a `payLink`, a "Pay for the box" button appears once the ribbon is tied (the shop's own Stripe Payment Link).

## Config
```json
"box": { "sizes": [{ "n": 6, "price": 12 }, { "n": 12, "price": 22, "payLink": "box-12" }, { "n": 16, "price": 28 }],
         "cardMax": 140, "start": ["gianduja", "dark-70"], "note": "Boxes keep for two weeks somewhere cool." }
```
Each piece is a menu item with `"box": true` and a `tile`: a square photo of the piece from above, cut out
(transparent around it), about 360 × 360. Shoot every piece on the same day, in the same light, straight down.
The look supplies the seal on the ribbon (`src/looks/<look>/parts/seal.njk`; none, no seal).

Logic: `lib/box.js` (price, message, gift link; unit-tested).

## Alternative showpiece: your words on the bar
Not built. The visitor types a name or a short message and sees it printed in the brand's lettering on a photo of
the shop's own wrapper, picks the chocolate and a collection day, and pays a deposit. Needs a straight-on wrapper
photo, a printer or label supplier, and a Stripe link. About 2 KB of script and one 80 KB photo.
