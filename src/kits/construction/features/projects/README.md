# Recently handed over (construction kit, Starter)

The builder's newest four finished projects on the home page, each a tall photograph with the place and the scope.
With the projects page on (Plus), each opens its own page.

```json
"projects": { "title": "Recently *handed over*", "items": [{ "id": "canonbury-house", "place": "Canonbury, N1", "scope": "A Georgian house restored, with a garden room.", "type": "listed", "year": 2025, "weeks": 34, "district": { "code": "N1", "lat": 51.544, "lng": -0.097 }, "photos": [{ "src", "width", "height", "alt" }], "before": { … }, "consent": true, "story": ["…"] }] }
```

`place` is an area, never an address; `district` is the postcode district's centre for the map. A `before` photo needs
`consent: true` (the client agreed in writing). Markup uses tokens only.
