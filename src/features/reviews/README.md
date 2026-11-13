# Reviews

| | |
|---|---|
| Feature id | `reviews` |
| Plan | plus and above |
| Config | `reviews` (`source`: `google` on client sites; `items`: `text`, `author`, `rating` 1–5, `date` `YYYY-MM`), `sections.reviews` |
| Files | `reviews.njk`, `reviews.css` |

## How it works
Static cards. Each card shows that review's own star rating, copied from Google with the text, first name and month. Never round a rating up or leave out a review because it is lower: pick reviews by how recent and useful they are. No rating or review data is put in structured data (Google treats it as self-serving).

## When something is missing or fails
—

## Notes
If `sections.reviews.kicker` quotes an overall score ("4.9 on Google · 380 reviews"), it must match the Google profile when the site is published, and be updated or removed if it drifts.

`source: "sample"` is only allowed on demo sites; validation rejects it on client sites.

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.
