# Download the menu (PDF)

| | |
|---|---|
| Feature id | `menu-pdf` |
| Plan | starter and above |
| Config | `menuPdf?`: `{ file?: "img/menu.pdf" }` (the restaurant's own PDF); without `file`, the menu is made from `menu` |
| Files | `menu-pdf.njk` (the download link), `menu-pdf.css`; the PDF in `src/kits/restaurant/lib/menu-pdf.js`, written by `src/kits/restaurant/build.js` |

## How it works
Every build writes `menu.pdf` from the same menu data as the website, so the PDF can never disagree with it: A4, two
balanced columns, the look's own typefaces and colours (`look.json` → `print`), one sitting per page (a sitting that
nearly fits one page is set slightly smaller, down to 84%), then the drinks, then the full allergen chart. Every page
carries the restaurant's allergen statement and the date its chart was checked.

A restaurant with its own designed PDF sets `menuPdf.file` instead; the link then downloads that file. Offering to redo a
client's menu is just turning `menuPdf.file` off.

The link sits under the menu on the home page, on the menu page and in the Menu Book.
