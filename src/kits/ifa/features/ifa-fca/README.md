# ifa-fca (IFA-1, Starter, always on)

The firm's statutory status (GEN 4 Annex 1) on every page, its FRN linked to its own entry on the FCA register, the
Financial Ombudsman Service with its free number in every footer, and the regulatory information page
(`regulatory.html`, free on every plan).

```json
"regulation": {
  "legalName": "Thursby Financial Planning Ltd", "tradingName": "Thursby",
  "frn": "000000", "registerUrl": "https://register.fca.org.uk/s/firm?id=…",
  "entity": "Registered in England and Wales, no. 00000000",
  "office": "…", "unregulated": "Tax and estate planning are not regulated by the Financial Conduct Authority.",
  "fscs": "optional, only if it applies",
  "complaints": { "email": "…", "address": "…", "steps": ["…"] }
}
```
A client's `registerUrl` is its own entry (open the firm on the register and copy the address); a demo may only point at
the register's search page, and its FRN is noughts. The Ombudsman's number (0800 023 4567) and the risk sentence come
from `lib/fca.js` (checked 16 Nov 2026).
