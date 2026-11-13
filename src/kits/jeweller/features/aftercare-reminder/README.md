# aftercare-reminder (jeweller kit, Plus)

The Aftercare page (`/aftercare`): cleaning, checks, repairs and resizing in the house's own words (never a guarantee
it doesn't give), then a yearly clean-and-check reminder: the customer names the piece and the day they collected
it, and a calendar file (.ics, every time in UTC, 10am shop time, repeating yearly) is made in the browser. Nothing is
sent to the house. Config `aftercare`: `title`, `intro`, `items` ([{ `title`, `text` }]), `reminder`, optional `description`.
