# tourism-local-time (Starter)

Local time and the gap to London for the place on show: "Local time 22:08 · 3 hours behind London". Every element
with `data-local-time` and `data-tz` is kept current every minute from the browser's own time-zone data (so summer time
on either side is handled by the browser, not by us). The logbook moves `data-tz` as the reader chooses a stop.

Uses each stop's `tz` (an IANA zone, checked at build time). Nothing else to set. The script attaches to the home page's
hero (`data-feature="tourism-local-time"`), and journey pages carry the same attribute.
