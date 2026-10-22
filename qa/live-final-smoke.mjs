import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const BASE='https://atrezzostudiosv-spec.github.io/tri-lane-roofing/';
const paths=['index.html','about.html','services.html','gallery.html','contact.html'];
const widths=[375,768,1024,1440];
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
let scans=0,urls=0,interactions=0,errors=[];
async function checkAxe(page,name){
  const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
  const violations=result.violations.map(v=>({id:v.id,impact:v.impact,targets:v.nodes.map(n=>n.target)}));
  if(violations.length)errors.push(name+' WCAG '+JSON.stringify(violations));
  scans++;
}
try{
 for(const name of paths)for(const width of widths){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  try {
    const page=await context.newPage();
    page.on('pageerror',e=>errors.push(name+' @'+width+' JS '+e.message));
    const r=await page.goto(BASE+name,{waitUntil:'load',timeout:65000});
    if(!r||r.status()!==200)throw Error('HTTP '+r?.status()+' '+name);
    await page.evaluate(()=>document.fonts.ready);
    const facts=await page.evaluate(()=>({
     robots:document.querySelector('meta[name="robots"]')?.content||'',
     css:!![...document.styleSheets].find(s=>s.href?.includes('/assets/css/accessibility.css')),
     heads:document.querySelectorAll('h1').length,overflow:document.documentElement.scrollWidth-innerWidth,
     labeled:['wiz-city','wiz-zip','wiz-name','wiz-contact','wiz-notes'].every(id=>
       [...document.querySelectorAll('label[for]')].some(e=>e.htmlFor===id)),
     missingImageAlt:[...document.images].filter(x=>!x.hasAttribute('alt')).length
    }));
    if(!facts.robots.includes('noindex')||!facts.css||facts.heads!==1||facts.overflow>1||!facts.labeled||facts.missingImageAlt)
      errors.push('Site contract '+name+' @'+width+' '+JSON.stringify(facts));
    if(width===375||width===1440)await checkAxe(page,name+' @'+width+' initial');
    if(width===375&&name==='contact.html'){
      // Never let the browser transmit a real message during this test.
      await page.route('https://formsubmit.co/ajax/**',route=>route.fulfill({status:200,contentType:'application/json',body:'{"success":true}'}));
      await page.locator('#contact-name').fill('Atrezzo automated browser QA');
      await page.locator('#contact-email').fill('qa@example.invalid');
      await page.locator('#contact-service').selectOption('Roofing');
      await page.locator('#contact-message').fill('Mocked QA submission, no actual email sent.');
      await page.locator('#contact-form button[type="submit"]').click();
      await page.waitForFunction(()=>document.querySelector('#form-status-msg')?.textContent?.includes('Message submitted.'),null,{timeout:18000});
      const status=await page.locator('#form-status-msg').innerText();
      if(!status.includes('Atrezzo Studios'))errors.push('contact success incorrectly labels recipient');
      interactions++;
      console.log('LIVE FORM PASS: intercepted simulated submission; recipient disclosure correct');
    }
    if(width===375&&(name==='index.html'||name==='contact.html')){
      await page.evaluate(()=>openInquiryModal());
      const open=await page.locator('#inquiry-modal').evaluate(e=>!e.classList.contains('hidden'));
      if(!open)errors.push('modal fails to open '+name);
      await page.evaluate(()=>selectWizardService('Roofing'));
      await page.evaluate(()=>wizardNext());
      await checkAxe(page,name+' wizard step3');
      await page.locator('#wiz-city').fill('QA city');
      await page.locator('#wiz-zip').fill('00000');
      await page.evaluate(()=>wizardNext());
      await checkAxe(page,name+' wizard step4');
      await page.evaluate(()=>closeInquiryModal());
      interactions++;
    }
    if(width===375&&name==='gallery.html'){
      await page.locator('#at-gallery-redesign .at-gallery-tile').first().click();
      await checkAxe(page,'Gallery viewer');
      await page.keyboard.press('Escape');
      if(!(await page.locator('#at-gallery-viewer').evaluate(el=>el.hidden)))errors.push('Gallery viewer cannot Escape-close');
      interactions++;
    }
    if(width===375){
      await page.locator('#mobile-menu-btn').click();
      if(await page.locator('#mobile-menu').evaluate(el=>el.classList.contains('hidden')))errors.push('Mobile menu does not open '+name);
      await page.locator('#mobile-menu-btn').click();
      interactions++;
    }
    console.log('LIVE PASS '+name+' '+width+'px, label/robots/CSS/overflow contract');
    urls++;
  }catch(e){errors.push(name+' @'+width+' '+String(e.stack||e))}
  finally { await context.close(); }
 }
}finally{await browser.close()}
console.log('FINAL LIVE SUMMARY '+JSON.stringify({pages:paths.length,viewportLoads:urls,axeScans:scans,interactionCases:interactions,errors}));
if(errors.length)process.exitCode=1;
