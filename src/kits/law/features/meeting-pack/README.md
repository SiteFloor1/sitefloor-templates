# First-meeting pack (Signature, unlisted page meeting)

A private page the firm sends before a first meeting: when, who, the way in, what to bring, fees, and a calendar file. The details live in the link after #, read only in the browser; nothing is stored (a published sheet would be public). `meeting#make` opens the firm's link maker.

## Config

```json
"meetingPack": { "title", "intro", "bring": [{ "id", "label" }], "fees", "note", "example": "<demo only: a pack link's part after #>" }
```

Pack format and checks: src/kits/law/lib/pack.js (unit tested).

Markup is neutral and styled with tokens; each look restyles it (and may override it in `src/looks/<look>/features/`).
