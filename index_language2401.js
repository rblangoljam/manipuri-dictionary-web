const fs = require("fs");
const path = require("path");
const mysql = require("mariadb");

const dec = (s) =>
  s.replace(/\x26amp;/g, "\x26").replace(/\x26lt;/g, "\x3C")
    .replace(/\x26gt;/g, "\x3E").replace(/\x26quot;/g, "\x22").replace(/\x26#39;/g, "\x27");

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
const IND = {a:"\uABD1\uABE5",e:"\uABD1\uABE6",E:"\uABD1\uABE9",o:"\uABD1\uABE3",O:"\uABD1\uABE7",q:"\uABD1\uABEA"};
const CONS = new Set(Object.values(M).filter((u)=>parseInt(u,16)>=0xabc0&&parseInt(u,16)<=0xabda));
function toMayek(t){let o="";for(const ch of t){if(ch in IND){const p=o[o.length-1];o+=CONS.has(p)?(M[ch]||ch):(IND[ch]||M[ch]||ch);}else o+=M[ch]||ch;}return o;}

// Manipuri romanization phonotactics: allowed consonant onsets
const ONSETS = new Set(["k","kh","g","ng","c","ch","j","t","th","d","n","p","ph","b","m","y","r","l","w","s","h","sh","ny"]);
const VOWELS = new Set(["a","e","i","o","u","E","O","ai","ei","ou","aa"]);
// valid: at least one vowel, segments parsed as onset+(vowel)
function cleanWord(w){
  if(!/^[a-z']+$/.test(w)||w.length<2) return false;
  if(!/[aeiouEO]/.test(w)) return false;
  // crude but effective: reject impossible consonant clusters (3+ consonants) and lone-consonant strings
  if(/([^aeiouEO]){3}/.test(w)) return false;
  if(!/[aeiouEO]/.test(w.slice(0,2))) return false;
  return true;
}

const POSMAP = { n:"noun","n+":"noun",v:"verb","v+":"verb",adv:"adverb",adj:"adjective",interj:"interjection",prep:"preposition",conj:"conjunction",pron:"pronoun",num:"numeral",suffix:"suffix",prefix:"prefix" };
const cl = (s)=>s.replace(/\s+/g," ").replace(/\s+\./g,".").trim();

const entries=[];
for(const file of files){
  const n=parseInt(file.split("_")[1]); if(n<9) continue;
  const html=fs.readFileSync(path.join(dir,file),"utf8");
  const m=html.match(/<p>(.*?)<\/p>/s); if(!m) continue;
  const text=dec(m[1]).replace(/Learners' Manipuri|English Dictionary/g,"");
  // split on /ipa/ blocks (each entry has one)
  const re=/\/([a-z.' ][^/]{0,40}?)\//g; let mm,last=0,segs=[];
  while((mm=re.exec(text))!==null){segs.push({pre:text.slice(last,mm.index),tail:text.slice(mm.index+mm[0].length)});last=mm.index+mm[0].length;}
  for(let i=0;i<segs.length;i++){
    const {pre,tail}=segs[i];
    const hw=pre.match(/[a-z][a-z.' ]*$/); const word=hw?hw[0].trim():"";
    if(!cleanWord(word)||word.split(" ").length>2) continue;
    let gloss=tail.split(/[A-Z][a-z'/]{1,20}\s+\S/)[0];
    gloss=gloss.replace(/Morph\s*:.*$/s,"");
    const posm=gloss.match(/^\s*((?:n|v|adv|adj|interj|prep|conj|pron|num|suffix|prefix)\+?)\.?\s*/);
    const pos=posm?(POSMAP[posm[1]]||posm[1]||""):"";
    gloss=cl(posm?gloss.slice(posm[0].length):gloss).replace(/^\d+\s*/,"").replace(/^[,.;]\s*/,"");
    const mayek=toMayek(word);
    if(gloss.length>2) entries.push({word,mayek,pos,gloss,page:n});
  }
}
const seen=new Set(); const uniq=[];
for(const e of entries){const k=e.word.toLowerCase()+"|"+e.gloss.slice(0,60); if(seen.has(k))continue; seen.add(k); uniq.push(e);}

(async()=>{
  console.log("=== DEEP RESEARCH: BIDIRECTIONAL INDEX REPORT ===");
  console.log(`Source pages : ${files.length}`);
  console.log(`Validated entries : ${uniq.length}`);
  console.log(`Unique headwords  : ${new Set(uniq.map(e=>e.word.toLowerCase())).size}`);

  // POS distribution
  const byPos={}; for(const e of uniq) byPos[e.pos||"(none)"]=(byPos[e.pos||"(none)"]||0)+1;
  console.log("\nWord-type (POS) distribution (matched):");
  Object.entries(byPos).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>console.log(`  ${k}: ${v}`));

  // English -> Manipuri index: gloss key -> romanized + Mayek
  const engToMan = new Map();
  for(const e of uniq){
    const k = e.gloss.split(/[;,]/)[0].toLowerCase().trim();
    if(k.length>1){
      if(!engToMan.has(k)) engToMan.set(k,[]);
      engToMan.get(k).push(`${e.word} [${e.mayek}]`);
    }
  }
  console.log(`\nEnglish->Manipuri index entries (gloss keys): ${engToMan.size}`);

  // Manipuri -> English index
  console.log(`Manipuri->English index entries (headwords)  : ${new Set(uniq.map(e=>e.word.toLowerCase())).size}`);

  // DB cross-check: how many headwords already exist, and word-type match
  try{
    const c=await mysql.createConnection({host:process.env.DB_HOST||'localhost',port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER||'root',password:process.env.DB_PASSWORD||'',database:process.env.DB_NAME||'manipuri_dictionary'});
    const dbWords=new Set((await c.query("SELECT LOWER(word) w FROM words")).map(r=>r.w));
    const overlap=[...uniq.map(e=>e.word.toLowerCase())].filter(w=>dbWords.has(w));
    console.log(`\nDB overlap: ${new Set(overlap).size} of ${new Set(uniq.map(e=>e.word.toLowerCase())).size} headwords already in DB (will be skipped on import)`);
    await c.end();
  }catch(e){ console.log("DB cross-check skipped:",e.message); }

  console.log("\n=== SAMPLE: Manipuri->English (romanized + Mayek + word type) ===");
  uniq.slice(0,25).forEach(e=>console.log(`  ${e.word} [${e.mayek}] (${e.pos||"?"}) -> ${e.gloss.slice(0,50)}`));

  console.log("\n=== SAMPLE: English->Manipuri index ===");
  let i=0;
  for(const [gloss,words] of engToMan){
    if(i++>=15) break;
    console.log(`  "${gloss}" -> ${words.slice(0,3).join(", ")}`);
  }
  console.log("\nNOTE: analysis only — no rows written to the database yet.");
})();