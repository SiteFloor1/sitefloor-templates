# Regulation (always on)

The FCA line (`line.njk`: the firm, "authorised and regulated by the Financial Conduct Authority", its FRN and the
capital-at-risk sentence) that the look places under the hero and in the footer, and the free **Regulatory
information** page: authorisation (checkable on the FCA register), what the FCA doesn't regulate (COBS 4.2.4(4)),
risk, compensation if the firm states it, and complaints (the firm, then the Financial Ombudsman Service after
8 weeks, within 6 months of the final response).

```json
"regulation": { "legalName", "frn": "123456", "entity", "office", "unregulated", "capitalAtRisk", "fscs",
  "complaints": { "email", "address", "steps": ["…"] } }
```

`frn` is six or seven digits; a demo uses `000000` and a client site can't. `capitalAtRisk` replaces the default
sentence but must still say capital is at risk. FCA facts and the date they were checked: `../../lib/fca.js`.
