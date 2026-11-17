# Drop alert

| | |
|---|---|
| Feature id | `stalls-drop` |
| Plan | signature |
| Config | `drop`: `title`, `at` ("YYYY-MM-DD"), `line`, `message` (the WhatsApp text, e.g. "Add me to the drop list"), `photo?`; `sections.drop` |

One-off flavours and pop-ups are what stalls post most. This puts the next one on the home page with its date and a
"Tell me" button that opens WhatsApp asking to join the stall's broadcast list (WhatsApp Business broadcast lists are
free; the stall adds the number). No promise of stock or a time unless the stall writes one. The stall changes or
removes it once the day has passed; the demo's date moves forward on every build (`src/demo/dates.js`, `drop.at`).

Registered in `src/kits/stalls/kit.js`.
