# Menu page

| | |
|---|---|
| Feature id | `menu-page` |
| Plan | plus and above (page `menu`) |
| Config | `menuPage`: `kicker`, `title`, `intro?`; uses `menu` |
| Files | `menu-page.njk`, `menu-page.css`, `menu-page.js`; dishes from `menu/dish.njk` |

## How it works
Tabs for each sitting, the drinks and the **allergen chart**: every dish and drink against the 14 allergens, a dot
where it contains one. "Hide dishes containing…" filters the lists and the chart together. Opens on the sitting being
served (or `#drinks`, `#chart`). The restaurant's statement, the date the chart was checked and a link to the FSA guidance
close the page. With `pairings` on, each dish shows what to drink with it.
