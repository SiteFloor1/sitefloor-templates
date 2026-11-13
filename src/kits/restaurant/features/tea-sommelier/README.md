# The tea sommelier

| | |
|---|---|
| Feature id | `tea-sommelier` |
| Plan | signature |
| Config | `tea.library` (each tea's `kind`, `caffeine`, optional `strength`, `milk`, `pairs`, `origin`, `notes`, `steep`); `sections.sommelier` (`title`, optional `intro`, optional `photo`) |
| Files | `tea-sommelier.njk`, `.css`, `.js`; logic `teaFor` in `src/kits/restaurant/lib/tearoom.js` |

## How it works
Three questions (the time of day, milk or not, how strong) and the library's best match from the café's own
descriptions: by the strength it drinks, whether it takes milk, and its caffeine (low or none in the evening). The
answer is set like a menu card: the tea, where it's from, how it's brewed and what it goes with on the stand, with a
second choice. Ties keep the library's order, so the café decides which tea leads.

## When something is missing or fails
Without JavaScript the questions are hidden and the whole library is listed.
