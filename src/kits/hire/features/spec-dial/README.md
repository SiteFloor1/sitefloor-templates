# Feature: spec-dial (hire kit, Signature showpiece)

Above the fleet page's list. **Plan:** Signature.

One precise control: choose what the dial turns (seats, power, budget, or "free on my dates"), turn it, and the whole
fleet filters live; the matching cars line up in one row of night photographs (each links to its car page), with the
count. The dial drives the fleet page's own radio filters, so the grid below always agrees and, without JavaScript,
the plain filters do the same job.

- **Keyboard and screen readers:** the dial is a `role="slider"` (arrows step, Home and End jump), its value spoken as
  "Power: 450+ bhp"; the modes are toggle buttons; each mark on the dial can be tapped.
- **Motion:** the hand turns with a short ease when you move it, never by itself, and not at all under reduced motion.
- **Dates:** "My dates" switches on the fleet page's date filter (the shared picker against the client's Sheet; an
  unreadable Sheet filters nothing and says so).
