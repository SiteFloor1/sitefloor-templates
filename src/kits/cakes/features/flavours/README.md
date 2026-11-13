# Choose by the slice (flavours)

| | |
|---|---|
| Feature id | `flavours` |
| Plan | plus and above |
| Config | `flavours.items[]`: `id`, `name`, `what` (what's in it), optional `months` (1–12; leave out for all year), `allergens` (from the studio's chart), optional `diets`, optional `layer` (`top`, `height`: where its slice sits in `flavours.photo`, as percentages of the photo's height); optional `flavours.photo` (the studio's cut slices stacked up); `sections.flavours` |
| Files | `flavours.njk`, `.js`, `.css` |

## How it works
The flavour list sits beside the photograph. Tapping, hovering or tabbing to a flavour outlines its layer in the
photo and says what's in it. Flavours without a `layer` are listed but not outlined. On the home page it links to the
flavours page when that's on.

## When something is missing
Without a photo it is a list. Without the script the first flavour is described and nothing is outlined.
