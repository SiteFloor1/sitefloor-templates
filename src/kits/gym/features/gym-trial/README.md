# Free trial page (GYM-5)

| | |
|---|---|
| Feature id | `gym-trial` |
| Plan | plus and above (a page: `trial.html`); needs `gym-daypass` |
| Config | `trialPage` `{ title, intro, photo, includes: [...], steps: [{ title, text }] }` and `dayPass` |

The day pass gets a page of its own: a tall photograph, what the day includes, what happens on the day (numbered), then
the request itself (`gym-daypass`, sent on WhatsApp). With this page on, the day pass leaves the home page, and the
hero's button and the phone bar's "Day pass" link here.
