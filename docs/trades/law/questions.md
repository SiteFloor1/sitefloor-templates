# Law firms (private client): customer questions

What this trade's customers ask before they get in touch (kit `law`). How to read it and the questions every trade gets: [`docs/CUSTOMER-QUESTIONS.md`](../../CUSTOMER-QUESTIONS.md).

## Law firm, private client (law kit)
Every fact (prices, people, SRA numbers, matters, insurance) comes from the firm's `site.json`. The regulator's facts
(SRA Transparency Rules, Legal Ombudsman time limits) live in `src/kits/law/lib/sra.js` with the date they were checked;
the intestacy rules in `lib/intestacy.js`. Nothing is guessed, and nothing promises an outcome.

| Question | Answered by |
|---|---|
| Who will actually handle my matter, and who supervises them? | practice index and practice page: the partner who leads each area; Speak to a partner shows them by practice; prices page names who does the work and their experience |
| Are you regulated? By whom? | the SRA digital badge under the first call to action, the SRA number on every page (footer), the regulation plate, every solicitor's SRA ID with a link to the register |
| What will it cost? VAT? Disbursements? | prices and service information (free on every plan) for every service rule 1 lists that the firm offers; the probate estimator (Signature), never outside the published range; "a written estimate before we start" for everything else |
| How long will it take, and what are the stages? | prices page (stages, timescale); your matter, step by step (Plus) |
| Have you done this for people like me? | practice pages and area pages (what the firm does); public matters the client approved, with a public source (Signature) |
| Is it confidential? Can I speak to you before naming everyone? | conflict-safe first contact (Plus): only who is involved, so the firm checks it can act first |
| Is the first meeting charged? What should I bring? | questions; the first-meeting pack (Signature); what to gather (Plus) |
| Where do I go? Can I arrive discreetly? Parking? | discreet arrival (Plus), the house room by room (Signature), Plan your visit |
| Can you work with my advisers or family abroad? When can I reach you? | our day in yours (Plus): the firm's hours in the client's time zone |
| What if I'm unhappy? | complaints and regulation (free on every plan): the firm's procedure, the Legal Ombudsman (8 weeks, one year, six months), the SRA |
| What insurance do you hold? | complaints page: insurer, address and where the cover applies |
| Someone has died: what do I do first? | when someone has died (Plus): steps in order with gov.uk links and calendar reminders |
| Who inherits if there's no will? Do I need to change my will? | if there's no will (Signature, England and Wales, dated and sourced); the will review reminder (Plus); guides |
| What do these words mean? | words we use (free on every plan) |
| Where has my matter got to? | your matter, by code (Signature; the firm's sheet holds only a code, a stage and a time) |
