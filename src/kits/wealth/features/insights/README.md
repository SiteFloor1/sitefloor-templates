# Insights (Plus) and the insights page (Plus)

The firm publishes insights without Sitefloor: from its own Google Sheet (File → Share → Publish to web → CSV).
A row shows on the site only when compliance has approved it. Both the home section (three newest) and the page
(all, filtered by subject, each folding out to its full text) read the sheet in the visitor's browser.

## The sheet

| Title | Category | Date | Summary | Body | Author | Photo | Approved | Approved by | Approved on |
|---|---|---|---|---|---|---|---|---|---|

- **Approved** is a tick box (or "yes"). A row also needs a name in **Approved by** and a date in **Approved on**
  (YYYY-MM-DD, not in the future). Without all three, it never shows.
- **Date** is the publication date; a future date waits until that day. **Body**: paragraphs separated by a blank line.
- **Photo** is one of the names in `insights.photos` (the site's own pictures); anything else uses the first.
- A row that promises a return or performance ("guaranteed", "outperform", "8% a year") is held back whatever the
  tick says (COBS 4.2). Every insight carries "General information, not advice"; the firm can't remove it.

```json
"insights": { "title", "intro", "source": "sheet", "csvUrl": "https://docs.google.com/spreadsheets/d/e/…/pub?output=csv",
  "photos": { "coast": { "src", "width", "height", "alt" } }, "items": [] }
```

`source: "site"` writes insights into `items` instead (each with `approvedBy` and `approvedOn`); they are also the
fallback shown before the sheet loads. A demo uses `"simulated"` with a `sample` CSV (`src/demo/insights-provider.js`).
The CSP allows the Google Sheets hosts only when `source` is `"sheet"`.
