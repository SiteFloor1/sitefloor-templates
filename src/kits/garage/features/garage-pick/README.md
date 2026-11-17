# garage-pick (Signature)

Pick your car, see your bays (PARK-10). The hall drawn to scale from the client's measurements (`hall`: `name`,
`width`, `depth`, `bayDepth`, `gate { y, width }`, `rows [{ side, x, bays }]`, `columns`), at build time, as SVG.
The visitor picks one of four typical car sizes (`CARS` in `lib/garage.js`, labelled as typical); the free bays that
fit light up (30 cm either side, 40 cm for cars 1.95 m wide or more, 20 cm to spare in length), the first one is
named with the room either side, and "Reserve bay N" opens WhatsApp with the request. With no bay, the waiting list.
With garage-charging and garage-security on, charging and camera coverage are layers on the plan.

The chips sit in the look's hero card, with the answer and the reserve link. They share
the car as `garage-car`, so the plan, the aerial hall and the night route follow one choice.
