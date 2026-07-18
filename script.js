const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const touchDevice = window.matchMedia('(pointer: coarse)').matches;
const mobile = () => window.matchMedia('(max-width: 860px)').matches;
const hasGsap = Boolean(window.gsap);
const hasScrollTrigger = Boolean(window.ScrollTrigger);
const hasSplitType = Boolean(window.SplitType);
let lenis = null;

// Shared scroll state
const sections = Array.from(document.querySelectorAll('.section'));
let sectionOffsets = [];
let snapTimer = 0;
let snapUnlockTimer = 0;
let resizeTimer = 0;
let snapping = false;
let wheelDirection = 0;
let suppressSnapUntil = 0;

const refreshScrollMetrics = () => {
  sectionOffsets = sections.map((section) => section.offsetTop);
};

const cancelGuidedSnap = () => {
  window.clearTimeout(snapTimer);
  window.clearTimeout(snapUnlockTimer);
  snapping = false;
};

const canGuidedSnap = () => (
  Boolean(lenis)
  && !touchDevice
  && !reduceMotion
  && document.body.classList.contains('is-loaded')
  && performance.now() >= suppressSnapUntil
);

const settleToNearbySection = () => {
  if (!canGuidedSnap() || !sectionOffsets.length) return;

  const currentY = window.scrollY;
  const threshold = Math.min(window.innerHeight * 0.28, 240);
  let nearestOffset = sectionOffsets[0];
  let nearestDistance = Math.abs(nearestOffset - currentY);

  sectionOffsets.forEach((offset) => {
    const distance = Math.abs(offset - currentY);
    if (distance < nearestDistance) {
      nearestOffset = offset;
      nearestDistance = distance;
    }
  });

  if (nearestDistance < 3 || nearestDistance > threshold) return;

  // Avoid pulling backwards to a section the user has deliberately moved away from.
  if (wheelDirection > 0 && nearestOffset < currentY && nearestDistance > threshold * 0.55) return;
  if (wheelDirection < 0 && nearestOffset > currentY && nearestDistance > threshold * 0.55) return;

  snapping = true;
  lenis.scrollTo(nearestOffset, {
    duration: 0.72,
    force: true,
    lock: false,
    onComplete: () => {
      snapping = false;
    }
  });

  snapUnlockTimer = window.setTimeout(() => {
    snapping = false;
  }, 950);
};

const scheduleGuidedSnap = () => {
  window.clearTimeout(snapTimer);
  if (!canGuidedSnap()) return;
  snapTimer = window.setTimeout(settleToNearbySection, 170);
};

window.addEventListener('wheel', (event) => {
  wheelDirection = Math.sign(event.deltaY);
  if (snapping) cancelGuidedSnap();
  scheduleGuidedSnap();
}, { passive: true });

// Continuously playing decorative background video
const scrollVideo = document.querySelector('.scroll-video');

if (scrollVideo) {
  const playBackgroundVideo = () => {
    if (reduceMotion || document.hidden) {
      scrollVideo.pause();
      if (reduceMotion && scrollVideo.readyState >= 1) scrollVideo.currentTime = 0;
      return;
    }

    const playAttempt = scrollVideo.play();
    if (playAttempt && typeof playAttempt.catch === 'function') {
      playAttempt.catch(() => {
        // Muted autoplay can still be blocked by browser or battery policies.
        // The loaded first frame remains as a stable visual fallback.
      });
    }
  };

  if (scrollVideo.readyState >= 1) {
    playBackgroundVideo();
  } else {
    scrollVideo.addEventListener('loadedmetadata', playBackgroundVideo, { once: true });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden || reduceMotion) {
      scrollVideo.pause();
    } else {
      playBackgroundVideo();
    }
  });

  window.addEventListener('pageshow', playBackgroundVideo);
}

const refreshAfterLayoutChange = () => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    refreshScrollMetrics();
    if (hasScrollTrigger) ScrollTrigger.refresh();
  }, 140);
};

