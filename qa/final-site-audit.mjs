import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const pages=['about.html','services.html','gallery.html','contact.html'];
const widths=[375,768,1024,1440];
const summary={responsive:[],accessibility:[],functionality:[],errors:[]};
const fail=(msg)=>{summary.errors.push(msg);console.error('FAIL '+msg)};
try{
 for(const path of pages){
  for(const width of widths){
   const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,reducedMotion:'reduce'});
   const page=await context.newPage();
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   const failed=[];
   page.on('response',response=>{if(response.url().startsWith('http://127.0.0.1:8766/') && response.status()>=400) failed.push(response.url()+':'+response.status())});
   try{
    const resp=await page.goto('http://127.0.0.1:8766/'+path,{waitUntil:'load',timeout:65000});
    await page.evaluate(()=>document.fonts.ready);
    await page.waitForTimeout(350);
    const facts=await page.evaluate(()=>{
      const media=[...document.querySelectorAll('img')].filter(e=>!!e.getAttribute('src') && !e.getAttribute('src').startsWith('data:') && !e.getAttribute('src').endsWith('/'));
      return {h1:document.querySelectorAll('h1').length,robots:document.querySelector('meta[name="robots"]')?.content||'',
       docWidth:document.documentElement.scrollWidth,innerWidth:window.innerWidth, title:document.title,
       mediaCount:media.length,brokenLoaded:media.filter(e=>e.complete&&!e.naturalWidth).map(e=>e.getAttribute('src')),
       missingAlts:media.filter(e=>!e.hasAttribute('alt')).map(e=>e.getAttribute('src')),
       localCSS:[...document.styleSheets].some(e=>e.href?.includes('tailwind-runtime-')),
       menu:!!document.querySelector('#mobile-menu-btn'),links:[...document.querySelectorAll('a[href]')].map(e=>e.getAttribute('href'))
      };
    });
    let violations=[];
    if(facts.h1!==1)violations.push('h1='+facts.h1);
    if(!facts.robots.includes('noindex'))violations.push('missing demo noindex');
    if(facts.docWidth>width+1)violations.push('horizontal scroll '+facts.docWidth);
    if(!facts.localCSS)violations.push('static CSS not loaded');
    if(facts.brokenLoaded.length)violations.push('broken loaded images='+facts.brokenLoaded.join(','));
    if(facts.missingAlts.length)violations.push('missing alt='+facts.missingAlts.join(','));
    if(failed.length)violations.push('404 local='+failed.join(','));
    if(errors.length)violations.push('JS error='+errors.join(','));
    summary.responsive.push({page:path,width,status:resp.status(),...facts,failures:violations});
    if(violations.length)fail(path+' @'+width+': '+violations.join(' | '));
    else console.log('PASS RESPONSIVE '+path+' @'+width+'px no overflow, errors or broken local resources');
    if(width===375){
      if(facts.menu){
       await page.locator('#mobile-menu-btn').click();
       const open=await page.locator('#mobile-menu').evaluate(e=>!e.classList.contains('hidden'));
       summary.functionality.push({path,width,action:'mobile-menu',ok:open});
       if(!open)fail('Mobile menu failed '+path);
       await page.locator('#mobile-menu-btn').click();
      }
      await page.evaluate(()=>openInquiryModal());
      const shown=await page.locator('#inquiry-modal').evaluate(e=>!e.classList.contains('hidden'));
      summary.functionality.push({path,width,action:'inquiry-modal',ok:shown});
      if(!shown)fail('Inquiry modal failed '+path);
      await page.evaluate(()=>closeInquiryModal());
      if(path==='gallery.html'){
        await page.locator('#at-gallery-redesign .at-gallery-tile').first().click();
        const open=await page.locator('#at-gallery-viewer').evaluate(e=>!e.hidden && e.getAttribute('aria-hidden')==='false');
        summary.functionality.push({path,width,action:'gallery-viewer-open',ok:open});
        if(!open)fail('Gallery viewer failed');
        await page.keyboard.press('Escape');
        const closed=await page.locator('#at-gallery-viewer').evaluate(e=>e.hidden);
        summary.functionality.push({path,width,action:'gallery-escape',ok:closed});
        if(!closed)fail('Gallery Escape failed');
      }
      const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
      summary.accessibility.push({page:path,width,
       violations:axe.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.length,help:v.help,examples:v.nodes.slice(0,3).map(n=>n.target)}))});
      console.log('A11Y '+path+' @375px '+JSON.stringify(summary.accessibility.at(-1).violations));
    }
   }catch(e){fail(path+' @'+width+' exception '+e.stack)}
   finally{await context.close();}
  }
 }
 // Mock remote FormSubmit: do not transmit a real email or any personal data.
 const context=await browser.newContext({viewport:{width:375,height:900}});
 await context.route(/formsubmit\.co\/ajax\//,route=>route.fulfill({status:200,contentType:'application/json',body:'{"success":true}'}));
 const page=await context.newPage();await page.goto('http://127.0.0.1:8766/contact.html',{waitUntil:'load'});
 await page.locator('#contact-name').fill('Automated QA'); await page.locator('#contact-email').fill('qa@example.invalid');
 await page.locator('#contact-service').selectOption('Roofing');
 await page.locator('#contact-message').fill('This is a mocked test, no real delivery.');
 await page.locator('#contact-form button[type=submit]').click();
 await page.waitForFunction(()=>document.querySelector('#form-status-msg')?.textContent?.includes('Message submitted.'),{timeout:12000});
 const success=await page.locator('#form-status-msg').innerText();
 summary.functionality.push({path:'contact.html',action:'mocked FormSubmit success',ok:success.includes('Atrezzo Studios')});
 if(!success.includes('Atrezzo Studios'))fail('Contact form mocked success text did not disclose Atrezzo');
 console.log('PASS FORM mocked success + Atrezzo notice (zero email sent)');
 await context.close();
}finally{await browser.close();fs.mkdirSync('qa-results',{recursive:true});fs.writeFileSync('qa-results/site-audit.json',JSON.stringify(summary,null,2));console.log('QA SUMMARY '+JSON.stringify({tested:summary.responsive.length,broken:summary.errors.length,accessibility:summary.accessibility,errors:summary.errors},null,2));}
if(summary.errors.length)process.exitCode=1;
