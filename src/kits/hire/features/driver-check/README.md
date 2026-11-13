# Feature: driver-check (hire kit)

On each self-drive car's page: "You can request this car if you're 30 or over, five years' full licence, up to six
points", then three answers (age, years with a full licence, points) read back against the car's own rules
(`fleet.cars[].driver`). **Plan:** Plus. It never approves anyone: the client checks every licence before the handover,
and the page says so.
