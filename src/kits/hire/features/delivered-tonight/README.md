# Feature: delivered-tonight (hire kit, Signature showpiece)

Inside the home page's handover (`handover`), the brand moment becomes the request. **Plan:** Signature.

1. Choose the car (self-drive cars that can be delivered), your postcode and the dates (the shared date picker, with
   the days that car is taken on the client's Sheet).
2. **The car arrives:** the door scene gives way to that car in a real night photograph: its own arrival photograph
   (`photos.arrival`, the `arrival_photo` column) when the client has one, otherwise its night photograph. A slow fade,
   once; nothing moves under reduced motion.
3. **Beneath it, the request assembles**, one line at a time: the client's delivery window, the dates and times, the key
   handed over at the door (the one bloom line), the hire from the client's own table, the delivery fee for the
   postcode's zone, the total, and the deposit apart (it's returned). A postcode outside the zones says so; a rate the
   car doesn't have says "ask us". Every figure is the client's own.
4. **Request and deposit from there:** WhatsApp with every part and the reference; the car's deposit Payment Link
   (`"holds": "request"`) carries the same reference to Stripe.
5. **The confirmation is the same scene:** "Request sent, not booked", the car, the dates, the postcode and the
   reference, and "Nothing is booked until we confirm". "Change something" returns to the request.

Without JavaScript the still handover above stands on its own and the button opens WhatsApp.
