# Category pages (Plus; each part of the menu counts as a page of the plan)

A page for each part of the menu with a `page` (`{ title, intro?, photo?, sections? }`), at `<category id>.html`:
each treatment with its minutes, price, line and, when the clinic wrote them, afterwards, patch test and this evening.
With this feature on, every category needs its `page`. Needs `skin-menu`.

On Plus (home + four pages) each part of the menu with a page counts as one of the four, like the bridal kit's guides
(checked in `src/kits/skin/config.js`, `checkCategoryPages`); extra pages are sold with `addonPages`.
