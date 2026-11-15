import { chromium } from 'playwright';
const b = await chromium.launch();
for (const [vw,vh,tag] of [[1440,900,'d'],[390,844,'p']]) {
  const p = await b.newPage({ viewport: { width: vw, height: vh } });
  await p.goto('file:///tmp/others/trainer/docs/trades/personal-trainer/design/a/index.html'); await p.waitForTimeout(2500);
  await p.screenshot({ path: `/tmp/others/trainer-${tag}.png` }); await p.close(); }
const p = await b.newPage({ viewport: { width: 2000, height: 2600 } });
await p.goto('file:///home/claude/odile6/index.html'); await p.waitForTimeout(3000);
await p.evaluate(()=>document.querySelector('.desk').style.setProperty('--z','1')); await p.waitForTimeout(300);
const d=await p.$('.desk'); const bb=await d.boundingBox();
await p.screenshot({path:'/tmp/main/zz-odile-d.png', clip:{x:bb.x,y:bb.y,width:1440,height:900}});
await p.screenshot({path:'/tmp/r6-desk-full.png', clip:{x:bb.x,y:bb.y,width:1440,height:bb.height}});
const ph=await p.$('.phone'); const pb=await ph.boundingBox();
await p.screenshot({path:'/tmp/main/zz-odile-p.png', clip:{x:pb.x,y:pb.y,width:390,height:844}});
await p.screenshot({path:'/tmp/r6-phone-full.png', clip:{x:pb.x,y:pb.y,width:390,height:pb.height}});
await b.close();
