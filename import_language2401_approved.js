const fs = require("fs");
const path = require("path");
const mysql = require("mariadb");

const dec = (s) =>
  s.replace(/&#39;/g, "'").replace(/"/g, '"').replace(/</g, "<")
    .replace(/>/g, ">").replace(/&/g, "&");

const REPO = __dirname;
const dir = path.join(REPO, "data", "epub_unzipped", "EPUB");
const files = fs.readdirSync(dir).filter((f) => /^page_\d+\.html$/.test(f));
files.sort((a, b) => parseInt(a.split("_")[1]) - parseInt(b.split("_")[1]));

// E-Pao keyboard -> Unicode Meitei Mayek
const M = {
  k:"\uABC0",s:"\uABC1",l:"\uABC2",m:"\uABC3",p:"\uABC4",n:"\uABC5",c:"\uABC6",t:"\uABC7",
  K:"\uABC8",Z:"\uABC9",T:"\uABCA",w:"\uABCB",y:"\uABCC",h:"\uABCD",U:"\uABCE",I:"\uABCF",
  f:"\uABD0",A:"\uABD1",g:"\uABD2",J:"\uABD3",r:"\uABD4",b:"\uABD5",j:"\uABD6",d:"\uABD7",
  G:"\uABD8",D:"\uABD9",B:"\uABDA",
  a:"\uABE5",e:"\uABE6",u:"\uABE8",i:"\uABE4",E:"\uABE9",o:"\uABE3",O:"\uABE7",q:"\uABEA",
  Q:"\uABDB",L:"\uABDC",M:"\uABDD",P:"\uABDE",N:"\uABDF",Y:"\uABE0",H:"\uABE1",
};
const IND = { a:"\uABD1\uABE5", e:"\uABD1\uABE6", E:"\uABD1\uABE9", o:"\uABD1\uABE3", O:"\uABD1\uABE7", q:"\uABD1\uABEA" };
const CONS = new Set(Object.values(M).filter((u) => parseInt(u,16) >= 0xabc0 && parseInt(u,16) <= 0xabda));
function toMayek(t){ let o=""; for(const ch of t){ if(ch in IND){ const p=o[o.length-1]; o+=CONS.has(p)?(M[ch]||ch):(IND[ch]||M[ch]||ch);} else o+=M[ch]||ch;} return o; }

const POSMAP = { n:"noun","n+":"noun", v:"verb","v+":"verb", adv:"adverb", adj:"adjective", interj:"interjection", prep:"preposition", conj:"conjunction", pron:"pronoun", num:"numeral", suffix:"suffix", prefix:"prefix" };
const cl = (s) => s.replace(/\s+/g," ").trim();

// Same validated pattern as the deep-research report.
function cleanWord(w){
  if(!/^[a-z][a-z'\u00f1]*$/.test(w) || w.length<2) return false;
  if(!/[aeiouEO]/.test(w)) return false;
  if(/([^aeiouEO]){3}/.test(w)) return false;
  return true;
}

const entries=[];
for(const file of files){
  const n=parseInt(file.split("_")[1]); if(n<9) continue;
  const html=fs.readFileSync(path.join(dir,file),"utf8");
  const m=html.match(/<p>(.*?)<\/p>/s); if(!m) continue;
  const text=dec(m[1]).replace(/Learners' Manipuri|English Dictionary/g,"");
  const re=/\/([a-z.'\u00f1][^/]{0,40}?)\//g;
  let mm,last=0,segs=[];
  while((mm=re.exec(text))!==null){ segs.push({pre:text.slice(last,mm.index),tail:text.slice(mm.index+mm[0].length)}); last=mm.index+mm[0].length; }
  for(let i=0;i<segs.length;i++){
    const {pre,tail}=segs[i];
    const hw=pre.match(/[^,;:()\u2018\u2019\u201c\u201d~]+$/);
    const word=hw?hw[0].trim():"";
    if(!cleanWord(word)) continue;
    let gloss=tail.split(/[A-Z][a-z'\u00f1]{1,20}\s+\S/)[0];
    gloss=gloss.replace(/Morph\s*:.*$/s,"");
    const posm=gloss.match(/^\s*((?:n|v|adv|adj|interj|prep|conj|pron|num|suffix|prefix)\+?)\.?\s*/);
    const pos=posm?(POSMAP[posm[1]]||posm[1]||""):"";
    gloss=cl(posm?gloss.slice(posm[0].length):gloss).replace(/^\d+\s*/,"").replace(/^[,.;\s]+/,"");
    const mayek=toMayek(word);
    if(gloss.length>2) entries.push({word,mayek,pos,gloss});
  }
}
const seen=new Set(); const uniq=[];
for(const e of entries){ const k=e.word.toLowerCase()+"|"+e.gloss.slice(0,60); if(seen.has(k))continue; seen.add(k); uniq.push(e); }
const slugify=(w)=>w.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")||"word";

(async()=>{
  const c=await mysql.createConnection({host:process.env.DB_HOST||'localhost',port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER||'root',password:process.env.DB_PASSWORD||'',database:process.env.DB_NAME||'manipuri_dictionary',charset:'utf8mb4'});
  const beforeW=Number((await c.query("SELECT COUNT(*) c FROM words"))[0].c);
  const existing=new Set((await c.query("SELECT LOWER(word) w FROM words")).map(r=>r.w));
  const toInsert=uniq.filter(e=>!existing.has(e.word.toLowerCase()));
  console.log("=== LIVE IMPORTER (validated) ===");
  console.log("Parsed entries:",uniq.length,"| New headwords to insert:",toInsert.length,"| Before words:",beforeW);

  await c.beginTransaction();
  let ins=0, dupSlug=0;
  for(const e of toInsert){
    const sl=slugify(e.word);
    const dup=await c.query("SELECT id FROM words WHERE slug = ? LIMIT 1",[sl]);
    const finalSlug=dup.length?sl+"-"+ins:sl; if(dup.length)dupSlug++;
    const r=await c.query("INSERT INTO words (word, slug, first_letter, search_index) VALUES (?,?,?,?)",[e.word,finalSlug,(e.word[0]||"?").toUpperCase(),e.word.toLowerCase()]);
    await c.query("INSERT INTO word_senses (word_id, wordtype, wordtype_raw, definition, meaning_eng_man, meaning_mm, meaning_mm_unicode, antonyms, synonyms, status, submitted_by, reviewed_by, reviewed_at) VALUES (?,?,?,?,?,?,?,'','','approved',1,1,NOW())",[r.insertId,e.pos||"unknown",e.pos||"",e.gloss,e.gloss,e.word,e.mayek]);
    ins++;
  }
  await c.commit();
  const afterW=Number((await c.query("SELECT COUNT(*) c FROM words"))[0].c);
  console.log("Inserted:",ins,"| Slug-collisions renamed:",dupSlug,"| After words:",afterW);
  const s=await c.query("SELECT w.word, w.slug, ws.wordtype, LEFT(ws.meaning_mm_unicode,16) mm, LEFT(ws.definition,45) def FROM words w JOIN word_senses ws ON ws.word_id=w.id WHERE w.id > ? ORDER BY w.id LIMIT 12",[beforeW]);
  console.log("\nSample inserted:");
  s.forEach(r=>console.log(`- ${r.word} [${r.wordtype}] ${r.mm||""} -> ${r.def}`));
  await c.end();
  console.log("DONE");
})().catch(async(e)=>{ console.error("FAIL:",e.message); process.exit(1); });