import {chromium} from 'playwright';
import {PNG} from 'pngjs';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const sizes=[375,768,1024,1440];
const variants=['gallery-hero-480.webp','gallery-hero-800.webp'];
let passed=0;
function avgDiff(a,b){
 if(a.width!==b.width||a.height!==b.height)throw Error('Screenshot dimensions changed');
 let s=0;for(let i=0;i<a.data.length;i+=4)for(let k=0;k<3;k++)s+=Math.abs(a.data[i+k]-b.data[i+k]);
 return s/(a.width*a.height*3);
}
try{
 for(const width of sizes){
  const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,reducedMotion:'reduce'});
  const screens=[],boxes=[];
  try{
   for(const port of [8765,8766]){
    const page=await context.newPage();
    const response=await page.goto('http://127.0.0.1:'+port+'/gallery.html',{waitUntil:'load',timeout:60000});
    if(response?.status()!==200)throw Error('HTTP failed '+port);
    await page.evaluate(()=>document.fonts.ready);
    const sel='.at-gallery-hero-photo';
    await page.waitForFunction(sel=>{const i=document.querySelector(sel);return i&&i.complete&&i.naturalWidth>0;},sel,{timeout:20000});
    await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'});
    await page.waitForTimeout(400);
    const hero=await page.evaluate(sel=>{let r=document.querySelector(sel).getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,src:document.querySelector(sel).currentSrc,width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight};},sel);
    if(port===8766&&width<=768&&!variants.some(v=>hero.src.endsWith(v)))throw Error('Gallery hero selected oversized original '+width+' '+hero.src);
    boxes.push(hero);
    screens.push(PNG.sync.read(await page.screenshot({animations:'disabled'})));
    if(port===8766){
      const cards=await page.locator('.at-gallery-tile img').count();
      if(cards!==7)throw Error('Expected 7 concept tiles '+cards);
      const all=await page.locator('.at-gallery-tile img').evaluateAll(xs=>xs.map(img=>({
          original:img.getAttribute('src'),full:img.dataset.fullSrc,
          thumb:img.currentSrc,alt:img.getAttribute('alt'),set:img.getAttribute('srcset')
        })));
      if(all.some(x=>!x.original||!x.full||!x.set||x.original!==x.full||!x.alt))throw Error('Data integrity of Gallery assets failed '+JSON.stringify(all));
      for(let i=0;i<7;i++){
        await page.locator('.at-gallery-tile').nth(i).click();
        await page.waitForFunction(()=>!document.querySelector('#at-gallery-viewer').hidden);
        const modal=await page.evaluate(()=>({
          selected:document.querySelector('#at-gallery-viewer-img')?.src,
          source:document.querySelectorAll('.at-gallery-tile img')[0]?.src,
          hidden:document.querySelector('#at-gallery-viewer').hidden
        }));
        if(!modal.selected.endsWith(all[i].full))throw Error('Modal not using original '+i+' '+modal.selected+' != '+all[i].full);
        const img=page.locator('#at-gallery-viewer-img');
        await img.evaluate(el=>el.decode());
        const dim=await img.evaluate(el=>({naturalWidth:el.naturalWidth,naturalHeight:el.naturalHeight}));
        if(dim.naturalWidth<1000)throw Error('Modal pixel resolution too low '+i+' '+JSON.stringify(dim));
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('Escape');
        if(!(await page.locator('#at-gallery-viewer').evaluate(el=>el.hidden)))throw Error('Gallery viewer cannot close');
      }
      console.log('PASS VIEWER '+width+'px, all 7 originals retained and navigable');
    }
    await page.close();
   }
   const [a,b]=boxes;
   if(JSON.stringify([a.x,a.y,a.w,a.h,a.width,a.height])!==JSON.stringify([b.x,b.y,b.w,b.h,b.width,b.height]))
     throw Error('Layout geometry changed @'+width+' '+JSON.stringify(boxes));
   if(b.width>width+1)throw Error('Horizontal scroll @'+width);
   const diff=avgDiff(screens[0],screens[1]);
   console.log('VISUAL '+width+'px: RGB diff '+diff.toFixed(3)+'/255 original geometry exact; new source '+b.src.split('/').at(-1));
   if(diff>5)throw Error('Visible photo difference too high @'+width+' '+diff);
   passed++;
  }finally{await context.close();}
 }
 console.log('SUCCESS '+passed+'/4 viewport groups with 28 original-resolution gallery opens');
}finally{await browser.close();}
