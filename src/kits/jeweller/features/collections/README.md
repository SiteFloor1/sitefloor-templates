# collections (jeweller kit, Starter)

The collections on the home page, as doors: one tall photograph each (a piece worn, from the collection's `door`, or
its first piece), the collection's name beneath. With `jewel-pages` each door opens the collection's own page
(`/collection-<id>`: its line, the worn photograph and every piece); without it, the pieces open one at a time.
One section, no headline device.

Config: `pieces.collections` (`id`, `name`, optional `line`, optional `door`: a 3:4 photo, about 900×1200) and
`pieces.items` (each with `collection`). Cards use `img/c/<file>` (900×1125), a smaller copy of each piece photo.
