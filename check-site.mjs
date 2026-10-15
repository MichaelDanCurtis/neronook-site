// Release checks use built-in Node APIs; no browser state or credentials.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url));
const dist=path.join(root,'dist');
const issues=[];
const check=(condition,message)=>{if(!condition)issues.push(message);};
const js=fs.readFileSync(path.join(dist,'site.js'),'utf8');
const rawKey=Buffer.from(js.match(/CATALOG_PUBLIC_KEY = '([^']+)'/)[1],'base64');
const key=crypto.createPublicKey({key:Buffer.concat([Buffer.from('302a300506032b6570032100','hex'),rawKey]),format:'der',type:'spki'});
const envelope=JSON.parse(fs.readFileSync(path.join(dist,'catalog.json'),'utf8'));
const payload=Buffer.from(envelope.payload,'base64');
check(envelope.keyID==='nero-catalog-2026'&&crypto.verify(null,payload,key,Buffer.from(envelope.signature,'base64')),'Catalog signature mismatch');
const catalog=JSON.parse(payload);
check(catalog.schemaVersion===1&&catalog.sequence>0,'Unsupported catalog');
check(new Date(catalog.expiresAt)>new Date(),'Catalog expired');
check(new Set(catalog.entries.map(e=>e.id)).size===catalog.entries.length,'Duplicate plugin IDs');
let available=0;
for(const entry of catalog.entries){
  check(!entry.id.includes('private'),'A private plugin must not appear in the public catalog');
  check((entry.availability==='available')===(entry.download!=null),entry.id+': availability mismatch');
  if(!entry.download)continue;
  available++;
  check(/^downloads\/[A-Za-z0-9][A-Za-z0-9._-]{0,160}$/.test(entry.download.path),entry.id+': invalid download path');
  const file=path.join(dist,entry.download.path);
  if(!fs.existsSync(file)){issues.push(entry.id+': missing download');continue;}
  const data=fs.readFileSync(file);
  check(data.length===entry.download.bytes,entry.id+': byte count differs');
  check(crypto.createHash('sha256').update(data).digest('hex')===entry.download.sha256,entry.id+': hash differs');
  check(data.length<25*1024*1024,entry.id+': exceeds static hosting file limit');
  if(entry.kind==='native')check(/^[A-Z0-9]{10}$/.test(entry.publisher.teamID),entry.id+': missing publisher team');
}
const referenced=new Set();
for(const page of ['index.html','guide.html','privacy.html','releases.html']){
  const source=fs.readFileSync(path.join(dist,page),'utf8');
  check(source.includes('<title>')&&source.includes('name="viewport"'),page+': missing page metadata');
  for(const match of source.matchAll(/(?:href|src)="([^"#?]+)[^"]*"/g)){
    const link=match[1];if(/^(https?:|data:|mailto:)/.test(link))continue;
    referenced.add(link);
    check(fs.existsSync(path.join(dist,link)),page+': missing local link '+link);
  }
}
for(const file of fs.readdirSync(path.join(dist,'downloads'))){
  check(!/key|credential|secret|token|notary|submit/i.test(file),'A non-release file is present in downloads');
}
const result={passed:issues.length===0,entries:catalog.entries.length,available,sequence:catalog.sequence,checkedLinks:referenced.size,issues};
console.log(JSON.stringify(result,null,2));process.exitCode=issues.length?1:0;
