# business-flowers (florist kit, Signature, unlisted page `your-flowers`)

Your flowers this week, for each business client: the florist sends `your-flowers#GLB2Q8`. The page reads that code
(never a name in the link) from `contract.accounts`'s published Google Sheet: the client's name, the week, what's
going where, when it changes next, a note and a photo from their Google Drive, plus a button to ask for a change.
Unknown, unreadable or not updated for `staleAfterDays` (default 8) says "message us". Kept out of the sitemap and search; free on the page count.

**The whole Sheet is public.** A published Sheet can be read by anyone who has its address, and the address is in the
page. The page only shows the row for the code typed, but the full Sheet is downloadable, so every client's row can be
read. Put only what the client wouldn't mind another client seeing: the business name, what's going where, the next
change and a photo of the flowers. No contacts, prices, invoices or access details. Use a separate Sheet for this.

Sheet columns: `code, name, week_of, pieces, next_change, note, photo, updated_at`, with pieces written as
`Lobby: two urns of roses; Restaurant: twelve bud vases`. Demo: `"source": "simulated"` with an `example` code.
Uses the same provider as `follow-order` (`src/kits/florist/features/follow-order/sheet-provider.js`;
demo `src/demo/florist-provider.js`).
