# Projects map (construction kit, Plus)

On the projects page: each project's postcode district (`projects.items[].district`, the district's centre, never a
house) as a list, and beside it a map. The tiles and marker positions are worked out when the site is built
(`lib/map.js`); the OpenStreetMap tiles load only when the visitor presses "Show the map", so no third party is
contacted otherwise. The map is drawn in grey so the photographs keep the colour; OpenStreetMap is credited on it.

```json
"projectsMap": { "title": "Where we've *built*", "intro": "Finished projects by postcode district." }
```
