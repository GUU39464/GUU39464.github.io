(() => {
 'use strict';
 // Keep a single router across visits. Fetch starts before the curtain moves,
 // while the compositor animates one persistent transform-only surface.
 if (!window.portfolioRouter) {
  const cache=new Map();let busy=false;let currentPath=location.pathname;
  const forceStatic=new URLSearchParams(location.search).get('motion')==='off';
  function page(url){const key=url.pathname; if(!cache.has(key))cache.set(key,fetch(key,{credentials:'same-origin'}).then(r=>{if(!r.ok)throw Error('Page unavailable');return r.text()}).catch(e=>{cache.delete(key);throw e}));return cache.get(key)}
  function eligible(a){if(!a||a.target||a.hasAttribute('download'))return null;const u=new URL(a.href);if(forceStatic)u.searchParams.set('motion','off');return u.origin===location.origin&&/^https?:$/.test(u.protocol)&&! /\.[a-z0-9]{2,5}$/i.test(u.pathname)?u:null}
  function preload(e){const a=e.target.closest('a'),u=eligible(a);if(u&&u.pathname!==location.pathname)page(u).catch(()=>{})}
  document.addEventListener('pointerover',preload,{passive:true});document.addEventListener('focusin',preload);
  async function navigate(url,label,pop=false){
   if(busy)return;busy=true;
   const reduced=document.documentElement.dataset.motion==='reduced';
   const curtain=document.querySelector('.page-curtain');
   const started=performance.now();let covered,trace=true,lastFrame=started;const gaps=[];
   function sample(now){if(!trace)return;gaps.push(now-lastFrame);lastFrame=now;requestAnimationFrame(sample)}requestAnimationFrame(sample);
   try{
    const messages={
     '/':['余佳灵','品牌营销 · 海外社媒 · AI 视觉创作'],
     '/work/shokz-black-friday/':['韶音黑五','在品牌规范下，把促销信息转化为系列视觉'],
     '/work/ai-commercial/':['AI 商业视觉','用品牌约束与制作流程，保持多客户视觉一致性'],
     '/work/nova/':['NOVA','用图形与版式规则，延续不同触点的品牌识别'],
     '/work/shokz-everyday/':['日常营销广告','把产品卖点，转化为清晰的广告信息']
    };
    const info=messages[url.pathname]||[label||'余佳灵','品牌视觉与创意实践'];
    const pending=page(url);curtain.querySelector('span').textContent=info[0];curtain.querySelector('.curtain-note').textContent=info[1];curtain.classList.add('transitioning');
    if(!reduced)covered=curtain.animate([{transform:'translateY(110%)'},{transform:'translateY(0)'}],{duration:340,easing:'cubic-bezier(.65,0,.25,1)',fill:'forwards'});
    const [html]=await Promise.all([pending,covered?.finished]);
    const doc=new DOMParser().parseFromString(html,'text/html');
    const oldHead=document.head;
    for(const link of doc.querySelectorAll('link[rel="stylesheet"]'))if(!oldHead.querySelector(`link[href="${link.getAttribute('href')}"]`))oldHead.append(link.cloneNode(true));
    window.__siteDispose?.();window.__revisionDispose?.();window.__novaDispose?.();
    const savedCurtain=curtain;document.body.replaceChildren(...[...doc.body.childNodes].filter(n=>!(n.nodeType===1&&n.matches('.page-curtain'))));
    document.body.append(savedCurtain);document.body.className=doc.body.className;document.body.id='top';document.title=doc.title;
    const canonical=document.querySelector('link[rel="canonical"]');if(canonical)canonical.href=url.origin+url.pathname;
    currentPath=url.pathname;if(!pop)history.pushState({portfolio:true},'',url.href);
    document.documentElement.dataset.motion=(matchMedia('(prefers-reduced-motion: reduce)').matches||url.searchParams.get('motion')==='off')?'reduced':'full';
    scrollTo({top:0,behavior:'instant'});
    await runScript(doc.querySelector('script[src^="/site.js"]').getAttribute('src'));
    if(url.pathname==='/work/nova/')await runScript('/nova-original/nova-original.js');
    initPage();
    if(url.hash)document.querySelector(url.hash)?.scrollIntoView({behavior:'instant'});
    if(!reduced){const reveal=curtain.animate([{transform:'translateY(0)'},{transform:'translateY(-118%)'}],{duration:490,easing:'cubic-bezier(.65,0,.25,1)',fill:'forwards'});await reveal.finished;reveal.cancel()}
    covered?.cancel();curtain.classList.remove('transitioning');
    document.body.dataset.transitionMs=String(Math.round(performance.now()-started));
    document.body.dataset.transitionMaxFrame=String(Math.round(Math.max(0,...gaps)));
    const heading=document.querySelector('h1');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true})}
   }catch(e){location.assign(url.href)}finally{trace=false;busy=false}
  }
  function runScript(src){return new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=src;el.onload=()=>{el.remove();resolve()};el.onerror=reject;document.body.append(el)})}
  document.addEventListener('click',e=>{if(e.button||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;const a=e.target.closest('a'),u=eligible(a);if(!u||u.pathname===location.pathname)return;e.preventDefault();navigate(u,a.dataset.pageTitle||a.textContent.trim().slice(0,30))});
  addEventListener('popstate',()=>{if(location.pathname!==currentPath)navigate(new URL(location.href),'余佳灵 · 作品集',true)});
  addEventListener('message',e=>{if(e.origin!==location.origin||e.data?.type!=='portfolio-anchor')return;const u=new URL(e.data.href,location.origin);if(forceStatic)u.searchParams.set('motion','off');if(u.pathname===location.pathname){document.querySelector(u.hash)?.scrollIntoView({behavior:document.documentElement.dataset.motion==='reduced'?'instant':'smooth'});history.replaceState({},'',u.href)}else navigate(u,'余佳灵 · 作品集')});
  window.portfolioRouter={navigate,cache};
 }
 function mountScrollRhythm(signal,clean,isAlive){
  const clamp=v=>Math.max(0,Math.min(1,v));
  const headings=[...document.querySelectorAll('.work-title h2,.section-heading h2,.case-intro h2,.about-copy h2')].map(el=>{
   el.classList.add('scroll-ink');const rgb=(getComputedStyle(el).color.match(/[\d.]+/g)||['8','9','10']).slice(0,3).map(Number);return{el,rgb,shift:0};
  });
  const lines=[...document.querySelectorAll('.reading-ink')].map(el=>({el,shift:0}));
  const index=document.querySelector('.project-index'),rows=[...document.querySelectorAll('.project-row')];
  const footer=document.querySelector('.contact'),footerHeading=footer?.querySelector('.contact-main h2');
  let frame=0,lastY=scrollY,hovered=null,focused=null,current=null;
  const reduced=()=>document.documentElement.dataset.motion==='reduced';
  function update(){
   frame=0;if(!isAlive())return;const h=innerHeight,quiet=reduced();
   const measures=headings.map(x=>({...x,top:x.el.getBoundingClientRect().top-x.shift}));
   const lineMeasures=lines.map(x=>({...x,top:x.el.getBoundingClientRect().top-x.shift}));
   const candidates=rows.filter(e=>!e.hidden).map(el=>({el,box:el.getBoundingClientRect()}));
   const footerBox=footer?.getBoundingClientRect();
   document.body.dataset.scrollDirection=scrollY>=lastY?'down':'up';lastY=scrollY;
   measures.forEach((m,i)=>{
    const p=quiet?1:clamp((h*.92-m.top)/(h*.33));const eased=1-Math.pow(1-p,2);
    const shift=(1-eased)*12;headings[i].shift=shift;m.el.style.transform=`translate3d(0,${shift.toFixed(2)}px,0)`;
    const light=m.rgb.reduce((a,b)=>a+b,0)/3>170;const muted=light?[150,143,160]:[133,136,147];const mix=.16+.84*eased;
    m.el.style.color=`rgb(${m.rgb.map((c,j)=>Math.round(muted[j]+(c-muted[j])*mix)).join(',')})`;m.el.dataset.readProgress=p.toFixed(2);
   });
   lineMeasures.forEach((m,i)=>{const p=quiet?1:clamp((h*.91-m.top)/(h*.32));const shift=(1-p)*18;lines[i].shift=shift;m.el.style.transform=`translate3d(0,${shift.toFixed(2)}px,0)`;m.el.style.opacity=String(.62+.38*p);m.el.dataset.readProgress=p.toFixed(2)});
   if(index){
    const visible=candidates.filter(x=>x.box.bottom>h*.12&&x.box.top<h*.92);
    const closest=visible.sort((a,b)=>Math.abs(a.box.top+a.box.height*.5-h*.52)-Math.abs(b.box.top+b.box.height*.5-h*.52))[0]?.el;
    const onScreen=el=>el&&visible.some(v=>v.el===el);
    const next=quiet?null:(onScreen(focused)?focused:onScreen(hovered)?hovered:closest);
    index.classList.toggle('has-reading-focus',!!next);if(next!==current){rows.forEach(el=>el.classList.toggle('is-reading',el===next));current=next;index.dataset.readingProject=next?.querySelector('h3')?.textContent||''}
   }
   if(footer&&footerBox){const p=quiet?1:clamp((h-footerBox.top)/(h*.9));footer.style.setProperty('--wave-scale',quiet?'1':String(Math.max(.04,1-p)));footer.dataset.revealProgress=p.toFixed(2);if(footerHeading)footerHeading.style.transform=`translate3d(0,${quiet?0:(1-p)*28}px,0)`;}
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(update)}
  window.addEventListener('scroll',schedule,{passive:true,signal});window.addEventListener('resize',schedule,{passive:true,signal});
  document.addEventListener('click',e=>{if(e.target.closest('[data-filter],[data-view]'))schedule()},{signal});
  if(index){index.addEventListener('pointerover',e=>{hovered=e.target.closest('.project-row');schedule()},{signal});index.addEventListener('pointerleave',()=>{hovered=null;schedule()},{signal});index.addEventListener('focusin',e=>{focused=e.target.closest('.project-row');schedule()},{signal});index.addEventListener('focusout',e=>{focused=e.relatedTarget?.closest('.project-row')||null;schedule()},{signal});}
  const mode=new MutationObserver(schedule);mode.observe(document.documentElement,{attributes:true,attributeFilter:['data-motion']});clean.push(()=>{cancelAnimationFrame(frame);mode.disconnect()});update();
 }
 function mountToolParticles(signal,clean,isAlive){
  const section=document.querySelector('.tools-section'),canvas=section?.querySelector('.tools-particles');if(!canvas)return;
  const ctx=canvas.getContext('2d');if(!ctx)return;
  let width=0,height=0,scale=1,ox=0,oy=0,dpr=1,time=0,last=performance.now(),frameId=0,visible=false;
  const pointer={x:-9999,y:-9999,active:false};const offsets=new Float32Array(3850*4);
  const reduced=()=>document.documentElement.dataset.motion==='reduced';
  function field(x,y,t){const a=x*.0041+y*.0038-t*.43,b=x*.0027-y*.0052+t*.24,h=Math.sin(a)+.48*Math.sin(b),ridge=Math.pow((Math.sin(a+Math.sin(b)*.5)+1)/2,4),m=(Math.sin(a*.61+b*.23-t*.17)+1)/2,green=Math.pow(m,4),purple=Math.pow(1-m,3);return{h,ridge,r:125+green*73+purple*25,g:110+green*145-purple*38,b:160-green*145+purple*95,saturation:Math.max(green,purple)}}
  const mist=document.createElement('canvas');mist.width=96;mist.height=54;const mc=mist.getContext('2d'),pixels=mc.createImageData(96,54);
  function paint(dt=0){
   const start=performance.now();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);ctx.translate(ox,oy);ctx.scale(scale,scale);
   for(let y=0;y<54;y++)for(let x=0;x<96;x++){const f=field(x/95*1680,y/53*945,time),i=(y*96+x)*4;pixels.data[i]=f.r;pixels.data[i+1]=f.g;pixels.data[i+2]=f.b;pixels.data[i+3]=255*(.02+f.ridge*.14)*(.45+.55*f.saturation)}mc.putImageData(pixels,0,0);ctx.drawImage(mist,0,0,1680,945);
   let maxMove=0;
   for(let row=-3;row<47;row++)for(let col=-2;col<75;col++){
    let x=col*23.5,y=row*23;const f=field(x,y,time);x+=Math.sin(y*.004-time*.23)*7;y+=f.h*25;
    const i=((row+3)*77+col+2)*4;let tx=0,ty=0;
    if(pointer.active&&!reduced()){let dx=x-pointer.x,dy=y-pointer.y,d=Math.hypot(dx,dy);if(d<190){if(d<.5){dx=1;dy=0;d=1}const force=Math.pow(1-d/190,2)*82;tx=dx/d*force;ty=dy/d*force}}
    if(dt){const steps=Math.max(1,Math.ceil(dt*120)),h=dt/steps;for(let n=0;n<steps;n++){offsets[i+2]+=((tx-offsets[i])*64-offsets[i+2]*12.5)*h;offsets[i+3]+=((ty-offsets[i+1])*64-offsets[i+3]*12.5)*h;offsets[i]+=offsets[i+2]*h;offsets[i+1]+=offsets[i+3]*h}}
    maxMove=Math.max(maxMove,Math.hypot(offsets[i],offsets[i+1]));x+=offsets[i];y+=offsets[i+1];
    ctx.fillStyle=`rgba(${Math.round(f.r)},${Math.round(f.g)},${Math.round(f.b)},${.13+f.ridge*.40})`;ctx.beginPath();ctx.arc(x,y,1.05+(f.h+1.48)*.23+f.ridge*.35,0,Math.PI*2);ctx.fill();
   }
   canvas.dataset.motionTime=time.toFixed(2);canvas.dataset.pointerActive=String(pointer.active);canvas.dataset.displacement=maxMove.toFixed(1);canvas.dataset.paintMs=(performance.now()-start).toFixed(1);
  }
  function tick(now){frameId=0;if(!isAlive()||!visible||document.hidden)return;const dt=Math.min((now-last)/1000,.035);last=now;if(!reduced())time+=dt;paint(reduced()?0:dt);if(!reduced())frameId=requestAnimationFrame(tick)}
  function start(){last=performance.now();if(!frameId&&visible&&!document.hidden)frameId=requestAnimationFrame(tick)}
  function resize(){const box=section.getBoundingClientRect();width=box.width;height=box.height;dpr=Math.min(devicePixelRatio,1.4);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);scale=Math.max(width/1680,height/945);ox=(width-1680*scale)/2;oy=(height-945*scale)/2;paint();start()}
  function move(e){const box=section.getBoundingClientRect();pointer.x=(e.clientX-box.left-ox)/scale;pointer.y=(e.clientY-box.top-oy)/scale;pointer.active=true}
  section.addEventListener('pointermove',move,{passive:true,signal});section.addEventListener('pointerdown',move,{passive:true,signal});section.addEventListener('pointerleave',()=>pointer.active=false,{signal});section.addEventListener('pointercancel',()=>pointer.active=false,{signal});
  document.addEventListener('visibilitychange',start,{signal});
  const ro=new ResizeObserver(resize);ro.observe(section);const io=new IntersectionObserver(es=>{visible=es[0].isIntersecting;if(visible)start()});io.observe(section);
  const mo=new MutationObserver(()=>{if(reduced())offsets.fill(0);paint();start()});mo.observe(document.documentElement,{attributes:true,attributeFilter:['data-motion']});
  clean.push(()=>{cancelAnimationFrame(frameId);ro.disconnect();io.disconnect();mo.disconnect()});resize();
 }
 function mountDesktopWork(signal,clean,isAlive){
  const index=document.querySelector('.project-index');if(!index)return;
  const media=matchMedia('(min-width:761px)'),fine=matchMedia('(hover:hover) and (pointer:fine)');
  const preview=document.createElement('div');preview.className='desktop-work-preview';preview.setAttribute('aria-hidden','true');
  preview.innerHTML='<div class="desktop-preview-stage"><img alt=""><span class="desktop-preview-label">查看 ↗</span></div>';document.body.append(preview);
  const image=preview.querySelector('img');let active=null,frame=0,x=0,y=0,tx=0,ty=0,last=0;
  function hide(){preview.classList.remove('visible');index.classList.remove('desktop-has-preview');document.body.classList.remove('desktop-project-hover');active?.classList.remove('desktop-preview-active');active=null;cancelAnimationFrame(frame);frame=0;}
  function tick(now){frame=0;if(!active||!isAlive())return;const dt=Math.min((now-last)/1000,.05);last=now;const k=1-Math.exp(-18*dt);x+=(tx-x)*k;y+=(ty-y)*k;preview.style.transform=`translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0)`;if(Math.abs(tx-x)+Math.abs(ty-y)>.15)frame=requestAnimationFrame(tick);}
  function position(cx,cy,immediate=false){const w=preview.getBoundingClientRect().width;tx=Math.max(12,Math.min(innerWidth-w-12,cx-w/2));ty=Math.max(12,Math.min(innerHeight-w-12,cy-w/2));if(immediate){x=tx;y=ty;preview.style.transform=`translate3d(${x}px,${y}px,0)`;}else if(!frame){last=performance.now();frame=requestAnimationFrame(tick);}}
  function show(row,cx,cy){if(!media.matches||!row||row.hidden)return hide();const fresh=!active;if(active!==row){active?.classList.remove('desktop-preview-active');active=row;row.classList.add('desktop-preview-active');const source=row.querySelector('.deck-card[data-front=true] img,.nova-preview>img')||row.querySelector('img');if(!source)return hide();image.src=source.getAttribute('src');index.classList.add('desktop-has-preview');document.body.classList.add('desktop-project-hover');}position(cx,cy,fresh||document.documentElement.dataset.motion==='reduced');preview.classList.add('visible');}
  index.addEventListener('pointermove',e=>{if(!fine.matches||e.pointerType==='touch')return;const row=e.target.closest('.project-row');if(document.documentElement.dataset.motion==='reduced'&&row){const box=row.getBoundingClientRect();show(row,innerWidth*.66,box.top+box.height/2);}else show(row,e.clientX,e.clientY);},{passive:true,signal});
  index.addEventListener('pointerleave',hide,{signal});
  index.addEventListener('focusin',e=>{if(!e.target.matches(':focus-visible'))return;const row=e.target.closest('.project-row');if(row){const b=row.getBoundingClientRect();show(row,innerWidth*.66,b.top+b.height/2);}},{signal});
  index.addEventListener('focusout',hide,{signal});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')hide();},{signal});
  document.addEventListener('click',e=>{if(e.target.closest('[data-filter]'))hide();},{signal});
  window.addEventListener('scroll',()=>{if(active?.contains(document.activeElement)&&document.activeElement.matches(':focus-visible')){const b=active.getBoundingClientRect();position(innerWidth*.66,b.top+b.height/2,true);}else hide();},{passive:true,signal});window.addEventListener('resize',hide,{signal});media.addEventListener('change',hide,{signal});
  clean.push(()=>{hide();preview.remove();});
 }
 function initPage(){
  const signalController=new AbortController(),{signal}=signalController;let alive=true;const clean=[];
  window.__revisionDispose=()=>{alive=false;signalController.abort();clean.forEach(f=>f())};
  if(document.documentElement.dataset.motion==='reduced')document.querySelectorAll('.nova-preview img').forEach(im=>im.src='/nova-original/assets/nova-home-motion-still.svg');
  const hero=document.querySelector('#hero-frame');
  if(hero){
   if(document.documentElement.dataset.motion==='reduced')hero.src='/hero/?motion=off';
   const observer=new IntersectionObserver(entries=>{hero.contentWindow?.postMessage({type:'hero-visibility',visible:entries[0].isIntersecting},location.origin)});observer.observe(hero);clean.push(()=>observer.disconnect());
  }
  // Native horizontal scrolling stays available even if script/autoplay is blocked.
  const reduced=()=>document.documentElement.dataset.motion==='reduced';
  const videoStates=new Map();
  function updateVideo(v,visible){v.muted=true;v.defaultMuted=true;v.removeAttribute('controls');if(visible&&!reduced()&&!document.hidden){v.preload='auto';v.play().then(()=>v.dataset.playback='playing').catch(()=>v.dataset.playback='blocked')}else{v.pause();v.dataset.playback='paused'}}
  const mediaObserver=new IntersectionObserver(entries=>entries.forEach(e=>{videoStates.set(e.target,e.isIntersecting);updateVideo(e.target,e.isIntersecting)}),{threshold:.08});
  document.querySelectorAll('.video-wall video').forEach(v=>{v.muted=true;v.defaultMuted=true;mediaObserver.observe(v)});clean.push(()=>{mediaObserver.disconnect();videoStates.forEach((_,v)=>v.pause())});
  document.addEventListener('visibilitychange',()=>videoStates.forEach((visible,v)=>updateVideo(v,visible)),{signal});
  const modeWatcher=new MutationObserver(()=>videoStates.forEach((visible,v)=>updateVideo(v,visible)));modeWatcher.observe(document.documentElement,{attributes:true,attributeFilter:['data-motion']});clean.push(()=>modeWatcher.disconnect());
  document.querySelectorAll('.video-wall').forEach(wall=>{
   let drag=null;
   wall.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button)return;drag={x:e.clientX,scroll:wall.scrollLeft};wall.setPointerCapture(e.pointerId);wall.style.scrollSnapType='none'},{signal});
   wall.addEventListener('pointermove',e=>{if(drag)wall.scrollLeft=drag.scroll+drag.x-e.clientX},{signal});
   function release(){drag=null;wall.style.scrollSnapType=''}
   wall.addEventListener('pointerup',release,{signal});wall.addEventListener('pointercancel',release,{signal});
   wall.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();wall.scrollBy({left:(e.key==='ArrowRight'?1:-1)*wall.clientWidth*.72,behavior:reduced()?'instant':'smooth'})}},{signal});
   wall.addEventListener('click',()=>{videoStates.forEach((visible,v)=>updateVideo(v,visible))},{signal});
  });
  mountDesktopWork(signal,clean,()=>alive);
  mountToolParticles(signal,clean,()=>alive);
  mountScrollRhythm(signal,clean,()=>alive);
  if(matchMedia('(pointer:fine) and (hover:hover)').matches&&document.documentElement.dataset.motion!=='reduced'){
   const cursor=document.createElement('div');cursor.className='cursor-orb';cursor.setAttribute('aria-hidden','true');document.body.append(cursor);clean.push(()=>cursor.remove());
   let x=-100,y=-100,tx=-100,ty=-100,last=performance.now();
   document.addEventListener('pointermove',e=>{tx=e.clientX;ty=e.clientY;const drag=e.target.closest('.ribbon-stage');const link=e.target.closest('.deck-card,.nova-preview,.project-title-link,.next-case>a');cursor.textContent=drag?'拖动':link?'查看 ↗':'';cursor.classList.toggle('visible',!!(drag||link))},{passive:true,signal});
   document.addEventListener('pointerleave',()=>cursor.classList.remove('visible'),{signal});
   function frame(now){if(!alive)return;const dt=Math.min((now-last)/1000,.05);last=now;const a=1-Math.exp(-22*dt);x+=(tx-x)*a;y+=(ty-y)*a;cursor.style.transform=`translate3d(${x-37}px,${y-37}px,0)`;requestAnimationFrame(frame)}requestAnimationFrame(frame);
  }
 }
 initPage();
})();
