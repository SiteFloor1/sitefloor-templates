# Complaints and regulation (free page)

SRA Transparency Rules 2.1: the firm's own procedure, then the Legal Ombudsman (eight weeks; one year / six months time limits) and the SRA, the badge, the firm and its insurance.

## Config

```json
"complaints": { "intro", "contact": { "name", "role", "email", "address" }, "steps": [{ "title", "text" }], "updated": "YYYY-MM" }
```

The Ombudsman's and SRA's facts live in src/kits/law/lib/sra.js with the date they were checked; recheck them when the rules change.

Markup is neutral and styled with tokens; each look restyles it (and may override it in `src/looks/<look>/features/`).
