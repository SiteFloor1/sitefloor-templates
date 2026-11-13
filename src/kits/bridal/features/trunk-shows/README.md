# trunk-shows (bridal kit, Plus)

Trunk shows and sample sales with their dates, soonest first. A show that has finished drops off at the next build
and, until then, in the browser, so a past date never reads as coming. With none announced, one line and the
waiting list: the salon's own Google Form (free).

```json
"trunkShows": {
  "formUrl": "https://forms.gle/…",
  "items": [{ "id": "morrell-feb", "kind": "trunk-show", "house": "studio-morrell", "title": "Studio Morrell", "from": "2027-02-19", "to": "2027-02-21", "text": "Every gown in the collection, for three days only." }]
}
```
`kind` is "trunk-show" or "sample-sale". Heading: `sections.trunkShows`.
