# fault-guide (electrician kit, Starter, ELEC-12)

"Something's wrong? Tell us this." The visitor picks what happened (keeps tripping, part of the house is off, a
burning smell, a warm socket…) and sees what to tell the electrician, then one safety line. It never tells anyone to
repair, reset or open anything: the validator refuses lines that read like an instruction. "Send this on WhatsApp"
carries the client's opening and the choice; the phone number sits beside it. Without JavaScript every case is listed.

```json
"faultGuide": {
  "message": "Hello <your business>, something's wrong with the electrics.",
  "safety": "Please don't open or repair anything yourself. If you smell burning, see scorch marks or hear crackling, keep clear and call us now.",
  "cases": [{ "id": "trip", "label": "Keeps tripping", "tell": ["When it trips: straight away, or after something is switched on."] }]
}
```
Heading: `sections.fault`. 2–6 cases.
