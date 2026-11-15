# Published demos

Every demo is published to GitHub Pages by `.github/workflows/demos.yml`: daily, after each green run on main, and by
hand. It's built by `scripts/pages.js` from `production`, at `demo-hosting.json` `base` + `/<demo folder>/`, with the
complete case studies at `<base>/case-studies/<slug>/`. Every page is noindex, and robots.txt allows crawling so
crawlers can read that.

**PDF menus are left out for now.** A PDF can't carry noindex, and GitHub Pages can't send an `X-Robots-Tag` header, so
`scripts/pages.js` removes each PDF and every link to it (the café, grand café and restaurant menus). They come back
when the demos move to demos.sitefloor.com on Cloudflare, whose `_headers` can send `X-Robots-Tag: noindex` for PDFs.

## Moving the demos to demos.sitefloor.com (Cloudflare)
1. Create a Cloudflare Pages project for the demo site, built by the same `node scripts/pages.js --out _site` from
   `production`, daily (a scheduled deploy hook) as well as on each promotion; point demos.sitefloor.com at it.
2. Send noindex for every response in its `_headers`, PDFs included:
   `/*` → `X-Robots-Tag: noindex, nofollow`.
3. Put the PDFs back: stop `dropPdfs` in `scripts/pages.js` (or make it Cloudflare-aware), and check the menu buttons
   on the café, grand café and restaurant demos download their PDFs.
4. In `demo-hosting.json`, move the old base into `previous` and set `base` to `https://demos.sitefloor.com`; run
   `npm run demo-links`; `npm run rules` must pass.
5. Retire the GitHub Pages workflow (`demos.yml`) once the new site is live, so only one copy is published.
