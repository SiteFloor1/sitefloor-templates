# Fine jewellers: customer questions

What this trade's customers ask before they get in touch (kit `jeweller`). How to read it and the questions every trade gets: [`docs/CUSTOMER-QUESTIONS.md`](../../CUSTOMER-QUESTIONS.md).

## Jeweller (jeweller kit)
Every fact about a piece (metal, stones, carat, hallmark, certificate, sourcing, price) comes from the client's
`site.json`; a field the client hasn't filled is simply not shown. Nothing here is ever guessed.

| Question | Answered by |
|---|---|
| Can I see it in person? Do I need an appointment? Is it private? | private appointment request (WhatsApp on Starter; date picker with the shop's own slots, notice and closed days on Plus); "by appointment" and walk-in hours from `visitInfo` |
| What does it cost, or roughly what range? | each piece's price, "from £…" or "Price on request", only as the client sets it; collection price bands if the client gives them |
| What is it made of: which metal, which stones, what size or carat? | the piece page: the client's own spec lines, nothing added |
| Is it hallmarked? Does it come with a certificate? | the piece's `hallmark` and `certificate` fields, shown only when the client fills them; never inferred |
| Can you make something bespoke? How long, what's the process, is there a deposit? | bespoke commission page: the client's own steps, timings and deposit wording; brief sent on WhatsApp; deposit through the client's own Payment Link (Plus) |
| What's my ring size? Can you resize it? | on-screen ring sizer calibrated against a bank card (Plus); resizing answer in `questions` |
| What does it look like on a hand, in real light? | the piece shown large in macro photography; "see it on a hand" at the client's stated size (Signature) |
| Do you engrave? | `questions` (the client's own answer, cost if they give one) |
| Does it come in a box? Can you gift wrap it? | `questions`; the client's own box photographed on the piece page if supplied |
| Returns, aftercare, cleaning and repairs? | `questions` (the client's own policy, never a default) |
| Where are you, is there parking, is it discreet? | `visit` / Plan your visit: address, discreet entrance note, parking, nearest station |
| Do you do insurance valuations? | `questions` (only if the client offers them) |
| Can I buy a gift card? | gift `vouchers` (Plus) |
| What have you made before? Can I trust you? | collections and past commissions (client's own photos); real `reviews` with name and date |
