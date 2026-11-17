# How busy it is (GYM-3)

| | |
|---|---|
| Feature id | `gym-count` |
| Plan | starter and above |
| Config | `busy`: `capacity` (the club's own limit), `usual` (per weekday, 24 values from midnight: the usual count that hour, or `null` when closed), optional `live` (with `gym-live`, Signature) |
| Files | `gym-count.njk` (placed by the look's hero), `.js`, `.css`; logic in `src/kits/gym/lib/gym.js` |

## How it works
One number and one line. Without a live count it is always said as "usually": "40 / usually in the club on a Monday
at 6pm." and, when the club's own figures show it, "Usually quiet from 8pm." With `gym-live` and a fresh door count:
"31 / in the club, counted 2 minutes ago." and "Quieter than a usual Monday." (within a fifth of the usual is "about as
busy"). When the club is closed it gives the usual count at opening time.

## Honesty
The usual figures are the club's own averages (its door system's reports). The built page names its day and hour, so
it stays true if the script never runs.
