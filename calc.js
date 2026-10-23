(function(root){
const ms=d=>d.getFullYear()*12+d.getMonth();
function parseCSV(t){const r=[];let row=[],f='',q=false;for(let i=0;i<t.length;i++){const c=t[i];if(q){if(c=='"'){if(t[i+1]=='"'){f+='"';i++}else q=false}else f+=c}else if(c=='"')q=true;else if(c==','){row.push(f);f=''}else if(c=='\n'||c=='\r'){if(c=='\r'&&t[i+1]=='\n')i++;row.push(f);r.push(row);row=[];f=''}else f+=c}if(f||row.length){row.push(f);r.push(row)}return r}
function pd(s){s=(s||'').trim();if(!s)return null;let m=s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);if(m)return new Date(+m[3],m[2]-1,+m[1]);m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);if(m)return new Date(+m[1],m[2]-1,+m[3]);return undefined}
function pn(s){s=(s||'').replace(/[\s\u00a0$]/g,'');if(/^\d{1,3}(,\d{3})+$/.test(s))s=s.replace(/,/g,'');return parseFloat(s.replace(',','.'))}
const CUR={USD:'USD','$':'USD',EUR:'EUR','€':'EUR',BYN:'BYN',BYR:'BYN',RUB:'RUB',RUR:'RUB','₽':'RUB'};
function rows(csv){const T=parseCSV(csv.replace(/^\uFEFF/,'')),h=(T[0]||[]).map(x=>x.trim().toLowerCase()),ix=(n,d)=>{const i=h.findIndex(x=>x==n||x.startsWith(n));return i<0?d:i};
 const ic=ix('компания',0),it=ix('тип',1),is=ix('начало',2),ie=ix('конец',3),ia=ix('сумма',4),iv=ix('валюта',-1),ip=ix('дата выплаты',-1),out=[];
 T.slice(1).forEach((r,i)=>{if(!r[ic]||!r[ic].trim())return;const s=pd(r[is]),e=pd(r[ie]),a=pn(r[ia]),pay=ip<0?null:pd(r[ip]);
  if(!s||e===undefined||pay===undefined||isNaN(a))throw new Error('Строка '+(i+2)+' в таблице: проверьте даты (дд.мм.гггг) и сумму');
  const cu=iv<0||!(r[iv]||'').trim()?'USD':CUR[r[iv].trim().toUpperCase()];if(!cu)throw new Error('Строка '+(i+2)+': неизвестная валюта «'+r[iv]+'». Допустимо USD, EUR, BYN, RUB');
  out.push({c:r[ic].trim(),p:(r[it]||'').trim()=='Премия',s,e,a,cur:cu,pay})});
 if(!out.length)throw new Error('В таблице нет данных');return out}
