# Paint protection film page

| | |
|---|---|
| Feature id | `ppf-page` (the page `ppf.html`) |
| Plan | plus and above |
| Config | `ppfPage`: `kicker`, `title`, `intro?`, `message`, `films` (`name`, `about`, `best?`, `finish`: gloss / satin / matte / chrome, `hex?` for coloured film), `filmsNote?`, `details?` (`src`, `alt`, `caption?`: the studio's own close-ups), `points?`; uses `protection` (panels and packs) and `jobs` for prices; questions with `topic: "PPF"` |
| Files | `ppf-page.njk`, `ppf-page.css`, page `src/kits/car/pages/ppf.njk` |

## How it works
What studios show on their own PPF pages: the film types (gloss, stealth/satin, coloured) as rendered samples in
the same studio lighting as the swatch library; every pack with its panels and a "from" price; every single
part, from headlights and rear lights to the grille; close-ups of the studio's own work (edges, lights, vents and
grilles are where precision shows); good-to-know points and PPF questions. Links to the PPF planner on the home
page when the site has it.

Never add film thickness, self-healing or warranty figures unless they come from the film maker's spec sheet or
the studio's own warranty.

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.
