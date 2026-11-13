# Have you done my car? (model finder)

| | |
|---|---|
| Feature id | `model-finder` |
| Plan | plus and above |
| Config | `models`: `{ "makes": [{ "name": "BMW", "tag": "bmw", "models": [{ "name": "3 Series", "tag": "bmw3series", "vehicle": "saloon" }] }], "priceJobs": ["tint-rear", …] }`; needs `gallery` (the same posts), `jobs`, `vehicles`; `sections.finder` |
| Files | `model-finder.njk`, `model-finder.css`, `model-finder.js`; matching in `src/kits/car/lib/finder.js` |

## How it works
The visitor picks a make, then a model. Posts the studio tagged with that model's hashtag (`#bmw3series`) show
first; if there are none, other posts of that make (`#bmw` or any of its models) show, clearly worded as "other".
Matching uses only the studio's hashtags, never guesses from captions. Beside them: the studio's own price and time
for that model's vehicle size for each job in `priceJobs`, and a WhatsApp button that links the best matching post.

For the studio: use one hashtag for the make and one for the model on every Instagram post (or `tags` on stored photos).

## When something is missing or fails
It uses the gallery's posts: the stored photos at first, the live Instagram feed when it loads. With no match it says
so and invites a message. Without JavaScript it links to the Our work page (if on) and WhatsApp.

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.