function compute(R,o){
 const now=o.now||new Date(),cur=ms(now),H=o.hours,I=o.infl,fx=o.fx||(()=>1);
 const cos=[...new Set(R.map(r=>r.c))],first=Math.min(...R.map(r=>ms(r.s))),n=cur-first+1,K=cos.length;
 const U=(y,m,d)=>Date.UTC(y,m,d)/864e5,UD=d=>U(d.getFullYear(),d.getMonth(),d.getDate());
 const fd=U(Math.floor(first/12),first%12,1),ed=U(Math.floor(cur/12),cur%12+1,0),T=ed-fd+1;
 const md=[],dm=new Int32Array(T);let off=0;
 for(let i=0;i<n;i++){const idx=first+i,dim=new Date(Date.UTC(Math.floor(idx/12),idx%12+1,0)).getUTCDate();md.push(dim);for(let j=0;j<dim;j++)dm[off+j]=i;off+=dim}
 const cv=cos.map(()=>new Uint8Array(T)),sal=cos.map(()=>Array(n).fill(0)),pr=cos.map(()=>Array(n).fill(0));
 // зарплата: пропорционально дням месяца, в которые человек числился в компании
 R.forEach(r=>{if(r.p)return;const k=cos.indexOf(r.c),a=Math.max(UD(r.s),fd),b=Math.min(r.e?UD(r.e):ed,ed);for(let d=a;d<=b;d++){cv[k][d-fd]=1;const i=dm[d-fd];sal[k][i]+=r.a*fx(r.cur,d)/md[i]}});
 // премия: если указан период (Начало и Конец), делится по дням работы в этой компании внутри периода;
 // если конца нет, как раньше: год до даты в «Начало»
 R.forEach(r=>{if(!r.p)return;const k=cos.indexOf(r.c),P=UD(r.s),hasP=!!r.e,amt=r.a*fx(r.cur,r.pay?UD(r.pay):hasP?UD(r.e):P);if(!hasP&&P>ed)return;
  const a0=hasP?P:U(r.s.getFullYear()-1,r.s.getMonth(),r.s.getDate()+1),b0=hasP?UD(r.e):P,lo=Math.max(a0,fd),hi=Math.min(b0,ed);let N=0;
  for(let d=lo;d<=hi;d++)N+=cv[k][d-fd];
  if(N){for(let d=lo;d<=hi;d++)if(cv[k][d-fd])pr[k][dm[d-fd]]+=amt/N}else pr[k][dm[Math.min(Math.max(b0,fd),ed)-fd]]+=amt});
 const f=cos.map(()=>Array(n).fill(0)),an=Array(n).fill(0);
 for(let d=0;d<T;d++){let a=0;for(let k=0;k<K;k++)if(cv[k][d]){f[k][dm[d]]++;a=1}an[dm[d]]+=a}
 for(let i=0;i<n;i++){an[i]/=md[i];for(let k=0;k<K;k++)f[k][i]/=md[i]}
 const sum=a=>a.reduce((x,y)=>x+y,0),avg=a=>a.length?sum(a)/a.length:null;
 const M=[];for(let i=0;i<n;i++){const s=cos.map((_,k)=>sal[k][i]),p=cos.map((_,k)=>pr[k][i]);M.push({i,idx:first+i,s,p,salT:sum(s),prT:sum(p),tot:sum(s)+sum(p),occ:sum(f.map(c=>c[i])),any:an[i]})}
 M.forEach((m,i)=>m.ma=avg(M.slice(Math.max(0,i-11),i+1).map(x=>x.tot)));
 const st=(a,b)=>{let mo=0,t=0,p=0,oc=0;M.forEach(m=>{if(m.idx>=a&&m.idx<=b){mo+=m.any;t+=m.tot;p+=m.prT;oc+=m.occ}});const am=mo>0?t/mo:null;return{mo,t,p,am,ay:am==null?null:am*12,hr:oc>0?t/(oc*H):null}};
 const g=(c,p)=>p>0&&c!=null?c/p-1:null,real=x=>x==null?null:(1+x)/(1+I)-1;
 const l12=st(cur-11,cur),p12=st(cur-23,cur-12),all=st(first,cur);l12.g=g(l12.am,p12.am);l12.r=real(l12.g);
 const ys=[];for(let y=Math.floor(first/12);y<=now.getFullYear();y++){const s=st(y*12,y*12+11);s.y=y;ys.push(s)}
 ys.forEach((s,i)=>{s.g=i?g(s.am,ys[i-1].am):null;s.r=real(s.g)});
 const base=ys.find(s=>s.am>0),last=ys[ys.length-1],N=base?last.y-base.y:0;
 const cagr=base&&N>0?Math.pow(last.am/base.am,1/N)-1:null;
 const gg=ys.map(s=>s.g).filter(x=>x!=null),rr=ys.map(s=>s.r).filter(x=>x!=null);
 const C=cos.map((name,k)=>{const sr=R.filter(r=>r.c==name&&!r.p),mo=sum(f[k]),t=sum(M.map(m=>m.s[k]+m.p[k]));
  return{name,k,mo,sal:sum(sal[k]),pr:sum(pr[k]),t,share:all.t?t/all.t:0,am:mo?t/mo:0,from:new Date(Math.min(...sr.map(r=>r.s))),open:sr.some(r=>!r.e),to:sr.some(r=>!r.e)?null:new Date(Math.max(...sr.map(r=>r.e)))}});
 C.forEach(c=>{c.ay=c.am*12;c.hr=c.am/H});
 const today=UD(now),act=R.filter(r=>!r.p&&UD(r.s)<=today&&(!r.e||UD(r.e)>=today)),salNow=sum(act.map(r=>r.a*fx(r.cur,today))),nAct=new Set(act.map(r=>r.c)).size;
 const rec=M.reduce((a,m)=>m.tot>a.tot?m:a,M[0]);
 return{fx,M,C,first,cur,l12,p12,all,ys,base,cagr,cagrR:real(cagr),avgG:avg(gg),avgR:avg(rr),
  salNow,rateNow:nAct?salNow/(nAct*H):null,rec,longest:C.reduce((a,c)=>c.mo>a.mo?c:a,C[0])}}
const api={rows,compute};if(typeof module!='undefined')module.exports=api;else root.Calc=api;
})(this);
