# Tissue (florist look)

For florists who sell on Instagram and TikTok, often from a home studio. **The home page is their feed.** Fresh and
Forever (up to three ranges) switch what shows; a pinned post comes first, two columns by two rows (a still, or a short
muted clip that can be paused and stays still under reduced motion); the rest flows round it in a strict three-column
grid, every tile 4:5, each bouquet with its name, its price, what's left and an italic "Ask for this one". The weekly
drop is one post in the feed, its countdown in peony. Below the feed, one satin ribbon, then "Send the link".

| Token | Value | Used for |
|---|---|---|
| `--bg` | warm white #FBF8F3 | the page; colour comes from the tissue, ribbon and flowers in the photos |
| `--surface` | blush #F3E3DF | the drop's tile and panel, photo placeholders |
| `--accent` | peony petal #9A3A64 | text and lines only: the ask links, the chosen range, the drop's digits, focus |
| `--text` | #2A2220 | ink, and the one filled button per screen |

Type: Tenor Sans (names, prices, headings, nav) in normal case, never letter-spaced; Spectral 300 for reading, its
italic for labels, asks and the handwritten-style card. No small capitals anywhere. Square photos, no pills, no radius
except the swatches. Motifs, used sparingly: the pearl pin (wordmark, the Pinned flag, holding each card), one satin
ribbon between the feed and "Send the link", the card. Motion: the pinned clip and a 2% ease on hover; nothing on scroll.

**Header:** the pin and the name in Tenor; the pages as plain words; Order as one underlined word (Menu on a phone).
**Home:** the ranges → same-day line and postcode check → the feed (pinned, the first bouquet, the drop, a full row)
→ the ribbon → Send the link → LIVE dates. **Phone bar:** warm white, an ink "Ask on WhatsApp" and "or Instagram".
**Inner pages:** a quiet "← Laleh" back link, the page's name in Tenor with its line in italic beside it; occasions use
the feed's grid; questions open and close with a peony +.

Lays out every feature it offers (`src/kits/florist/looks.js`): `todays-bouquets`, `same-day`, `make-this`,
`live-dates`, `the-drop` (page and the feed's tile), `occasion-pages` (both), `delivery-areas` (both), `care-card`,
`bouquet-builder`, `follow-order`, and the shared `plan-visit` and `custom-pages`. The four social-first features have
no markup or styles outside a look. The kit refuses any florist feature this look doesn't offer. Fonts self-hosted with size-matched fallbacks (`fonts.css`). Design record:
`sitefloor-internal/docs/design/laleh.md`.
