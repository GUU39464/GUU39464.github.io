(()=>{
 'use strict';
 const article=document.querySelector('.aigc-project'),toggle=article.querySelector('.aigc-toggle'),root=article.querySelector('.ai-case'),wall=root.querySelector('.sticky-wall'),stage=wall.querySelector('.wall-stage'),grid=wall.querySelector('.wall-grid'),tiles=[...grid.children],center=wall.querySelector('.wall-center'),details=root.querySelector('#aigc-details'),mode=root.querySelector('[data-wall-mode]'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let frame=0,flat=reduced.matches,geometry=null;
 const clamp=x=>Math.max(0,Math.min(1,x));const ease=x=>x*x*(3-2*x);
 function measure(){if(root.hidden)return;const columns=innerWidth<=700?3:5;const tile=tiles[0].offsetWidth,gap=innerWidth<=700?8:14;geometry={columns,tile,gap,rows:Math.ceil(tiles.length/columns),height:stage.clientHeight,width:stage.clientWidth};update()}
 function update(){frame=0;if(root.hidden||flat||!geometry)return;const r=wall.getBoundingClientRect(),g=geometry;const p=clamp((parseFloat(getComputedStyle(stage).top)-r.top)/(wall.offsetHeight-g.height));if(r.bottom<0||r.top>innerHeight)return;
 const entry=ease(clamp(p/.12)),travel=clamp((p-.12)/.60),spread=ease(clamp((p-.72)/.24));
 const distance=Math.max(0,g.rows*(g.tile+g.gap)-g.height+90);const offset=55-distance*travel;
 const middle=(g.columns-1)/2;
 tiles.forEach((t,i)=>{const col=i%g.columns,row=Math.floor(i/g.columns);const entering=(col%2?1:-1)*(1-entry)*(g.height+g.tile);let y=offset+entering;let x=0;
 if(col===middle){const screenY=row*(g.tile+g.gap)+offset;y+=spread*(screenY<g.height/2?-g.height:g.height)}else{x=(col<middle?-1:1)*spread*g.width*(g.columns===3?.13:.25)}
 t.style.transform=`translate3d(${x}px,${y}px,0) scale(${1+spread*.12})`;
 });
 const reveal=clamp((spread-.35)/.5);center.style.opacity=reveal;center.style.visibility=reveal>.05?'visible':'hidden';center.inert=reveal<.8;wall.style.setProperty('--wall-progress',`${p*100}%`);wall.querySelector('.wall-hint').textContent=p>.85?'点击标题，查看创作过程 ↗':'向下滚动，展开作品墙 ↓';
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(update)}
 function setFlat(value){flat=value;wall.classList.toggle('is-flat',flat);mode.setAttribute('aria-pressed',String(flat));mode.textContent=flat?'返回滚动展示':'平铺查看 70 张';center.inert=false;measure()}
 function openCase(){root.hidden=false;grid.querySelectorAll('img').forEach(im=>im.loading='eager');article.classList.add('is-open');toggle.setAttribute('aria-expanded','true');toggle.querySelector('.project-open').textContent='CASE OPEN ↓';measure();root.scrollIntoView({behavior:reduced.matches?'auto':'smooth',block:'start'})}
 function closeCase(){root.hidden=true;details.hidden=true;root.querySelectorAll('[data-open-details]').forEach(b=>b.setAttribute('aria-expanded','false'));article.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');toggle.querySelector('.project-open').textContent='EXPAND CASE ↓';toggle.focus({preventScroll:true});article.scrollIntoView({behavior:'instant',block:'start'});geometry=null}
 toggle.addEventListener('click',()=>root.hidden?openCase():closeCase());root.querySelector('[data-ai-close]').addEventListener('click',closeCase);
 root.querySelectorAll('[data-open-details]').forEach(b=>b.addEventListener('click',()=>{details.hidden=false;root.querySelectorAll('[data-open-details]').forEach(b=>b.setAttribute('aria-expanded','true'));details.scrollIntoView({behavior:reduced.matches?'auto':'smooth',block:'start'});details.setAttribute('tabindex','-1');details.focus({preventScroll:true})}));
 mode.addEventListener('click',()=>{setFlat(!flat);wall.scrollIntoView({behavior:'instant',block:'start'})});
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',measure);new ResizeObserver(measure).observe(stage);
 reduced.addEventListener('change',()=>setFlat(reduced.matches));setFlat(flat);
 function route(){if(['#ai-series','#ai-process','#ai-workflow','#mingko-case'].includes(location.hash)){openCase();details.hidden=false;root.querySelectorAll('[data-open-details]').forEach(b=>b.setAttribute('aria-expanded','true'));requestAnimationFrame(()=>document.querySelector(location.hash)?.scrollIntoView({block:'start'}))}}addEventListener('hashchange',route);route();
 window.__wallProbe={open:openCase,close:closeCase,measure,state:()=>({open:!root.hidden,details:!details.hidden,count:tiles.length,flat,progress:wall.style.getPropertyValue('--wall-progress')})};
})();


