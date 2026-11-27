# Delivery dates (CVID-9)

| | |
|---|---|
| Feature id | `carfilm-turnaround` |
| Plan | plus and above |
| Config | `turnaround` { workdays [mon…sun], note }; `photosDays` / `filmDays` on each package |

A shoot date in, the day each package's photographs and film arrive: the studio's working days after the shoot,
skipping UK bank holidays for its nation (from `location.postcode`, shared `src/core/lib/bank-holidays.js`). The
note calls it an estimate. A package without days shows a dash.
