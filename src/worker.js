/* ===== PileShared : code identique côté jeu et côté serveur ===== */
const PileShared=(()=>{
  const LIMIT=180000;
  const EPOCH=Date.UTC(2026,10,12);
  function dayKey(d){
    const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d||new Date());
    const g=t=>p.find(x=>x.type===t).value;return g('year')+'-'+g('month')+'-'+g('day');
  }
  function dayNum(k){const [y,m,d]=k.split('-').map(Number);return Math.round((Date.UTC(y,m-1,d)-EPOCH)/864e5)+1}
  function hashStr(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
  function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
  function makeDaily(k){
    const r=rng(hashStr('pile-daily-'+k));
    const pickI=n=>Math.floor(r()*n);
    for(let round=0;round<50;round++){
      const nums=[];for(let i=0;i<6;i++)nums.push(1+pickI(9));
      const ops=['×','×'];const pool=['+','+','−','÷','×'];for(let i=0;i<3;i++)ops.push(pool[pickI(pool.length)]);
      for(let tries=0;tries<200;tries++){
        const cnt=4+pickI(2);
        const idx=[0,1,2,3,4,5];for(let i=5;i>0;i--){const j=pickI(i+1);const x=idx[i];idx[i]=idx[j];idx[j]=x}
        let vals=idx.slice(0,cnt).map(i=>nums[i]);const left=ops.slice();let ok=true;
        while(vals.length>1){
          const i=pickI(vals.length);let j=pickI(vals.length-1);if(j>=i)j++;
          const oi=pickI(left.length),op=left.splice(oi,1)[0];
          const a=vals[i],b=vals[j];let v;
          if(op==='+')v=a+b;else if(op==='×')v=a*b;else if(op==='−'){if(a===b){ok=false;break}v=Math.abs(a-b)}
          else{const hi=Math.max(a,b),lo=Math.min(a,b);if(hi%lo!==0||lo===1){ok=false;break}v=hi/lo}
          vals=vals.filter((_,q)=>q!==i&&q!==j);vals.push(v);
        }
        if(!ok)continue;const t=vals[0];
        if(t>=100&&t<=999){
          const ORD=['+','−','×','÷'];
          return {k,num:dayNum(k),nums:nums.slice().sort((x,y)=>x-y),ops:ops.slice().sort((x,y)=>ORD.indexOf(x)-ORD.indexOf(y)),target:t};
        }
      }
    }
    return {k,num:dayNum(k),nums:[2,3,4,7,7,8],ops:['+','−','×','×','÷'],target:392};
  }
  /* calcul exact en fractions */
  function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){const t=a%b;a=b;b=t}return a}
  function F(n,d){if(d===undefined)d=1;if(d<0){n=-n;d=-d}const g=gcd(n,d)||1;const o={n:n/g,d:d/g};if(Math.abs(o.n)>1e13||o.d>1e13)throw 'big';return o}
  const add=(a,b)=>F(a.n*b.d+b.n*a.d,a.d*b.d),sub=(a,b)=>F(a.n*b.d-b.n*a.d,a.d*b.d),mul=(a,b)=>F(a.n*b.n,a.d*b.d),div=(a,b)=>{if(b.n===0)throw 'div0';return F(a.n*b.d,a.d*b.n)};
  function evalTokens(tokens){
    let i=0;const pk=()=>tokens[i];const isOp=(t,l)=>t&&t.t==='op'&&l.includes(t.op);
    function expr(){let v=term();while(isOp(pk(),['+','−'])){const o=tokens[i++].op,r=term();v=o==='+'?add(v,r):sub(v,r)}return v}
    function term(){let v=factor();while(isOp(pk(),['×','÷'])){const o=tokens[i++].op,r=factor();v=o==='×'?mul(v,r):div(v,r)}return v}
    function factor(){let v=prim();while(isOp(pk(),['²','³'])){const o=tokens[i++].op;v=o==='²'?mul(v,v):mul(mul(v,v),v)}return v}
    function prim(){const t=tokens[i];if(!t)throw 'eof';if(t.t==='num'){i++;return F(t.v)}if(t.t==='('){i++;const v=expr();if(!tokens[i]||tokens[i].t!==')')throw 'par';i++;return v}throw 'tok'}
    try{if(!tokens.length)return null;const v=expr();return i===tokens.length?v:null}catch(e){return null}
  }
  /* propriétés (sans reliques) */
  const isPrime=n=>{if(n<2)return false;if(n%2===0)return n===2;for(let i=3;i*i<=n;i+=2)if(n%i===0)return false;return true};
  const isSq=n=>{const r=Math.round(Math.sqrt(n));return r*r===n},isCu=n=>{const r=Math.round(Math.cbrt(n));return r*r*r===n};
  const isTri=n=>{const k=Math.round((Math.sqrt(8*n+1)-1)/2);return k*(k+1)/2===n};
  const FIB=new Set();{let a=1,b=2;while(a<1e12){FIB.add(a);const c=a+b;a=b;b=c}}
  const isHappy=n=>{const s=new Set();while(n!==1&&!s.has(n)){s.add(n);n=String(n).split('').reduce((t,d)=>t+d*d,0)}return n===1};
  const isPal=n=>{const s=String(n);return s.length>1&&s===s.split('').reverse().join('')};
  const isPow2=n=>{if(n<2)return false;while(n%2===0)n/=2;return n===1};
  const KAP=new Set([9,45,55,99,297,703,999,2223,2728,4879,4950,5050,5292,7272,7777,9999]),FACT=new Set([6,24,120,720,5040,40320]),PERF=new Set([6,28,496,8128]);
  const PROPS=[
    {id:'premier',tier:'commun',add:2,test:n=>isPrime(n)},
    {id:'jumeaux',tier:'commun',add:3,test:n=>isPrime(n)&&(isPrime(n-2)||isPrime(n+2))},
    {id:'sexy',tier:'commun',add:3,test:n=>isPrime(n)&&(isPrime(n-6)||isPrime(n+6))},
    {id:'triangulaire',tier:'commun',add:2,test:n=>n>=3&&isTri(n)},
    {id:'fibonacci',tier:'commun',add:2,test:n=>n>=2&&FIB.has(n)},
    {id:'puiss2',tier:'commun',add:2,test:n=>isPow2(n)},
    {id:'heureux',tier:'commun',add:2,test:n=>n>1&&isHappy(n)},
    {id:'dizaine',tier:'commun',add:1,test:n=>n%10===0},
    {id:'carre',tier:'rare',add:4,test:n=>n>=4&&isSq(n)},
    {id:'cube',tier:'rare',add:6,test:n=>n>=8&&isCu(n)},
    {id:'factorielle',tier:'rare',add:6,test:n=>FACT.has(n)},
    {id:'kaprekar',tier:'rare',add:8,test:n=>KAP.has(n)},
    {id:'parfait',tier:'legendaire',mul:3,test:n=>PERF.has(n)},
    {id:'taxi',tier:'legendaire',mul:17,test:n=>n===1729},
    {id:'palindrome',tier:'commun',fin:2,test:n=>isPal(n)},
  ];
  function scoreDaily(n,digits,target){
    const steps=[];const base=digits.reduce((s,v)=>s+v,0);
    steps.push({k:'base',l:'Tuiles jouées',v:'+'+base,short:true});
    let multi=1;const e=Math.abs(n-target);
    if(e===0){multi+=3;steps.push({k:'add',l:'Pile !',v:'+3'})}
    else if(e===1){multi+=2;steps.push({k:'add',l:'À 1 près',v:'+2'})}
    else if(e<=3){multi+=1;steps.push({k:'add',l:'À '+e+' près',v:'+1'})}
    const props=digits.length>=2?PROPS.filter(p=>p.test(n)):[];
    if(digits.length<2)steps.push({k:'info',l:'Un seul chiffre joué',v:'—'});
    for(const p of props)if(p.add){multi+=p.add;steps.push({k:'add',pid:p.id,tier:p.tier,v:'+'+p.add})}
    for(const p of props)if(p.mul){multi*=p.mul;steps.push({k:'mul',pid:p.id,tier:p.tier,v:'×'+p.mul})}
    multi=Math.round(multi*100)/100;
    let total=base*multi;
    if(e>10){total*=0.5;steps.push({k:'fin',l:'Hors cible',v:'×0,5'})}
    if(props.some(p=>p.id==='palindrome')){total*=2;steps.push({k:'fin',pid:'palindrome',tier:'commun',v:'×2'})}
    return {base,multi,total:Math.floor(total),steps,props:props.map(p=>p.id)};
  }
  /* reconstruit une expression à partir des index de tuiles du défi */
  function buildFromIdx(P,raw){
    if(!Array.isArray(raw)||raw.length>40)return null;
    const usedN=new Set(),usedO=new Set(),toks=[],digits=[];
    for(const t of raw){
      if(!t||typeof t!=='object')return null;
      if(t.t==='('||t.t===')'){toks.push({t:t.t});continue}
      const i=t.i|0;
      if(t.t==='num'){if(i<0||i>=P.nums.length||usedN.has(i))return null;usedN.add(i);toks.push({t:'num',v:P.nums[i]});digits.push(P.nums[i]);continue}
      if(t.t==='op'){if(i<0||i>=P.ops.length||usedO.has(i))return null;usedO.add(i);toks.push({t:'op',op:P.ops[i]});continue}
      return null;
    }
    return {toks,digits};
  }
  function toStr(toks){return toks.map(t=>t.t==='num'?t.v:t.t==='op'?' '+t.op+' ':t.t).join('').replace(/\( /g,'(').replace(/ \)/g,')')}
  return {LIMIT,dayKey,dayNum,makeDaily,evalTokens,scoreDaily,buildFromIdx,toStr};
})();

