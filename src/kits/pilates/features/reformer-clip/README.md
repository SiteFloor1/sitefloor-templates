# The reformer, explained (Signature showpiece)

| | |
|---|---|
| Feature id | `reformer-clip` |
| Plan | signature |
| Config | `reformerClip`: `video` (`src` .mp4, `width`, `height`, `seconds`), `poster` (a still from the clip), `captions` (`{ from, to, text }` in seconds, in order), `credit`; `sections.reformerClip` |
| Files | `reformer-clip.njk`, `.js`, `.css` |

## How it works
A real clip of a teacher showing a first-timer onto the reformer. The still shows first; the film is only fetched
when someone taps Watch, plays silently once, and stops on its last frame. The studio's captions show over the film
at their moment and are listed beside it, so the words work without the film too. Encode the clip at 720p H.264
(`-preset veryfast`, no sound); keep it short.

## When something is missing or fails
Without JavaScript the still and the captions show; the film doesn't play.
