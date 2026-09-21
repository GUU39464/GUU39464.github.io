const header = document.querySelector('.site-header');
const progress = document.querySelector('.scroll-progress');
const revealItems = document.querySelectorAll('.reveal, .nova-reveal');
const filterButtons = document.querySelectorAll('.filter');
const projects = document.querySelectorAll('.project');
const video = document.querySelector('.hero-video');
const videoStage = document.querySelector('[data-video-stage]');
const soundToggle = document.querySelector('[data-sound-toggle]');
const videoProgress = document.querySelector('[data-video-progress]');
const stillsTrack = document.querySelector('[data-stills-track]');
const motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const projectAccordion = document.querySelector('[data-project-accordion]');
const projectToggle = document.querySelector('[data-project-toggle]');
const projectCase = document.querySelector('[data-project-case]');
const projectToggleLabel = document.querySelector('[data-project-toggle-label]');

function updateScrollUI() {
  const scrollTop = window.scrollY;
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.width = `${scrollable > 0 ? (scrollTop / scrollable) * 100 : 0}%`;
  header.classList.toggle('is-scrolled', scrollTop > 24);

  if (motionOK && videoStage && scrollTop < window.innerHeight * 1.2) {
    const amount = Math.min(scrollTop / window.innerHeight, 1);
    videoStage.style.transform = `scale(${1.035 + amount * .08})`;
    videoStage.style.filter = `brightness(${1 - amount * .42})`;
  }

  if (motionOK && stillsTrack) {
    const section = stillsTrack.closest('.stills');
    const rect = section.getBoundingClientRect();
    if (rect.bottom > 0 && rect.top < window.innerHeight) {
      const amount = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      stillsTrack.style.transform = `translate3d(${-Math.max(0,amount) * 9}vw,0,0)`;
    }
  }
}

const revealObserver = new IntersectionObserver((entries,observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    observer.unobserve(entry.target);
  });
},{threshold:.12,rootMargin:'0px 0px -50px'});
revealItems.forEach((item) => revealObserver.observe(item));

filterButtons.forEach((button) => button.addEventListener('click',() => {
  const selected = button.dataset.filter;
  filterButtons.forEach((item) => item.classList.remove('is-active'));
  button.classList.add('is-active');
  projects.forEach((project) => project.classList.toggle('is-hidden',selected !== 'all' && project.dataset.category !== selected));
}));

projects.forEach((project) => {
  const media = project.querySelector('.project-media');
  if (!motionOK || !window.matchMedia('(pointer:fine)').matches) return;
  project.addEventListener('pointermove',(event) => {
    if(project.classList.contains('is-open'))return;
    const rect = media.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - .5;
    const y = (event.clientY - rect.top) / rect.height - .5;
    media.style.transform = `perspective(1000px) rotateX(${-y * 2.5}deg) rotateY(${x * 2.5}deg)`;
  });
  project.addEventListener('pointerleave',() => { media.style.transform = ''; });
});

function setProjectCase(open,scrollBack = false) {
  if (!projectAccordion || !projectToggle || !projectCase) return;
  const duration = motionOK ? 680 : 0;
  projectToggle.setAttribute('aria-expanded',String(open));
  projectAccordion.classList.toggle('is-open',open);
  if (projectToggleLabel) projectToggleLabel.textContent = open ? 'CASE OPEN ↓' : 'EXPAND CASE ↓';

  if (open) {
    projectCase.hidden = false;
    const targetHeight = projectCase.scrollHeight;
    projectCase.style.height = '0px';
    projectCase.style.opacity = '0';
    requestAnimationFrame(() => {
      projectCase.animate([
        {height:'0px',opacity:0},
        {height:`${targetHeight}px`,opacity:1}
      ],{duration,easing:'cubic-bezier(.2,.75,.2,1)'}).onfinish = () => {
        projectCase.style.height = 'auto';
        projectCase.style.opacity = '1';
        if(projectToggle.getAttribute('aria-expanded') === 'true') projectCase.scrollIntoView({behavior:motionOK ? 'smooth' : 'auto',block:'start'});
      };
    });
  } else {
    const startHeight = projectCase.getBoundingClientRect().height;
    const animation = projectCase.animate([
      {height:`${startHeight}px`,opacity:1},
      {height:'0px',opacity:0}
    ],{duration,easing:'cubic-bezier(.4,0,.2,1)'});
    animation.onfinish = () => {
      projectCase.hidden = true;
      projectCase.style.height = '';
      projectCase.style.opacity = '';
      if (scrollBack) projectToggle.focus({preventScroll:true});
      if (scrollBack) projectToggle.scrollIntoView({behavior:motionOK ? 'smooth' : 'auto',block:'start'});
    };
  }
}

if (projectToggle && projectCase) {
  projectToggle.addEventListener('click',() => setProjectCase(projectToggle.getAttribute('aria-expanded') !== 'true'));
  document.querySelectorAll('[data-project-close]').forEach((button) => button.addEventListener('click',() => setProjectCase(false,true)));
}

window.addEventListener('scroll',updateScrollUI,{passive:true});
updateScrollUI();
