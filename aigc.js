(()=>{
 'use strict';
 const root=document.querySelector('.ai-case');if(!root)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const groups=window.AIGC_GROUPS;
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const url=id=>String(id).startsWith("evidence/")?`assets/aigc/${id}`:`assets/aigc/i${String(id).padStart(3,'0')}.webp`;
 const tabs=[...root.querySelectorAll('[data-brand]')],panel=root.querySelector('#ai-series-panel');
 function changeBrand(key,focus=false){
  const g=groups.find(g=>g.key===key);if(!g)return;
  tabs.forEach(t=>{const active=t.dataset.brand===key;t.setAttribute('aria-selected',active);t.tabIndex=active?0:-1;if(active&&focus)t.focus()});
  panel.getAnimations().forEach(a=>a.cancel());
  if(!reduced.matches) panel.animate([{opacity:.35},{opacity:1}],{duration:350,easing:'ease-out'});
  panel.setAttribute('aria-labelledby',`ai-tab-${key}`);
  panel.innerHTML=`<div class="ai-series-copy"><span class="ai-kicker">${escape(g.field)} / SERIES</span><h4>${escape(g.title)}</h4><p>${escape(g.copy)}</p><dl><div><dt>保持统一</dt><dd>${escape(g.fixed)}</dd></div><div><dt>按需变化</dt><dd>${escape(g.variable)}</dd></div></dl></div><div class="ai-series-art ${key==='nowoherb'?'is-portrait':''}">${g.ids.map((id,i)=>`<figure class="ai-art"><button type="button" data-ai-image="${id}" data-caption="${escape(g.names[i])}" aria-label="放大查看：${escape(g.names[i])}"><img src="${url(id)}" alt="${escape(g.names[i])}" decoding="async"><span class="ai-zoom">查看大图 ↗</span></button><figcaption>${escape(g.names[i])}</figcaption></figure>`).join('')}</div>`;
  if(!reduced.matches)panel.querySelectorAll('.ai-series-copy,.ai-art').forEach((el,i)=>el.animate([{opacity:.25,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}],{duration:500,delay:i*65,easing:'cubic-bezier(.16,1,.3,1)'}));
 }
 tabs.forEach((t,i)=>{t.addEventListener('click',()=>changeBrand(t.dataset.brand));t.addEventListener('keydown',e=>{let n=i;if(e.key==='ArrowRight')n=(i+1)%tabs.length;else if(e.key==='ArrowLeft')n=(i-1+tabs.length)%tabs.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=tabs.length-1;else return;e.preventDefault();changeBrand(tabs[n].dataset.brand,true)})});
 const descriptions=['灰色背景呈现产品组合，文字与原料关系直接；作为后续视觉探索的起点。','加入金色光线与场景层次，调整产品位置、标题和卖点区域。','进一步强化底部品牌区域，整理装饰纹样、字号与信息位置，形成更完整的封面。'];
 root.querySelectorAll('[data-version]').forEach(button=>button.addEventListener('click',()=>{const n=Number(button.dataset.version);root.querySelectorAll('[data-version]').forEach(b=>{const on=b===button;b.classList.toggle('is-active',on);b.setAttribute('aria-pressed',on)});root.querySelectorAll('[data-slide]').forEach(s=>{s.hidden=Number(s.dataset.slide)!==n;if(!s.hidden&&!reduced.matches)s.animate([{opacity:.2,transform:'translateX(12px)'},{opacity:1,transform:'translateX(0)'}],{duration:350,easing:'cubic-bezier(.16,1,.3,1)'})});root.querySelector('#ai-version-description').textContent=descriptions[n]}));
 const dialog=document.querySelector('.ai-lightbox'),large=dialog.querySelector('img'),caption=dialog.querySelector('[data-ai-caption]'),status=dialog.querySelector('[data-ai-lightbox-status]');
 let activeList=[],current=0,lastFocus=null,previousOverflow='';
 function display(){const b=activeList[current];status.hidden=true;large.hidden=false;large.src=url(b.dataset.aiImage);large.alt=b.dataset.caption;caption.textContent=`${current+1} / ${activeList.length} — ${b.dataset.caption}`;dialog.querySelector('[data-ai-prev]').disabled=activeList.length<2;dialog.querySelector('[data-ai-next]').disabled=activeList.length<2;}
 large.addEventListener('error',()=>{status.hidden=false;large.hidden=true});
 root.addEventListener('click',e=>{const b=e.target.closest('[data-ai-image]');if(!b)return;lastFocus=b;const group=b.closest('.mk-panel,.wall-grid,.ai-series-art,.ai-contact-print,.ai-process-grid,.ai-more-grid,.ai-version-stage')||root;activeList=[...group.querySelectorAll('[data-ai-image]')].filter(el=>!el.closest('[hidden]'));current=activeList.indexOf(b);display();previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal();if(!reduced.matches)dialog.animate([{opacity:0,transform:'scale(.985)'},{opacity:1,transform:'scale(1)'}],{duration:220,easing:'ease-out'})});
 function advance(n){current=(current+n+activeList.length)%activeList.length;display()}
 dialog.querySelector('[data-ai-prev]').addEventListener('click',()=>advance(-1));dialog.querySelector('[data-ai-next]').addEventListener('click',()=>advance(1));
 dialog.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();advance(1)}if(e.key==='ArrowLeft'){e.preventDefault();advance(-1)}});
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});dialog.addEventListener('close',()=>{document.body.style.overflow=previousOverflow;lastFocus?.focus({preventScroll:true})});
 const chapters=[...root.querySelectorAll('#ai-series,#ai-process,#ai-workflow')];let chapterFrame=0;
 function updateChapter(){chapterFrame=0;let selected=chapters[0];for(const s of chapters)if(s.getBoundingClientRect().top<=innerHeight*.4)selected=s;root.querySelectorAll('.ai-chapters a').forEach(a=>{const active=a.hash==='#'+selected.id;a.classList.toggle('is-current',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')})}
 addEventListener('scroll',()=>{if(!chapterFrame)chapterFrame=requestAnimationFrame(updateChapter)},{passive:true});updateChapter();
 const flowObserver=new IntersectionObserver(entries=>entries.forEach(e=>e.target.classList.toggle('is-reading',e.isIntersecting)),{rootMargin:'-25% 0px -25% 0px'});root.querySelectorAll('.ai-flow-list li').forEach(s=>flowObserver.observe(s));
 const video=document.querySelector('.hero-video');function syncMotion(){if(reduced.matches)video?.pause()}syncMotion();reduced.addEventListener('change',syncMotion);
 window.__aigcProbe={selectBrand:changeBrand,state:()=>({brand:tabs.find(t=>t.getAttribute('aria-selected')==='true')?.dataset.brand,images:panel.querySelectorAll('img').length,version:root.querySelector('[data-version][aria-pressed=true]')?.dataset.version,dialogOpen:dialog.open,reducedMotion:reduced.matches})};
})();
