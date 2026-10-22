/* Temporary Chromium regression test, not intended for production. */
const {chromium}=require('/tmp/atrezzo-image-qa/node_modules/playwright');
const {PNG}=require('/tmp/atrezzo-image-qa/node_modules/pngjs');
const fs=require('fs');
const path=require('path');
const assert=require('assert');
const out='/tmp/tri-lane-image-qa';
fs.mkdirSync(out,{recursive:true});
const results=[],failures=[];
const widths=[375,768,1024,1440];
const sections=['services','gallery'];
async function capture(port,context,section,width,name){
 const p=await context.newPage();
 await p.setViewportSize({width,height:900});
 const response=await p.goto('http://127.0.0.1:'+port+'/'+section+'.html',{waitUntil:'domcontentloaded',timeout:50000});
 await p.evaluate(async()=>{
   try{await Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,7000))]);}catch(e){}
   const imgs=Array.from(document.images).filter(i=>i.getAttribute('src'));
   imgs.forEach(i=>i.loading='eager');
   await Promise.race([Promise.all(imgs.map(i=>i.decode().catch(()=>{}))),new Promise(r=>setTimeout(r,10000))]);
 });
 await p.addStyleTag({content:'*,*::before,*::after{transition:none!important;animation:none!important;scroll-behavior:auto!important}'});
 await p.evaluate(()=>scrollTo(0,0));
 await p.waitForTimeout(350);
 const metrics=await p.evaluate(()=>{
   const imgs=Array.from(document.images).filter(i=>i.getAttribute('src'));
   const selector=document.body.dataset.page==='services'
      ? '.sv-card,.sv-hero,.sv-roofing,.sv-exteriors'
      : '.at-gallery-tile,.at-gallery-hero,.at-gallery-showcase';
   const rects=Array.from(document.querySelectorAll(selector)).map(n=>{const r=n.getBoundingClientRect();return [r.x,r.y+scrollY,r.width,r.height]});
   return {rects,scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,
     height:document.documentElement.scrollHeight,loaded:imgs.filter(i=>i.complete&&i.naturalWidth>0).length,
     broken:imgs.filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.getAttribute('src').slice(0,90))};
 });
 const shot=path.join(out,section+'-'+width+'-'+name+'.png');
 await p.screenshot({path:shot,fullPage:true,animations:'disabled'});
 await p.close();
 return {metrics,shot,http:response.status()};
}
function compare(base,updated,label){
 const b=base.metrics,n=updated.metrics;
 assert.equal(base.http,200);assert.equal(updated.http,200);
 assert.equal(n.broken.length,0,'broken optimized images: '+n.broken);
 assert.equal(n.loaded,b.loaded,'loaded image count changed');
 assert.ok(n.scrollWidth<=n.clientWidth+2,'horizontal overflow: '+n.scrollWidth+' vs '+n.clientWidth);
 assert.equal(n.height,b.height,'page height mismatch');
 assert.equal(n.rects.length,b.rects.length,'component count mismatch');
 let diff=0;
 for(let i=0;i<n.rects.length;i++)
   for(let j=0;j<4;j++)diff=Math.max(diff,Math.abs(n.rects[i][j]-b.rects[i][j]));
 assert.ok(diff<1.3,'geometry changed '+diff+'px');
 const a=PNG.sync.read(fs.readFileSync(base.shot)),c=PNG.sync.read(fs.readFileSync(updated.shot));
 assert.equal(a.width,c.width);assert.equal(a.height,c.height);
 let changed=0;
 for(let i=0;i<a.data.length;i+=4)if(
   Math.abs(a.data[i]-c.data[i])>15||
   Math.abs(a.data[i+1]-c.data[i+1])>15||
   Math.abs(a.data[i+2]-c.data[i+2])>15
 )changed++;
 const pct=changed/(a.width*a.height);
 assert.ok(pct<.005,'pixel diff '+(pct*100).toFixed(3)+'%');
 return {label,geometryDifferencePx:diff,pixelDifferencePercent:Number((pct*100).toFixed(4)),imagesLoaded:n.loaded};
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
   const context=await browser.newContext({reducedMotion:'reduce',deviceScaleFactor:1,colorScheme:'light'});
   for(const width of widths)for(const section of sections){
     try{
       const base=await capture(8761,context,section,width,'original');
       const updated=await capture(8762,context,section,width,'optimized');
       const check=compare(base,updated,section+'-'+width);
       results.push(check);console.log('PASS',JSON.stringify(check));
     }catch(e){failures.push(section+'-'+width+': '+e.message);console.error('FAIL',failures.at(-1));}
   }
   await context.close();
   for(const width of [375,1024,1440]){
     const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
     const p=await context.newPage();
     try{
       await p.goto('http://127.0.0.1:8762/gallery.html',{waitUntil:'domcontentloaded',timeout:50000});
       const tiles=p.locator('.at-gallery-tile');
       assert.equal(await tiles.count(),7);
       await tiles.nth(1).click();
       await p.locator('#at-gallery-viewer:not([hidden])').waitFor();
       await p.waitForFunction(()=>document.getElementById('at-gallery-viewer-img').naturalWidth===1053,null,{timeout:15000});
       assert.equal(await p.locator('#at-gallery-project-thumbs button').count(),4);
       // Verify thumbnails, previous/next controls, and horizontal touch swipe.
       await p.locator('#at-gallery-project-thumbs button').nth(1).click();
       assert.match(await p.locator('#at-gallery-viewer-progress').innerText(),/IMAGE 02/);
       await p.locator('#at-gallery-viewer .at-gallery-viewer-next').click();
       assert.match(await p.locator('#at-gallery-viewer-progress').innerText(),/IMAGE 03/);
       await p.locator('#at-gallery-viewer .at-gallery-viewer-previous').click();
       assert.match(await p.locator('#at-gallery-viewer-progress').innerText(),/IMAGE 02/);
       await p.evaluate(()=>{
         const v=document.getElementById('at-gallery-viewer');
         const begin=new Touch({identifier:1,target:v,clientX:320,clientY:320});
         const end=new Touch({identifier:1,target:v,clientX:100,clientY:320});
         v.dispatchEvent(new TouchEvent('touchstart',{touches:[begin],bubbles:true}));
         v.dispatchEvent(new TouchEvent('touchend',{changedTouches:[end],bubbles:true}));
       });
       assert.match(await p.locator('#at-gallery-viewer-progress').innerText(),/IMAGE 03/);
       await p.screenshot({path:path.join(out,'viewer-'+width+'.png')});
       await p.keyboard.press('Escape');
       assert.ok(await p.locator('#at-gallery-viewer').getAttribute('hidden')!==null,'viewer failed to close');
       results.push({label:'gallery-viewer-'+width,passed:true});
       console.log('PASS gallery viewer '+width);
     }catch(e){failures.push('gallery viewer '+width+': '+e.message);console.error('FAIL',failures.at(-1));}
     finally{await context.close();}
   }
   // Services: on touch/mobile, next arrow should advance horizontal cards.
   {
     const c=await browser.newContext({viewport:{width:375,height:900},reducedMotion:'reduce',hasTouch:true,isMobile:true});
     const p=await c.newPage();
     try {
       await p.goto('http://127.0.0.1:8762/services.html',{waitUntil:'domcontentloaded',timeout:50000});
       const track=p.locator('#sv-exterior-cards');
       const start=await track.evaluate(e=>e.scrollLeft);
       await p.locator('#sv-card-next').click();
       await p.waitForTimeout(800);
       const end=await track.evaluate(e=>e.scrollLeft);
       assert.ok(end>start+10,'mobile Services carousel did not advance');
       results.push({label:'services-mobile-carousel',start,end});
       console.log('PASS services mobile carousel');
     }catch(e){failures.push('services mobile carousel: '+e.message);console.error('FAIL',failures.at(-1));}
     finally{await c.close();}
   }
   fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({results,failures},null,2));
   if(failures.length){console.error('QA FAILURES',failures);process.exitCode=1;}
   else console.log('ALL PASS: '+results.length+' image/geometry/interaction checks');
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
