# The class passport (Signature showpiece)

| | |
|---|---|
| Feature id | `class-passport` |
| Plan | signature |
| Config | `passport`: `source` (`"sheet"`, or `"simulated"` on demos only), `csvUrl`, optional `staleAfterHours` (default 48), `milestones` (e.g. `[25, 50, 100]`), `example` (demo only) |
| Files | `class-passport.njk`, `.js`, `.css`, `sheet-provider.js`; parsing in `src/kits/pilates/lib/members.js`; demo data `src/demo/passport-provider.js`; page `passport.html` |

## The studio's sheet
One row per member, found by the code the studio gives them. **No names, emails or phone numbers**: the published
sheet can be opened by anyone with its link.

    code,card,left,expires,total,month,updated_at
    K7M2QX4P,Ten classes,4,2027-01-31,38,6,2026-11-02 09:10

`left` is blank for a membership with no count. A member can also open `passport.html#K7M2QX4P`.

## How it works
The card's name with one hole per class left, the use-by date (with days to go when it's close), classes this month
and in all, and the next of the studio's milestones.

## When something is missing or fails
Codes are 8–12 letters and digits, random, one per member. Fails closed: an unknown code, a row older than
`staleAfterHours`, or an unreadable sheet says so and points to the desk; nothing is guessed. The sheet counts as
unreadable when a code appears twice, anything is written in a column outside the seven above (a name, an email),
an expiry isn't a real date, or `month` is more than `total`.
