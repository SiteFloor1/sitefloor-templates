# Financial advisers: playbook

What to build for this trade (kit `adviser`). The ground rules and the steps for a new kit: [`docs/TRADE-PLAYBOOK.md`](../../TRADE-PLAYBOOK.md).

## Independent financial advisers (new `adviser` kit, look `tariff`, demo Avenel) — design round 1, 16 Nov 2026

**Status: features and pages PROPOSED, AWAITING THE OWNER.** He approves them with the design. `docs/VISION.md`
already holds four approved codes (IFA-1 to IFA-4, 29 Oct) and 12 pages; this proposal keeps those and adds IFA-5 to
IFA-12 and six pages.

- Customer: someone in their 50s or 60s with pensions in three places, or a family thinking about inheritance tax,
  choosing between two or three local firms. The site's job: say what advice costs in pounds, show the firm is
  authorised and independent (or say plainly it is restricted), and get a free first meeting booked.
- Demo brand **Avenel** (fictional; a web check found no UK advice firm using it, confirm at Companies House before
  publishing), Cheltenham. Feeling: Coutts' discretion, Schroders' plain authority. Unlike Lyall Harrow (wealth) and
  Calder Wyke (law): a deep holly-green first screen with a working fee slip, not a white page or a stone library.

### Proposed features (S = Starter, P = Plus, Sig = Signature)

| Code | Tier | Feature | Notes |
|---|---|---|---|
| IFA-1 | S | Services, advisers, FCA numbers | approved 29 Oct; FRN in every footer, each adviser's reference number linked to the FCA Register |
| IFA-5 | S | Fees in pounds: three worked examples | proposed; the easy lower-tier version of the slip: the firm's own fees on £100k, £250k and £500k, from its sheet |
| IFA-6 | S | Independent or restricted, explained | proposed; the firm's status in its own words, then the FCA's plain difference |
| IFA-2 | P | Fees explained | approved; the whole structure: initial, ongoing, hourly, minimums, what the ongoing fee buys, platform and fund charges shown separately |
| IFA-3 | P | First-meeting checklist | approved; per topic, tick and print; links GOV.UK's State Pension forecast and pension-tracing service |
| IFA-7 | P | Book a free first meeting | proposed; topic, in person or video, preferred times; refuses account numbers; WhatsApp or email to the firm |
| IFA-10 | P | Client documents | proposed; a link to the firm's own client portal (we never take uploads), a fraud warning before it |
| IFA-11 | P | Is this really us? | proposed; check a call or email; logic shared with the wealth kit's `check`, markup new |
| IFA-12 | P | Tax-year dates (.ics) | proposed; 5 April year end and the firm's review month, as calendar files |
| IFA-8 | Sig | The fee slip (showpiece) | proposed; type an amount, see the firm's published fees as pounds once and each year; never returns |
| IFA-9 | Sig | Retirement milestones | proposed; from a date of birth: the earliest pension age (55, 57 from 6 Apr 2028) and State Pension age from GOV.UK's tables, with GOV.UK's checker linked; no growth figures |
| IFA-4 | Sig | Life-event guides | approved; retiring, an inheritance, selling a business, separating; general information, compliance-ticked |

**A conflict to decide:** `VISION.md` says "No calculators" for IFA. The fee slip (IFA-8) only multiplies the firm's
own published fees; it projects nothing, and the FCA expects adviser charges in cash terms. IFA-9 works out dates, not
money. Both need the owner's yes because they override that line. If he says no: IFA-5's worked examples carry the
fees, and the hero becomes the photograph with one sentence.

### Proposed Signature pages (18)

1★ Home · 2★ What we help with · 3★ Fees · 4★ Advisers · 5★ Your first meeting · 6 Pensions · 7 Retirement income ·
8 Inheritance tax · 9 Protection · 10 Investing and ISAs · 11 Business owners · 12 Retirement milestones ·
13 Independent or restricted · 14 Client documents · 15 Is this really us? · 16 Insights (the journal) ·
17 Mortgages (only if the firm holds the permission) · 18 Regulatory information and complaints.
FCA rules apply to every article; insights are general information, never advice.

### Showpieces (discussed, not agreed)
- **The fee slip (recommended hero).** It answers the first question nobody else answers on their homepage, and it is
  the "clear authority" the brief asks for. Risk: it is only as good as the firm's sheet; tiered fees, minimums and
  VAT (advice is usually VAT-exempt, but not always) must come from the firm, and the slip says "we confirm in writing".
- **Retirement milestones.** Useful, but GOV.UK's checker already does State Pension age well; our value is putting
  the three dates (pension access, State Pension, the next tax-year end) on one line. Signature, below the fold.
- **First-meeting checklist and booking.** Essential, not a showpiece. Plus.
- **Independent vs restricted explainer.** Starter, quiet. A showpiece only if it were a two-column honest comparison,
  and that risks looking like a dig at restricted firms (who will be clients too).
- **Secure upload link.** We must not take documents ourselves (data protection and the £0 rule); a link to the
  firm's portal is a Plus page, not a showpiece.
- **Alternatives to pitch:** fee structures side by side (the firm's percentage against its fixed-fee option, same
  slip); "your review year" for existing clients (the firm's service calendar with .ics); a pension-tracing helper
  that links GOV.UK's service and lists what to look for on old payslips.
