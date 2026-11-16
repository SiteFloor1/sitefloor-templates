# Gyms and health clubs: customer questions

What people ask a premium gym or health club before joining, from UK clubs' public pages (Third Space, Equinox
London, Gymbox, Virgin Active, Hyrox's own pages) and members' common questions on review sites. Checked 16 Nov 2026.
Where the kit answers each (codes from `docs/VISION.md`, approved 29 Oct):

| Question | Where it's answered |
|---|---|
| How much is it a month, and is there a joining fee? | Memberships (GYM-2): every tier in pounds; the first-year total with the joining fee added (the Memberships page) |
| How long is the contract? Can I freeze or cancel? | Memberships: minimum term, notice, freeze rules, in the club's own words |
| What's included: pool, sauna, classes, towels? | Memberships (what each tier includes); Facilities tour (GYM-6) |
| What classes are on, and when? | Timetable (GYM-1); Class finder by type, time and length (GYM-4) |
| Are there spaces left in tonight's class? | Spaces left (GYM-7), from the club's booking sheet with the time it was updated; otherwise Book opens the club's app |
| How busy is it right now? When is it quiet? | Usually busy times (GYM-3), labelled "usually"; a live count only when the club keeps one, with its age shown |
| Can I try it first? Can I bring a guest? | Free trial (GYM-5): day pass request; guest rules on Memberships |
| Do you do Hyrox training? I have a race in March. | Hyrox and race prep page; the race-prep planner (GYM-8) |
| Personal training: who, and how much? | Personal training page and Coaches: the club's prices and each coach's specialisms |
| Is there parking? How do I get there? | Your first visit (Plan your visit): parking, bike racks, nearest station |
| What are the opening hours, including bank holidays? | Open now, in the header and on Your first visit; holiday hours from the club's sheet |
| Do you run member events? | Members' events (GYM-9) |
| Do you have corporate rates? | Corporate memberships page |

## Rules to check at build (not yet checked)
- Prices shown as the full amount, joining fee included where it is mandatory (the DMCC Act 2024's drip-pricing rules;
  read the CMA's current guidance and record the page and date in `playbook.md` before showing any price).
- Class and busy figures are the club's own; anything not live says "usually".
- Health wording: no promises of results; injury and pregnancy questions go to the coach and the member's GP.
