# hair-services (hair kit, Plus)

Services and prices on one page (`/services`): the level chooser once at the top (a radio group, so it works without
JavaScript; the grids read it with `:has()`, and fall back to the default level), jump links, then each menu group
as a price grid: lengths across, the chosen level's price in each cell, a flat price across the row ("£52, any
length"), "Priced at a free consultation" for `null`, times under each service, and the skin-test line on colour.
Page head: `servicesPage` (`title`, `intro`, `description`, optional `photo`). The grid and the chooser
(`partials/price-table.njk`, `partials/level-pick.njk`) are shared with the colour and group pages; their CSS is here.
