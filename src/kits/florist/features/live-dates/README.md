# live-dates (florist kit, Plus)

The florist's next TikTok or Instagram LIVE sessions (pre-orders, a new drop), up to three, each with "Add to my
calendar" (an .ics made in the browser with a reminder 15 minutes before; nothing is sent anywhere). Sessions that have
ended drop off at build time and again in the browser; with none left the section doesn't show.

```json
"live": {
  "title": "Come to a LIVE",
  "intro": "We take pre-orders live and show the next drop first.",
  "sessions": [{ "date": "2026-11-12", "time": "19:00", "minutes": 60, "where": "TikTok", "what": "Christmas pre-orders" }],
  "links": { "tiktok": "https://www.tiktok.com/@<handle>", "instagram": "https://www.instagram.com/<handle>" }
}
```

**Markup:** each look lays this feature out itself (`src/looks/<look>/features/`); the kit's template is empty and
`src/kits/florist/looks.js` refuses the feature on a look that hasn't designed it (today: Tissue only).
