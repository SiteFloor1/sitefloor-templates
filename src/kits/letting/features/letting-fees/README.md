# letting-fees: the fees page (every plan, free)

Letting agents must show their fees prominently, with VAT, and name their redress and client money protection
schemes (Consumer Rights Act 2015, s.83), with a copy of the CMP certificate on the site (2018 regulations). The
page is in the main menu of every page.

- **Owners:** each service in `fees.services` (`name`, `basis` `monthly` or `year-once`, `percent` with VAT,
  `includes`), then `fees.other` (`name`, `price` in pounds with VAT, `per`).
- **Tenants:** the permitted payments only, in plain English, from GOV.UK's "Fees you can charge as part of a
  tenancy" (lib/fees.js holds the caps, the page and the dates it was updated and checked). The agent's own terms in
  `fees.tenant` (`holdingWeeks`, `depositWeeksBelow`, `depositWeeksFrom`, `changeFee`, `lostKeys`) are refused above the caps.
- **Schemes:** `schemes.redress` (The Property Ombudsman or the Property Redress Scheme), `schemes.cmp` (with
  `certificate`, required on a client site), optional `schemes.deposits` (which deposit scheme protects deposits).
  Demo numbers are 000000 and marked "(demo)".

When GOV.UK changes the rules, update `RULES` in lib/fees.js (and its dates); the tests check the boundaries.
