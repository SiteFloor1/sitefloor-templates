# Handover (construction kit)

A builder's site with the calm of a finished house. Design, references and the approval history:
`sitefloor-internal/docs/design/construction.md`.

- **Hero:** the extension visualiser (`hero.photo` 16:9, `hero.photoPhone` 4:5), then `hero.title` with one italic word,
  `hero.intro` under it, and the site code's key strip beside (when "your house, this week" is on).
- **Header:** the name as a wordmark (an " & " in the name is set in italic), the site code with its key tag, the
  telephone number, and "Menu", which opens every page on any screen. **Phone bar:** white, Call · Site code (WhatsApp
  when the site code isn't on); the page keeps room for it and scrolled-to content stops above it.
- **Home order:** how a build runs, recently handed over, what we build, accreditations, Start a project, reviews,
  questions, page links, the yard. What we build, Start a project, accreditations, reviews, questions and page links
  move to their pages when those are on.
- **Palette:** a duck's egg on a limewash ground: ground `#F7F5F0`, stone `#EDE9E1`, umber `#2A241D` text, duck egg
  `#A9CBC1` as a fill only (`--accent-soft`: the key tag, the ground line, the chosen control), its shade `#3E6B62`
  (`--accent`) for links and focus. A client's own accent replaces the shade.
- **3D colours:** the `--model-*` tokens in `look.css` (sky, light, lawn, brick, mortar, glass, frames…).
- **Type:** Castoro 400 (and italic) / Kumbh Sans 400–600, self-hosted, size-matched fallbacks.
- **Photographs:** one grade (saturation 0.85, 18% toward umber shadows and a shell-white highlight).
- **Motion:** the hero photo settles once (2.4 s); the 3D turns a quarter-step into its resting view once, then only
  moves when dragged. Nothing tied to the scroll; reduced motion stops both, and "pause" stops the photo.
