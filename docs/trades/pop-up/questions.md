# Pop-up shops and brand experiences: customer questions

What people ask before they go to a brand's pop-up shop, launch space or touring installation in the UK: a shop,
house or label that takes a space for days or weeks, sells or shows something there, and may move on to another
city. Drawn from the "visit", "FAQ" and booking pages of luxury brand pop-ups and launch spaces, ticketing and
timed-entry pages, and the themes that recur in public comments on them (it was shut when I got there, the queue,
"is it free?", the thing I came for had sold out, the booking fee I didn't see). England, Wales and Scotland.

## Visitors

| # | Question | What the site must answer |
|---|---|---|
| P1 | Is it open right now, and until when today? | "Open now, until 9pm" or "Opens at 12" worked out from the client's own dates and hours, in UK time; closed days and early closes shown; nothing claimed once the run has ended |
| P2 | When does it start and when does it finish? How many days are left? | The run's first and last day, the days left, and the last-day hours |
| P3 | Where exactly is it? Which door, which floor, how do I find it? | Address, a map link, the nearest station with the client's walking minutes, the entrance in words and a photo |
| P4 | Is it free? Do I need a ticket or a time? | Free entry, walk-in, or timed entry, as the client sets it; any price shown as a total with every mandatory fee included (DMCC Act 2024, CMA drip-pricing guidance) |
| P5 | Can I book a time? Which times can I still get? | The client's entry times for each day, linked to the client's own booking page; availability only from the client's booking app or sheet, never guessed, never "booked" |
| P6 | Can I just turn up? How long is the queue? | Walk-in rules, the usually quiet hours as the client states them, and the queue only if staff update it |
| P7 | What is actually there? What will I see and do, and how long does it take? | The experience in a few photos and lines, rooms or stations in order, and the time a visit usually takes, from the client |
| P8 | Can I buy there? Is there something only sold here? Has it sold out? | What is on sale, the pop-up-only pieces, prices as totals, sold-out marked only from the client's stock sheet |
| P9 | Is there a tasting, a talk or a launch night? Which day? | The dated programme from the client: what, when, how long, the price as a total, and how to book |
| P10 | Is it suitable for children? Do I need to be 18? Can I bring a dog? | The client's own entry rules; for alcohol, the client's own age policy (selling to under-18s is illegal; the venue's ID policy is the client's to state) |
| P11 | Is it accessible: step-free, a lift, seating, quiet times? | Step-free route, lift, seating, toilets and any quiet hour, as the client supplies them |
| P12 | When is it coming to my city? Is there a tour? | The tour dates and places from the client, each with its own status (on now, opens in N days, ended) |
| P13 | Can you tell me when it opens, or when bookings open? | A waitlist on the client's own form or mailing tool; add-to-calendar for the opening day; never a fake count of people waiting |
| P14 | Can you come to my city? | A short request (city, and email or WhatsApp) to the client's form; counts shown only if the client publishes real ones |
| P15 | Can I bring a group, book it privately or use it for an event? | Group and private hire terms as the client sets them, and a pre-filled enquiry |
| P16 | Can I take photos? Is there a moment to share? | The client's photo rules and their hashtag or account; live Instagram from their feed (POP-3) |
| P17 | What happened at the last one? | Past pop-ups: place, dates and real photos only from the client |
| P18 | Who is behind it? Has it been in the press or made with anyone? | Press and collaborations only as the client supplies them, with links; never invented |

## Brands and organisers (the client's own questions)

| # | Question | What the site must answer |
|---|---|---|
| B1 | Can I change dates, hours or the address myself, quickly? | One Google Sheet row per stop: dates, hours, address, booking link; the site reads it on every visit |
| B2 | What happens to the site when the pop-up ends? | It switches itself to "ended" and points at the next stop or the waitlist; past stops move to Past pop-ups |
| B3 | Can people book without a new paid tool? | Links to the booking app the client already uses (Eventbrite, Fatsoma, Resy, Fresha, Calendly); Starter needs none |
| B4 | Will it work for a one-off weekend as well as a tour? | Yes: one stop or many from the same sheet |

## Notes for the build
- Dates and hours come from the client; "open now" is worked out on the visitor's phone in Europe/London time. Demo dates
  are classed in `src/demo/dates.js` so they always sit ahead of, or around, today.
- Never say "booked", "selling fast" or "almost gone" unless the client's own data says it, and never show counts the
  client hasn't supplied.
- Alcohol pop-ups: the site states the client's own age policy; it does not quote ID schemes as law.
