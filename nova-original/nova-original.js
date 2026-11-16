(()=>{'use strict';
window.__novaDispose?.();
const captions=['以需求、品牌资料和渠道为输入，组织可延展的传播内容。','用 Seed、Build、Matrix 建立共同的图形语言，并统一字体、色彩与网格。','品牌识别由同一套标志与组合规则延展，保持不同触点之间的关联。','通过重复的图形结构建立识别，同时允许主题与版面变化。','三种主视觉沿用共同规则，用不同构图表达不同主题。','将主视觉发展为系列海报，观察标题、图形与信息区的连续性。','针对不同尺寸重排信息，保留核心图形与品牌识别。','将视觉语言延伸至数字工作空间；此部分为概念应用。'];
const dialog=document.createElement('dialog');dialog.className='nova-detail-dialog';dialog.setAttribute('aria-label','NOVA 设计细节');dialog.innerHTML='<form method="dialog"><button>关闭大图 ×</button></form><div class="nova-detail-scroll"><img alt=""></div>';document.body.append(dialog);let source;document.querySelectorAll('.nova-frame').forEach((frame,i)=>{if(frame.querySelector('.nova-zoom'))return;const im=frame.querySelector('img');const button=document.createElement('button');button.type='button';button.className='nova-zoom';button.setAttribute('aria-label','放大查看：'+im.alt);im.before(button);button.append(im);const hint=document.createElement('span');hint.textContent='放大查看设计细节 ↗';button.append(hint);const caption=document.createElement('figcaption');caption.dataset.novaCaption='';caption.textContent=captions[i]||im.alt;frame.append(caption);button.addEventListener('click',()=>{source=button;dialog.querySelector('img').src=im.src;dialog.querySelector('img').alt=im.alt;dialog.showModal()})});dialog.addEventListener('close',()=>source?.isConnected&&source.focus({preventScroll:true}));dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
const motion=matchMedia('(prefers-reduced-motion: reduce)');
const reveal=new IntersectionObserver((entries,observer)=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}})},{threshold:.12,rootMargin:'0px 0px -50px'});
const isReduced=()=>motion.matches||document.documentElement.dataset.motion==='reduced'||new URL(location.href).searchParams.get('motion')==='off';
function syncMotion(){
  const reduced=isReduced();
  document.querySelectorAll('.nova-reveal').forEach(item=>{if(reduced){item.classList.add('is-visible');reveal.unobserve(item)}else if(!item.classList.contains('is-visible'))reveal.observe(item)});
  document.querySelectorAll('.nova-original-cover img,.nova-motion-stage>img,.nova-motion-insert object').forEach(media=>{
    const attr=media.tagName==='OBJECT'?'data':'src';
    const original=media.dataset.novaMotionSource||(media.dataset.novaMotionSource=media.getAttribute(attr));
    if(!original?.endsWith('.svg'))return;
    media.setAttribute(attr,reduced?original.replace(/\.svg$/,'-still.svg'):original);
  });
}
syncMotion();
motion.addEventListener('change',syncMotion);
const modeObserver=new MutationObserver(syncMotion);
modeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-motion']});
window.__novaDispose=()=>{
  reveal.disconnect();modeObserver.disconnect();motion.removeEventListener('change',syncMotion);
  source=null;if(dialog.open)dialog.close();dialog.remove();
  document.querySelectorAll('.nova-zoom').forEach(button=>{const image=button.querySelector('img');if(image)button.replaceWith(image)});
  document.querySelectorAll('[data-nova-caption]').forEach(caption=>caption.remove());
  window.__novaDispose=null;
};
})();
