# Showreel on the home page (CVID-1)

| | |
|---|---|
| Feature id | `carfilm-reel` |
| Plan | starter and above |
| Config | `reel` { items [{ id, title, kind, car, seconds, src (MP4), poster, width, height }], note? } |

Each film as its poster with its runtime (from `seconds`), the kind of shot and the car. Tap to play it in place,
muted with the player's own controls. Films load only when played.
