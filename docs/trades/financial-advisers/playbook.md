# Financial advisers: playbook

What to build for this trade (kit `ifa`). The ground rules and the steps for a new kit:
[`docs/TRADE-PLAYBOOK.md`](../../TRADE-PLAYBOOK.md). Customer questions: [`questions.md`](questions.md).

## Independent financial adviser (kit `ifa`), plan, 16 Nov 2026 (features and pages approved; design round 2)

A small UK advice firm (one to ten advisers) that helps people retire, pass money on and protect their family. The
site answers the four things that decide a first meeting: what it costs in pounds, whether the first meeting is free,
whether the firm is independent, and whether it's really regulated. It must feel like Coutts' discretion with Schroders'
clarity, and look nothing like Lyall Harrow (wealth: white, light Mona Sans, navy band, people at a distance) or
Calder Wyke (law: ivory, serif headline left, library photograph right).

**Status: the feature codes and the page list below were approved by the owner on 16 Nov 2026**, including Fees in
pounds as the hero showpiece ("arithmetic on the firm's published fees; projections stay banned"). `docs/VISION.md` already has a
short IFA row (approved 29 Oct: IFA 1 S services, team, FCA numbers · 2 P fees explained · 3 P first meeting checklist ·
4 Sig life-event guides, "No calculators", and twelve pages). This plan keeps those four codes as they are and adds
more. "No calculators" still means no growth, return or projection tools; IFA-6 is allowed because it only multiplies
the firm's own published fees.

### Compliance (non-negotiable; pages read 16 Nov 2026)
- FCA Handbook COBS 4.2 (fair, clear and not misleading; capital at risk made clear): handbook.fca.org.uk/handbook/COBS/4/2.html
- FCA, "Risk warnings for mainstream investments" (11 Dec 2025): no prescribed wording, and no separate warning box is
  required, but the risk must be made clear and balanced. The kit puts one plain sentence beside every mention of
  investing ("Investments can fall as well as rise, and you may get back less than you put in"), never a repeated banner:
  fca.org.uk/firms/risk-warnings-mainstream-investments
- COBS 6.2B (describing advice services: independent or restricted, said plainly): handbook.fca.org.uk/handbook/COBS/6/2B.html
- GEN 4 Annex 1 (statutory status: "authorised and regulated by the Financial Conduct Authority", spelt out, not "FCA"):
  handbook.fca.org.uk/handbook/gen4
