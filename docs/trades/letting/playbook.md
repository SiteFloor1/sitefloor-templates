# Independent letting agents: playbook

What to build for this trade (kit `letting`). The ground rules and the steps for a new kit:
[`docs/TRADE-PLAYBOOK.md`](../../TRADE-PLAYBOOK.md). Customer questions: [`questions.md`](questions.md).

## Independent letting agent (kit `letting`) — plan, 15 Nov 2026 (stage 1: awaiting the owner's pick of a design)

An independent agent for long lets in England: calm and professional, never a portal clone. The site answers the four
things people ring about (what's available, can I see it, what does it cost, what do landlords get) and shows the
legal basics plainly, because an agent that shows its fees and schemes up front looks more trustworthy than one that
hides them.

**Always on, every plan (the law requires them):** the fees page (a free page, like Plan your visit), linked from every
page: tenant payments (only the permitted ones) and landlord fees with VAT, then the redress scheme and the client money
protection scheme by name, with the certificate link. Every home shown anywhere carries its rent, holding deposit,
tenancy deposit, council tax band and EPC rating. The kit refuses a site.json whose holding deposit is over 1 week's
rent, whose deposit is over the 5- or 6-week cap, that asks for rent in advance over 1 month, that lists any tenant fee
the Act doesn't permit, or that has no redress scheme.

**Starter** (home + Plan your visit + fees)
- `letting-board` homes available now: the agent's sheet as a short list on the home page (area, beds, rent, available
  from, the Part A facts), with the sheet's "updated" time; a stale or broken sheet hides the list and shows the phone
  and WhatsApp instead (fails closed).
- `letting-fees` the fees page (above).
- `letting-movein` the easy extra: "what you'll pay before you move in". Type a rent; it shows the holding deposit, the
  tenancy deposit and the first month, worked out from the agent's own multipliers within the legal caps, and says
  there is nothing else to pay. Pure logic in `lib/`, unit-tested on the caps (£50,000 and £100,000 a year).
- Viewing request by WhatsApp with the home's reference filled in (shared WhatsApp logic).

**Plus** (up to 5 pages: Home, Homes to rent, Book a viewing, Landlords, Areas)
- `letting-homes` filters (area, beds, rent, available from, pets considered, parking): the easy extra for Plus.
- `letting-areas` area pages: the agent's own notes per area, with a credited photograph of that area only.
- `letting-repairs` report a repair: what to tell us, what counts as an emergency, the out-of-hours line, a WhatsApp
  message with the home's reference (the tenant attaches photos in WhatsApp).
- `letting-services` the three services side by side, what each includes, priced from the fees list (one source).

**Signature** (17 pages; the homes count as one)
Showpieces, 2 to 3 of these:
1. `letting-homes` as a collection: a page per home from the agent's sheet: lead photograph, Part A on the card, Parts
   B and C on the home's page ("no more than one click away"), status, available from, how to view, share. Let agreed
   homes stay for 14 days marked as let, then go. Stale sheet: no home is shown as available.
2. `letting-net` "what you'd receive", for landlords: type a monthly rent, choose a service; the agent's own rates (with
   VAT) give the monthly fee, what reaches the landlord, and the one-off charges in the first year. Labelled an
   illustration using our published fees, not advice; never estimates a rent, never mentions yields, tax or mortgage
   figures; "send me this" copies a WhatsApp summary. Reads the same numbers as the fees page, so they can't disagree.
3. `letting-viewings` open viewings: the agent's slots per home from the sheet (time, places left), book one by
   WhatsApp or email with a calendar file; past and stale slots never show.

Alternative showpieces (alongside or instead):
- `letting-compliance` your home's year, by code (landlord): gas safety, EICR, EPC expiry, deposit protected date,
  next inspection, from the agent's sheet, with calendar reminders. No photos needed.
- `letting-timeline` from holding deposit to keys (tenant): the 15-day deadline worked out from the date paid,
  referencing, signing, rent, move-in, as a calendar file. No photos needed.
- `letting-real` "Is this really us?": our bank details never change by email or message; how to check. Lettings
  deposits are a common fraud target. Could be always-on.
- Switching agent: what we need from your current agent, in order.
- Client-only (need the agent's own matched material, so never on a demo): multi-photo galleries of one home, floor
  plans, the agent's own 3D tour embedded, refurbishment before/after.
- Dropped from the approved list: the stay-length price (PROP 9): long lets are now periodic with no end date, so a
  price by length would mislead.

Pages (Signature): Home · Homes to rent · Areas · Book a viewing · Fees (free) · Landlords · Our services · What you'd
receive · Rental valuation · Renting with us · Repairs and emergencies · What landlords must do (dated GOV.UK checklist)
· Renting is changing (Renters' Rights Act, dated) · Switch to us · About us · Is this really us? · Journal (the agent's
own writing: getting a deposit back, preparing a home to let). Plus Plan your visit and privacy, free.

Design directions (three static screens, awaiting the owner's pick): `sitefloor-internal/docs/trades/letting/directions.md`.

**Photographs (checked 15 Nov 2026).** Free, licensed single interiors (Unsplash License) and street photographs of
English cities are plentiful. Matched sets of several rooms of one real home could not be confirmed, so each demo home
shows one lead photograph of one place, never rooms from different homes presented as one. Area photographs show only
that area. Nothing bought.

**Honesty:** demo redress and CMP membership numbers are marked "demo"; client sites need the real scheme names and
certificate link (`npm run rules` refuses a demo marker on a client). Rents, fees and homes come only from the agent.
No review stars in structured data, no "days to let" or "occupancy" figures unless the agent supplies them. Legal
lines are dated and live in `src/kits/letting/lib/rules.js` with their GOV.UK source.

**Running cost £0:** a Google Sheet for homes and viewing slots, WhatsApp, the agent's own email, calendar files.
