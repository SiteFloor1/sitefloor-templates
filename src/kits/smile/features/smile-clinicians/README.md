# Who treats you (home)

Every clinician as the GDC guidance on advertising asks: name, registered role, qualification and the country it was gained in, and GDC number linked to the GDC register. The lead clinician (`lead: true`, or the first) leads with a portrait and their own note.

```json
"clinicians": { "items": [{ "id", "name", "role": "dentist|hygienist|therapist|clinical-technician|orthodontic-therapist|nurse|technician", "qualification": "BDS", "country": "United Kingdom", "gdc": "123456",
  "interest": "special interest in whitening", "specialist": "<GDC specialist list, only if on it>", "prescribedBy": "<dentist id, for a hygienist or therapist who whitens>", "lead": true, "bio", "photo" }] }
```

Demo sites use `"000000"`, which belongs to no one; client sites the real number. "Specialist" anywhere in the copy is refused unless someone is on a GDC specialist list.
