# Car videographers and photographers: plan

Kit `carfilm`, look `viewfinder`, demo Kerrow (`sites/demos/kerrow`). Owners (a new car, a restoration, a sale) and
dealers (stock, launches, social). Customer questions: `questions.md`. Codes: `docs/VISION.md` (CVID-1 to 12; CVID-6 dropped).

## The showpiece
The viewfinder: the studio's film behind a real camera monitor's guides (frame lines, corner marks, thirds, a centre
mark, the surround shaded), and along the bottom the readout: the clip's own timecode, tonight's golden hour, sunset
and blue hour on the studio's road (calculated, and tomorrow's once tonight's has gone), and on Signature the format
switch that snaps the frame to each shape the studio delivers. Every number on it is real.

## Features by plan
| Plan | Features |
|---|---|
| Starter | Viewfinder with the film and timecode; tonight's light in the readout (CVID-8); the showreel with runtimes and the packages at one all-in price each (CVID-1); questions; Plan your visit |
| Plus | Location guide with tonight's light on every road (CVID-4); pages: Showreel, Packages (with delivery dates CVID-9 and the listing shot set CVID-10), the work by car (CVID-3), Book a shoot (with the shot list builder CVID-2) |
| Signature | The format switch (CVID-7); the golden-hour planner (CVID-5) with the cloud forecast (CVID-11) and the share card (CVID-12); guide pages: Dealers and brands, Private owners, Rolling shots, Locations, Social media packs, Behind the shoot, Questions, Deliveries |

## Honesty
- Prices are whole prices (CMA): the note says what each includes; "from" is refused; no price shows "Ask for a quote".
- Light is calculated (NOAA equations, `src/core/lib/sun.js`), never weather. The forecast is MET Norway's
  Locationforecast (free, commercial use allowed with credit), named a forecast with its source and time, and hidden
  when it can't be read. Open-Meteo's free tier is non-commercial, so it isn't used. Switched off in the first
  release: it returns through the shared weather function (the site's own `/weather`), so no browser calls MET.
- No permissions, licences (drone, insurance) or laws are claimed: those answers are the studio's own words.
- Demo footage and photographs are free stock (Mixkit, Unsplash), credited, plates and badges blurred, no real
  dealerships, and the demo groups the work by kind of car, never by brand.

## Ideas for later
A client's own grade looks shown one frame at a time are out (a grade switch reads as a before/after). Possible next:
a sold-car gallery for dealers from their sheet, and a "this road this week" pick from the forecast.
