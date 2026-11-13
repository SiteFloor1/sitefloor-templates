# Gallery (home strip)

| | |
|---|---|
| Feature id | `gallery` |
| Plan | starter and above |
| Config | `gallery` (see below), `sections.gallery` |
| Files | `gallery.njk`, `gallery-list.njk`, `gallery.css`, `gallery.js`; the full page is the `work` feature |

```json
"gallery": {
  "source": "behold",                                   // or "photos"
  "feedUrl": "https://feeds.behold.so/AbC123xyz",       // behold only
  "profile": "https://www.instagram.com/shopname",      // optional
  "handle": "shopname",                                 // optional, shown as @shopname
  "filters": [{ "tag": "skinfade", "label": "Skin fades" }],   // hashtag → chip on the work page
  "photos": [{ "src": "img/cut-1.webp", "alt": "…", "caption": "…", "by": "Kofi", "width": 720, "height": 900, "tags": ["skinfade"] }]
}
```

## How it works
- `photos`: pictures stored with the site. Always in the built page, so it is complete without JavaScript.
- `behold`: the shop's Instagram. The shop switches Instagram to a free Business or Creator account and connects it to Behold (behold.so) once. Behold publishes a JSON feed with resized WebP images. The visitor's browser fetches it, so new posts appear without rebuilding the site. Any `photos` given are shown first and stay if the feed can't be reached.
- Home strip: the newest 6, three across like an Instagram profile, linking to the work page when it's on, otherwise to each post.
- Hashtags on posts drive the work page's filters. Shops should use a few consistent tags (e.g. #skinfade, #kidscut); only tags listed in `filters` become chips.

## When something is missing or fails
Feed unreachable, slow (6 s) or empty: stored photos stay; with none, a link to Instagram replaces the grid. Images are only accepted from Behold's own image hosts.

## Privacy and security
Behold receives the visitor's IP address when the feed loads; the privacy page says so automatically. The site's security headers allow `feeds.behold.so`, `behold.pictures` and `*.behold.pictures` only when the source is `behold`.

## Cost
Behold's paid plans cover several shops per account (about $30 a month for 15 at the time of writing). Moving to Sitefloor's own Meta app later needs Meta app review and business verification; the `source` setting is where that switch would go.

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.
