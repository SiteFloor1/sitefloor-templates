# Feature: driver-form (hire kit)

Driver details in advance, through the client's OWN Google Form: licence, age and the DVLA check code. **Plan:** Plus.
Shown in the home questions and on every car page (and on Before your hire on Signature).

The site only links to the form and says what to bring: it never stores, checks or decides. The check code rule comes
from gov.uk with the date we checked it (`checkCode.validDays`, `source`, `checked`): on 29 Oct 2026 gov.uk said a code
is valid for 21 days (https://www.gov.uk/add-driving-licence-check-code). Re-check before shipping a client.

Config: `hire.driverForm` `{ url, checkCode: { validDays, source, checked } }`.