refreshScrollMetrics();
window.addEventListener('resize', refreshAfterLayoutChange, { passive: true });

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
  refreshScrollMetrics();
};

if (!hasGsap || !hasScrollTrigger || reduceMotion) {
  showContentImmediately();
} else {
  gsap.registerPlugin(ScrollTrigger);

  if (window.Lenis && !touchDevice) {
    lenis = new Lenis({
      duration: 1.1,
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

  gsap.set('.preloader-kicker', { autoAlpha: 0, y: 14, filter: 'blur(6px)' });
  gsap.set('.preloader-mark', { autoAlpha: 0, y: 18, clipPath: 'inset(100% 0 0 0)', filter: 'blur(7px) contrast(1.05)', scale: 0.975 });
  gsap.set('.preloader-veil', { autoAlpha: 0 });
  gsap.set('.preloader-smoke', { autoAlpha: 0, scale: 1.16, xPercent: -2.5, y: 12 });
  gsap.set('.preloader-spot', { autoAlpha: 0, scale: 0.68 });
  gsap.set('.preloader-dust', { autoAlpha: 0 });
  gsap.set('.preloader-dust span', { autoAlpha: 0, y: 22, scale: 0.68 });
  gsap.set('.preloader-brush', { autoAlpha: 0, x: '-68vw' });
  gsap.set(['.hero-status .word', '.hero-brand .word', '.intro .word', '.ghost-button'], { autoAlpha: 0, y: 22, filter: 'blur(5px)' });
  gsap.set('.hero-visual', { autoAlpha: 0, y: 20, filter: 'blur(5px)' });
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
      refreshScrollMetrics();
      ScrollTrigger.refresh();
    }
  });

  introTimeline
    .addLabel('blackout', 0)
    .addLabel('atmosphere', 0.3)
    .addLabel('credit', 0.9)
    .addLabel('brandReveal', 1.6)
    .addLabel('titleHold', 3.0)
    .addLabel('handoff', 4.2)
    .addLabel('heroReveal', 4.75)
    .to('.preloader-veil', { autoAlpha: 0.42, duration: 1.35, ease: 'power2.out' }, 'atmosphere')
    .to('.preloader-spot', { autoAlpha: 0.58, scale: 1, duration: 1.45, ease: 'power2.out' }, 'atmosphere+=0.08')
    .to('.preloader-smoke', { autoAlpha: 0.4, scale: 1, x: 0, y: 0, duration: 1.55, ease: 'power2.out' }, 'atmosphere+=0.12')
    .to('.preloader-smoke', { x: 10, y: -5, scale: 1.025, duration: 3.6, ease: 'sine.inOut' }, 'atmosphere+=1.0')
    .to('.preloader-dust', { autoAlpha: 0.24, duration: 1.1, ease: 'power2.out' }, 'atmosphere+=0.28')
    .to('.preloader-dust span', { autoAlpha: 0.16, y: -20, scale: 1, stagger: 0.08, duration: 2.1, ease: 'sine.inOut' }, 'atmosphere+=0.45')
    .to('.preloader-kicker', { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.95, ease: 'power3.out' }, 'credit')
    .to('.preloader-mark', { autoAlpha: 1, y: 0, clipPath: 'inset(0% 0 0 0)', filter: 'blur(0px) contrast(1.07)', scale: 1, duration: 1.35, ease: 'power3.out' }, 'brandReveal')
    .to('.preloader-spot', { autoAlpha: 0.68, scale: 1.08, duration: 1.15, ease: 'sine.inOut' }, 'brandReveal+=0.15')
    .to('.preloader-mark', { scale: 1.006, duration: 0.7, ease: 'sine.inOut' }, 'titleHold')
    .to('.preloader-mark', { scale: 1, duration: 0.7, ease: 'sine.inOut' }, 'titleHold+=0.7')
    .to('.preloader-content', { autoAlpha: 0, y: -12, filter: 'blur(5px)', duration: 0.78, ease: 'power2.inOut' }, 'handoff')
    .to('.preloader-spot', { autoAlpha: 0.2, scale: 1.18, duration: 0.9, ease: 'power2.inOut' }, 'handoff')
    .to('.preloader-smoke', { autoAlpha: 0.12, scale: 1.04, duration: 0.9, ease: 'power2.inOut' }, 'handoff')
    .to('.preloader', { autoAlpha: 0, duration: 0.92, ease: 'power2.inOut' }, 'handoff+=0.22')
    .call(() => {
      document.body.classList.remove('is-loading');
      document.body.classList.add('is-loaded');
    }, null, 'handoff+=0.72')
    .to('.spotlight', { opacity: 0.32, duration: 1.1, ease: 'power2.out' }, 'handoff+=0.3')
    .to('.hero-frame', { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 1.05, ease: 'power3.out' }, 'heroReveal-=0.18')
    .to('.hero-orbit', { autoAlpha: 0.58, y: 0, filter: 'blur(0px)', duration: 1.08, ease: 'power3.out' }, 'heroReveal-=0.12')
    .to('.brand-wall span', { autoAlpha: 1, y: 0, filter: 'blur(0px)', stagger: 0.12, duration: 0.95 }, 'heroReveal-=0.08')
    .to('.hero-depth', { autoAlpha: 0.46, stagger: 0.08, duration: 0.9, ease: 'power2.out' }, 'heroReveal')
    .to('.hero-inner', { scale: 1, y: 0, duration: 1.2, ease: 'power3.out' }, 'heroReveal')
    .to('.site-header', { autoAlpha: 1, y: 0, duration: 0.88, ease: 'power3.out' }, 'heroReveal+=0.05')
    .to('.hero-status .word', { autoAlpha: 1, y: 0, filter: 'blur(0px)', stagger: 0.035, duration: 0.62 }, 'heroReveal+=0.18')
    .to('.hero-brand .word', { autoAlpha: 1, y: 0, filter: 'blur(0px)', stagger: 0.045, duration: 0.82, ease: 'power3.out' }, 'heroReveal+=0.36')
    .to('.intro .word', { autoAlpha: 1, y: 0, filter: 'blur(0px)', stagger: 0.018, duration: 0.66 }, 'heroReveal+=0.82')
    .to('.ghost-button', { autoAlpha: 1, y: 0, filter: 'blur(0px)', stagger: 0.08, duration: 0.62 }, 'heroReveal+=1.02')
    .to('.hero-visual', { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.82, ease: 'power3.out' }, 'heroReveal+=0.68')
    .to('.hero-rule', { autoAlpha: 0.38, clipPath: 'inset(0 0% 0 0%)', duration: 0.72, ease: 'power3.inOut' }, 'heroReveal+=1.25');

  introTimeline.timeScale(1.35);

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
    gsap.to(item, { x: x * 0.08, y: y * 0.1, duration: 0.42, ease: 'power3.out' });
  });

  item.addEventListener('pointerleave', () => {
    gsap.to(item, { x: 0, y: 0, duration: 0.52, ease: 'power3.out' });
  });
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;

    event.preventDefault();
    cancelGuidedSnap();
    suppressSnapUntil = performance.now() + 1200;
    if (lenis && !reduceMotion) {
      lenis.scrollTo(target, {
        offset: -20,
        duration: 1.1,
        onComplete: () => {
          refreshScrollMetrics();
        }
      });
    } else {
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }
  });
});

document.querySelectorAll('.ghost-button, .contact-button, .instagram-cta, .service-card, .audience-grid article, .quality-points span').forEach((element) => {
  element.addEventListener('pointerenter', () => element.classList.add('interactive-active'));
  element.addEventListener('pointerleave', () => element.classList.remove('interactive-active'));
});
