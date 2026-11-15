import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1900, height: 1200 } });
p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('file:///home/claude/odile4/index.html'); await p.waitForTimeout(3000);
await p.screenshot({ path: '/tmp/r4.png', fullPage: true });
await b.close();
