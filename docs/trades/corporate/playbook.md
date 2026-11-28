# Corporate and B2B firms: playbook

What to build for this trade (kit `corp`). The ground rules and the steps for a new kit: [`docs/TRADE-PLAYBOOK.md`](../../TRADE-PLAYBOOK.md).

## Corporate B2B (kit `corp`, demo Keswold) — design round 1, 28 Nov 2026
Its own kit, not the law kit's second look. Clients: regional UK B2B firms of 10 to 100 people (precision engineering
and manufacturing, IT managed services, logistics, consultancy). The references (Accenture, PwC, Salesforce, Siemens)
set the bar for confidence and clarity; the honesty is a 40-person firm's: one site, real certificates, its own figures.

- **Demo: Keswold, precision engineering, Redditch** (fictional; no UK company of that name on Companies House, checked
  28 Nov 2026). Why it sells best: the product is physical, so the site can show the work large (the machined part, the
  machine, the floor), which the other three can't without stock clichés; its buyers ask the most checkable questions
  (tolerance, materials, certificates, lead times), so the kit's honest features show off; and the Midlands and North
  are full of 20 to 80-person engineering firms with good money and dated websites. IT, logistics and consultancy are the
  same kit with different settings (services, quote questions, capability list).
- **Design process:** three directions (Gauge, First shift, Title block), each one static screen on desktop and phone,
  in `sitefloor-internal/docs/design/corporate.md` on branch `design/corporate`. No build until one is approved.
- **Starter:** services with their limits, routed enquiry (a named person per subject, direct line), certificates
  (number, body, scope, expiry, a link to check; past expiry hides itself), offices and visiting (goods-in, visitors,
  parking), policies (dated documents), the company's legal details on every page (name, number, registered office).
- **Plus:** request a quote (what to send for each service, assembled into an email to the right person; files go in the
  buyer's own mail app), lead times from the firm's Sheet (dated, "as of", shown as old when old), capability list
  (machines, software, vehicles), case studies (the client's written permission and its own result), about and
  leadership, careers from the firm's Sheet (closing dates expire themselves; salary only if given), industries list.
- **Signature:** the direction's showpiece, a page per industry, offices with local time and hours (CORP-4), press kit
  (logos and photos to download, the press contact), partners, sustainability (Green Claims Code checks), insights,
  investors (only for firms that publish accounts; figures from the filed accounts with the date).
- **Showpieces (one per direction):** A, the part measured where you point (the client's own photo and drawing
  dimensions); B, the floor now (shift running, prototype and production lead times, next free machine time, from the
  firm's Sheet); C, the title block as the quote request (each cell becomes a field; the email goes to the estimator).
- **Alternative showpieces (pitch, not built):** an exploded view of the client's own part rendered in Blender Cycles
  from their CAD (Bespoke add-on, stills or a 36-frame turn); "where your parts go", a UK map of the sectors and regions
  the firm ships to (from the firm, no client names); a certificate wall that checks itself against expiry daily; a
  first-article report sample (the firm's redacted FAI) beside the part; a shift-by-shift capacity board for MSPs as
  "response times now" and for logistics as "vehicles out today"; a visitor pass (the site's induction rules and a
  calendar file for an audit visit).
- **CORP-7 (offices on a globe):** not live WebGL. For a firm with several sites: a still Blender Cycles render of the
  globe at dusk with the firm's sites lit (rendered once per client, Bespoke), or CORP-4's real map with local times.
  For a single-site firm (most of them): CORP-4 only, honestly one pin. Picture first, before any build.
- **Routed enquiry:** reuse the law kit's `leadFor` and `mailHref` (`src/kits/law/lib/route.js`) by moving those two
  pure functions to `src/core/lib/route.js` with their unit tests, the law kit importing them from there. The conflict-safe
  wording (`partiesFrom`, `firstContactBody`) stays in the law kit. Done in the build PR, only if `npm run rules`, the law
  tests and the law demo build pass unchanged.
- **Honesty:** never invent clients, logos, figures, certifications, accreditations or awards on a client site; case
  studies, client names, investor figures and vacancies are demo-only (`src/demo/`), and the build fails if they reach a
  client. Certificates need a number, a body and an expiry. Sustainability claims follow the CMA Green Claims Code
  (truthful, clear, nothing material left out, fair comparisons, the full life cycle, substantiated), each with its
  evidence linked and dated; never "carbon neutral" or "net zero" without it. B2B claims are also covered by the
  Business Protection from Misleading Marketing Regulations 2008. Companies House details on every page (the law requires
  a company's name, number, place of registration and registered office on its website).
- **Setting up a client:** legal name, number, registered office; services and their limits; who handles each
  subject (name, role, email, direct line); certificates (standard, scope, number, body, expiry, check link); their own
  photographs (the part, the machines, the floor, the people if they want); the Sheet for lead times and vacancies.
  Running cost £0.