/* ===== Serveur du classement (Cloudflare Worker + Durable Object) ===== */
import { DurableObject } from "cloudflare:workers";

const json=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const cleanPseudo=p=>String(p||'').replace(/[^\p{L}\p{N} _\-.]/gu,'').trim().slice(0,16);
const cleanDev=d=>String(d||'').replace(/[^a-f0-9]/g,'').slice(0,32);

export class Board extends DurableObject{
  constructor(ctx,env){
    super(ctx,env);this.sql=ctx.storage.sql;
    this.sql.exec('CREATE TABLE IF NOT EXISTS starts(day TEXT, dev TEXT, pseudo TEXT, t0 INTEGER, PRIMARY KEY(day,dev))');
    this.sql.exec('CREATE TABLE IF NOT EXISTS scores(day TEXT, dev TEXT, pseudo TEXT, score INTEGER, ms INTEGER, expr TEXT, len INTEGER, PRIMARY KEY(day,dev))');
  }
  start(dev,pseudo){
    const day=PileShared.dayKey(),now=Date.now();
    const row=this.sql.exec('SELECT t0,pseudo FROM starts WHERE day=? AND dev=?',day,dev).toArray()[0];
    if(row)return {day,t0:row.t0,now,pseudo:row.pseudo};
    this.sql.exec('INSERT INTO starts(day,dev,pseudo,t0) VALUES(?,?,?,?)',day,dev,pseudo,now);
    return {day,t0:now,now,pseudo};
  }
  play(day,dev,tokens){
    const st=this.sql.exec('SELECT t0,pseudo FROM starts WHERE day=? AND dev=?',day,dev).toArray()[0];
    if(!st)return {error:'Pas de partie commencée.'};
    const ms=Date.now()-st.t0;
    if(ms>PileShared.LIMIT+5000)return {error:'Temps écoulé.',over:true};
    const P=PileShared.makeDaily(day);
    const b=PileShared.buildFromIdx(P,tokens);if(!b)return {error:'Calcul invalide.'};
    const v=PileShared.evalTokens(b.toks);if(!v||v.d!==1||v.n<=0)return {error:'Calcul invalide.'};
    const sc=PileShared.scoreDaily(v.n,b.digits,P.target).total;
    const old=this.sql.exec('SELECT score,ms FROM scores WHERE day=? AND dev=?',day,dev).toArray()[0];
    if(!old||sc>old.score||(sc===old.score&&ms<old.ms)){
      this.sql.exec('INSERT OR REPLACE INTO scores(day,dev,pseudo,score,ms,expr,len) VALUES(?,?,?,?,?,?,?)',day,dev,st.pseudo,sc,ms,PileShared.toStr(b.toks)+' = '+v.n,b.digits.length);
    }
    return Object.assign({score:sc},this.rankOf(day,dev));
  }
  rankOf(day,dev){
    const me=this.sql.exec('SELECT score,ms FROM scores WHERE day=? AND dev=?',day,dev).toArray()[0];
    const total=this.sql.exec('SELECT COUNT(*) AS c FROM scores WHERE day=?',day).one().c;
    if(!me)return {rank:null,total};
    const better=this.sql.exec('SELECT COUNT(*) AS c FROM scores WHERE day=? AND (score>? OR (score=? AND ms<?))',day,me.score,me.score,me.ms).one().c;
    return {rank:better+1,total,best:me.score};
  }
  board(day,dev){
    const top=this.sql.exec('SELECT pseudo,score,ms,len,dev FROM scores WHERE day=? ORDER BY score DESC, ms ASC LIMIT 30',day).toArray()
      .map(r=>({pseudo:r.pseudo,score:r.score,ms:r.ms,len:r.len,me:r.dev===dev}));
    return Object.assign({day,top},this.rankOf(day,dev));
  }
}

