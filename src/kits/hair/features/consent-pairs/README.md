# consent-pairs (hair kit, Signature)

Before and after, with consent only. Each pair is one client in one session (never two people), compared with a slider
(the shared `before-after` script on this kit's markup: drag, tap or the arrow keys); the caption names the stylist and,
on a client site, "Shown with consent" and the date. Validation refuses a client site's pair without `consent`
(YYYY-MM-DD, the day the client agreed in writing). Without JavaScript the two photographs sit side by side.

```json
"pairs": { "note": "…", "items": [{ "id": "waves", "before": "img/…", "after": "img/…", "beforeLabel": "During the cut",
  "afterLabel": "Finished", "alt": "…", "caption": "Cut and blow-dry, mid-length", "stylist": "rae", "consent": "2026-10-12" }] }
```
Client sites only (`clientOnly`): the demo has no pair, because stock photographs can't honestly show one client in one
session. Shown on the look book page.
