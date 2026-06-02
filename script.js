const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const touchDevice = window.matchMedia('(pointer: coarse)').matches;
const mobile = () => window.matchMedia('(max-width: 860px)').matches;
const hasGsap = Boolean(window.gsap);
const hasScrollTrigger = Boolean(window.ScrollTrigger);
const hasSplitType = Boolean(window.SplitType);
let lenis = null;

document.body.classList.add('is-loading');

const showContentImmediately = () => {
  document.body.classList.remove('is-loading');
  document.body.classList.add('is-loaded');
  document.querySelectorAll('[data-reveal], [data-card], [data-step], .audience-grid article, .quality-points span').forEach((item) => {
    item.style.opacity = '1';
    item.style.transform = 'none';
  });
  document.querySelectorAll('.hero-visual').forEach((item) => {
    item.style.opacity = '1';
    item.style.transform = 'none';
  });
  document.querySelector('.preloader')?.remove();
};

if (!hasGsap || !hasScrollTrigger || reduceMotion) {
  showContentImmediately();
} else {
  gsap.registerPlugin(ScrollTrigger);

  if (window.Lenis && !touchDevice) {
    lenis = new Lenis({
      duration: 0.88,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      anchors: false
    });

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const splitTargets = [];
  if (hasSplitType) {
    document.querySelectorAll('.split-words').forEach((target) => {
      splitTargets.push(new SplitType(target, { types: 'words' }));
    });

    document.querySelectorAll('.split-lines').forEach((target) => {
      splitTargets.push(new SplitType(target, { types: 'lines, words' }));
    });
  }

  gsap.set('.preloader-kicker', { autoAlpha: 0, y: 12, filter: 'blur(7px)' });
  gsap.set('.preloader-mark', { autoAlpha: 0, y: 14, clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)', filter: 'blur(14px) contrast(1.2)', scale: 0.965 });
  gsap.set('.preloader-veil', { autoAlpha: 0 });
  gsap.set('.preloader-smoke', { autoAlpha: 0, scale: 1.12, xPercent: -2, y: 8 });
  gsap.set('.preloader-spot', { autoAlpha: 0, scale: 0.74 });
  gsap.set('.preloader-dust', { autoAlpha: 0 });
  gsap.set('.preloader-dust span', { autoAlpha: 0, y: 18, scale: 0.72 });
  gsap.set('.preloader-brush', { autoAlpha: 0, x: '-68vw' });
  gsap.set(['.hero-status .word', '.hero-brand .word', '.intro .word', '.ghost-button'], { autoAlpha: 0, y: 24, filter: 'blur(9px)' });
  gsap.set('.hero-visual', { autoAlpha: 0, y: 28, filter: 'blur(10px)' });
  gsap.set('.hero-rule', { autoAlpha: 0, clipPath: 'inset(0 50% 0 50%)' });
  gsap.set('.hero-inner', { scale: 1.025, y: 18 });
  gsap.set('.brand-wall span, .hero-frame, .hero-orbit', { autoAlpha: 0, y: 46, filter: 'blur(18px)' });
  gsap.set('.hero-depth', { autoAlpha: 0 });
  gsap.set('.site-header', { autoAlpha: 0, y: -12 });

  const introTimeline = gsap.timeline({
    defaults: { ease: 'power4.out' },
    onComplete: () => {
      document.body.classList.remove('is-loading');
      document.body.classList.add('is-loaded');
      document.querySelector('.preloader')?.remove();
    }
  });

  introTimeline
    .addLabel('blackout', 0)
    .addLabel('atmosphere', 0.35)
    .addLabel('credit', 1.05)
    .addLabel('brandReveal', 1.65)
    .addLabel('settle', 2.65)
    .addLabel('handoff', 3.25)
    .addLabel('heroReveal', 3.65)
    .to('.preloader-veil', { autoAlpha: 0.46, duration: 0.9, ease: 'power2.out' }, 'atmosphere')
    .to('.preloader-spot', { autoAlpha: 0.72, scale: 1, duration: 1.05, ease: 'power2.out' }, 'atmosphere+=0.03')
    .to('.preloader-smoke', { autoAlpha: 0.48, scale: 1, x: 0, y: 0, duration: 1.18, ease: 'power2.out' }, 'atmosphere+=0.05')
    .to('.preloader-smoke', { x: 14, y: -6, scale: 1.03, duration: 2.75, ease: 'sine.inOut' }, 'atmosphere+=0.75')
    .to('.preloader-dust', { autoAlpha: 0.36, duration: 0.85, ease: 'power2.out' }, 'atmosphere+=0.16')
    .to('.preloader-dust span', { autoAlpha: 0.2, y: -18, scale: 1, stagger: 0.075, duration: 1.65, ease: 'sine.inOut' }, 'atmosphere+=0.28')
    .to('.preloader-kicker', { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.72, ease: 'power3.out' }, 'credit')
    .to('.preloader-brush', { autoAlpha: 0.62, x: '90vw', duration: 1.05, ease: 'power3.inOut' }, 'brandReveal-=0.05')
    .to('.preloader-mark', { autoAlpha: 1, y: 0, clipPath: 'polygon(-3% 0, 104% 0, 98% 100%, -8% 100%)', filter: 'blur(1px) contrast(1.22)', scale: 1, duration: 0.92, ease: 'expo.inOut' }, 'brandReveal')
    .to('.preloader-brush', { autoAlpha: 0, duration: 0.42, ease: 'power2.out' }, 'brandReveal+=0.82')
    .to('.preloader-mark', { filter: 'blur(0px) contrast(1.16)', textShadow: '0 0 30px rgba(233,232,225,0.15), 0 0 84px rgba(233,232,225,0.065)', duration: 0.42, ease: 'power2.out' }, 'settle-=0.1')
    .to('.preloader-mark', { scale: 1.006, duration: 0.34, ease: 'sine.inOut' }, 'settle')
    .to('.preloader-mark', { scale: 1, duration: 0.42, ease: 'sine.inOut' }, 'settle+=0.34')
    .to('.preloader-content', { autoAlpha: 0, y: -10, filter: 'blur(8px)', duration: 0.52, ease: 'power2.inOut' }, 'handoff')
    .to('.preloader-spot', { autoAlpha: 0.32, scale: 1.2, duration: 0.7, ease: 'power2.inOut' }, 'handoff+=0.02')
    .to('.preloader', { autoAlpha: 0, duration: 0.72, ease: 'expo.inOut' }, 'handoff+=0.18')
    .call(() => {
      document.body.classList.remove('is-loading');
      document.body.classList.add('is-loaded');
    }, null, 'handoff+=0.76')
    .to('.spotlight', { opacity: 0.58, duration: 0.9, ease: 'power2.out' }, 'handoff+=0.12')
    .to('.hero-frame', { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.86, ease: 'power3.out' }, 'handoff+=0.2')
    .to('.hero-orbit', { autoAlpha: 0.58, y: 0, filter: 'blur(0px)', duration: 0.95, ease: 'power3.out' }, 'handoff+=0.24')
    .to('.brand-wall span', { autoAlpha: 1, y: 0, filter: 'blur(0px)', stagger: 0.1, duration: 0.78 }, 'handoff+=0.26')
    .to('.hero-depth', { autoAlpha: 0.46, stagger: 0.07, duration: 0.72, ease: 'power2.out' }, 'handoff+=0.36')
    .to('.hero-inner', { scale: 1, y: 0, duration: 1, ease: 'power3.out' }, 'heroReveal-=0.1')
    .to('.site-header', { autoAlpha: 1, y: 0, duration: 0.72, ease: 'power3.out' }, 'heroReveal')
    .to('.hero-status .word', { autoAlpha: 1, y: 0, filter: 'blur(0px)', stagger: 0.04, duration: 0.52 }, 'heroReveal+=0.16')
    .to('.hero-brand .word', { autoAlpha: 1, y: 0, filter: 'blur(0px)', stagger: 0.045, duration: 0.7, ease: 'power3.out' }, 'heroReveal+=0.28')
    .to('.intro .word', { autoAlpha: 1, y: 0, filter: 'blur(0px)', stagger: 0.02, duration: 0.52 }, 'heroReveal+=0.62')
    .to('.ghost-button', { autoAlpha: 1, y: 0, filter: 'blur(0px)', stagger: 0.08, duration: 0.52 }, 'heroReveal+=0.78')
    .to('.hero-visual', { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.72, ease: 'power3.out' }, 'heroReveal+=0.46')
    .to('.hero-rule', { autoAlpha: 0.38, clipPath: 'inset(0 0% 0 0%)', duration: 0.56, ease: 'expo.inOut' }, 'heroReveal+=1.08');

  gsap.to('.hero-inner', {
    y: -48,
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 1.1
    }
  });

  gsap.to('.hero-depth-one', {
    y: 90,
    rotate: 12,
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });

  gsap.to('.hero-depth-two', {
    y: -70,
    rotate: -18,
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });

  gsap.to('.brand-wall', {
    y: 80,
    opacity: 0.34,
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });

  gsap.to('.hero-frame', {
    y: 34,
    opacity: 0.72,
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.2 }
  });

  gsap.to('.hero-orbit', {
    y: 52,
    rotate: 18,
    opacity: 0.48,
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.4 }
  });

  gsap.to('.hero-visual', {
    y: 18,
    opacity: 0.78,
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.2 }
  });

  document.querySelectorAll('[data-reveal]').forEach((item) => {
    const textBits = item.querySelectorAll('.line, .word');
    gsap.fromTo(item, { autoAlpha: 0, y: 46, filter: 'blur(10px)' }, {
      autoAlpha: 1,
      y: 0,
      filter: 'blur(0px)',
      duration: 1.05,
      ease: 'power4.out',
      scrollTrigger: { trigger: item, start: 'top 82%' }
    });

    if (textBits.length) {
      gsap.from(textBits, {
        y: 22,
        autoAlpha: 0,
        stagger: 0.035,
        duration: 0.72,
        ease: 'power3.out',
        scrollTrigger: { trigger: item, start: 'top 82%' }
      });
    }
  });

  gsap.utils.toArray('[data-card]').forEach((card, index) => {
    gsap.fromTo(card, { autoAlpha: 0, y: 58, rotateX: 10 }, {
      autoAlpha: 1,
      y: 0,
      rotateX: 0,
      duration: 0.95,
      delay: index * 0.08,
      ease: 'power4.out',
      scrollTrigger: { trigger: card, start: 'top 86%' }
    });

    const paths = card.querySelectorAll('path, rect');
    paths.forEach((path) => {
      const length = path.getTotalLength?.() || 80;
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
      gsap.to(path, {
        strokeDashoffset: 0,
        duration: 1.15,
        ease: 'power3.out',
        scrollTrigger: { trigger: card, start: 'top 82%' }
      });
    });
  });

  const processTl = gsap.timeline({
    scrollTrigger: {
      trigger: '.process-line',
      start: 'top 76%',
      end: 'bottom 50%',
      scrub: 0.8
    }
  });
  processTl.to('.process-progress', mobile() ? { scaleY: 1, duration: 1 } : { scaleX: 1, duration: 1 });
  gsap.utils.toArray('[data-step]').forEach((step, index) => {
    ScrollTrigger.create({
      trigger: step,
      start: 'top 78%',
      once: true,
      onEnter: () => {
        step.classList.add('is-active');
        gsap.to(step, { autoAlpha: 1, y: 0, duration: 0.75, ease: 'power3.out' });
        const number = step.querySelector('.process-number');
        const finalValue = Number(step.dataset.final || index + 1);
        gsap.fromTo({ value: 0 }, { value: 0 }, {
          value: finalValue,
          duration: 0.9,
          ease: 'power3.out',
          onUpdate() {
            number.textContent = String(Math.round(this.targets()[0].value)).padStart(2, '0');
          }
        });
      }
    });
  });

  gsap.utils.toArray('.audience-grid article, .quality-points span').forEach((item, index) => {
    gsap.fromTo(item, { autoAlpha: 0, y: 38 }, {
      autoAlpha: 1,
      y: 0,
      duration: 0.8,
      delay: index * 0.07,
      ease: 'power3.out',
      scrollTrigger: { trigger: item, start: 'top 88%' }
    });
  });

  gsap.fromTo('.contact', { autoAlpha: 0, y: 60, scale: 0.985 }, {
    autoAlpha: 1,
    y: 0,
    scale: 1,
    duration: 1.1,
    ease: 'power4.out',
    scrollTrigger: {
      trigger: '.contact',
      start: 'top 78%',
      onEnter: () => {
        document.querySelector('.contact')?.classList.add('is-live');
        gsap.fromTo('.contact-button', { boxShadow: '0 0 0 rgba(255,255,255,0)' }, {
          boxShadow: '0 0 34px rgba(255,255,255,0.24)',
          duration: 0.55,
          yoyo: true,
          repeat: 1
        });
      }
    }
  });
}

