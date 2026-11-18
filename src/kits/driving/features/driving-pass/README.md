# driving-pass (Signature, DRIVE-6, with the cost to pass)

"When could I pass?" on the first screen. The learner picks lessons a week (the instructor's own choices, or the
intensive course), their hours so far and whether the theory is passed. It shows:

- the weeks to test-ready on the DVSA's average of 45 hours of lessons, and the date that lands on (the intensive
  choice gives no date: "dates agreed with you");
- the cost to pass: the hours still to go at the instructor's block (or intensive) rate, plus the practical test and,
  if not passed, the theory test, from gov.uk; rounded to £10 and called "about".

Labelled on the card: "An estimate from DVSA averages and our prices, not a promise." Fees show only while
`fees.checked` is under six months old; after that the cost leaves them out and says to check gov.uk. Follows the
manual/automatic switch in `driving-prices`.

```json
"planner": { "title": "When could I pass?", "intro": "Two-hour lessons a week", "perWeek": [{ "hours": 2, "label": "One" }, { "hours": 4, "label": "Two", "default": true }], "intensive": true },
"fees": { "practical": 62, "practicalOutOfHours": 75, "theory": 23, "checked": "2026-11-16", "source": "https://www.gov.uk/driving-test-cost" }
```
