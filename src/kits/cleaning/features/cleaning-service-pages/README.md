# A page for each service (cleaning kit, Signature collection)

Each service with `page` gets `<id>.html`: one photograph, the worked example (that service's own room strip and bill,
from `visit()` like the home page; a deep clean is every room at `visit.deep`), the task list room by room with what
the service adds marked, what isn't included, then the company's own words and "Ask about …" on WhatsApp.
Counted as one page.

Settings, per `cleans.items[]`:
- `example` { beds, baths, freq, extras? }: the worked example. Its price is worked out from `visit`, so the service
  carries no `rate` of its own; the list shows the hourly rate for that frequency, or `from` the example's price
  (`from: true`, only for a one-bedroom, one-bathroom example).
- `page` { intro, sections, photo?, label?, adds? { kitchen, hall, bed, bath }, also?, not? }.
- `link: "end-of-tenancy"` (or `"offices"`) instead of `page`, for a service that already has a page of its own; the
  end-of-tenancy page then shows its worked example above the checklist.

A service that can't be timed from rooms (after building work, say) has no worked example: put it inside the
nearest service's page, in the company's words, rather than give it a thin page.
