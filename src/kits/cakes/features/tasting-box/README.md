# Tasting box

| | |
|---|---|
| Feature id | `tasting-box` |
| Plan | plus and above |
| Config | `tasting`: `name`, `contents[]`, `price` (whole pounds), `payLink` (the studio's own Stripe Payment Link: test mode on demos, live on client sites), `posting` (when it's posted), optional `note` (e.g. whether it comes off the cake), optional `photo`; `sections.tasting` |
| Files | `tasting-box.njk`, `tasting-box.css` |

Payment goes through the studio's own Stripe link; the site holds no card details and sends no order itself.
