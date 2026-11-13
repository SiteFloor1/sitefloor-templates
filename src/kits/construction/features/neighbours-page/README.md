# For our neighbours (construction kit, Signature)

One unlisted page per live site (`neighbours-<id>.html`, not in the menu or search): the link on the builder's letter
or the notice on the hoarding. It shows the postcode district large and the work, the builder's working hours and
promises in their words, how to reach them (a call, or WhatsApp with the district filled in), and this week at the
site from the builder's published Google Sheet: what's happening, the noisy work and the deliveries.

No address, ever: a site's `id` is its district and one short word (`n5-rear`), so it can't be a street or a house
name, and the sheet may hold only these columns (anything in any other column refuses the whole sheet):

```
site,updated_at,this_week,noisy,deliveries
n5-rear,2026-11-02 08:30,Bricklayers on the new walls.,Tuesday and Wednesday mornings,Steel on Thursday before 9 am
```

News older than `staleAfterDays`, a missing row or an unreadable sheet says to call. A demo reads a simulated week
(`src/demo/neighbours-provider.js`); a client always reads their own sheet.

```json
"neighbours": { "title": "For our *neighbours*", "intro": "…", "hours": ["Monday to Friday, 8 am to 6 pm"],
  "promises": ["…"], "reach": "…", "message": "Hello …, I live near your site in {district}.",
  "source": "sheet", "csvUrl": "https://docs.google.com/spreadsheets/d/e/…/pub?…output=csv", "staleAfterDays": 10,
  "sites": [{ "id": "n5-rear", "district": { "code": "N5", "lat": 51.5537, "lng": -0.0985 }, "work": "A rear extension", "from": "2026-09", "to": "2027-02" }] }
```

The hours are the builder's own; the page doesn't say what the council allows.
