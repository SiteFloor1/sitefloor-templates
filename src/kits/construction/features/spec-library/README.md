# Specification library (construction kit, Plus)

`specification.html`: the materials the builder works with (stone, timber, brick, plaster, glazing, ironmongery,
tiles), each photographed close with one line and where it is used, and a filter by kind. Without scripts every
material is listed. Name suppliers only if the builder wants to.

```json
"spec": { "title": "The *specification*", "intro": "…", "categories": [{ "id": "floors", "name": "Floors" }], "items": [{ "id": "oak", "name": "Oak boards", "category": "floors", "line": "…", "where": "Kitchens and halls", "photo": { … } }] }
```
