# Private dining page

| | |
|---|---|
| Feature id | `private-dining` |
| Plan | plus and above (page `private-dining`) |
| Config | `privateDining`: `kicker`, `title`, `intro`, `message`, `rooms` (`id`, `name`, `seats` [fewest, most], `minSpend?`, `text`, `photo?`), `menus?` (`id`, `name`, `price` a head, `courses`), `note?` |
| Files | `private-dining.njk`, `private-dining.css`, `private-dining.js` |

## How it works
Rooms with guest numbers and minimum spend, set menus per head, and an enquiry form: guests, date, room and menu. The line under it works out the set-menu total for the group, whether it covers the room's minimum spend, and warns when the group is outside the room's numbers. **Send the enquiry** writes it all to WhatsApp.
