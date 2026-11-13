# Conflict-safe first contact (Plus, page contact)

The first message carries only the sender, how to reach them, the area and the other people or companies involved, so the firm can run its conflict check before hearing a confidence. The visitor's email app sends it; nothing passes through the site.

## Config

```json
"firstContact": { "title", "intro", "email": "intake@…" }
```

The words of the message are in src/kits/law/lib/route.js (unit tested).

Markup is neutral and styled with tokens; each look restyles it (and may override it in `src/looks/<look>/features/`).
