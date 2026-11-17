# The latest posts (TikTok)

| | |
|---|---|
| Feature id | `stalls-posts` |
| Plan | plus and above |
| Config | `posts`: `tiktok` [{ `href`, `line`, `cover` (a still from the video, the stall's own) }], `tiktokProfile`, `instagramProfile?`; `sections.posts`. Clients need `tiktokProfile`; demos are fictional, so they leave out `href` and the profiles and the covers show without links |

Up to three of the stall's TikToks as tall covers that open TikTok, and a link to the profile. Links, never embeds:
TikTok's embed script is heavy and sets cookies, so nothing from TikTok loads on the page. The stall's Instagram is
the shared `gallery` feature (Behold), shown next to this section on the home page.

Registered in `src/kits/stalls/kit.js`.
