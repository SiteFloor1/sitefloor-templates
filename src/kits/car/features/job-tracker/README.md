# Your car, live

| | |
|---|---|
| Feature id | `job-tracker` |
| Plan | signature (or an add-on; it adds one page) |
| Page | `your-car.html`: private, kept out of the sitemap and search (`noindex`) and not in the menu |
| Config | `jobTracker`: `source` ("sheet", or "simulated" on demos), `csvUrl` (published Google Sheet CSV), `staleAfterHours?` (default 24), `stages` (2–8 `{ id, name, about }` in order; the last means ready to collect), `kicker`, `title`, `intro?`; demos only: `example` (the simulated car's code) |
| Files | `job-tracker.njk`, `job-tracker.css`, `job-tracker.js`, `sheet-provider.js`; logic in `src/kits/car/lib/tracker.js`; demo `src/demo/tracker-provider.js` |

## The studio's sheet
One Google Sheet, published to the web as CSV (File → Share → Publish to web → CSV), one row per car in:

| code | stage | updated_at | note | photo |
|---|---|---|---|---|
| K7M2QX | fitting | 2026-10-26 11:40 | Fronts done; rears next | (a Google Drive share link) |

- `code`: a random code the studio makes up per car (4–10 letters and digits) and sends with the link,
  e.g. `https://studio.co.uk/your-car#K7M2QX`. The code after `#` never reaches any server.
- `stage`: one of the stage ids from `site.json`, as typed. `updated_at`: when they changed it (UK time).
- `note` (optional, up to 280 characters) and `photo` (optional: a Google Drive photo shared as "anyone with the link").
- **No names, number plates or phone numbers in the sheet, and no plates or people in the photos.** A published sheet
  can be opened by anyone with its link, so it only holds the code and the progress. Delete a row when the car goes home.

The studio updates it from the Google Sheets app on a phone in a few seconds per stage.

## How it works
The customer opens the link (or types the code). The page shows the stage now, when it was updated, the studio's
note and photo, and every stage as a line (done, now, still to come). It checks again every two minutes while the
page is open and visible. At the last stage it shows "I'm on my way" (a WhatsApp message with the code) and a link
to the aftercare page if the site has it.

## When something is missing or fails
Fails closed: an unknown code (or one used twice), an unknown stage, a sheet that can't be read in 6 seconds, or an
update older than `staleAfterHours` says so and offers "Message us" with the code filled in. Photo links other than
Google Drive / googleusercontent.com are ignored. Without JavaScript the page says to message the studio. The site
allows `docs.google.com` and `*.googleusercontent.com` (data and photos) in its security policy only when this is on.

## Demo
Code `DEMO24` is a simulated car that starts at the middle stage and moves on every 20 seconds, with stock photos and
notes; the page checks every 5 seconds. Any other code shows the "can't find that code" message.

## Ideas
- A Google Form for the studio ("car, stage, photo") that writes the row, so they never open the sheet.
- "Text me when it's ready": the customer's phone can't be stored here, so this stays a WhatsApp message from the studio.
