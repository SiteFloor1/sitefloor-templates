# Your advisers (Starter)

Ruled rows: name, role and, for anyone on the FCA register, their individual reference number with a link to the
register (WEALTH 2). On Plus and Signature the look moves this section to the people page.

```json
"people": { "items": [{ "id", "name", "role", "irn": "ABC01234", "leads": ["selling-a-business"], "note", "phone", "email" }] }
```

A demo's IRN ends `00000`; a client site can't use one that does. `leads` names moments in `lifeEvents.items`.
