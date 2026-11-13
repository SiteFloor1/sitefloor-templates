# drop-queue (Signature)
Drop day at the showroom: staff hand out numbered tickets at the door and type the number they're serving into a sheet
(`serving, given, updated_at, note`). On drop day the section shows "Now serving 18 · 34 waiting" and, from a ticket
number, how many are ahead and roughly how long (`dropQueue.minutesEach`, from the brand). Hidden on other days and
whenever the sheet is older than `staleAfterMinutes`. Demos show it any day with `dropQueue.fixed`, saying so.
