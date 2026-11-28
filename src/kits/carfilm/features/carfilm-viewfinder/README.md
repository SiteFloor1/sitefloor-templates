# Viewfinder (hero)

| | |
|---|---|
| Feature id | `carfilm-viewfinder` |
| Plan | starter and above |
| Config | `hero` { kicker, title, intro, film { src (MP4), smallSrc?, poster, width, height, fps, label } } |

The studio's film seen through a camera monitor: frame lines, corner marks, a rule-of-thirds grid, a centre mark, the
surround shaded. Under it the readout: the clip's own timecode (its position at `fps`, never invented) and a pause
(core's motion pause). The poster paints first; the film starts after the page has loaded, never with reduced motion or
Save-Data, and stops while the tab is hidden. The frame is centred at the first viewfinder format by CSS, so nothing
moves when the script starts. Includes the readout (`carfilm-tonight`) and the format switch (`carfilm-formats`)
when they are on.
