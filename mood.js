/* Fan mood worlds for the Red Brief: Kop Roar (the crowd) and Constellation (the stars).
   window.moodRoar(stage, mood) and window.moodStars(stage, mood). All brief text goes in via textContent. */
(function(){
const TONE={positive:'#00f0c8',mixed:'#ffb000',negative:'#ff2a4f'};
const ABOUT={player:'#00f0c8',team:'#ff2a4f',manager:'#ffb000',board:'#7c4dff'};
const LABEL={player:'PLAYERS',team:'TEAM',manager:'MANAGER',board:'BOARD'};
const MONO="ui-monospace,Menlo,monospace";
const rgb=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const still=matchMedia('(prefers-reduced-motion: reduce)').matches;
function mk(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}
function quoteNode(q,box){
  box.style.setProperty('--qc',ABOUT[q.about]||'#fff');box.replaceChildren();
  const a=mk('div','qa',q.about+' · '+q.subject);
  if(q.kind==='insight')a.append(mk('span','qk ins','INSIGHT'));
  if(q.kind==='claim')a.append(mk('span','qk nc','NOT CHECKED'));
  const w=mk('div','qw',q.handle+' · ');const l=mk('a',null,'Open ↗');
  if(/^https:\/\/(x\.com|www\.reddit\.com|reddit\.com)\//.test(q.url||'')){l.href=q.url;l.target='_blank';l.rel='noopener'}w.append(l);
  box.append(a,mk('q',null,q.text),w);return box}
function run(stage,factory){
  const cv=mk('canvas'),ov=mk('div','ov');stage.append(cv,ov);const ctx=cv.getContext('2d');
  let api=null,vis=false,last=performance.now(),t0=last,W=0;
  function size(){const r=stage.getBoundingClientRect();if(!r.width||(Math.abs(r.width-W)<1&&api))return;W=r.width;
    const d=Math.min(devicePixelRatio||1,2);cv.width=r.width*d;cv.height=r.height*d;cv.style.width=r.width+'px';cv.style.height=r.height+'px';ctx.setTransform(d,0,0,d,0,0);
    ov.replaceChildren();api=factory(ctx,r.width,r.height,stage,ov);if(still)api.frame(2.5,0)}
  let rt;new ResizeObserver(()=>{clearTimeout(rt);rt=setTimeout(size,api?150:0)}).observe(stage);
  new IntersectionObserver(e=>{vis=e[0].isIntersecting},{rootMargin:'60px'}).observe(stage);
  stage.addEventListener('click',()=>api&&api.tap&&api.tap());
  if(still)return;
  function loop(now){requestAnimationFrame(loop);if(!vis||!api){last=now;return}const dt=Math.min(.05,(now-last)/1000);last=now;api.frame((now-t0)/1000,dt)}
  requestAnimationFrame(loop)}
function popup(ov,q,x,y,w,h,life){
  const b=quoteNode(q,mk('div','bubble'));ov.append(b);
  const bw=b.offsetWidth,bh=b.offsetHeight,left=Math.max(10,Math.min(w-bw-10,x-bw/2)),top=Math.max(10,Math.min(h-bh-10,y-bh));
  b.style.left=left+'px';b.style.top=top+'px';b.style.setProperty('--tail',Math.max(14,Math.min(bw-26,x-left-6))+'px');
  requestAnimationFrame(()=>requestAnimationFrame(()=>b.classList.add('on')));
  setTimeout(()=>{b.classList.add('off');setTimeout(()=>b.remove(),500)},life)}

/* ---------- KOP ROAR: the stand is the chart ---------- */
window.moodRoar=function(stage,M){run(stage,(ctx,w,h,st,ov)=>{
  const S=M.split,top=h*.3,rows=22,fans=[];
  for(let r=0;r<rows;r++){const s=.55+.45*r/(rows-1),sp=7.2*s+2.2,y0=top+18+Math.pow(r/(rows-1),1.15)*(h-top-40);
    const n=Math.ceil(w/sp)+1;for(let i=0;i<n;i++){const x=i*sp+(r%2?sp/2:0)-2,c=(x-w/2)/(w/2);
      fans.push({x,y:y0-14*(1-c*c)*(1-r/rows),r,s,ph:Math.random()*6.28,v:x/w*.75+.28*Math.sin(r*.55+x*.018)+Math.random()*.3})}}
  const ord=fans.map((f,i)=>i).sort((a,b)=>fans[a].v-fans[b].v),np=Math.round(fans.length*S.positive/100),nm=Math.round(fans.length*S.mixed/100);
  ord.forEach((fi,k)=>fans[fi].tone=k<np?'positive':k<np+nm?'mixed':'negative');fans.forEach(f=>f.c=rgb(TONE[f.tone]));
  const Q=M.quotes||[],word=M.word.toUpperCase(),wc=M.word==='positive'?TONE.positive:M.word==='mixed'?TONE.mixed:TONE.negative;
  let qi=0,next=1.2,focus=null,flashes=[];
  function frame(t,dt){
    const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#0a0716');g.addColorStop(.32,'#120a18');g.addColorStop(1,'#030206');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    for(const fx of [w*.12,w*.88]){const r=ctx.createRadialGradient(fx,-20,0,fx,-20,h*.75);r.addColorStop(0,'#ffffff16');r.addColorStop(1,'#ffffff00');ctx.fillStyle=r;ctx.fillRect(0,0,w,h)}
    let fs=Math.min(w*.3,120);ctx.font=`400 ${fs}px Anton,Impact,sans-serif`;while(ctx.measureText(word).width>w*.86&&fs>30){fs-=4;ctx.font=`400 ${fs}px Anton,Impact,sans-serif`}
    ctx.textAlign='center';ctx.textBaseline='alphabetic';const pulse=1+.025*Math.sin(t*4.2);
    ctx.save();ctx.translate(w/2,h*.17);ctx.scale(pulse,pulse);ctx.shadowColor=wc;ctx.shadowBlur=34;ctx.fillStyle=wc;ctx.fillText(word,0,0);ctx.shadowBlur=0;ctx.fillStyle='#fff3';ctx.fillText(word,0,-2);ctx.restore();
    const segs=28,mw=w-48,sx=24,sy=h*.205,lvl=.62+.18*Math.sin(t*2.3)+.12*Math.sin(t*7.1)+.05*Math.random();
    for(let i=0;i<segs;i++){const f=i/segs,c=f<S.positive/100?TONE.positive:f<(S.positive+S.mixed)/100?TONE.mixed:TONE.negative;ctx.fillStyle=f<lvl?c:'#ffffff12';ctx.fillRect(sx+i*mw/segs,sy,mw/segs-3,10)}
    ctx.font=`700 10px ${MONO}`;ctx.textAlign='left';ctx.fillStyle='#9a96b6';ctx.fillText('KOP-O-METER',sx,sy+26);
    ctx.textAlign='right';ctx.fillStyle='#fff';ctx.fillText(S.positive+'% · '+S.mixed+'% · '+S.negative+'%',w-sx,sy+26);
    if(focus){const f=focus.f,a=Math.min(1,(t-focus.t)*3)*Math.max(0,1-(t-focus.t-3.4)*2);if(a>0){ctx.save();ctx.globalAlpha=a*.55;const lg=ctx.createLinearGradient(0,0,0,f.y);lg.addColorStop(0,'#ffffff00');lg.addColorStop(1,'#ffffffaa');ctx.fillStyle=lg;
      ctx.beginPath();ctx.moveTo(focus.sx-6,0);ctx.lineTo(focus.sx+6,0);ctx.lineTo(f.x+14,f.y+6);ctx.lineTo(f.x-14,f.y+6);ctx.fill();const rg=ctx.createRadialGradient(f.x,f.y,0,f.x,f.y,30);rg.addColorStop(0,'#ffffffaa');rg.addColorStop(1,'#fff0');ctx.fillStyle=rg;ctx.fillRect(f.x-30,f.y-30,60,60);ctx.restore()}}
    const wp=((t*.32)%1.6)-.3;
    for(const f of fans){const wave=Math.exp(-Math.pow(f.x/w-wp,2)/.0035);let dy=-wave*9*f.s,dx=0,br=.5+.5*wave;
      if(f.tone==='positive'){const b=Math.abs(Math.sin(t*5.2+f.ph));dy-=b*2.6*f.s;br=Math.max(br,.55+.35*b)}
      else if(f.tone==='mixed')dx=Math.sin(t*1.8+f.ph)*1.3*f.s;
      else{dx=(Math.random()-.5)*1.4*f.s;br=Math.max(br,.45+.55*(Math.sin(t*9+f.ph)>.7))}
      if(focus&&focus.f===f)br=1.6;
      const sz=4.4*f.s,x=f.x+dx,y=f.y+dy,c=f.c;
      ctx.fillStyle=`rgba(${c[0]},${c[1]},${c[2]},${Math.min(1,.25+.6*br)})`;ctx.fillRect(x-sz/2,y,sz,sz*1.25);
      ctx.fillStyle=`rgba(${Math.min(255,c[0]+90)},${Math.min(255,c[1]+90)},${Math.min(255,c[2]+90)},${Math.min(1,.35+.6*br)})`;ctx.fillRect(x-sz*.3,y-sz*.7,sz*.6,sz*.6);
      if(wave>.45||(f.tone==='positive'&&br>.86)){ctx.fillRect(x-sz*.75,y-sz*1.3,1,sz*1.2);ctx.fillRect(x+sz*.75-1,y-sz*1.3,1,sz*1.2)}
      if(f.tone==='negative'&&br>.95)ctx.fillRect(x+sz*.6,y-sz*1.1,1.4,sz)}
    if(Math.random()<.18)flashes.push({x:Math.random()*w,y:top+Math.random()*(h-top),t});
    flashes=flashes.filter(fl=>t-fl.t<.12);for(const fl of flashes){ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(fl.x,fl.y,1.6,0,7);ctx.fill();ctx.fillStyle='#ffffff30';ctx.beginPath();ctx.arc(fl.x,fl.y,6,0,7);ctx.fill()}
    if(Q.length&&t>next&&!still){const q=Q[qi++%Q.length],pool=fans.filter(f=>f.tone===q.tone&&f.r>8&&f.x>30&&f.x<w-30),f=pool[Math.random()*pool.length|0]||fans[fans.length>>1];
      focus={f,t,sx:f.x<w/2?w*.12:w*.88};popup(ov,q,f.x,f.y-18,w,h,3600);next=t+4.1}}
  return{frame,tap(){next=0}}})};

/* ---------- CONSTELLATION: every post a star, grouped by target ---------- */
window.moodStars=function(stage,M){run(stage,(ctx,w,h,st,ov)=>{
  const tapc=mk('div','tap','TAP ›'),card=mk('div','gx-card');ov.append(tapc,card);
  const Q=M.quotes||[],BS=M.bySubject||{},S=M.split,dflt=[S.positive,S.mixed,S.negative];
  const keys=['player','team','manager','board'].filter(k=>BS[k]||Q.some(q=>q.about===k));
  const R=Math.min(w*.36,170),vec=(lon,lat)=>[Math.cos(lat)*Math.sin(lon),Math.sin(lat),Math.cos(lat)*Math.cos(lon)],gauss=()=>(Math.random()+Math.random()+Math.random()-1.5)*.9;
  const CL={};keys.forEach((k,i)=>{CL[k]={v:vec(i/keys.length*6.283,i%2?-.18:.26),mix:(BS[k]||dflt).map(n=>n/100)}});
  const stars=[];
  for(const k of keys){const c=CL[k];for(let i=0;i<38;i++){const r=Math.random(),tone=r<c.mix[0]?'positive':r<c.mix[0]+c.mix[1]?'mixed':'negative';let v=c.v.map(a=>a+gauss()*.42);const L=Math.hypot(...v);stars.push({v:v.map(a=>a/L),k,tone,s:.8+Math.random()*1.2,tw:Math.random()*6})}}
  Q.forEach(q=>{const c=CL[q.about];if(!c)return;let v=c.v.map(a=>a+gauss()*.3);const L=Math.hypot(...v);stars.push({v:v.map(a=>a/L),k:q.about,tone:q.tone,s:3,tw:0,q})});
  const edges=[];stars.forEach((a,i)=>{let best=-1,bd=9;stars.forEach((b,j)=>{if(j===i||b.k!==a.k)return;const d=Math.hypot(a.v[0]-b.v[0],a.v[1]-b.v[1],a.v[2]-b.v[2]);if(d<bd){bd=d;best=j}});if(best>=0&&bd<.32)edges.push([i,best])});
  const dust=Array.from({length:110},()=>({x:Math.random()*w,y:Math.random()*h,p:Math.random()*6}));
  const qs=stars.filter(s=>s.q);let qi=0,next=.6,cur=null,curT=0;
  function proj(v,rot,tilt){const x=v[0]*Math.cos(rot)+v[2]*Math.sin(rot),z0=-v[0]*Math.sin(rot)+v[2]*Math.cos(rot),y=v[1]*Math.cos(tilt)-z0*Math.sin(tilt),z=v[1]*Math.sin(tilt)+z0*Math.cos(tilt),f=1/(1-z*.32);return[w/2+x*R*f,h*.42+y*R*f,z,f]}
  function show(t){if(!qs.length)return;cur=qs[qi++%qs.length];curT=t;card.classList.add('fade');setTimeout(()=>{quoteNode(cur.q,card);card.style.borderColor=(ABOUT[cur.q.about]||'#fff')+'88';card.classList.remove('fade')},250)}
  function frame(t,dt){
    ctx.fillStyle='#030208';ctx.fillRect(0,0,w,h);
    [[TONE.positive,.25,.3,S.positive],[TONE.mixed,.7,.45,S.mixed],[TONE.negative,.45,.65,S.negative]].forEach(([c,x,y,v],i)=>{const gx=w*(x+.05*Math.sin(t*.2+i)),gy=h*(y+.04*Math.cos(t*.17+i)),r=ctx.createRadialGradient(gx,gy,0,gx,gy,w*.2+v*2.6);r.addColorStop(0,c+'2a');r.addColorStop(1,c+'00');ctx.fillStyle=r;ctx.fillRect(0,0,w,h)});
    for(const d of dust){ctx.fillStyle=`rgba(255,255,255,${.15+.25*Math.sin(t*1.5+d.p)**2})`;ctx.fillRect(d.x,d.y,1,1)}
    const rot=t*.16,tilt=.32+.06*Math.sin(t*.13),P=stars.map(s=>proj(s.v,rot,tilt));
    ctx.lineWidth=.8;for(const [a,b] of edges){const pa=P[a],pb=P[b],z=(pa[2]+pb[2])/2;ctx.strokeStyle=ABOUT[stars[a].k]+Math.round(Math.max(.04,.1+.3*(z+1)/2)*255).toString(16).padStart(2,'0');ctx.beginPath();ctx.moveTo(pa[0],pa[1]);ctx.lineTo(pb[0],pb[1]);ctx.stroke()}
    const order=stars.map((s,i)=>i).sort((a,b)=>P[a][2]-P[b][2]);
    for(const i of order){const s=stars[i],p=P[i],dep=(p[2]+1)/2,c=TONE[s.tone];let a=.25+.75*dep;
      if(s.q&&s.q.kind==='claim')a*=.45+.55*(Math.sin(t*17+s.tw)>-.3?1:.2);
      const r=s.s*p[3]*(s.q?1:.9)*(1+.25*Math.sin(t*2+s.tw));
      ctx.globalAlpha=a*.28;ctx.fillStyle=c;ctx.beginPath();ctx.arc(p[0],p[1],r*3.2,0,7);ctx.fill();ctx.globalAlpha=a;ctx.beginPath();ctx.arc(p[0],p[1],r,0,7);ctx.fill();
      if(s.q){ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(p[0],p[1],r*.45,0,7);ctx.fill();
        if(s.q.kind==='insight'){const k=(t*.8+s.tw)%1;ctx.strokeStyle=`rgba(0,240,200,${(1-k)*a})`;ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(p[0],p[1],r+4+k*14,0,7);ctx.stroke()}
        if(s.q.kind==='claim'){ctx.setLineDash([2,3]);ctx.strokeStyle=`rgba(255,42,79,${a})`;ctx.lineWidth=1;ctx.beginPath();ctx.arc(p[0],p[1],r+6,0,7);ctx.stroke();ctx.setLineDash([])}}
      ctx.globalAlpha=1}
    ctx.textAlign='center';ctx.font=`700 10px ${MONO}`;for(const k of keys){const p=proj(CL[k].v,rot,tilt);if(p[2]>-.15){ctx.globalAlpha=Math.min(1,(p[2]+.15)*2);ctx.fillStyle=ABOUT[k];ctx.fillText(LABEL[k].split('').join(' '),p[0],p[1]-R*.42*p[3]);ctx.globalAlpha=1}}
    if(t>next){show(t);next=t+4.6}
    if(cur){const p=proj(cur.v,rot,tilt),cb=card.getBoundingClientRect(),sb=st.getBoundingClientRect(),tx=cb.left-sb.left+cb.width*.5,ty=cb.top-sb.top,k=Math.min(1,(t-curT)*2.5),col=ABOUT[cur.q.about];
      ctx.strokeStyle=col;ctx.lineWidth=1.2;ctx.globalAlpha=.85;ctx.beginPath();ctx.moveTo(p[0],p[1]);const mx=p[0]+(tx-p[0])*k,my=p[1]+(ty-p[1])*k;ctx.lineTo(mx,my);ctx.stroke();
      ctx.beginPath();ctx.arc(p[0],p[1],10+4*Math.sin(t*6),0,7);ctx.stroke();ctx.globalAlpha=1;ctx.fillStyle=col;ctx.beginPath();ctx.arc(mx,my,2.5,0,7);ctx.fill()}}
  return{frame,tap(){next=0}}})};
})();
