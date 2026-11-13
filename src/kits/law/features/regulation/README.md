# Regulation (always on)

The SRA digital badge (badge.njk, used by the look under the first call to action and on the complaints page) and the regulation plate: regulator, SRA number, firm, complaints and prices.

## Config

```json
"regulation": { "legalName", "entity", "sraNumber", "badgeFrame": "https://cdn.yoshki.com/iframe/…html", "insurance": { "insurer", "address", "coverage" }, "office" }
```

`badgeFrame` is the iframe address from the firm's SRA badge code (SRA Transparency Rules 4.1). Required on client sites, refused on demos. The build allows exactly that host in the CSP (frame-src).

Markup is neutral and styled with tokens; each look restyles it (and may override it in `src/looks/<look>/features/`).
