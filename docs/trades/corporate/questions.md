# Corporate and B2B firms: customer questions

What a business buyer asks before they get in touch (kit `corp`). How to read it and the questions every trade gets: [`docs/CUSTOMER-QUESTIONS.md`](../../CUSTOMER-QUESTIONS.md).

The buyer is a professional: a buyer or engineer at a larger company, an operations or finance director, an IT lead. They
are checking a supplier, often against a list of three, often for someone else who will ask "why them?". They want
facts they can paste into a supplier form. Every fact on a client site (certificates, sectors, machines, people,
lead times, figures, offices, vacancies) comes from the firm's `site.json` or its own Sheet. Case studies, client
names and logos, investor figures and jobs are demo-only on demos, and the build fails if demo markers reach a client.

## Every B2B firm (corp kit)

| Question | Answered by |
|---|---|
| What exactly do you do? In one line? | the home page's first line (a fact, not a slogan) and the services index: each service with what it is, what it isn't, and its limits (sizes, volumes, contract types) |
| Who do you do it for? Have you done it for firms like mine? | industries (Signature: a page each) with what the firm does for that sector; case studies (Plus), only with the client's written permission and a named, dated result the client supplied |
| Can you prove it? | case studies the client approved; certificates with number and issuing body; real accounts figures only if the firm chooses (investors page, Signature) |
| Which certifications do you hold? Are they current? Who issued them? | certificates (free on every plan): standard, scope, certificate number, certification body, expiry date, a link to check it (UKAS CertCheck or the body's register). A certificate past its expiry date hides itself and the build warns; none is ever shown without a number and a body |
| Who do I contact? Will I get a person or a form? | routed enquiry (Starter): pick what it's about and the message goes to the named person who handles it, with their direct line; no anonymous form |
| How do I ask for a quote? What do you need from me? | request a quote (Plus): what to send (drawing, quantities, material, deadline; or users, sites and current set-up for IT; or lanes, pallets and frequency for logistics), assembled into an email to the right person. Files are attached in the buyer's own mail app, never uploaded to us |
| Where are you? Can I visit or audit you? Where do deliveries go? | offices (Starter: address, map link, goods-in and visitor entrances, parking, site rules for visitors); offices with local time (Signature) |
| Are you open now? When can I reach someone? | offices with local time and hours (Signature, CORP-4): "07:42 in Redditch, the office is open" worked out on the day, bank holidays from gov.uk |
| How long will it take? What are your lead times? | lead times (Plus): the firm's own typical times per service, dated "as of", from its Sheet; old data is shown as old, never as current |
| How big are you? Can you handle my volume? Will you be around in five years? | about (Plus): founded year, people, site size and equipment only as the firm states them; the Companies House number and registered office on every page (a link to the register) |
| What equipment or capability do you have? | capability list (Plus): machines, software, vehicles or platforms by make, model and capacity, from the firm |
| Do you meet our supplier requirements (insurance, policies, security, modern slavery)? | policies (free on every plan): the documents the firm publishes (quality, environment, modern slavery statement where it applies, privacy), each dated; insurance only as the firm states it |
| What is your environmental record? | sustainability (Signature): only specific, evidenced, dated claims under the CMA Green Claims Code; never "carbon neutral", "net zero" or "green" without the evidence linked beside it |
| Who runs the company? | about and leadership (Plus): names, roles and portraits only if the firm wants them (neutral portraits or none) |
| Are you hiring? What is it like to work there? Is the job still open? | careers (Plus): vacancies from the firm's Sheet; each closes itself after its closing date; salary shown only if the firm gives it, never invented |
| I'm a journalist / I need your logo | press and media (Signature): the press contact, approved logos and photographs to download, a short factual boilerplate |
| Who do you partner with? Which vendors are you accredited by? | partners (Signature): only partnerships the firm documents (for IT firms, vendor partner levels with a link to the vendor's partner finder) |
| What do you know about my problem? | insights (Signature): articles by the firm, dated, by a named author or the firm |

## Questions by kind of firm
The demo is a precision engineering firm. The same kit answers the other three with different services, quote questions and
capability lists (settings only, no new code).

| Kind of firm | What they also ask | Answered by |
|---|---|---|
| Precision engineering and manufacturing | Tolerances? Materials? Batch sizes, prototype to production? Inspection reports (FAI, CMM)? Material certificates? Which standards (ISO 9001, AS9100, ISO 13485)? Can you work from my STEP file? | services with their limits; capability list; certificates; request a quote asks for the drawing format and revision |
| IT managed services | Response times? Do you cover my sites? Cyber Essentials? Who answers out of hours? Contract length? | services with stated response times from the firm; offices and hours; certificates (Cyber Essentials, ISO 27001) with number, body and expiry |
| Logistics and warehousing | Which lanes and areas? Pallet and vehicle sizes? Tracking? Temperature control? Insurance per load? | services; coverage (postcode districts, shared postcode checker); capability list of vehicles and sites |
| Consultancy | What do you actually deliver? Day rates or fixed fee? Who would I work with? Sector experience? | services as deliverables; leadership; case studies with permission; request a quote asks for scope and deadline |
