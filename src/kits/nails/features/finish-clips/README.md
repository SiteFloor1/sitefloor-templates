# Finish clips

| | |
|---|---|
| Feature id | `finish-clips` |
| Plan | signature and above |
| Config | `finishes.items` (`id`, `name`, `text`, `still`, `clip?`: `{ mp4?, webm? }`); `sections.finishes` |

## How it works
Chrome, cat-eye, velvet and matte: a still first; where the salon has a clip, a tap plays it (silent, looping, inline). Nothing loads before the tap.

## When something is missing or fails
A clip that fails puts the still back. Finishes without a clip show the still only (the demo has no clips yet).

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.
