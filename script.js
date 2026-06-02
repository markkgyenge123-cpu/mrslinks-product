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
  document.querySelectorAll('[data-reveal], [data-card], [data-project], [data-step], .stats-grid article, .logo-strip span').forEach((item) => {
    item.style.opacity = '1';
    item.style.transform = 'none';
  });
  document.querySelector('.brush-logo')?.style.setProperty('clip-path', 'none');
  document.querySelector('.preloader')?.remove();
};

if (!hasGsap || !hasScrollTrigger || reduceMotion) {
  showContentImmediately();
} else {
  gsap.registerPlugin(ScrollTrigger);

  if (window.Lenis && !touchDevice) {
    lenis = new Lenis({
      duration: 1.25,
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

  gsap.set('.preloader-line', { scaleX: 0 });
  gsap.set('.preloader-mark', { autoAlpha: 0, y: 12, filter: 'blur(8px)' });
  gsap.set(['.creator .word', '.intro .word', '.hero-micro .word', '.ghost-button'], { autoAlpha: 0, y: 24, filter: 'blur(8px)' });
  gsap.set('.brush-logo', { autoAlpha: 0, clipPath: 'inset(0 100% 0 0)', filter: 'blur(12px) contrast(1.5)', scale: 0.96 });
  gsap.set('.hero-rule', { autoAlpha: 0, clipPath: 'inset(0 50% 0 50%)' });
  gsap.set('.hero-inner', { scale: 1.08 });
  gsap.set('.brand-wall span', { autoAlpha: 0, y: 38, filter: 'blur(16px)' });
  gsap.set('.hero-slash', { autoAlpha: 0, x: 0 });
  gsap.set('.smoke', { scale: 0.96 });

  const introTimeline = gsap.timeline({
    defaults: { ease: 'power4.out' },
    onComplete: () => {
      document.body.classList.remove('is-loading');
      document.body.classList.add('is-loaded');
      document.querySelector('.preloader')?.remove();
    }
  });

  introTimeline
    .to('.preloader-mark', { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.9 })
    .to('.preloader-line', { scaleX: 1, duration: 0.95, ease: 'expo.inOut' }, '-=0.35')
    .to('.preloader-mark', { autoAlpha: 0, y: -18, filter: 'blur(10px)', duration: 0.65 }, '+=0.1')
    .to('.preloader', { autoAlpha: 0, duration: 0.9, ease: 'expo.inOut' }, '-=0.25')
    .to('.smoke', { scale: 1.08, duration: 2.8, ease: 'power2.out' }, '-=0.9')
    .to('.brand-wall span', { autoAlpha: 1, y: 0, filter: 'blur(0px)', stagger: 0.12, duration: 1.15 }, '-=1.15')
    .to('.hero-slash', { autoAlpha: 1, x: '160vw', duration: 0.72, ease: 'expo.inOut' }, '-=0.6')
    .to('.hero-slash', { autoAlpha: 0, duration: 0.18 }, '-=0.15')
    .to('.hero-inner', { scale: 1, duration: 2.3, ease: 'power3.out' }, '-=0.95')
    .to('.creator .word', { autoAlpha: 1, y: 0, filter: 'blur(0px)', stagger: 0.1, duration: 0.8 }, '-=1.65')
    .to('.brush-logo', { autoAlpha: 1, clipPath: 'inset(0 -4% 0 -4%)', filter: 'blur(0px) contrast(1.25)', scale: 1, duration: 1.3, ease: 'expo.inOut' }, '-=0.75')
    .to('.brush-logo', { x: -8, duration: 0.05, repeat: 6, yoyo: true, ease: 'steps(2)' }, '-=0.42')
    .to('.intro .word', { autoAlpha: 1, y: 0, filter: 'blur(0px)', stagger: 0.045, duration: 0.72 }, '-=0.12')
    .to('.ghost-button', { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.75 }, '-=0.22')
    .to('.hero-micro .word', { autoAlpha: 1, y: 0, filter: 'blur(0px)', stagger: 0.05, duration: 0.6 }, '-=0.35')
    .to('.hero-rule', { autoAlpha: 0.7, clipPath: 'inset(0 0% 0 0%)', duration: 0.75, ease: 'expo.inOut' }, '-=0.55');

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

  gsap.utils.toArray('[data-project]').forEach((card, index) => {
    gsap.fromTo(card, { autoAlpha: 0, y: 44 }, {
      autoAlpha: 1,
      y: 0,
      duration: 0.85,
      delay: index * 0.09,
      ease: 'power3.out',
      scrollTrigger: { trigger: card, start: 'top 88%' }
    });
  });

  gsap.to('.phone-front', { y: -16, rotateZ: -4.5, duration: 7, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  gsap.to('.phone-back', { y: 14, rotateZ: 5.5, duration: 8.5, repeat: -1, yoyo: true, ease: 'sine.inOut' });

  gsap.to('.phone-front', {
    yPercent: -12,
    scrollTrigger: { trigger: '.showcase', start: 'top bottom', end: 'bottom top', scrub: 1.2 }
  });
  gsap.to('.phone-back', {
    yPercent: 10,
    scrollTrigger: { trigger: '.showcase', start: 'top bottom', end: 'bottom top', scrub: 1.2 }
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

  gsap.utils.toArray('.stats-grid article, .logo-strip span').forEach((item, index) => {
    gsap.fromTo(item, { autoAlpha: 0, y: 38 }, {
      autoAlpha: 1,
      y: 0,
      duration: 0.8,
      delay: index * 0.07,
      ease: 'power3.out',
      scrollTrigger: { trigger: item, start: 'top 88%' }
    });
  });

  document.querySelectorAll('.stat-number').forEach((stat) => {
    const end = Number(stat.dataset.count || 0);
    ScrollTrigger.create({
      trigger: stat,
      start: 'top 86%',
      once: true,
      onEnter: () => {
        gsap.fromTo({ value: 0 }, { value: 0 }, {
          value: end,
          duration: 1.8,
          ease: 'power4.out',
          onUpdate() {
            stat.textContent = String(Math.round(this.targets()[0].value)).padStart(2, '0');
          },
          onComplete() {
            gsap.fromTo(stat, { scale: 1 }, { scale: 1.045, duration: 0.18, yoyo: true, repeat: 1 });
          }
        });
      }
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

const interactiveSelector = 'a, button, .service-card, .project-card, .phone, .magnetic';
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

document.querySelectorAll('[data-tilt]').forEach((phone) => {
  if (touchDevice || reduceMotion || !hasGsap) return;

  phone.addEventListener('pointermove', (event) => {
    const rect = phone.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    gsap.to(phone, {
      rotateY: x * 16,
      rotateX: -y * 12,
      z: 30,
      duration: 0.45,
      ease: 'power3.out'
    });
  });

  phone.addEventListener('pointerleave', () => {
    const isFront = phone.classList.contains('phone-front');
    gsap.to(phone, {
      rotateX: isFront ? 8 : -4,
      rotateY: isFront ? -10 : 10,
      z: 0,
      duration: 0.7,
      ease: 'power3.out'
    });
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

document.querySelectorAll('.ghost-button, .contact-button, .service-card, .project-card').forEach((element) => {
  element.addEventListener('pointerenter', () => element.classList.add('interactive-active'));
  element.addEventListener('pointerleave', () => element.classList.remove('interactive-active'));
});
