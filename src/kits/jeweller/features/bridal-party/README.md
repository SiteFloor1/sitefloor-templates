# Feature: bridal-party (jeweller, Plus)

A page for bridal party pieces: matching pieces for bridesmaids, mothers, flower girls and the rest of the party. Each
role gets its piece and how many; the wedding date, names for the boxes and a note go with it. What it comes to shows
at the client's own prices ("price on request" when a chosen piece has none) and is sent as a request on WhatsApp. The
house replies with whether they can be ready in time and the price with any engraving.

- **Page:** `/bridal-party`. **Config:** `party: { title, intro, description?, photo, photoPhone, pieces, roles, max, lead? }`.
  `pieces` are ids from `pieces.items`; `roles` are the client's words ("Bridesmaids", "Mothers of the bride and groom");
  `max` is the most of one piece in an order; `lead` is the client's own notice ("Allow ten weeks…").
- **No JavaScript:** a plain WhatsApp link. **Words:** `partyText()` and `partyTotal()` (unit-tested).
