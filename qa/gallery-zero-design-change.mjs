import { chromium } from 'playwright';import {PNG} from 'pngjs';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const widths=[375,768,1024,1440];let results=[];let errors=[];
const skip=(err)=>{errors.push(err);console.log('FAIL '+err)};
try {
for(const width of widths){
 const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,reducedMotion:'reduce'});
 try {
  const views=[];
  for(const port of [8765,8766]){
   const p=await context.newPage();
   await p.goto('http://127.0.0.1:'+port+'/gallery.html',{waitUntil:'networkidle',timeout:60000});
   await p.evaluate(()=>document.fonts.ready);
   await p.addStyleTag({content:'*,*:before,*:after{animation:none!important;transition:none!important;caret-color:transparent!important}'});
   await p.waitForTimeout(300);
   const l=await p.evaluate(()=>({
     scrollWidth:document.documentElement.scrollWidth,
     scrollHeight:document.documentElement.scrollHeight,
     nodes:[...document.querySelectorAll('header, main h1, .at-gallery-hero-photo, .at-gallery-grid, .at-gallery-tile, .at-gallery-caption strong, #mobile-menu-btn, footer, i.fa-solid, button.bg-brand-orange')].slice(0,24).map(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {x:r.x,y:r.y,w:r.width,h:r.height,font:s.fontFamily,fontSize:s.fontSize,lineHeight:s.lineHeight,color:s.color,bg:s.backgroundColor,display:s.display,visibility:s.visibility}}),
     fontStatus:document.fonts.status
   }));
   const img=PNG.sync.read(await p.screenshot({fullPage:true,animations:'disabled'}));
   const modalP=p.locator('#at-gallery-redesign .at-gallery-tile').first();
   await modalP.click();await p.waitForTimeout(200);
   const mod=PNG.sync.read(await p.screenshot({animations:'disabled'}));
   const state=await p.locator('#at-gallery-viewer-img').evaluate(el=>({src:el.src,naturalWidth:el.naturalWidth}));
   await p.keyboard.press('Escape'); 
   const closed=await p.locator('#at-gallery-viewer').evaluate(el=>el.hidden);
   views.push({l,img,mod,state,closed});
   await p.close();
  }
  const [a,b]=views;
  if(JSON.stringify(a.l)!==JSON.stringify(b.l))skip('Computed positions/fonts/colors differ '+width+' '+JSON.stringify({a:a.l,b:b.l}).slice(0,1900));
  if(a.img.width!==b.img.width||a.img.height!==b.img.height)skip('Full page image dimensions '+width);
  let max=0,count=0,sum=0;
  if(a.img.data.length===b.img.data.length)for(let i=0;i<a.img.data.length;i+=4)for(let k=0;k<3;k++){let v=Math.abs(a.img.data[i+k]-b.img.data[i+k]);if(v>max)max=v;sum+=v;if(v>0)count++}
  if(count>0)skip('PIXELS changed at width '+width+' count='+count+' maxdiff='+max+' avg='+sum/(a.img.width*a.img.height*3));
  let modcount=0;if(a.mod.data.length===b.mod.data.length)for(let i=0;i<a.mod.data.length;i++)if(a.mod.data[i]!==b.mod.data[i])modcount++;
  if(modcount>0)skip('Gallery overlay pixels changed '+width+' count='+modcount);
  if(!a.closed||!b.closed||JSON.stringify(a.state)!==JSON.stringify(b.state))skip('Gallery overlay functionality changed '+width);
  results.push({width,fullPageChangedPixels:count,modalChangedBytes:modcount,scrollHeight:b.l.scrollHeight});
  console.log('VISUAL CONTRACT '+JSON.stringify(results.at(-1)));
 }finally{await context.close()}
}
}finally{await browser.close()}
console.log('VISUAL SUMMARY '+JSON.stringify({results,errors}));
if(errors.length)process.exitCode=1;
