// @ts-check
/**
 * Day or evening colours for looks that follow a restaurant's sittings (the Carte look). A tiny inline
 * script in <head> sets <html data-mood> and <html data-sitting> (the menu to show) before the first paint, so an
 * evening visitor never sees the daytime colours flash and the menu doesn't jump as a sitting is hidden. It never sees the
 * daytime colours flash. The script's text is fixed (its sha256 is allowed in the CSP); the sittings come
 * from a <meta> tag. It also sets <html data-season> (same rule as src/core/lib/seasons.js activeSeason) and --season-name. The same rule is in src/kits/restaurant/lib/sittings.js (moodNow), unit-tested against it.
 */
import { DAY_KEYS, toMinutes } from "./hours.js";

/**
 * The <meta name="sf-daypart"> content: the timezone, each sitting as [weekdays, from, to, mood, id] and, when the site
 * has seasons, each as [from, to, tint, name] (so a season's colours, e.g. the Menu Book's cover, are there from the first paint).
 * @param {{ timezone: string }} hours @param {{ id?: string, days: string[], from: string, to: string, mood: string }[]} sittings
 * @param {{ from: string, to: string, tint?: string, name: string }[]} [seasons]
 */
export function daypartMeta(hours, sittings, seasons = []) {
  return JSON.stringify({
    tz: hours.timezone,
    s: sittings.map((s) => [s.days.map((d) => DAY_KEYS.indexOf(/** @type {any} */ (d))), toMinutes(s.from), toMinutes(s.to), s.mood, s.id ?? ""]),
    se: seasons.map((s) => [s.from, s.to, s.tint ?? "", s.name]),
  });
}

/** Runs in the browser as written, before anything else. Keep it ES5 and free of anything the CSP would block. */
export const DAYPART_SCRIPT = "(function(){try{var e=document.documentElement,c=JSON.parse(document.querySelector('meta[name=\"sf-daypart\"]').content),"
  + "p=new Intl.DateTimeFormat('en-GB',{timeZone:c.tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23',weekday:'short'}).formatToParts(new Date()),"
  + "g=function(t){for(var i=0;i<p.length;i++){if(p[i].type===t){return p[i].value}}return''},"
  + "d=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(g('weekday')),m=Number(g('hour'))*60+Number(g('minute')),"
  + "b=null,y=null,cur=null,nx=null,fs=null,i,x;for(i=0;i<c.s.length;i++){x=c.s[i];"
  + "if(x[0].indexOf(d)>-1){if(!fs){fs=x}if(m>=x[1]&&m<x[2]&&!cur){cur=x}if(x[1]>m&&(!nx||x[1]<nx[1])){nx=x}if(x[1]<=m&&(!b||x[1]>b[1])){b=x}}"
  + "if(x[0].indexOf((d+6)%7)>-1&&(!y||x[1]>y[1])){y=x}}"
  + "e.setAttribute('data-mood',cur?cur[3]:b?b[3]:(m<360&&y?y[3]:'day'));"
  + "var sh=cur||nx||fs||c.s[0];if(sh&&sh[4]){e.setAttribute('data-sitting',sh[4])}"
  + "var td=g('year')+'-'+g('month')+'-'+g('day'),on=null;for(i=0;i<(c.se||[]).length;i++){x=c.se[i];if(x[0]<=td&&td<=x[1]&&(!on||x[0]>=on[0])){on=x}}"
  + "if(on){if(on[2]){e.setAttribute('data-season',on[2])}e.style.setProperty('--season-name',JSON.stringify(on[3]))}}catch(_){}})();";
