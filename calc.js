(function(root){
const ms=d=>d.getFullYear()*12+d.getMonth();
function parseCSV(t){const r=[];let row=[],f='',q=false;for(let i=0;i<t.length;i++){const c=t[i];if(q){if(c=='"'){if(t[i+1]=='"'){f+='"';i++}else q=false}else f+=c}else if(c=='"')q=true;else if(c==','){row.push(f);f=''}else if(c=='\n'||c=='\r'){if(c=='\r'&&t[i+1]=='\n')i++;row.push(f);r.push(row);row=[];f=''}else f+=c}if(f||row.length){row.push(f);r.push(row)}return r}
function pd(s){s=(s||'').trim();if(!s)return null;let m=s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);if(m)return new Date(+m[3],m[2]-1,+m[1]);m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);if(m)return new Date(+m[1],m[2]-1,+m[3]);return undefined}
function pn(s){s=(s||'').replace(/[\s\u00a0$]/g,'');if(/^\d{1,3}(,\d{3})+$/.test(s))s=s.replace(/,/g,'');return parseFloat(s.replace(',','.'))}
function rows(csv){const out=[];parseCSV(csv.replace(/^\uFEFF/,'')).slice(1).forEach((r,i)=>{if(!r[0]||!r[0].trim())return;const s=pd(r[2]),e=pd(r[3]),a=pn(r[4]);if(!s||e===undefined||isNaN(a))throw new Error('Строка '+(i+2)+' в таблице: проверьте даты (дд.мм.гггг) и сумму');out.push({c:r[0].trim(),p:(r[1]||'').trim()=='Премия',s,e,a})});if(!out.length)throw new Error('В таблице нет данных');return out}
function compute(R,o){
 const now=o.now||new Date(),cur=ms(now),H=o.hours,I=o.infl;
 const cos=[...new Set(R.map(r=>r.c))],first=Math.min(...R.map(r=>ms(r.s))),n=cur-first+1;
 const mk=()=>cos.map(()=>Array(n).fill(0)),sal=mk(),cov=mk(),pr=mk();
 R.forEach(r=>{if(r.p)return;const k=cos.indexOf(r.c),a=ms(r.s),b=r.e?ms(r.e):cur;for(let m=Math.max(a,first);m<=Math.min(b,cur);m++){sal[k][m-first]+=r.a;cov[k][m-first]=1}});
 R.forEach(r=>{if(!r.p)return;const k=cos.indexOf(r.c),pm=ms(r.s)-first,w=[];for(let m=pm-11;m<=pm;m++)if(m>=0&&m<n&&cov[k][m])w.push(m);if(w.length)w.forEach(m=>pr[k][m]+=r.a/w.length);else if(pm>=0&&pm<n)pr[k][pm]+=r.a});
 const sum=a=>a.reduce((x,y)=>x+y,0),avg=a=>a.length?sum(a)/a.length:null;
 const M=[];for(let i=0;i<n;i++){const s=cos.map((_,k)=>sal[k][i]),p=cos.map((_,k)=>pr[k][i]);M.push({i,idx:first+i,s,p,salT:sum(s),prT:sum(p),tot:sum(s)+sum(p),occ:sum(cov.map(c=>c[i]))})}
 M.forEach((m,i)=>m.ma=avg(M.slice(Math.max(0,i-11),i+1).map(x=>x.tot)));
 const st=(a,b)=>{let mo=0,t=0,p=0,oc=0;M.forEach(m=>{if(m.idx>=a&&m.idx<=b){if(m.occ)mo++;t+=m.tot;p+=m.prT;oc+=m.occ}});const am=mo?t/mo:null;return{mo,t,p,am,ay:am==null?null:am*12,hr:oc?t/(oc*H):null}};
 const g=(c,p)=>p>0&&c!=null?c/p-1:null,real=x=>x==null?null:(1+x)/(1+I)-1;
 const l12=st(cur-11,cur),p12=st(cur-23,cur-12),all=st(first,cur);l12.g=g(l12.am,p12.am);l12.r=real(l12.g);
 const ys=[];for(let y=Math.floor(first/12);y<=now.getFullYear();y++){const s=st(y*12,y*12+11);s.y=y;ys.push(s)}
 ys.forEach((s,i)=>{s.g=i?g(s.am,ys[i-1].am):null;s.r=real(s.g)});
 const base=ys.find(s=>s.am>0),last=ys[ys.length-1],N=base?last.y-base.y:0;
 const cagr=base&&N>0?Math.pow(last.am/base.am,1/N)-1:null;
 const gg=ys.map(s=>s.g).filter(x=>x!=null),rr=ys.map(s=>s.r).filter(x=>x!=null);
 const C=cos.map((name,k)=>{const sr=R.filter(r=>r.c==name&&!r.p),mo=sum(cov[k]),t=sum(M.map(m=>m.s[k]+m.p[k]));
  return{name,k,mo,sal:sum(sal[k]),pr:sum(pr[k]),t,share:all.t?t/all.t:0,am:mo?t/mo:0,from:new Date(Math.min(...sr.map(r=>r.s))),open:sr.some(r=>!r.e),to:sr.some(r=>!r.e)?null:new Date(Math.max(...sr.map(r=>r.e)))}});
 C.forEach(c=>{c.ay=c.am*12;c.hr=c.am/H});
 const cm=M[n-1],rec=M.reduce((a,m)=>m.tot>a.tot?m:a,M[0]);
 return{M,C,first,cur,l12,p12,all,ys,base,cagr,cagrR:real(cagr),avgG:avg(gg),avgR:avg(rr),
  salNow:cm.salT,rateNow:cm.occ?cm.salT/(cm.occ*H):null,rec,longest:C.reduce((a,c)=>c.mo>a.mo?c:a,C[0])}}
const api={rows,compute};if(typeof module!='undefined')module.exports=api;else root.Calc=api;
})(this);
