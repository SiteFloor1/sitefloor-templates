# People (home)

Name, role, practice and every solicitor's SRA ID, with a link to the SRA register. A look may move it to the people page (look.json onPages).

## Config

```json
"people": { "items": [{ "id", "name", "role", "solicitor": true, "sraId": "123456", "practice": ["<area id>"], "email", "phone", "admitted": 2009, "note", "photo" }] }
```

Demo sites must use 000000 for every SRA ID; client sites the real one.

Markup is neutral and styled with tokens; each look restyles it (and may override it in `src/looks/<look>/features/`).
