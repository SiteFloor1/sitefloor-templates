# Cover look

For bridal hair and makeup artists (kit `bridalbeauty`). The home page opens as a bridal magazine cover.

- **The cover:** one finished bride full-bleed; the artist's name as a Didone masthead (the page's h1). By default the
  name sits in its own band above the photograph, which works with any photo. When the client's cover photo has room
  above her head, set `hero.cutout` (the same photo with only her head and hair kept, WebP with transparency, same
  size) and the name passes behind her head. The cover lines are the answers: her date (or the next open Saturday),
  trial and wedding day for the service she picks, what time we start, and "On the cover" naming the look.
- **Inside:** pages open with their name set very large in Libre Bodoni; prices and times as ruled lists with the
  figures in the masthead face; looks captioned in italic.
- **Header:** a thin line of words. Over the cover on the home page (pages left, the issue line right); elsewhere the
  name small in the middle. Menu opens every page on a paper sheet.
- **Footer:** an imprint page: who, where, ask, hours, pages as ruled label and value lines.
- **Phone bar:** "Your date" (back to the cover) and WhatsApp in the accent.
- **Colour:** warm white #F6F2EC, ink #161312, one accent (fern #3D5A43 by default; suggestions in look.json) used for
  "Open.", the send buttons and links. Photographs in one fresh, warm grade.
- **Type:** Libre Bodoni (masthead, headings, figures, cover lines) and Faustina (every sentence); size-matched
  fallbacks in fonts.css.
- **Sections moved to pages when they're on (look.json `onPages`):** travel and reviews to the bridal page; "before I
  arrive" and the studio to the trials page; questions to Plan your visit. The home page keeps the cover, This season,
  the packages and everyone in the chair.

Client checklist: a cover photo of a finished bride, portrait, at least 1600 × 1920, with plain background and, for
the name behind her head, clear room above it; `hero.focus` places her face on a wide screen and a phone.
