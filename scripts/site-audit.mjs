import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root=process.cwd();
const skipDirs=new Set(['.git','node_modules']);
const files=[];
function walk(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){if(skipDirs.has(ent.name))continue;const p=path.join(dir,ent.name);if(ent.isDirectory())walk(p);else files.push(path.relative(root,p).replaceAll('\\','/'));}}
walk(root);
const htmlFiles=files.filter(f=>f.endsWith('.html'));
const jsFiles=files.filter(f=>f.endsWith('.js')||f.endsWith('.mjs'));
const errors=[];const warnings=[];
const exists=p=>fs.existsSync(path.join(root,p));
const stripUrl=v=>v.split('#')[0].split('?')[0];
const isExternal=v=>/^(?:https?:|mailto:|tel:|data:|javascript:|#|\/\/)/i.test(v);
const attrRe=/(?:href|src)\s*=\s*["']([^"']+)["']/gi;
for(const file of htmlFiles){const text=fs.readFileSync(path.join(root,file),'utf8');
  const ids=[...text.matchAll(/\sid=["']([^"']+)["']/gi)].map(m=>m[1]);
  const dup=[...new Set(ids.filter((x,i)=>ids.indexOf(x)!==i))];if(dup.length)errors.push(`${file}: duplicate id(s): ${dup.join(', ')}`);
  for(const m of text.matchAll(attrRe)){const raw=m[1].trim();if(!raw||isExternal(raw))continue;const clean=decodeURIComponent(stripUrl(raw));if(!clean)continue;let target=clean;if(target.startsWith('/'))target=target.slice(1);else target=path.normalize(path.join(path.dirname(file),target)).replaceAll('\\','/');if(!exists(target))errors.push(`${file}: missing local target ${raw} -> ${target}`);}
  for(const m of text.matchAll(/<span\b([^>]*)>([\s\S]*?)<\/span>/gi)){const attrs=m[1],label=m[2].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();if(/class=["'][^"']*(?:btn|button|dark|detail)[^"']*["']/i.test(attrs)&&!/data-|onclick=|role=["']link["']/i.test(attrs))warnings.push(`${file}: clickable-looking span may be inert: "${label.slice(0,70)}"`);}
  for(const m of text.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)){const attrs=m[1],label=m[2].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();const type=(attrs.match(/type=["']([^"']+)/i)||[])[1]||'submit';const wired=/onclick=|data-[\w-]+=|data-[\w-]+\b|id=["'][^"']+["']/i.test(attrs);if(type==='button'&&!wired)warnings.push(`${file}: button may be inert: "${label.slice(0,70)}"`);}
  if(/TODO|FIXME|demo only|placeholder action|الإرسال الفعلي سيتوفر|سيتم ربط|قريبًا سيتم/i.test(text))warnings.push(`${file}: contains placeholder/TODO wording`);
}
for(const file of jsFiles){try{execFileSync(process.execPath,['--check',file],{cwd:root,stdio:'pipe'});}catch(e){errors.push(`${file}: JavaScript syntax error\n${String(e.stderr||e.message)}`);}}
// Ensure every local HTML href target is covered and core pages exist.
const core=['index.html','scholarships.html','services.html','offers.html','contact.html','login.html','register.html','profile.html','admin-analytics.html','admin-users.html','admin-staff.html','admin-orders.html','admin-messages.html','admin-gamification.html'];
for(const f of core)if(!exists(f))errors.push(`Missing core page: ${f}`);
console.log(`Audited ${htmlFiles.length} HTML files and ${jsFiles.length} JS files.`);
if(warnings.length){console.log(`\nWARNINGS (${warnings.length})`);warnings.forEach(x=>console.log(`- ${x}`));}
if(errors.length){console.error(`\nERRORS (${errors.length})`);errors.forEach(x=>console.error(`- ${x}`));process.exit(1);}else console.log('\nPASS: no broken local file links, duplicate IDs, or JavaScript syntax errors found.');
