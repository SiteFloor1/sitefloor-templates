# Launch mode (Starter)

For a new house before its first scents are out. `launch`: `date` (the launch day), `scents` (the launch fragrances),
`newWeeks?` (how long they show "New" after the day), `message` (the WhatsApp line for the waiting list and
pre-orders, `{fragrance}`, `{ml}`, `{price}`), `waitlist?.formUrl` (the house's Google Form; without it the waiting list
goes on WhatsApp), `preorder?` (`{ fragrance id: Stripe Payment Link }`), `story?` (`title`, `text`, `by`: the founder's
note in their words) and `terms` (when pre-orders ship, what happens if they cancel; UK customers keep their 14-day
right to cancel). Before the day the hero says when it's out and offers the waiting list and pre-order; from the day
the site is the shop by itself (checked in the browser on the day, so no rebuild is needed). No countdown pressure,
no waiting-list counts, no stock numbers. A demo shows a quiet control to see either state.
