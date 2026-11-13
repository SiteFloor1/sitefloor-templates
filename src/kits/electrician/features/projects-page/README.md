# projects-page (electrician kit, Plus, ELEC-4)

A projects page (`/projects`): the client's finished jobs, each with a photograph, the area, the kind of work and a few
lines on what was done, filtered by kind (rewires, lighting, smart home, chargers…). Without JavaScript every project shows.

```json
"projectsPage": { "kicker": "Projects", "title": "Finished work", "intro": "…" },
"projects": { "types": [{ "id": "lighting", "label": "Lighting" }],
  "items": [{ "id": "highgate", "title": "A Victorian house, relit", "area": "Highgate", "type": "lighting", "did": ["…"], "photo": { "src": "…", "width": 1200, "height": 800, "alt": "…" } }] }
```
Name places by area, never by street or house. Photos of the client's own work, with the homeowner's permission.
