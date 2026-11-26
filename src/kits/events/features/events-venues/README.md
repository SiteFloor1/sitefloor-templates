# events-venues (Signature)

Venues (`venues.html`, EVT-6): the client supplies the list, always. `venues.items`: `{ name, area, kind, seated?,
standing?, line?, url?, partner? }`, grouped by `area` in the order given. Capacities are the venue's own. `partner:
true` only with an agreement in place (shown as "Partner venue"); otherwise no venue is called a partner. The note
under the list says the venue's own licence and rules decide (`venues.note` to word it).
