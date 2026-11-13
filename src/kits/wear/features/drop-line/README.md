# drop-line (Starter)
One quiet line under the hero: `Drop 04 · Saturday 10:00 · 3 days · Remind me`.

- `drop.name`, `drop.opens` ("YYYY-MM-DDTHH:MM" on the brand's clock) or, on demos only, `drop.rolling` ({ day, time }: always the next one).
- `drop.remindForm`: the brand's Google Form (…/viewform). On a demo the link opens a note instead of a fictional form.
- Days are counted on the brand's calendar (23:00 the night before says "tomorrow"); under an hour it says "in 25 min"; after it opens, "open now".
- The look places it in the hero (`look.json → heroParts`).

## The clock
A small countdown sits after the words ("2d 14h 06m 09s", no days on the day itself), in tabular figures at reduced
opacity so it never changes width or shouts. It ticks once a second on the brand's clock, pauses when the tab is
hidden, and disappears when the drop opens. It is `aria-hidden`; screen readers get "· 3 days" instead. The drops page
shows the same clock beside the date.