- Financial Ombudsman Service: financial-ombudsman.org.uk (in every footer, with the FRN and a direct link to the firm's
  entry on the Financial Services Register, not the register's home page)
- GOV.UK: State Pension age 66 to 67 between April 2026 and April 2028; 67 to 68 legislated for 2044–46; the third review
  launched July 2025 and is under way (gov.uk/government/collections/third-state-pension-age-review). Normal minimum
  pension age rises from 55 to 57 on 6 April 2028 (gov.uk/government/publications/increasing-normal-minimum-pension-age).
- The build refuses: "guaranteed", "best", "risk-free", any percentage return, any growth projection, and an FRN that
  isn't six or seven digits (a demo shows 000000). Testimonials, if a client ever wants them, are financial promotions
  too: service only, never returns; the kit doesn't offer them by default.

### Proposed features (codes as the other trades)
- **IFA-1 S** services, team, FCA numbers (approved). The FCA line on every page; each adviser with their individual
  reference number linked to their register entry; who we help and the firm's own minimum.
- **IFA-2 P** fees explained (approved). The firm's published fees as a table: initial, ongoing, one-off and hourly if it
  offers them, what the ongoing fee includes, how the firm is paid, which fees carry VAT. Platform and fund charges named
  as separate.
- **IFA-3 P** first-meeting checklist (approved), with booking: what to bring, ticked on the device only (nothing sent),
  then the firm's own booking link or a form that refuses account numbers.
- **IFA-4 Sig** life-event guides (approved): retiring, inheriting, selling a business, divorce, a parent needing care.
  General information, each dated and sourced.
- **IFA-5 S** check it's us (proposed, the Starter easy feature): the firm's register entry, the numbers it calls from,
  and what it will never ask for, with the FCA's ScamSmart link. Free, takes ten minutes to fill in, and answers a real fear.
- **IFA-6 Sig** Fees in pounds (approved; the hero showpiece): type an amount, see the firm's published fees as a statement in pounds (once, each year, each month, first year).
- **IFA-7 S** independent or restricted (proposed, always on): one plain paragraph saying which the firm is, what that
  means for the client, and where free guidance lives (MoneyHelper, Pension Wise).
- **IFA-8 P** secure upload (proposed): a link to the firm's own client portal or secure upload, with the warning never
  to email statements. Nothing hosted by us.
- **IFA-9 P** your year with us (proposed): the review rhythm as the firm describes it (first plan, annual review,
  what triggers an extra meeting), with an .ics reminder for the client's own review month.
- **IFA-10 Sig** Milestones (proposed showpiece): enter a year of birth; see the year you can usually take a pension
  and your State Pension age year under current law, sourced to GOV.UK.
- **IFA-11 Sig** old pensions list (proposed showpiece): list old employers on the device; get a printable tracing list
  with the GOV.UK Pension Tracing Service link and what to ask each scheme.

### Split by plan
- **Starter** (home + Plan your visit, here "First meeting"): IFA-1, IFA-7, the FCA footer, and **IFA-5 check it's us**
  as the easy extra.
- **Plus** (up to 5 pages): adds IFA-2 fees, IFA-3 first meeting and booking, IFA-8 secure upload, IFA-9 your year.
- **Signature** (up to 20 pages): adds the showpieces IFA-6 Fees in pounds, IFA-10 Milestones, IFA-11 old pensions
  list, and IFA-4 life-event guides.
- **Not offered:** reviews widget, gallery, vouchers, loyalty, seasonal banners, any performance or projection tool.

### Showpieces for discussion (not decided)
| Candidate | What it does | Question it answers | Tier | How it runs at £0 | Effort | Honesty risks and how it fails closed | Why a visitor shows a friend |
|---|---|---|---|---|---|---|---|
| **Fees in pounds** | Type an amount; see the firm's own fees as pounds once and per year, plus the first-year total | "What will this actually cost me?" (Q1) | Sig | Fees in `site.json` or a one-row Sheet the firm owns (rates, minimum, caps, VAT) | small–medium | Never shows returns or net values; says platform and fund charges are separate; tiered fees worked exactly as published; a missing or malformed fee table shows the fees page instead of a figure | "Look, they just tell you: £1,875 a year." Almost no adviser does |
| **Milestones** | Year of birth in; the year you can usually take a pension and your State Pension age year out, from the law today | "When can I retire / take my pension?" (Q11, Q12) | Sig | Rules table in the kit, checked date stored; no client input needed | medium | Change-over birth years (1960–61, 1971–73, 1977–78) show "check GOV.UK" instead of a year; after 180 days without a re-check the figures hide and only the GOV.UK link shows; says the review is under way | Everyone wants to know their own date; it's shareable without revealing money |
| **First-meeting checklist and booking** | Tick what you have; see what's missing; book | "What should I bring? Is it free?" (Q2, Q17) | P | The firm's own booking link or Form | small | Ticks stay on the device; nothing uploaded; no account numbers in the form | Less useful to share, very useful to the visitor |
| **Independent or restricted** | One honest paragraph and a two-line comparison | "Are you independent?" (Q3) | S (always on) | Text from the firm | small | Says only what the firm is; never implies independent advice is "better"; links to free guidance | Clears up a word most people don't understand |
| **Secure upload** | A link to the firm's own portal with "never email statements" | "How do I send documents safely?" (Q27) | P | The firm's existing portal link | small | Our site never receives files; if no link, the section hides | Not shareable; a trust signal |
| **Old pensions list** (own idea) | List old employers and dates; print a tracing list with what to ask each scheme and the GOV.UK Pension Tracing Service link | "I've lost track of old pensions" (Q20) | Sig | All in the browser; nothing stored or sent | medium | General information only; doesn't search anything or claim to find pensions; prints with the date and source | No competitor has it; most people have a lost pension and will send it to a sibling |
| **Check it's us** (own idea) | The firm's register entry, its real numbers and what it will never ask | "Is this email really from you?" (Q28) | S | Text and numbers from the firm | small | Links straight to the firm's register entry so the visitor checks the regulator, not us | People forward it to parents |

**Recommendation.** Signature: **Fees in pounds** (it answers the first question everyone asks, and the screens show it
working), **Milestones** (useful to every visitor, no money needed, safe because it fails to GOV.UK) and **old pensions
list** (the one nobody else has). Starter: **check it's us** (easy, real, protects the firm's clients). Alternatives
kept for clients who want them: first-meeting checklist (already Plus), independent or restricted (always on), secure upload (Plus).

### Signature pages (18; approved 16 Nov 2026)
★ = suggested Plus five. The VISION list's twelve stay; six are added from the questions.
1★ Home · 2★ Fees (with Fees in pounds) · 3★ Advisers · 4★ First meeting · 5★ Services · 6 Pensions and retirement
(with Milestones) · 7 Inheritance tax planning · 8 Protection · 9 Mortgages · 10 Business owners · 11 Independent or
restricted · 12 Your year with us · 13 Old pensions (the tracing list) · 14 Later life and care · 15 Life-event guides
· 16 Check it's us · 17 Insights (the journal; FCA rules apply to every article) · 18 Regulatory information and complaints

### Design (sitefloor-internal `design/financial-advisers`)
Round 1 (Corran: In pounds, The first hour, Milestones) is replaced. Round 2: demo name **Thursby** (Corran dropped:
Companies House lists CORRAN LTD and CORRAN PARTNERS LTD). Two directions, both led by Fees in pounds set as a private
bank's statement: **light** (The statement: ivory, forest and pewter, a seal, Frank Ruhl Libre, the City from above in a
pewter grade) and **deep** (The private ledger: slate and gold leaf, a crest, Bona Nova, a black Georgian door).
Round 3: the owner chose **light** (The statement); the photograph is now a Georgian terrace in morning sun, graded
warm with holly-green shadows. Thursby to be confirmed on the Companies House register before the build.
