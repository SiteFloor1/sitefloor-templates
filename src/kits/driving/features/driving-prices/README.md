# driving-prices (Starter, DRIVE-1)

Prices on the first screen: one switch between manual and automatic (only when the instructor teaches both); one hour,
two hours, a block and the intensive course, with what the block and the course save against single hours (worked
out, never negative). Without JavaScript both lists show, each under its name. The planner (`driving-pass`) reads the
chosen gearbox.

```json
"lessons": {
  "title": "Prices",
  "manual":    { "hour": 38, "two": 76, "block": { "hours": 10, "price": 360 }, "intensive": { "hours": 30, "price": 1110, "over": "over one to two weeks" } },
  "automatic": { "hour": 41, "two": 82, "block": { "hours": 10, "price": 390 }, "intensive": { "hours": 30, "price": 1200, "over": "over one to two weeks" } }
}
```
A block or course dearer than the same hours singly is refused (config.js).
