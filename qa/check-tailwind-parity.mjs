import { chromium } from 'playwright';
import { PNG } from 'pngjs';
const pages=['index.html','about.html','services.html','gallery.html','contact.html'], widths=[375,768,1024,1440];
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
let passed=0;
try{
 for(const file of pages)for(const width of widths){
  const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,reducedMotion:'reduce'});
  const captures=[],metrics=[];
  try{
   for(const port of [8765,8766]){
    const page=await context.newPage();
    const resp=await page.goto('http://127.0.0.1:'+port+'/'+file,{waitUntil:'load',timeout:60000});
    if(!resp || resp.status()!==200)throw Error('HTTP failure '+file+' '+port);
    await page.evaluate(()=>document.fonts.ready);
    if(port===8765)await page.waitForFunction(()=>[...document.querySelectorAll('style')].some(e=>e.textContent.length>14000&&e.textContent.includes('--tw-border-spacing-x')),{timeout:15000});
    if(port===8766) {
      const hasCSS=await page.evaluate((x)=>[...document.styleSheets].some(e=>e.href?.endsWith('tailwind-runtime-'+x+'.css')),file==='index.html'?'home':file.replace('.html',''));
      if(!hasCSS)throw Error('Static CSS not loaded: '+file);
      if((await page.locator('script[src*="cdn.tailwindcss.com"]').count())!==0)throw Error('Old runtime script still present');
    }
    await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;}'});
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.waitForTimeout(350);
    const geom=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,
       header:(()=>{const e=document.querySelector('header');if(!e)return null;const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height].map(x=>Math.round(x*100)/100)})(),
       main:(()=>{const e=document.querySelector('main');if(!e)return null;const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height].map(x=>Math.round(x*100)/100)})()
    }));
    metrics.push(geom);
    captures.push(PNG.sync.read(await page.screenshot({animations:'disabled'})));
    await page.close();
   }
   if(JSON.stringify(metrics[0])!==JSON.stringify(metrics[1]))throw Error('DOM geometry changed '+file+' '+width+' '+JSON.stringify(metrics));
   const [a,b]=captures;
   if(a.width!==b.width || a.height!==b.height)throw Error('Screenshot size changed '+file+' '+width);
   let diff=0;
   for(let i=0;i<a.data.length;i+=4)
    if(Math.abs(a.data[i]-b.data[i])>8 || Math.abs(a.data[i+1]-b.data[i+1])>8 || Math.abs(a.data[i+2]-b.data[i+2])>8 || Math.abs(a.data[i+3]-b.data[i+3])>8) diff++;
   const pct=100*diff/(a.width*a.height);
   if(pct>0.05)throw Error('Visual mismatch '+file+' '+width+' changed='+pct.toFixed(4)+'%');
   passed++;
   console.log('PASS '+file+' @ '+width+'px; screenshot diff '+pct.toFixed(4)+'%, 0px geometry change');
  }finally{await context.close();}
 }
 console.log('SUCCESS '+passed+'/'+(pages.length*widths.length)+' visual parity checks');
}finally{await browser.close();}