const interactiveSelector = 'a, button, .service-card, .audience-grid article, .quality-points span, .magnetic';
const cursorMain = document.querySelector('.cursor-main');
const cursorTrail = document.querySelector('.cursor-trail');
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let mainX = mouseX;
let mainY = mouseY;
let trailX = mouseX;
let trailY = mouseY;

const updateSpotlight = (x, y) => {
  document.documentElement.style.setProperty('--mx', `${x}px`);
  document.documentElement.style.setProperty('--my', `${y}px`);
};

if (!touchDevice && !reduceMotion) {
  document.body.classList.add('cursor-ready');

  window.addEventListener('pointermove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    updateSpotlight(mouseX, mouseY);
  }, { passive: true });

  const cursorLoop = () => {
    mainX += (mouseX - mainX) * 0.22;
    mainY += (mouseY - mainY) * 0.22;
    trailX += (mouseX - trailX) * 0.08;
    trailY += (mouseY - trailY) * 0.08;
    cursorMain.style.transform = `translate3d(${mainX}px, ${mainY}px, 0) translate(-50%, -50%)`;
    cursorTrail.style.transform = `translate3d(${trailX}px, ${trailY}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(cursorLoop);
  };
  cursorLoop();

  document.querySelectorAll(interactiveSelector).forEach((item) => {
    item.addEventListener('pointerenter', () => document.body.classList.add('cursor-hover'));
    item.addEventListener('pointerleave', () => document.body.classList.remove('cursor-hover'));
  });
}

document.querySelectorAll('.magnetic').forEach((item) => {
  if (touchDevice || reduceMotion || !hasGsap) return;

  item.addEventListener('pointermove', (event) => {
    const rect = item.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    gsap.to(item, { x: x * 0.18, y: y * 0.22, duration: 0.35, ease: 'power3.out' });
  });

  item.addEventListener('pointerleave', () => {
    gsap.to(item, { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1, 0.35)' });
  });
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;

    event.preventDefault();
    if (lenis && !reduceMotion) {
      lenis.scrollTo(target, { offset: -20, duration: 1.1 });
    } else {
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }
  });
});

document.querySelectorAll('.ghost-button, .contact-button, .instagram-cta, .service-card, .audience-grid article, .quality-points span').forEach((element) => {
  element.addEventListener('pointerenter', () => element.classList.add('interactive-active'));
  element.addEventListener('pointerleave', () => element.classList.remove('interactive-active'));
});
