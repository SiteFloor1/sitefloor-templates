# hol-calendar: next free dates (HOL-7 on Signature)

Each home on The homes shows its next free runs of three nights or more within twelve weeks ("Next free: 13 to 20
Dec"). They come from the company's own Google Sheet, published as CSV (`homes.calendar.csvUrl`), one row per booked
stay: `home,from,to,updated_at` (`from` is the first night, `to` the leaving day). A company can fill it by hand or pull
each listing's calendar link into it with a sheet formula. When the newest `updated_at` is older than
`homes.calendar.staleAfterHours` (36 by default), or the sheet can't be read, nothing is shown as free and the page
says so. Demos use `src/demo/hol-calendar-provider.js`, written on the day.
