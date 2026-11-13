# sketch-to-ring (jeweller kit, Signature)

From sketch to ring: past commissions told in the house's own photographs, in order from the first drawing to the
finished piece, each with a caption and how long it took. The Stories page (`/stories`) tells every one; on the home
page, the first is shown as two photographs, the drawing and the finished piece, with the weeks between. Step photos use the card-sized copy (`img/c/…`).

Config `stories`: `title`, `intro`, optional `description`, `items` = [{ `id`, `title`, `line`, optional `weeks`,
optional `piece`, `steps` = [{ `photo`, `caption` }] (two or more) }]. A demo may add `demoNote` (stock photographs of
different makers' work stand in for one commission). Section copy: `sections.stories`.
