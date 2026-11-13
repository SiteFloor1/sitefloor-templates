# for-business (florist kit, Signature, page `for-business`)

Hotels, restaurants and offices: two photographs of the florist's work in a room, what changes each week (in their
words), how it works (questions and answers), up to four sizes with their prices and how often they change, and one
enquiry on WhatsApp. With `contract.accounts`, each business client can also have a private page (`business-flowers`).

```json
"contract": { "title": "Hotels, restaurants and offices", "intro": "…", "weekly": "…", "message": "Hello <your shop>, flowers for our business:",
  "photos": [{ … }, { … }], "how": [{ "q": "…", "a": "…" }],
  "sizes": [{ "id": "desk", "name": "Reception", "line": "…", "price": 85, "every": "week" }],
  "accounts": { "source": "sheet", "csvUrl": "…", "title": "Your flowers this week" } }
```
