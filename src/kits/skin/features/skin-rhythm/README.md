# Treatment rhythm reminders (BEAU-8, Signature)

From each menu item's `rhythm`: `everyWeeks` (the clinic's spacing between visits) and `reminders` (`afterDays`,
`label`, optional `note`: "SPF every morning this week", "Exfoliate again from today"). The visitor picks the
treatment and the day of the visit; the page lists the clinic's reminders and the next three visits still ahead and
saves them as one calendar file (all-day events, nothing sent anywhere). Book the next visit sends the clinic's
`rhythm.message` with `{treatment}` and `{date}`. On the courses page; needs `skin-courses`.
