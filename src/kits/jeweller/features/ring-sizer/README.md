# ring-sizer (jeweller kit, Plus)

The Ring size page (`/ring-size`), as a guide: (1) measure the finger with a strip of paper and type the length: the
nearest UK letter (or "between M and N"); (2) match a ring you own on the screen: first fit an outline to a bank card
(85.60 mm, ISO/IEC 7810) so the screen's scale is known, then grow a circle until it fills the ring's inside; (3) ask
for the house's free sizer by post on WhatsApp. The UK sizes H to Z with circumference and diameter, from a published
UK chart, checked 29 October 2026 (`src/kits/jeweller/lib/sizes.js` names the source). The page always says the size
is confirmed at the appointment. The card scale is kept on the device and shared with `on-a-hand`.
Config `ringSizer`: `title`, `intro`, `postal` (the house's words), `message` (the WhatsApp message), optional `description`.
