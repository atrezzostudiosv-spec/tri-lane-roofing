import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const base='https://atrezzostudiosv-spec.github.io/tri-lane-roofing/';
const path=['index.html','about.html','services.html','gallery.html','contact.html'];
const out={crossAnchor:[],wizardFlow:[],placeholderImages:[],questions:[],serviceStrings:[]};
try{
const ctx=await browser.newContext({viewport:{width:375,height:812},reducedMotion:'reduce'});
const pg=await ctx.newPage();
await pg.goto(base+'index.html',{waitUntil:'networkidle'});
for (const p of path){
 await pg.goto(base+p,{waitUntil:'networkidle'});
 const bad=await pg.evaluate(()=>{
  return [...document.images].filter(x=>!x.complete||!x.naturalWidth).map(x=>({id:x.id,srcAttr:x.getAttribute('src'),hidden:!!x.closest('[hidden],.hidden')||getComputedStyle(x).display==='none',ancestor:x.parentElement?.id,className:x.className}));
 });out.placeholderImages.push({page:p,bad});
 const links=await pg.evaluate(()=>[...document.querySelectorAll('a[href]')].filter(a=>new URL(a.href).pathname.includes('/tri-lane-roofing/')&&new URL(a.href).hash).map(a=>({href:a.href,label:a.textContent.trim().slice(0,35)})));
 for(const l of links){
  const u=new URL(l.href);const target=u.pathname.split('/').at(-1)||'index.html';
  const dest=await ctx.request.get(base+target);const html=await dest.text();
  const id=decodeURIComponent(u.hash.slice(1));
  const page=await ctx.newPage();
  await page.goto(base+target,{waitUntil:'domcontentloaded'});
  const exists=await page.evaluate(id=>!!document.getElementById(id)||!!document.querySelector('[name="'+CSS.escape(id)+'"]'),id);
  out.crossAnchor.push({...l,target,status:dest.status(),id,exists});
  await page.close();
 }
}
const net=[];
await pg.route('**/formsubmit.co/ajax/**',async route=>{
 const data=route.request().postDataJSON();net.push({recipient:route.request().url().split('/').pop(),service:data.service,city:data.city,zip:data.zip,form_type:data.form_type,namePresent:!!data.name,emailPresent:!!data.email,messagePresent:!!data.message});
 await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true})});
});
await pg.goto(base+'index.html',{waitUntil:'networkidle'});
await pg.evaluate(()=>openInquiryModal());
await pg.evaluate(()=>selectWizardService('Roofing'));
const step2=await pg.locator('#wizard-step-2').isVisible();
await pg.evaluate(()=>wizardNext());
const step3=await pg.locator('#wizard-step-3').isVisible();
await pg.locator('#wiz-city').fill('QA-TOWN');await pg.locator('#wiz-zip').fill('76226');
await pg.evaluate(()=>wizardNext());
const step4=await pg.locator('#wizard-step-4').isVisible();
await pg.locator('#wiz-name').fill('ATREZZO FINAL QA TEST');
await pg.locator('#wiz-contact').fill('qa@example.com');
await pg.evaluate(()=>wizardNext());
await pg.waitForFunction(()=>document.querySelector('#wiz-status')?.textContent?.includes('Message submitted.'),{timeout:15000});
const msg=await pg.locator('#wiz-status').innerText();
out.wizardFlow=[{step2,step3,step4,deliveredToProvider:net,ui:msg}];
out.summary={countCrossAnchors:out.crossAnchor.length,brokenCrossAnchors:out.crossAnchor.filter(x=>!x.exists||x.status!==200),wizardFlowTested:out.wizardFlow[0]?.step4&&net.length===1,placeholderCount:out.placeholderImages.reduce((n,x)=>n+x.bad.length,0)};
console.log('SECOND PASS QA '+JSON.stringify(out.summary));
console.log('WIZARD TEST '+JSON.stringify(out.wizardFlow));
console.log('INACTIVE IMAGES '+JSON.stringify(out.placeholderImages));
}finally{await browser.close()}
await fs.writeFile('audit-results/followup-navigation-wizard.json',JSON.stringify(out,null,2));
