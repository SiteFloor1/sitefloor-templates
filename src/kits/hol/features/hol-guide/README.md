# hol-guide: guest guidebook by code (HOL-9, Signature, unlisted)

One private page per home, `guide-<home id>.html`, kept out of the sitemap and search and not linked from the site.
`guides.items` (each { home, code, arrival, wifi, heating, bins, near, walks, leaving }). The guest opens it with the
code from the booking message, or straight from a link such as `guide-glasshouse?code=…`. The page carries a hash of the code, not the
code; that keeps it out of casual reach and is NOT security: the text is in the page. Door codes, key-safe codes and
passwords never go in a guidebook (the build refuses obvious ones): send those in the booking message on the day.
