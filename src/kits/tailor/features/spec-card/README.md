# spec-card (tailor kit, Signature, page `specification`)

The specification card. The client chooses each detail from the house's own photographs (lapel, fastening, pockets,
vents, whatever groups the house lists; every option must have a real photograph), what it's for (from `garments`)
and the cloth (from the cloth book). A one-page card builds beside the choices with those photographs, dated. "Send my
card on WhatsApp" sends the choices as text plus a link that opens the same card (the choices live in the link after
`#`; nothing is stored). "Print or save as PDF" prints only the card, to bring to the first appointment.

```json
"spec": { "kicker", "title", "intro", "message": "Hello Fennick & Lowe.", "note": "Bring this to your first appointment…",
  "groups": [{ "id": "lapel", "name": "Lapel", "options": [{ "id": "peak", "label": "Peak", "text": "…", "photo": { "src", "width", "height", "alt" } }] }] }
```
2–6 groups of 2–5 options. Photographs: details the house has made, 4:5. A group can carry `"for": ["shirt"]` (ids
from `garments.items`): it shows only while one of those garments is chosen, so a shirt gets its collar and a coat its
lapel. Without JavaScript every group shows.
