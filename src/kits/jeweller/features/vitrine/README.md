# Feature: vitrine (jeweller, Signature)

The pieces page as a cabinet of drawers, one per collection, after the Bond Street ring tray: open a drawer and its
pieces lie in a suede tray, one to a slot. Each piece opens full screen in the pieces viewer, or without JavaScript its
own page. One drawer open at a time (`<details name>`); the first starts open.

- **Where:** the pieces page, in place of the stacked collection grids (a demo keeps the grids for the plan switcher).
- **Config:** none; it reads `pieces.collections` and `pieces.items`.
- **No JavaScript needed.** The tray eases open where the browser can animate `details`; it opens at once elsewhere
  and with reduced motion.
