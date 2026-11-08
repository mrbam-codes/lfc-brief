/* Red Brief opening worlds. Each world draws today's real brief data.
   The page calls startOpening(canvas, brief[, forceIndex]) and gets back the world's name.
   Choice: matchday -> Tunnel, postmatch -> Match Engine, talking -> VAR Room,
   window -> Deal Room, quiet -> Radar, Floodlight or Pixel by date. */
(function(){
const RED='#ff2a4f',TEAL='#00f0c8',AMB='#ffb000',INK='#f4f2ff',DIM='#8a86a6',BG='#05040a';
const TC={1:TEAL,2:AMB,3:RED},HEAT={hot:85,warm:62,cooling:36,done:100,dead:6};
function rnd(s){return()=>(s=Math.imul(s^s>>>15,1|s)+0x6D2B79F5|0,((s^s>>>14)>>>0)/4294967296)}
const up=s=>String(s||'').toUpperCase();
const cut=(c,s,w)=>{s=String(s);if(c.measureText(s).width<=w)return s;while(s.length>1&&c.measureText(s+'…').width>w)s=s.slice(0,-1);return s+'…'};
function countdown(b){const k=b.nextMatch&&Date.parse(b.nextMatch.kickoff);if(!k)return null;return Math.floor((k-Date.now())/1000)}
const pad=n=>String(n).padStart(2,'0');
function cdText(sec,short){if(sec==null)return'NO FIXTURE';if(sec<=0)return sec>-7200?'KICK-OFF NOW':'PLAYED';const d=Math.floor(sec/86400),h=Math.floor(sec%86400/3600),m=Math.floor(sec%3600/60),s=sec%60;
  return short?(d?d+'D ':'')+pad(h)+'H '+pad(m)+'M':(d?d+'D ':'')+pad(h)+':'+pad(m)+':'+pad(s)}
const lfcPos=b=>{const r=((b.table||{}).rows||[]).find(r=>/liverpool/i.test(r.team));return r?r:null};
const ord=n=>n+(n%10==1&&n!=11?'ST':n%10==2&&n!=12?'ND':n%10==3&&n!=13?'RD':'TH');
const heads=b=>[...(b.posters||[]),...(b.stories||[])].map(s=>s.headline);
function fitFont(c,txt,max,w,weight){let z=max;do{c.font=weight+' '+z+'px "Arial Black",Arial,sans-serif';z-=2}while(c.measureText(txt).width>w&&z>12);return z+2}

const WORLDS={
radar:{name:'Tactics Radar',make:(c,w,h,b)=>{const H=heads(b);const p=lfcPos(b);return t=>{c.fillStyle=BG;c.fillRect(0,0,w,h);
  const pw=Math.min(w*.86,h*.5),ph=pw*1.45,px=(w-pw)/2,py=h*.1;
  c.strokeStyle='rgba(0,240,200,.35)';c.lineWidth=1.5;c.strokeRect(px,py,pw,ph);c.beginPath();c.moveTo(px,py+ph/2);c.lineTo(px+pw,py+ph/2);c.stroke();
  c.beginPath();c.arc(px+pw/2,py+ph/2,pw*.15,0,7);c.stroke();c.strokeRect(px+pw*.22,py+ph*.84,pw*.56,ph*.16);c.strokeRect(px+pw*.22,py,pw*.56,ph*.16);
  const cx=px+pw/2,cy=py+ph/2,a=t*.9%(Math.PI*2),R=Math.hypot(pw,ph)/2;
  if(c.createConicGradient){const g=c.createConicGradient(a-.9,cx,cy);g.addColorStop(0,'rgba(0,240,200,0)');g.addColorStop(.14,'rgba(0,240,200,.28)');g.addColorStop(.143,'rgba(0,240,200,0)');c.fillStyle=g;c.save();c.beginPath();c.rect(px,py,pw,ph);c.clip();c.beginPath();c.moveTo(cx,cy);c.arc(cx,cy,R,a-.9,a);c.fill();c.restore()}
  const F=[[.5,.93],[.15,.78],[.38,.8],[.62,.8],[.85,.78],[.25,.64],[.5,.67],[.75,.64],[.18,.52],[.5,.53],[.82,.52]];
  F.forEach((q,i)=>{const x=px+pw*(q[0]+Math.sin(t*.7+i)*.025),y=py+ph*(q[1]-.04+Math.cos(t*.5+i*2)*.02);
    const pa=(Math.atan2(y-cy,x-cx)+Math.PI*2)%(Math.PI*2),d=(a-pa+Math.PI*2)%(Math.PI*2),hot=Math.max(0,1-d/1.2);
    c.fillStyle=RED;c.shadowColor=RED;c.shadowBlur=8+30*hot;c.beginPath();c.arc(x,y,5+5*hot,0,7);c.fill();c.shadowBlur=0;
    if(i%2==0&&hot>.05&&H.length){c.globalAlpha=hot;c.font='bold 12px ui-monospace,Menlo,monospace';c.fillStyle=INK;const s=cut(c,H[(i/2)%H.length],w*.55);c.fillText(s,x>w/2?x-12-c.measureText(s).width:x+12,y+4);c.globalAlpha=1}});
  const y0=py+ph+28;c.font='bold 12px ui-monospace,Menlo,monospace';c.fillStyle=AMB;if(b.nextMatch)c.fillText(cut(c,'NEXT: '+up(b.nextMatch.opp)+' · '+up(b.nextMatch.comp),w*.62),16,y0);
  c.font='900 22px "Arial Black",Arial';c.fillText(cdText(countdown(b)),16,y0+26);
  if(p){c.fillStyle=TEAL;c.font='bold 12px ui-monospace,Menlo,monospace';c.textAlign='right';c.fillText('TABLE: '+ord(p.pos)+' · '+p.pts+' PTS',w-16,y0);c.textAlign='left'}}}},

deal:{name:'Deal Room',make:(c,w,h,b)=>{const T=(b.tracker||[]).slice(0,5);const r=rnd(7);
  const walk=T.map(q=>{let v=HEAT[q.status]||50,a=[];for(let i=0;i<400;i++){v+=(r()-.5)*5;v=Math.max(3,Math.min(99,v*.97+(HEAT[q.status]||50)*.03));a.push(v)}return a});
  const tick=(T.length?T.map(q=>up(q.player)+' '+up(q.status)+' (TIER '+q.tier+', '+up(q.reportedBy[0].outlet)+')').join('  ///  '):'NO LIVE RUMOURS TODAY')+'  ///  '+(b.window?'WINDOW OPEN':'WINDOW CLOSED')+'  ///  ';
  return t=>{c.fillStyle=BG;c.fillRect(0,0,w,h);c.strokeStyle='rgba(255,176,0,.07)';for(let x=0;x<w;x+=24){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke()}for(let y=0;y<h;y+=24){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke()}
  c.fillStyle='rgba(255,42,79,.15)';c.fillRect(0,64,w,26);c.font='bold 13px ui-monospace,Menlo,monospace';c.fillStyle=RED;const tw=c.measureText(tick).width,off=-(t*55%tw);c.fillText(tick,off,82);c.fillText(tick,off+tw,82);
  if(!T.length){c.font='900 28px "Arial Black",Arial';c.fillStyle=DIM;c.fillText('MARKET QUIET',16,h*.35);return}
  const rowH=Math.min(130,(h*.62-100)/T.length);
  T.forEach((q,i)=>{const y0=106+i*rowH,col=TC[q.tier]||DIM;c.fillStyle=col;c.fillRect(16,y0,4,rowH-14);
    c.font='bold 14px ui-monospace,Menlo,monospace';c.fillStyle=INK;c.fillText(cut(c,up(q.player)+' · '+up(q.move),w-120),30,y0+15);
    c.font='11px ui-monospace,Menlo,monospace';c.fillStyle=DIM;c.fillText(cut(c,q.reportedBy.map(x=>x.outlet).join(', '),w-120),30,y0+30);
    c.fillStyle=col;c.fillRect(w-66,y0+2,50,18);c.fillStyle=BG;c.font='bold 11px ui-monospace,Menlo,monospace';c.fillText('TIER '+q.tier,w-62,y0+15);
    const a=walk[i],n=80,s=Math.floor(t*8)%(a.length-n),gx=30,gw=w-gx-90,gy=y0+36,gh=rowH-52;
    if(gh>8){c.beginPath();for(let k=0;k<n;k++){const x=gx+gw*k/(n-1),y=gy+gh*(1-a[s+k]/100);k?c.lineTo(x,y):c.moveTo(x,y)}c.strokeStyle=col;c.lineWidth=2;c.shadowColor=col;c.shadowBlur=10;c.stroke();c.shadowBlur=0}
    c.font='900 15px "Arial Black",Arial';c.fillStyle=col;c.fillText(up(q.status),w-72,gy+Math.max(gh/2,8)+6)})}}},

kop:{name:'Floodlight Mosaic',make:(c,w,h,b)=>{const big=(b.big||{}).value||'YNWA',lab=up((b.big||{}).label);
  const o=document.createElement('canvas');o.width=Math.max(1,Math.round(w));o.height=Math.max(1,Math.round(h));const x=o.getContext('2d');x.fillStyle='#fff';x.textAlign='center';
  const z=fitFont(x,big,Math.min(w*.42,h*.36),w*.9,'900');x.font='900 '+z+'px "Arial Black",Arial';x.fillText(big,w/2,h*.42);
  const d=x.getImageData(0,0,o.width,o.height).data,P=[],r=rnd(3),step=Math.max(4,Math.round(w/110));
  for(let yy=0;yy<o.height;yy+=step)for(let xx=0;xx<o.width;xx+=step)if(d[(yy*o.width+xx)*4]>128)P.push([xx,yy,r()*w,h*.7+r()*h*.3,r()]);
  return t=>{c.fillStyle=BG;c.fillRect(0,0,w,h);c.globalCompositeOperation='lighter';
  [[.08,.06],[.92,.06],[.3,.02],[.7,.02]].forEach((L,i)=>{const lx=w*L[0],ly=h*L[1],ang=Math.PI/2+Math.sin(t*.6+i*1.7)*.55;const g=c.createRadialGradient(lx,ly,0,lx,ly,h*.9);g.addColorStop(0,'rgba(255,220,160,.32)');g.addColorStop(1,'rgba(255,220,160,0)');c.fillStyle=g;c.beginPath();c.moveTo(lx,ly);c.arc(lx,ly,h*.9,ang-.18,ang+.18);c.fill();c.fillStyle='#fff';c.fillRect(lx-8,ly-3,16,6)});
  c.globalCompositeOperation='source-over';const cy=(t%10)/10,k=cy<.12?0:cy<.42?(cy-.12)/.3:cy<.88?1:1-(cy-.88)/.12,e=k*k*(3-2*k);
  P.forEach(p=>{const tw=.5+.5*Math.sin(t*4+p[4]*20);c.fillStyle=p[4]<.12?AMB:RED;c.globalAlpha=.35+.65*(e*.7+.3*tw);c.fillRect(p[2]+(p[0]-p[2])*e,p[3]+(p[1]-p[3])*e,3,3)});c.globalAlpha=1;
  c.font='bold 13px ui-monospace,Menlo,monospace';c.fillStyle=AMB;c.textAlign='center';c.globalAlpha=e;c.fillText(cut(c,lab,w-32),w/2,h*.5);c.globalAlpha=1;c.textAlign='left'}}},

pixel:{name:'Pixel League',make:(c,w,h,b)=>{const o=document.createElement('canvas');o.width=160;o.height=Math.max(90,Math.round(160*h/w));const x=o.getContext('2d'),W2=o.width,H2=o.height;
  const rows=((b.table||{}).rows||[]).slice(0,7),out=(b.injuries||[]).filter(i=>i.status==='out').length;
  return t=>{x.fillStyle='#07051a';x.fillRect(0,0,W2,H2);
  for(let i=0;i<40;i++){const sx=(i*37+t*(4+i%3*3))%W2,sy=(i*53)%(H2*.3);x.fillStyle=i%5?'#3a3560':'#fff';x.fillRect(Math.floor(sx),Math.floor(sy)+4,1,1)}
  x.font='bold 8px monospace';x.fillStyle=TEAL;x.fillText('HI-SCORES',W2/2-22,22);
  rows.forEach((r,i)=>{const us=/liverpool/i.test(r.team),bl=us&&Math.floor(t*3)%2;x.fillStyle=us?(bl?RED:'#fff'):'#b8b4e0';x.fillText(String(r.pos).padStart(2,' ')+' '+up(r.team).replace('MANCHESTER','MAN').padEnd(10,' ').slice(0,10)+String(r.pts).padStart(4,' '),14,34+i*10)});
  const py=Math.floor(H2*.58),ph=H2-py-16;x.fillStyle='#0b3d2e';x.fillRect(10,py,W2-20,ph);x.fillStyle='#1d7a57';x.fillRect(W2/2,py,1,ph);
  for(let i=0;i<5;i++){x.fillStyle=RED;x.fillRect(Math.floor(20+i*22+Math.sin(t*2+i)*4),Math.floor(py+6+((i*13)%(ph-12))),3,4);x.fillStyle='#6cf';x.fillRect(Math.floor(W2-30-i*20+Math.cos(t*2+i)*4),Math.floor(py+8+((i*17)%(ph-14))),3,4)}
  x.fillStyle='#fff';x.fillRect(Math.floor(10+((Math.sin(t*1.3)+1)/2)*(W2-24)),Math.floor(py+((Math.sin(t*2.1)+1)/2)*(ph-4)),2,2);
  x.fillStyle=AMB;x.fillText('OUT',14,H2-5);for(let i=0;i<Math.min(out,8);i++){x.fillStyle=RED;x.fillRect(34+i*7,H2-11,5,5)}if(!out){x.fillStyle=TEAL;x.fillText('NONE',34,H2-5)}
  x.fillStyle=Math.floor(t*2)%2?'#fff':'#07051a';x.fillText('PRESS START',W2-70,H2-5);c.imageSmoothingEnabled=false;c.drawImage(o,0,0,w,h)}}},

engine:{name:'Match Engine',make:(c,w,h,b)=>{const m=b.lastMatch;const r=rnd(11),P=[];for(let i=0;i<22;i++)P.push({hx:i<11?.08+(i%4)*.13+r()*.05:.92-(i%4)*.13-r()*.05,hy:.1+r()*.8,us:i<11});
  const ev=(m.events||[]).map(e=>({m:parseInt(e.min,10)||0,e})).sort((a,z)=>a.m-z.m);let from=0,to=1,start=0,next=0,shots=[];
  const goalFor=e=>(e.type==='og')?(e.side==='lfc'?'opp':'lfc'):e.side;
  return t=>{c.fillStyle=BG;c.fillRect(0,0,w,h);const px=16,py=h*.1,pw=w-32,ph=h*.4;
  c.strokeStyle='rgba(0,240,200,.3)';c.lineWidth=1;c.strokeRect(px,py,pw,ph);c.beginPath();c.moveTo(px+pw/2,py);c.lineTo(px+pw/2,py+ph);c.stroke();c.beginPath();c.arc(px+pw/2,py+ph/2,ph*.16,0,7);c.stroke();
  const att=(Math.sin(t*.25)+1)/2;P.forEach((p,i)=>{p.x=px+pw*(p.hx+(p.us?1:-1)*att*.12+Math.sin(t+i)*.015);p.y=py+ph*(p.hy+Math.cos(t*.8+i)*.03)});
  if(t>next){from=to;let n;do{n=Math.floor(r()*11)+(r()<.75?(P[from].us?0:11):(P[from].us?11:0))}while(n===from);to=n;start=t;next=t+.8+r()*.7;if(r()<.12)shots.push({x:P[from].x,y:P[from].y,us:P[from].us,t})}
  const k=Math.min(1,(t-start)/.6),A=P[from],B=P[to];shots=shots.filter(s=>t-s.t<2.5);
  shots.forEach(s=>{c.strokeStyle=s.us?RED:'#6aa8ff';c.globalAlpha=1-(t-s.t)/2.5;c.lineWidth=2;c.beginPath();c.moveTo(s.x,s.y);c.lineTo(s.us?px+pw:px,py+ph/2);c.stroke();c.globalAlpha=1});
  P.forEach(p=>{c.fillStyle=p.us?RED:'#6aa8ff';c.shadowColor=c.fillStyle;c.shadowBlur=8;c.beginPath();c.arc(p.x,p.y,5,0,7);c.fill()});c.shadowBlur=0;
  c.fillStyle='#fff';c.beginPath();c.arc(A.x+(B.x-A.x)*k,A.y+(B.y-A.y)*k,3.5,0,7);c.fill();
  c.font='10px ui-monospace,Menlo,monospace';c.fillStyle=DIM;c.fillText('ILLUSTRATION: PLAYER DOTS ARE NOT REAL POSITIONS',px,py+ph+14);
  const min=Math.floor((t%22)/22*96);let us=0,th=0;ev.forEach(x=>{if(x.m<=min&&['goal','pen','og'].includes(x.e.type)){goalFor(x.e)==='lfc'?us++:th++}});
  const done=min>=95;if(done){us=m.us;th=m.them}
  const line='LFC '+us+'-'+th+' '+up(m.opp);const z=fitFont(c,line,30,w-90,'900');c.fillStyle=INK;c.fillText(line,16,py+ph+48);
  c.fillStyle=AMB;c.font='bold 14px ui-monospace,Menlo,monospace';c.textAlign='right';c.fillText(done?'FT':min+"'",w-16,py+ph+44);c.textAlign='left';
  ev.filter(x=>x.m<=min||done).slice(-4).forEach((x,i)=>{const e=x.e;c.fillStyle=['goal','pen','og'].includes(e.type)?(goalFor(e)==='lfc'?TEAL:'#6aa8ff'):e.type==='var'?AMB:e.type==='red'?RED:DIM;c.font='bold 12px ui-monospace,Menlo,monospace';c.fillText(cut(c,e.min+"' "+e.text,w-32),16,py+ph+76+i*18)})}}},

tunnel:{name:'Tunnel Walkout',make:(c,w,h,b)=>{const nm=b.nextMatch||{};return t=>{c.fillStyle=BG;c.fillRect(0,0,w,h);const cx=w/2,cy=h*.36;
  for(let i=0;i<18;i++){const z=((i/18)+t*.18)%1,s=Math.pow(z,2.4)*1.6,rw=w*s,rh=h*s*.8;c.strokeStyle=i%3?'rgba(255,42,79,'+z+')':'rgba(0,240,200,'+z+')';c.lineWidth=1+z*3;c.shadowColor=c.strokeStyle;c.shadowBlur=12*z;c.strokeRect(cx-rw/2,cy-rh/2,rw,rh)}c.shadowBlur=0;
  c.strokeStyle='rgba(255,176,0,.25)';for(let i=-5;i<=5;i++){c.beginPath();c.moveTo(cx+i*4,cy+4);c.lineTo(cx+i*w*.25,h);c.stroke()}
  const g=c.createRadialGradient(cx,cy,0,cx,cy,w*.15);g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(cx-w*.15,cy-w*.15,w*.3,w*.3);
  const txt=cdText(countdown(b),true);c.textAlign='center';const z=fitFont(c,txt,Math.min(84,w*.16),w*.9,'900');c.fillStyle=INK;c.shadowColor=RED;c.shadowBlur=24;c.fillText(txt,cx,h*.6);c.shadowBlur=0;
  c.font='bold 13px ui-monospace,Menlo,monospace';c.fillStyle=AMB;c.fillText(cut(c,'KICK-OFF V '+up(nm.opp)+' · '+up(nm.comp),w-32),cx,h*.6-z-6);c.textAlign='left'}}},

var:{name:'VAR Room',make:(c,w,h,b)=>{const tp=(b.talking||[]).find(x=>x.call)||(b.talking||[])[0]||{};return t=>{c.fillStyle='#030306';c.fillRect(0,0,w,h);const fx=16,fy=h*.1,fw=w-32,fh=h*.36;
  c.fillStyle='#0a1612';c.fillRect(fx,fy,fw,fh);c.strokeStyle='rgba(0,240,200,.18)';for(let i=1;i<8;i++){c.beginPath();c.moveTo(fx+fw*i/8,fy);c.lineTo(fx+fw*i/8-30,fy+fh);c.stroke()}
  [[.3,.4,1],[.42,.55,1],[.58,.35,0],[.62,.62,0],[.7,.5,1],[.5,.7,0]].forEach(p=>{c.fillStyle=p[2]?RED:'#6aa8ff';c.beginPath();c.arc(fx+fw*p[0],fy+fh*p[1],7,0,7);c.fill()});
  c.fillStyle='#fff';c.beginPath();c.arc(fx+fw*.66,fy+fh*.58,3,0,7);c.fill();const cyc=t%9,sc=Math.min(1,cyc/3);
  c.strokeStyle=AMB;c.lineWidth=2;c.shadowColor=AMB;c.shadowBlur=10;c.beginPath();c.moveTo(fx+fw*sc,fy);c.lineTo(fx+fw*sc-30,fy+fh);c.stroke();
  if(cyc>3){c.strokeStyle=TEAL;c.beginPath();c.moveTo(fx+fw*.62,fy);c.lineTo(fx+fw*.62-30,fy+fh);c.stroke();c.strokeStyle=RED;c.beginPath();c.moveTo(fx+fw*.7,fy);c.lineTo(fx+fw*.7-30,fy+fh);c.stroke()}c.shadowBlur=0;
  c.font='bold 12px ui-monospace,Menlo,monospace';c.fillStyle=Math.floor(t*2)%2?RED:'#600';c.fillText('● REVIEW',fx+8,fy+18);c.fillStyle=DIM;c.font='10px ui-monospace,Menlo,monospace';c.fillText('ILLUSTRATION',fx+fw-84,fy+fh-8);
  const y=fy+fh+30;c.font='bold 13px ui-monospace,Menlo,monospace';c.fillStyle=INK;c.fillText(cut(c,up(tp.headline||'TALKING POINT'),w-32),16,y);
  c.fillStyle=DIM;c.fillText(cyc<6?'CHECKING...':'CHECK COMPLETE',16,y+20);
  if(cyc>6&&tp.call){const s=Math.min(1,(cyc-6)*3);c.save();c.translate(w/2,y+64);c.rotate(-.08);c.scale(2-s,2-s);c.globalAlpha=s;c.textAlign='center';const z=fitFont(c,up(tp.call),26,w*.7,'900');const tw=c.measureText(up(tp.call)).width;c.strokeStyle=AMB;c.lineWidth=3;c.strokeRect(-tw/2-14,-z,tw+28,z*1.5);c.fillStyle=AMB;c.fillText(up(tp.call),0,z*.35);c.restore();c.globalAlpha=1;c.textAlign='left'}}}}
};
const QUIET=['radar','kop','pixel'],ORDER=['radar','deal','kop','pixel','engine','tunnel','var'];
function pick(b){const dt=b.dayType;
  if(dt==='matchday'&&b.nextMatch)return'tunnel';if(dt==='postmatch'&&b.lastMatch)return'engine';
  if(dt==='talking'&&(b.talking||[]).length)return'var';if(dt==='window')return'deal';
  const[y,m,d]=b.date.split('-').map(Number);const n=Math.round(Date.UTC(y,m-1,d)/864e5);return QUIET[n%QUIET.length]}
let stop=null;
window.OPENINGS=ORDER.map(k=>WORLDS[k].name);
window.startOpening=function(cv,b,force){
  if(stop)stop();let key=force==null?pick(b):ORDER[force];
  if(key==='engine'&&!b.lastMatch)key='radar';if(key==='tunnel'&&!b.nextMatch)key='kop';
  const W=WORLDS[key],still=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const r=cv.getBoundingClientRect(),w=r.width||375,h=r.height||700,d=Math.min(devicePixelRatio||1,2);
  cv.width=Math.round(w*d);cv.height=Math.round(h*d);const c=cv.getContext('2d');c.setTransform(d,0,0,d,0,0);
  const f=W.make(c,w,h,b);let t=still?7:2,raf=0,on=true,last=performance.now();f(t);
  if(!still){const loop=n=>{const dt=Math.min((n-last)/1000,.05);last=n;if(on){t+=dt;f(t)}raf=requestAnimationFrame(loop)};raf=requestAnimationFrame(loop)}
  const io=new IntersectionObserver(e=>{on=e[0].isIntersecting;last=performance.now()},{threshold:.05});io.observe(cv);
  stop=()=>{cancelAnimationFrame(raf);io.disconnect()};cv.setAttribute('data-opening',key);return W.name};
})();