export default{
  async fetch(req,env){
    const url=new URL(req.url);
    if(!url.pathname.startsWith('/api/'))return env.ASSETS.fetch(req);
    const stub=env.BOARD.get(env.BOARD.idFromName('pile-board'));
    try{
      if(url.pathname==='/api/daily/board'&&req.method==='GET'){
        const day=/^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get('day')||'')?url.searchParams.get('day'):PileShared.dayKey();
        return json(await stub.board(day,cleanDev(url.searchParams.get('dev'))));
      }
      if(req.method!=='POST')return json({error:'Méthode non prise en charge.'},405);
      const body=await req.json().catch(()=>({}));
      const dev=cleanDev(body.dev);if(dev.length<8)return json({error:'Appareil inconnu.'},400);
      if(url.pathname==='/api/daily/start'){
        const pseudo=cleanPseudo(body.pseudo);if(pseudo.length<2)return json({error:'Pseudo trop court.'},400);
        return json(await stub.start(dev,pseudo));
      }
      if(url.pathname==='/api/daily/play'){
        const day=String(body.day||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return json({error:'Jour invalide.'},400);
        const r=await stub.play(day,dev,body.tokens);return json(r,r.error?400:200);
      }
      return json({error:'Introuvable.'},404);
    }catch(e){return json({error:'Erreur serveur.'},500)}
  }
};
