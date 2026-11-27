# Viewfinder (carfilm kit)

A car studio seen through its own camera. The hero is a monitor: the studio's film behind crisp frame lines, corner
marks, a rule-of-thirds grid and a centre mark, the surround shaded. Along the bottom, the readout: the clip's real
timecode and a pause, tonight's golden hour, sunset and blue hour on the studio's road, and (Signature) the format
switch that snaps the frame to each delivered shape. Ivory ground, warm ink, apricot from the low sun; monitor black
only for the readout. Trirong and Wix Madefor Text, sentence case; Martian Mono only inside the readout and the
timecode section markers.

- `site.hero`: `kicker`, `title` (above the monitor), `intro`, `film` { `src` (MP4), `smallSrc?` (a lighter MP4 for
  phones), `poster`, `width`, `height`, `fps` (the timecode counts in it), `label` }.
- Section markers count `site.sections` in order from 01:00:12:00; inner pages carry their page number.
- Accent: any suggested colour, or the studio's own if it passes contrast on ivory (the readout keeps its own gold).
