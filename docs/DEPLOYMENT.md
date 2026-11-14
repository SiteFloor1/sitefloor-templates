# Deployment (Cloudflare Pages)

Each site is its own Cloudflare Pages project, connected to this repository.
Nothing depends on anyone's laptop: Cloudflare builds from GitHub.

## How a change reaches a live site
```
pull request ──► GitHub Actions: npm run check (all tests, all sites)
     │ merge
     ▼
   main ──► GitHub Actions: npm run check again ──► passes ──► fast-forwards `production`
                                                                  │
                                         Cloudflare builds only `production`
                                         with npm run release (unit tests, house rules,
                                         validation, build, size budget for that site)
                                                                  │ passes
                                                                  ▼
                                                             live site
```
- A commit that fails any check never reaches `production`, so it never deploys.
- If the Cloudflare build fails, the live site keeps serving its last good build.
- Never push to `production` by hand. It only moves when main is green.
- `main` is protected (pull request and the `check` status required); the `production` branch stays the
  deploy gate. Merge through the pull request (button or `PUT …/pulls/N/merge`); each merge starts a run on main.
- The nightly run promotes too, but only a commit whose own run on main was green or never started (the repository's
  first push started none; cause not established). If main's run failed, press "Re-run failed jobs" on it: a green
  re-run promotes.

## Demos
Demos aren't Cloudflare projects: `.github/workflows/demos.yml` publishes every demo to GitHub Pages each day (and after
each green run on main), at `demo-hosting.json` `base` + `/<demo folder>/`, with the case studies at
`<base>/case-studies/<slug>/` (only those whose media are all in the repo). Every page carries a robots noindex tag;
robots.txt allows crawling on purpose, because a crawler that may not fetch a page never sees its noindex. To move them
to their own domain (e.g. demos.sitefloor.com): add it in Settings → Pages → Custom domain, then change `base` and run
`npm run demo-links`.

## Create the project for a site
Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → `SiteFloor1/sitefloor-templates`.

| Setting | Value |
|---|---|
| Production branch | `production` (never `main`) |
| Build command | `npm ci && npm run release -- --site clients/<slug>` |
| Build output directory | `dist/clients/<slug>` |
| Environment variable (Production) | `SITE_ENV=production` |
| Environment variable (Preview) | `SITE_ENV=preview` (or leave unset: preview is the default) |
| Node version | `NODE_VERSION=22` |
| Build watch paths (include) | `src/*`, `scripts/*`, `package.json`, `package-lock.json`, `sites/clients/<slug>/*` |
| Preview branches | None, or only the branches you want to preview (each preview build counts toward the monthly limit) |

- **Preview builds are never indexed**: `SITE_ENV` other than `production` produces `noindex`
  meta tags, `X-Robots-Tag: noindex` and a `Disallow: /` robots.txt.
- Demo sites use the same setup with `demos/<kit>`; they are noindex in every environment.
- `_headers` (security headers, CSP, asset caching) is generated per site by the build.
- No secrets are needed. Do not add any to the repo; if a future feature needs one, use
  Cloudflare environment variables and document it here (name only, never the value).

## Custom domain
Pages project → Custom domains → add `www.client.co.uk` and the apex. The domain is registered
in the **client's** name; DNS points to Cloudflare. HTTPS is automatic. Set `url` in `site.json`
to the final `https://` domain *before* the production build (canonical URLs and the sitemap use it).

## Releasing a change
1. Branch, change, `npm run check` locally.
2. Push and open a pull request (mark it ready, not draft). GitHub Actions runs `npm run check`; it must pass.
3. Check the change on a phone: `npm run serve -- dist/<site> 4173`, or a Cloudflare preview if enabled.
4. Merge to `main`. When the check passes on main it moves `production`, and Cloudflare deploys.

## Limits to plan for (Cloudflare free plan, October 2026)
- 500 builds a month per account and one build at a time. A shared change (`src/`) rebuilds every
  client, so with 25 clients each shared release costs 25 builds. Build watch paths stop one
  client's edit from rebuilding the others. Batch shared changes into fewer releases as the
  client count grows.
- 100 Pages projects per account. Past roughly 80 clients, move to a second account, ask
  Cloudflare about a higher limit, or build in GitHub Actions and upload with
  `wrangler pages deploy` (confirm first whether direct uploads count toward the build limit).
  Decide before client 60.
- Source: developers.cloudflare.com/pages/platform/limits (checked October 2026).

## Rolling back
Pages project → Deployments → pick the last good deployment → **Rollback to this deployment**.
Then fix forward on a branch.

## After going live
- Search Console: add the domain, submit `https://domain/sitemap.xml`.
- Check `https://domain/robots.txt` shows `Allow: /`.
- Run PageSpeed Insights on mobile and record the result in the trade's `docs/trades/<trade>/speed.md` (then `npm run docs`).
