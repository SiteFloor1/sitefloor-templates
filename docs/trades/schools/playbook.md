# Independent schools (prep and senior)

Kit `school` (not built yet; design round 1 on 28 Nov 2026). Questions: [`questions.md`](questions.md). References and
approved codes: `docs/VISION.md` (Schools rows, SCH features and pages). The client is a small UK independent prep or
senior school in historic grounds; the site must feel like an old institution with real standing, never like a
nursery or a playful education brand.

## Rules for every client (also in `src/kits/school/README.md`)
- No identifiable child's face anywhere: buildings, grounds, rooms, hands, objects, backs and distance only. Planned for the
  build: the kit's config refuses an image without the school's `noFaces: true` confirmation.
- Fees exactly as published, VAT included and said so, the date checked shown. Never invent bursary or scholarship terms.
- SCH-8 links the real ISI or Ofsted report; no quote, no paraphrase, no badge.
- Results only as the school publishes them, with the year; no league-table claims.
- Admissions logic (SCH-5) is England and Wales only (1 September cut-off); Scotland and Northern Ireland are refused.

## Features by plan (proposal; every site also gets Plan your visit, open now, WhatsApp, reviews, Instagram)
| Plan | Features | Why there |
|---|---|---|
| Starter | SCH-1 open days and visit request · SCH-2 fees as published (VAT stated, date checked) · **SCH-8 inspection report linked** (moved down: a link and the report's date, nothing to build) | The three things a parent checks first; all easy |
| Plus | Starter + SCH-3 term dates (.ics) · SCH-4 a day in the life · **SCH-5 admissions timeline** (date of birth to every entry point, deadlines, .ics) | Real logic, unit-tested, but light; the most useful tool on the site |
| Signature | Plus + SCH-6 campus tour on a map · SCH-7 boarding houses · the chosen showpiece | Next-level work |

## Showpieces to pitch (alongside or instead of the owner's timeline hero)
1. **The year line** (owner's idea, raised): the child's whole school life drawn as one ruled line of Septembers, entry points as notches with their deadlines.
2. **The term card**: the school's letterpress term card as the first screen, today marked on it ("week 9 of 12, exeat in 4 days"), one calendar file.
3. **The route**: "Where do you live?" draws the school coach route from that town, with its pick-up time and the fare as published. Country schools sell on transport.
4. **Fees, worked out for your family**: children and year groups in, each child's termly fee incl. VAT from the published table, the school's sibling wording beside it (never computed discounts it hasn't published).
5. **Sixth Form subject planner**: pick three or four A levels; the school's option blocks show which combinations fit.
6. **The estate map** (Signature): the grounds as an engraved estate survey; tap a building for its photograph and what happens there.
7. **Boarding night**: a boarding house's evening by the clock (prep, supper, lights out), photographs of rooms and objects only.
