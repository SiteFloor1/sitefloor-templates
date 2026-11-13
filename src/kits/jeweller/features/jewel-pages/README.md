# jewel-pages (jeweller kit, Plus)

The pieces page (`/pieces`): every collection, each opened by its name very large and its pieces in a staggered
two-column catalogue. And a page for every piece (`/piece-<id>`): the photograph large, the collection, name, spec line
and price as the client sets them, its story, its facts and actions (see it in person, set aside, drop a hint, find
your size). Then, as the plan allows and only when the client has given what each shows: the piece in detail
(`the-piece`), on a hand (`on-a-hand`), pair it, inside the band; the box; more
from the collection. Counts as one page however many pieces.

Config `piecesPage` (`title`, `intro`, optional `description`); pieces in `pieces.items`, each with an optional `story`
(paragraphs separated by a blank line). Piece pages are flat (`piece-<id>.html`) so previews with relative links work.
