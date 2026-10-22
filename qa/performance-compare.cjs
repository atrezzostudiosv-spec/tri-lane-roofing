/* Temporary Atrezzo visual/performance regression gate. Do not ship with production. */
const { chromium }=require('/tmp/atrezzo-perf/node_modules/playwright');
const { PNG }=require('/tmp/atrezzo-perf/node_modules/pngjs');
const fs=require('fs'), path=require('path');
const endpoints={main:8851,hero:8852,css:8853};
const widths=[375,768,1024,1440],pages=['index','about','services','gallery','contact'];
const out='/tmp/atrezzo-perf-report';fs.mkdirSync(out,{recursive:true});
const records=[],failures=[];
async function shoot(context,variant,entry,width) {
 const p=await context.newPage();
 await p.setViewportSize({width,height:900});
 const urls=[];
 p.on('requestfailed', req=>urls.push(req.url().slice(0,100)));
 const res=await p.goto('http://127.0.0.1:'+endpoints[variant]+'/'+entry+'.html',{waitUntil:'domcontentloaded',timeout:45000});
 await p.evaluate(async()=>{
  try{await Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,9000))])}catch(e){}
  const images=Array.from(document.images).filter(i=>i.getAttribute('src'));
  for(const i of images)i.loading='eager';
  await Promise.race([Promise.all(images.map(i=>i.decode().catch(()=>{}))),new Promise(r=>setTimeout(r,12000))]);
 });
 await p.addStyleTag({content:'*,*::before,*::after{transition:none!important;animation:none!important;scroll-behavior:auto!important}'});
 await p.evaluate(()=>window.scrollTo(0,0));await p.waitForTimeout(320);
 const stats=await p.evaluate(()=>{
   const imgs=Array.from(document.images).filter(i=>i.getAttribute('src'));
   const selectors=['header','h1','h2','.sv-hero','.at-gallery-hero','.tl-wwd-grid','.sv-card','.at-gallery-tile','footer'];
   const rects={};
   for(const sel of selectors)rects[sel]=Array.from(document.querySelectorAll(sel)).map(n=>{const r=n.getBoundingClientRect();return [Math.round(r.x*10)/10,Math.round((r.y+scrollY)*10)/10,Math.round(r.width*10)/10,Math.round(r.height*10)/10]});
   const colors=['.bg-brand-orange','.text-brand-orange','.font-display','.md\\:flex','.lg\\:grid'].map(sel=>{
     try {const n=document.querySelector(sel);return n?{sel,color:getComputedStyle(n).color,display:getComputedStyle(n).display}:null;}catch(e){return null;}
   });
   return {height:document.documentElement.scrollHeight,scrollWidth:document.documentElement.scrollWidth,
     clientWidth:document.documentElement.clientWidth,imgCount:imgs.length,
     loaded:imgs.filter(i=>i.complete&&i.naturalWidth>0).length,
     broken:imgs.filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.src.slice(0,90)),
     cssRules:document.styleSheets.length,rects,colors};
 });
 const screenshot=path.join(out,variant+'-'+entry+'-'+width+'.png');
 await p.screenshot({path:screenshot,fullPage:true,animations:'disabled'});
 await p.close();
 return {stats,screenshot,http:res?.status(),failedRequests:urls};
}
function diff(a,b,variant,page,width) {
 const x=a.stats,y=b.stats,issues=[];
 if(a.http!==200||b.http!==200)issues.push('HTTP status');
 if(x.height!==y.height)issues.push('height '+x.height+' vs '+y.height);
 if(x.imgCount!==y.imgCount||x.loaded!==y.loaded||y.broken.length)issues.push('image count or broken');
 if(y.scrollWidth>y.clientWidth+2)issues.push('horizontal overflow');
 let geom=0;
 for(const sel of Object.keys(x.rects)){
   const m=x.rects[sel],n=y.rects[sel]||[];
   if(m.length!==n.length){issues.push('node count '+sel);continue;}
   for(let i=0;i<m.length;i++)for(let j=0;j<4;j++)geom=Math.max(geom,Math.abs(m[i][j]-n[i][j]));
 }
 if(geom>1.5)issues.push('geometry max '+geom+' px');
 const imga=PNG.sync.read(fs.readFileSync(a.screenshot)),imgb=PNG.sync.read(fs.readFileSync(b.screenshot));
 let changed=0;
 if(imga.width!==imgb.width||imga.height!==imgb.height)issues.push('screenshots dimensions differ');
 else for(let i=0;i<imga.data.length;i+=4){
   if(Math.abs(imga.data[i]-imgb.data[i])>15||Math.abs(imga.data[i+1]-imgb.data[i+1])>15||Math.abs(imga.data[i+2]-imgb.data[i+2])>15)changed++;
 }
 const pixels=imga.width*imga.height;
 const pct=changed/pixels*100;
 if(pct>0.05)issues.push('pixel-diff '+pct.toFixed(4)+'% (>0.05%)');
 return {variant,page,width,differencePercent:Math.round(pct*10000)/10000,geometryMaxPx:Math.round(geom*10)/10,
   htmlHeight:x.height,images:y.loaded,requestsFailed:b.failedRequests.length,issues};
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const ctx=await browser.newContext({reducedMotion:'reduce',deviceScaleFactor:1,colorScheme:'light'});
  for(const width of widths)for(const entry of pages){
    const base=await shoot(ctx,'main',entry,width);
    for(const variant of ['hero','css']){
      const candidate=await shoot(ctx,variant,entry,width);
      const result=diff(base,candidate,variant,entry,width);
      records.push(result);
      if(result.issues.length) {
        failures.push(result);
        console.error('FAIL',JSON.stringify(result));
      } else {
        console.log('PASS',JSON.stringify(result));
      }
    }
  }
  await ctx.close();
  fs.writeFileSync(out+'/comparison.json',JSON.stringify({records,failures},null,2));
  console.log('RENDER SUMMARY',JSON.stringify({total:records.length,pass:records.length-failures.length,fail:failures.length,
   heroFailures:failures.filter(x=>x.variant==='hero').length,cssFailures:failures.filter(x=>x.variant==='css').length}));
  if(failures.length)process.exitCode=1;
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
