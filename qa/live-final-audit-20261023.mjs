import {chromium} from 'playwright';
import axe from 'axe-core';
import fs from 'node:fs/promises';

const BASE='https://atrezzostudiosv-spec.github.io/tri-lane-roofing/';
const pages=['index.html','about.html','services.html','gallery.html','contact.html'];
const widths=[375,768,1024,1440];const results=[];
const audit={version:'2026-10-23',url:BASE,viewports:[],violations:[],issues:[],formTests:[],links:[],keyboard:[],network:[],staticSource:[],notes:[]};
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const saveIssue=(severity,page,width,reason,detail={})=>{const msg={severity,page,width,reason,...detail};audit.issues.push(msg);console.log('AUDIT ISSUE '+JSON.stringify(msg));};
const newPage=async(width=375)=>{const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,reducedMotion:'reduce',acceptDownloads:false});return {context,page:await context.newPage()};};
async function analyzeAxe(page,where){
 await page.addScriptTag({content:axe.source});
 const result=await page.evaluate(async()=>await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']},resultTypes:['violations']}));
 const violations=result.violations.map(v=>({id:v.id,impact:v.impact,description:v.help,nodes:v.nodes.slice(0,6).map(n=>({selector:n.target.join(' '),summary:n.failureSummary?.slice(0,220)}))}));
 audit.violations.push({where,violations});
 if(violations.length)for(const v of violations)saveIssue(v.impact||'accessibility',where,'varies','AXE '+v.id,{nodes:v.nodes});
 return violations.length;
}
function urlFor(path){return BASE+path}
try {
  // Primary viewport matrix: browser render, accessibility, nav, alt and local content.
  for(const path of pages){
    for(const width of widths){
      const {context,page}=await newPage(width);const failures=[];const consoleErrors=[];const networkFailures=[];
      try{
        page.on('pageerror',e=>consoleErrors.push(e.message));
        page.on('response',r=>{if(r.status()>=400)networkFailures.push({url:r.url(),status:r.status()});});
        const response=await page.goto(urlFor(path),{waitUntil:'networkidle',timeout:70000});
        await page.evaluate(()=>document.fonts.ready);
        const basic=await page.evaluate(()=>{
          const doc=document.documentElement;
          const badImages=[...document.images].filter(i=>i.complete&&i.naturalWidth===0).map(i=>({src:i.currentSrc||i.src,alt:i.alt}));
          const imgs=[...document.images];
          const links=[...document.querySelectorAll('a[href]')];
          const phoneLinks=links.filter(a=>a.protocol==='tel:').map(a=>({name:a.textContent.trim().slice(0,50),href:a.href}));
          const localLinks=links.filter(a=>a.href.startsWith(location.origin+'/tri-lane-roofing/')||a.href.startsWith(location.origin+'/tri-lane-roofing#')).map(a=>({label:a.textContent.trim().replace(/\s+/g,' ').slice(0,80),href:a.href}));
          return{
           page:document.body.dataset.page,h1:[...document.querySelectorAll('h1')].map(n=>n.textContent.trim()),title:document.title,description:document.querySelector('meta[name=description]')?.content||'',robots:document.querySelector('meta[name=robots]')?.content||'',lang:doc.lang,
           clientWidth:innerWidth,scrollWidth:doc.scrollWidth,scrollHeight:doc.scrollHeight,images:imgs.length,badImages,missingAlt:imgs.filter(i=>!i.hasAttribute('alt')).map(i=>i.src),
           fontMain:getComputedStyle(document.querySelector('h1')).fontFamily,fontBody:getComputedStyle(document.body).fontFamily,
           fontIcon:getComputedStyle(document.querySelector('i.fa-solid')).fontFamily,
           localLinks,phoneLinks,allLinks:links.length,buttons:[...document.querySelectorAll('button')].length,
           main:document.querySelectorAll('main').length,footer:document.querySelectorAll('footer').length,
           metaViewport:document.querySelector('meta[name=viewport]')?.content||''
          }
        });
        const row={path,width,http:response?.status(),...basic,consoleErrors,networkFailures};
        audit.viewports.push(row);
        if(response?.status()!==200)saveIssue('critical',path,width,'Non-200 HTML response',{status:response?.status()});
        if(basic.scrollWidth>width+1)saveIssue('major',path,width,'Horizontal overflow',{scrollWidth:basic.scrollWidth});
        if(basic.h1.length!==1)saveIssue('major',path,width,'Expected one H1',{h1:basic.h1});
        if(basic.main!==1||basic.footer!==1)saveIssue('major',path,width,'Unexpected page landmarks',{main:basic.main,footer:basic.footer});
        if(!basic.robots.includes('noindex'))saveIssue('critical',path,width,'Prospect demo missing noindex');
        if(basic.badImages.length||basic.missingAlt.length)saveIssue('major',path,width,'Broken images or missing alt',{badImages:basic.badImages,missingAlt:basic.missingAlt});
        if(consoleErrors.length)saveIssue('major',path,width,'Uncaught JavaScript errors',{errors:consoleErrors});
        // A failed external tracking/Font CDN request should be reviewed separately from local failures.
        const localFail=networkFailures.filter(x=>x.url.includes('/tri-lane-roofing/'));
        if(localFail.length)saveIssue('major',path,width,'Failed local network resources',{failures:localFail});
        if(width===375||width===1440){const n=await analyzeAxe(page,path+':'+width);row.axeViolations=n;}
        if(width===375||width===768||width===1024){
          const menu=page.locator('#mobile-menu-btn');
          const visible=await menu.isVisible();
          if(visible){
             await menu.click();
             const opened=await page.locator('#mobile-menu').evaluate(el=>!el.classList.contains('hidden'));
             const expanded=await menu.getAttribute('aria-expanded');
             await page.keyboard.press('Escape');
             const escaped=await page.locator('#mobile-menu').evaluate(el=>el.classList.contains('hidden'));
             audit.keyboard.push({path,width,type:'mobile menu',opened,expanded,escaped});
             if(!opened||expanded!=='true'||!escaped)saveIssue('major',path,width,'Mobile menu toggle/Escape state incorrect',{opened,expanded,escaped});
          }
        }
        if(width===375){
          const at=await page.evaluate(()=>{
           const arr=[...document.querySelectorAll('a[href]')].filter(a=>a.href.startsWith(location.origin+'/tri-lane-roofing/'));
           const anchors=arr.filter(a=>new URL(a.href).pathname===location.pathname&&new URL(a.href).hash);
           const broken=anchors.filter(a=>{const id=decodeURIComponent(new URL(a.href).hash.slice(1));return !document.getElementById(id)&&!document.querySelector('[name="'+CSS.escape(id)+'"]')}).map(a=>({href:a.href,label:a.textContent.trim().slice(0,60)}));
           return {broken,uniqueLocal:[...new Set(arr.map(a=>a.href.split('#')[0]))],invalidUrls:arr.filter(a=>a.href.includes('undefined')).map(a=>a.href)};
          });
          audit.links.push({path,...at});
          if(at.broken.length)saveIssue('major',path,width,'Invalid same-page anchor destinations',{broken:at.broken});
        }
        if(width===375){await page.screenshot({path:'audit-results/'+path.replace('.html','')+'-375.png',fullPage:false,animations:'disabled'});}
        if(width===1440){await page.screenshot({path:'audit-results/'+path.replace('.html','')+'-1440.png',fullPage:false,animations:'disabled'});}
        console.log('AUDIT VIEWPORT '+JSON.stringify({path,width,http:row.http,scrollWidth:basic.scrollWidth,imgs:basic.images,h1:basic.h1.length,navLinks:basic.localLinks.length,axeViolations:row.axeViolations??null,errors:consoleErrors.length,localFailures:localFail.length}));
      }catch(e){saveIssue('critical',path,width,'Browser audit failed',{error:String(e)});}
      finally{await context.close();}
    }
  }
  // Verify same-origin destinations found in the live main menu/footer, not just href syntax.
  const hrefs=[...new Set(audit.links.flatMap(x=>x.uniqueLocal||[]))];const sample=await newPage();
  for(const href of hrefs){
    const dest=await sample.context.request.get(href,{timeout:20000,maxRedirects:3}).catch(e=>({status:()=>0,error:String(e)}));
    const item={url:href,http:dest.status()};audit.links.push({destination:item});
    if(![200,301,302].includes(item.http))saveIssue('major','site',0,'Broken internal destination',item);
  }
  await sample.context.close();

  // Modal inquiry: keyboard focus, accessibility, full multi-step flow, backdrop, Escape.
  for(const path of ['index.html','contact.html']){
    const {context,page}=await newPage(375);
    try{
      await page.goto(urlFor(path),{waitUntil:'networkidle',timeout:65000});
      await page.evaluate(()=>openInquiryModal());
      const initial=await page.evaluate(()=>{
        const modal=document.getElementById('inquiry-modal');
        const field=document.activeElement;
        return {open:!modal.classList.contains('hidden'),focused:field?.outerHTML?.slice(0,160),role:modal.getAttribute('role'),
         ariaModal:modal.getAttribute('aria-modal'),focusInside:modal.contains(field),disclosure:modal.textContent.includes('Atrezzo Studios')};
      });
      const keyboardFocus=[];
      for(let i=0;i<10;i++){
        await page.keyboard.press('Tab');
        keyboardFocus.push(await page.evaluate(()=>({tag:document.activeElement?.tagName,id:document.activeElement?.id,inside:document.getElementById('inquiry-modal').contains(document.activeElement)})));
      }
      const trapped=keyboardFocus.every(x=>x.inside);
      const axeViolations=await analyzeAxe(page,path+':wizard-open');
      const beforeEscape=await page.locator('#inquiry-modal').isVisible();
      await page.keyboard.press('Escape');
      const afterEscape=await page.locator('#inquiry-modal').isVisible();
      audit.keyboard.push({path,type:'wizard focus and Escape',initial,keyboardFocus,trapped,beforeEscape,afterEscape,axeViolations});
      if(!initial.focusInside)saveIssue('major',path,375,'Inquiry dialog opens without focus inside',{focused:initial.focused});
      if(!trapped)saveIssue('major',path,375,'Inquiry dialog does not trap keyboard focus',{sequence:keyboardFocus});
      if(afterEscape)saveIssue('major',path,375,'Escape does not close inquiry dialog');
      if(!initial.disclosure)saveIssue('major',path,375,'Inquiry preview routing not disclosed');
    }catch(e){saveIssue('major',path,375,'Wizard keyboard audit failed',{error:String(e)});}
    finally{await context.close()}
  }

  // Gallery viewer dialog keyboard behavior and accessible modal attributes.
  {
    const {context,page}=await newPage(375);
    try{
      await page.goto(urlFor('gallery.html'),{waitUntil:'networkidle',timeout:65000});
      await page.locator('.at-gallery-tile').first().click();
      const info=await page.evaluate(()=>{
       const modal=document.getElementById('at-gallery-viewer'),active=document.activeElement;
       return {hidden:modal.hidden,role:modal.getAttribute('role'),ariaModal:modal.getAttribute('aria-modal'),
        focusedInside:modal.contains(active),focused:active?.outerHTML.slice(0,160),alt:modal.querySelector('img#at-gallery-viewer-img')?.alt}
      });
      await analyzeAxe(page,'gallery:viewer-open');
      await page.keyboard.press('ArrowRight');const next=await page.locator('#at-gallery-viewer-counter').innerText();
      await page.keyboard.press('Escape');const closed=await page.locator('#at-gallery-viewer').evaluate(x=>x.hidden);
      audit.keyboard.push({path:'gallery.html',type:'viewer',info,next,closed});
      if(!info.focusedInside)saveIssue('major','gallery.html',375,'Gallery viewer opens without focus');
      if(!info.role||info.ariaModal!=='true')saveIssue('major','gallery.html',375,'Gallery viewer missing dialog semantics',info);
      if(!closed)saveIssue('major','gallery.html',375,'Escape does not close Gallery viewer');
    }catch(e){saveIssue('major','gallery.html',375,'Gallery keyboard audit failed',{error:String(e)})}
    finally{await context.close()}
  }

  // Contact form: native required validation, custom validation, provider true/false/network paths.
  {
    const {context,page}=await newPage(375);
    let interceptCount=0,captured=[];
    await page.route('**/formsubmit.co/ajax/**',async route=>{
      interceptCount++;
      const payload=route.request().postDataJSON();captured.push(payload);
      const kind=interceptCount===1?{success:'false',message:'Not delivered'}:{success:true,message:'Success'};
      await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(kind)});
    });
    try{
     await page.goto(urlFor('contact.html'),{waitUntil:'networkidle',timeout:65000});
     const form=page.locator('#contact-form');
     const blank=await form.evaluate(el=>el.checkValidity());
     await page.locator('#contact-name').fill('ATREZZO QA TEST');
     await page.locator('#contact-email').fill('auditor@example.com');
     await page.locator('#contact-service').selectOption('Roofing');
     await page.locator('#contact-message').fill('Automated QA simulation. Do not send.');
     const valid=await form.evaluate(el=>el.checkValidity());
     await page.locator('#contact-form button[type=submit]').click();
     await page.waitForFunction(()=>document.querySelector('#form-status-msg').textContent.includes('Message not sent'),{timeout:12000});
     const falseResponse=await page.locator('#form-status-msg').innerText();
     await page.locator('#contact-form button[type=submit]').click();
     await page.waitForFunction(()=>document.querySelector('#form-status-msg').textContent.includes('Message submitted'),{timeout:12000});
     const trueResponse=await page.locator('#form-status-msg').innerText();
     const test={path:'contact.html',kind:'mocked provider truth check',blankValid:blank,filledValid:valid,interceptCount,
       falseMessage:falseResponse,trueMessage:trueResponse,captured:captureDummied(captured)};
     audit.formTests.push(test);
     if(blank||!valid||!falseResponse.includes('not sent')||!trueResponse.includes('Atrezzo')||interceptCount!==2)saveIssue('major','contact.html',375,'Form feedback/validation mismatch',test);
    }catch(e){saveIssue('major','contact.html',375,'Form provider audit failed',{error:String(e)})}
    finally{await context.close()}
  }
}finally{await browser.close()}
function captureDummied(payloads){return payloads.map(x=>({form_type:x.form_type,name:x.name,service:x.service,_subject:x._subject}));}
audit.summary={pages:pages.length,viewportTests:audit.viewports.length,allViolations:audit.violations.flatMap(x=>x.violations).length,
issues:audit.issues.length,bySeverity:audit.issues.reduce((o,i)=>(o[i.severity]=(o[i.severity]||0)+1,o),{}),internalDestinations:audit.links.filter(x=>x.destination).length};
await fs.writeFile('audit-results/live-final-audit.json',JSON.stringify(audit,null,2));
await fs.writeFile('audit-results/live-final-audit-summary.txt',JSON.stringify({summary:audit.summary,issues:audit.issues,keyboard:audit.keyboard,formTests:audit.formTests,links:audit.links},null,2));
console.log('AUDIT FINAL SUMMARY '+JSON.stringify(audit.summary));
console.log('AUDIT ALL ISSUES '+JSON.stringify(audit.issues).slice(0,30000));
console.log('AUDIT FORMS '+JSON.stringify(audit.formTests));
