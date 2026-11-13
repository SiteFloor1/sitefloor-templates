# Feature: date-range (shared)

A date picker any kit can put inside its own feature: a start and an end (a hire, a stay) or one date (`single`, an
appointment), with the business's own times. It answers "which days can I choose?" and "is this range allowed?" from the
business's rules. It never prices anything: each kit prices the result itself.

- **Plan:** Starter (it is a part, not a section; the feature that uses it sets the plan). **Kits:** jeweller (the appointment request, one date with the house's own times). A kit adds
  itself to `kits` in `src/features/registry.js` when one of its demos shows the picker (the demo-coverage rule), and its
  feature lists `needs: ["date-range"]`.
- **Logic:** `src/core/lib/date-range.js` (pure, unit-tested in `tests/unit/date-range.test.js`). The business's UK clock
  (`ctx.now()`), never the visitor's.
- **No JavaScript:** plain date inputs and time lists; the business checks the dates when the request arrives.
- **With JavaScript:** a month calendar fills the box reserved for it (same height before and after, six rows every
  month, so nothing moves). One ARIA grid with a roving focus: arrows, Home/End (week), Page Up/Down (four weeks),
  Enter or Space to choose. Each day is named "Saturday 14 November, free" (or gone, taken, closed, too soon, not open
  for requests yet). The inputs and the calendar stay in step; typing a date moves the calendar.

## What a day can be

| State | Means | Can be a pick-up or return? | Can a range run through it? |
|---|---|---|---|
| free | open, enough notice | yes | yes |
| closed | shut that day: hours, an hours exception, or a bank holiday when `bankHolidays` is `"closed"` (an exception for the date wins) | no | yes |
| taken | blocked on the business's Sheet | no | no |
| too soon | inside `leadHours` (or no time left today) | no | yes |
| gone / not open yet | before today / after `horizonDays` | no | no |

An unreadable Sheet blocks nothing: the picker says "We couldn't read our calendar just now… Ask us to check your
dates" in room kept for it inside the calendar box (nothing moves), and the request still goes to the business, who checks.

The calendar repaints only when something it shows changes (a new day, a day becoming too soon, a new choice or Sheet),
and a keyboard or screen-reader user stays on the same day after a repaint.

## Use it in a kit feature

```njk
{% set dr = { id: "hire", region: hire.region, rules: site.hire.dates, from: "Pick-up", to: "Return" } %}
{% include "features/date-range/date-range.njk" %}
```

| `dr` key | |
|---|---|
| `id` | unique on the page; used for element ids and the shared-state keys |
| `region` | `"england-wales"`, `"scotland"` or `"northern-ireland"`, for bank holidays (work it out from the postcode with `regionFromPostcode`) |
| `rules` | the rules below, from the site's own config |
| `from`, `to`, `legend` | optional labels ("Pick-up", "Return", "Your dates") |

Rules (validate them in the kit's config check with `checkRangeRules(rules, "path", err)`; unknown keys are refused):

| Rule | |
|---|---|
| `horizonDays` | how far ahead the business takes requests (1–730) |
| `bankHolidays` | `"closed"` or `"open"`: does the business hand over on bank holidays? Required: we never guess it |
| `leadHours` | notice needed before a start, 0–720 |
| `single` | one date only (set by the kit, not the client) |
| `minDays`, `maxDays` | shortest and longest range: with times, days on the UK clock (nights, plus one if the return time is later in the day than the pick-up time, so the clocks changing never adds a day); without times, nights |
| `slots` | the business's own times, `"HH:MM"`, in order; a time is offered on a day only inside that day's hours |
| `slotMinutes` | how long what starts at a time lasts (an appointment), 0–600; a time is offered only if it ends by closing. Default 0: a hand-over may be at closing time itself |

The business's opening hours come from `site.hours` (with its exceptions).

## Talking to the kit

- The picker shares every change as `ctx.share("date-range:<id>", result)` and fires a bubbling `dr-change` event with
  the same `result`: `checkRange`'s answer (`ok`, `reason`, `from`, `to`, `nights`, `hours` (exact, for display),
  `periods` (what to price on), `dates`,
  `weekendDays`) plus `selection` (the raw inputs) and `sheet` (`"ok"`, `"error"` or `"none"`).
- The kit feeds days blocked on its Sheet with `ctx.share("date-range:<id>:blocked", blockedFromRows(rows))` (or
  `{ status: "error" }` when the Sheet can't be read). Old Sheet data must never be passed as current: the kit's
  provider decides when its data is too old and sends an error instead.

## A look's own markup

A look can replace `date-range.njk` with `src/looks/<look>/features/date-range.njk`. Keep the hooks: `data-feature`,
`data-dr`, `data-dr-region`, `data-dr-rules`, `data-dr-from`/`-to` inputs, `data-dr-from-time`/`-to-time` lists,
`data-dr-cal` (with `data-js-only`), `data-dr-status`, and a reserved height for the calendar box.
