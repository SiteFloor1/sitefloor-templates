# driving-areas (Starter, DRIVE-1)

"Do you cover me?" on the first screen: a postcode against the instructor's own districts. A yes names the area in the
instructor's words; a no says what to do (`notCovered`). Every district is printed under the box, so it works without
JavaScript. The Areas page (`driving-area-page`) shows it again with every district by name.

```json
"areas": {
  "title": "Do you cover me?",
  "pickup": "We pick up from home, school, college or work in",
  "districts": [{ "district": "E14", "name": "Poplar and Canary Wharf" }],
  "notCovered": "Message us and we'll say honestly if we can reach you."
}
```
