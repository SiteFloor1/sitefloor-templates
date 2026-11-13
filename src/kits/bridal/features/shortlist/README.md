# shortlist (bridal kit, Signature)

"Keep" on any gown puts it on the shortlist. A bar along the foot of the gowns page sends the list to the salon on
WhatsApp, so the gowns are on the rail when she arrives, and gives a link (`gowns.html#shortlist=ottilie.iris`) that
opens the same list on another phone. The list lives in that link; nothing is stored on a server. The phone also
remembers it (a convenience; nothing breaks without it), and the appointment request adds it on any page. A list
opened from someone else's link is shown on its own ("from a shared link") and never replaces the list the phone has
kept: "Keep these on my phone" adds those gowns to it, "My own list" goes back to it.

```json
"shortlist": { "message": "Hello Wexley, here are the gowns I'd like to try." }
```
