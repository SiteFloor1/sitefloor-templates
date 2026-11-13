# Clothing brands (menswear, running and outerwear): playbook

What to build for this trade (kit `wear`). The ground rules and the steps for a new kit: [`docs/TRADE-PLAYBOOK.md`](../../TRADE-PLAYBOOK.md).

## Menswear: running and outerwear brand (new kit `wear`, branch `trade/menswear`), direction stage 29 Oct 2026
A men's brand growing on TikTok: wind and rain shells, windbreakers, run-club kit. Owner's feel: On on steroids, crossed
with Dior Men and Arc'teryx Veilance; Satisfy and Represent 247 too. Must read as a big, expensive brand, not a small
Shopify store. The kit must later suit a cosy-essentials brand (no running-only wording in shared feature logic).
Demo brand: **Isotach** (fictional; a line on a weather chart joining points of equal wind speed). Directions, feature
split and difference table: `sitefloor-internal/docs/design/isotach.md`. Customer questions: `docs/CUSTOMER-QUESTIONS.md`.
Selling the products stays on the client's own shop (Shopify or Stripe Payment Links); the site is the flagship:
drops, fit, fabric, where to try it, the club.
**Built 29 Oct 2026 (kit `wear`, look `basalt`, demo `sites/demos/menswear`).** Starter: `drop-line`, `pieces`,
`details`, `club-runs` (+ Plan your visit, questions). Plus: `shop-page`, `fit-room`, `club-page`, `drops-page`.
Signature: `lookbook`, `piece-pages`, `size-run`, `wear-today`, `kit-card`, `route-cards`, `drop-queue`. Live data:
the stock sheet (`piece, size, left, updated_at`), the line sheet (`serving, given, updated_at, note`), Open-Meteo.
For a cosy-essentials brand: drop the club and weather features; everything else is garment-generic.
Ideas not built yet: a gift-wrapping note at checkout (belongs on the client's shop), a pop-ups page with dated events.
