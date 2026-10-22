import {chromium} from 'playwright';
import {PNG} from 'pngjs';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const scenarios=[['index.html',375,'modal'],['index.html',1440,'modal'],['contact.html',375,'modal'],['index.html',375,'mobile-menu'],['gallery.html',375,'gallery-viewer']];
function comparison(a,b,label){
 if(a.width!==b.width||a.height!==b.height)throw Error(label+' screenshot dimension mismatch');
 let differing=0;
 for(let i=0;i<a.data.length;i+=4)
  if(Math.abs(a.data[i]-b.data[i])>8||Math.abs(a.data[i+1]-b.data[i+1])>8||Math.abs(a.data[i+2]-b.data[i+2])>8)differing++;
 const pct=100*differing/(a.width*a.height);
 if(pct>0.05)throw Error(label+' visual mismatch '+pct.toFixed(4)+'%');
 console.log('PASS '+label+' screenshot diff '+pct.toFixed(4)+'%');
}
try{
 for(const [file,width,scenario] of scenarios){
   const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,reducedMotion:'reduce'});
   const snaps=[],statuses=[];
   try{
    for(const port of [8765,8766]){
     const page=await context.newPage();
     const response=await page.goto('http://127.0.0.1:'+port+'/'+file,{waitUntil:'load',timeout:60000});
     if(!response||response.status()!==200)throw Error(file+' response '+response?.status());
     await page.evaluate(()=>document.fonts.ready);
     await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;}'});
     await page.evaluate(()=>{
       const a=document.createElement('div');
       a.className='bg-amber-50 border border-amber-300 text-amber-900';a.style.position='fixed';a.style.left='-10000px';
       const b=document.createElement('div');
       b.className='text-green-900';b.style.position='fixed';b.style.left='-10000px';
       document.body.append(a,b);window.__statusProbe=[a,b];
     });
     if(port===8765)await page.waitForFunction(()=>[...document.querySelectorAll('style')].some(el=>el.textContent.length>14000&&el.textContent.includes('.bg-amber-50')),{timeout:15000});
     await page.waitForTimeout(350);
     statuses.push(await page.evaluate(()=>window.__statusProbe.map(el=>{const c=getComputedStyle(el);return [c.backgroundColor,c.color,c.borderTopColor]})));
     if(scenario==='modal'){
       await page.evaluate(()=>openInquiryModal());
       await page.waitForTimeout(250);
       if(await page.locator('#inquiry-modal').evaluate(e=>e.classList.contains('hidden')))throw Error('Wizard did not open');
     } else if(scenario==='mobile-menu'){
       await page.locator('#mobile-menu-btn').click();
       if(await page.locator('#mobile-menu').evaluate(e=>e.classList.contains('hidden')))throw Error('Mobile menu did not open');
     } else if(scenario==='gallery-viewer'){
       await page.locator('#at-gallery-redesign .at-gallery-tile').first().click();
       const visible=await page.locator('#at-gallery-viewer').evaluate(e=>!e.hidden);
       if(!visible)throw Error('Gallery viewer did not open');
       await page.waitForTimeout(300);
     }
     await page.evaluate(()=>window.scrollTo(0,0));
     await page.waitForTimeout(350);
     snaps.push(PNG.sync.read(await page.screenshot({animations:'disabled'})));
     await page.close();
    }
    if(JSON.stringify(statuses[0])!==JSON.stringify(statuses[1]))throw Error(file+' dynamic error/success CSS differs '+JSON.stringify(statuses));
    comparison(snaps[0],snaps[1],file+' '+width+' '+scenario);
   }finally{await context.close();}
 }
 console.log('SUCCESS 5/5 UI interactions + identical dynamic status colors');
}finally{await browser.close();}
