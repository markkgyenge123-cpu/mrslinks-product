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
  const threshold = Math.min(window.innerHeight * 0.18, 160);
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
    duration: 0.55,
    force: true,
    lock: false,
    onComplete: () => {
      snapping = false;
    }
  });

  snapUnlockTimer = window.setTimeout(() => {
    snapping = false;
  }, 760);
};

const scheduleGuidedSnap = () => {
  window.clearTimeout(snapTimer);
  if (!canGuidedSnap()) return;
  snapTimer = window.setTimeout(settleToNearbySection, 190);
};

window.addEventListener('wheel', (event) => {
  wheelDirection = Math.sign(event.deltaY);
  if (snapping) cancelGuidedSnap();
  scheduleGuidedSnap();
}, { passive: true });

// Continuously playing decorative background video
const scrollVideo = document.querySelector('.scroll-video');

if (scrollVideo) {
  scrollVideo.muted = true;
  scrollVideo.defaultMuted = true;
  scrollVideo.playsInline = true;
  scrollVideo.controls = false;
  scrollVideo.disablePictureInPicture = true;
  scrollVideo.setAttribute('muted', '');
  scrollVideo.setAttribute('playsinline', '');
  scrollVideo.setAttribute('webkit-playsinline', '');

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
  scrollVideo.addEventListener('loadeddata', playBackgroundVideo, { once: true });
  scrollVideo.addEventListener('canplay', playBackgroundVideo, { once: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden || reduceMotion) {
      scrollVideo.pause();
    } else {
      playBackgroundVideo();
    }
  });

  window.addEventListener('pageshow', playBackgroundVideo);
  window.addEventListener('pointerdown', playBackgroundVideo, { once: true, passive: true });
  window.addEventListener('touchstart', playBackgroundVideo, { once: true, passive: true });
}

// Native chapter tracking remains available even when animation CDNs are unavailable.
const chapterMeta = [
  { id: 'hero', label: 'Studio', rgb: '191, 247, 255', x: '72%', y: '34%' },
  { id: 'about', label: 'About', rgb: '171, 139, 255', x: '28%', y: '44%' },
  { id: 'services', label: 'Services', rgb: '226, 104, 160', x: '72%', y: '48%' },
  { id: 'process', label: 'Process', rgb: '126, 220, 255', x: '34%', y: '56%' },
  { id: 'quality', label: 'Quality', rgb: '238, 235, 224', x: '68%', y: '42%' },
  { id: 'for-who', label: 'Audience', rgb: '179, 128, 220', x: '30%', y: '58%' },
  { id: 'contact', label: 'Contact', rgb: '230, 112, 155', x: '56%', y: '46%' }
];
const chapterSections = chapterMeta.map(({ id }) => document.getElementById(id)).filter(Boolean);
const chapterLinks = Array.from(document.querySelectorAll('[data-chapter-index]'));
const chapterNumber = document.querySelector('.chapter-number');
const chapterTitle = document.querySelector('.chapter-title');
const chapterReadout = document.querySelector('.chapter-readout');
const chapterMobileCount = document.querySelector('.chapter-mobile-count');
const chapterProgress = document.querySelector('.chapter-progress');
const chapterAmbient = document.querySelector('.chapter-ambient');
const chapterSweep = document.querySelector('.chapter-sweep');
let activeChapterIndex = -1;
let chapterTextTimer = 0;
let chapterEffectTimer = 0;
let lastSweepAt = 0;
let heroShimmerPlayed = false;

const padChapter = (value) => String(value).padStart(2, '0');

const activateChapter = (index) => {
  if (index < 0 || index >= chapterMeta.length || index === activeChapterIndex) return;

  const chapter = chapterMeta[index];
  const previousIndex = activeChapterIndex;
  activeChapterIndex = index;
  document.documentElement.style.setProperty('--chapter-rgb', chapter.rgb);
  document.documentElement.style.setProperty('--chapter-x', chapter.x);
  document.documentElement.style.setProperty('--chapter-y', chapter.y);

  chapterLinks.forEach((link, linkIndex) => {
    if (linkIndex === index) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });

  if (chapterProgress) {
    chapterProgress.style.setProperty('--chapter-progress', String((index + 1) / chapterMeta.length));
  }
  if (chapterMobileCount) {
    chapterMobileCount.textContent = `${padChapter(index + 1)} / ${padChapter(chapterMeta.length)}`;
  }

  window.clearTimeout(chapterTextTimer);
  if (reduceMotion || previousIndex < 0) {
    if (chapterNumber) chapterNumber.textContent = padChapter(index + 1);
    if (chapterTitle) chapterTitle.textContent = chapter.label;
  } else if (chapterReadout) {
    chapterReadout.classList.add('is-updating');
    chapterTextTimer = window.setTimeout(() => {
      if (chapterNumber) chapterNumber.textContent = padChapter(index + 1);
      if (chapterTitle) chapterTitle.textContent = chapter.label;
      chapterReadout.classList.remove('is-updating');
    }, 145);
  }

  if (chapterAmbient && !reduceMotion) {
    chapterAmbient.classList.add('is-changing');
    window.setTimeout(() => chapterAmbient.classList.remove('is-changing'), 240);
  }

  const now = performance.now();
  const canSweep = (
    previousIndex >= 0
    && !reduceMotion
    && !touchDevice
    && !mobile()
    && document.body.classList.contains('is-loaded')
    && now - lastSweepAt > 700
  );
  if (canSweep && chapterSweep) {
    lastSweepAt = now;
    window.clearTimeout(chapterEffectTimer);
    chapterSweep.classList.remove('is-sweeping');
    void chapterSweep.offsetWidth;
    chapterSweep.classList.add('is-sweeping');
    chapterEffectTimer = window.setTimeout(() => chapterSweep.classList.remove('is-sweeping'), 620);
  }
};

const selectNearestChapter = () => {
  if (!chapterSections.length) return;
  const viewportCenter = window.innerHeight / 2;
  let nearestIndex = 0;
  let nearestDistance = Infinity;

  chapterSections.forEach((section, index) => {
    const rect = section.getBoundingClientRect();
    const sectionCenter = rect.top + Math.min(rect.height, window.innerHeight) / 2;
    const containsCenter = rect.top <= viewportCenter && rect.bottom >= viewportCenter;
    const distance = containsCenter ? 0 : Math.abs(sectionCenter - viewportCenter);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });
  activateChapter(nearestIndex);
};

if (chapterSections.length) {
  const chapterObserver = new IntersectionObserver(selectNearestChapter, {
    rootMargin: '-42% 0px -42% 0px',
    threshold: [0, 0.01]
  });
  chapterSections.forEach((section) => chapterObserver.observe(section));
  window.addEventListener('pageshow', selectNearestChapter);
  window.addEventListener('resize', selectNearestChapter, { passive: true });
  selectNearestChapter();
}

const runHeroShimmer = () => {
  if (heroShimmerPlayed || reduceMotion || touchDevice || mobile()) return;
  heroShimmerPlayed = true;
  const heroBrand = document.querySelector('.hero-brand');
  if (!heroBrand) return;
  window.setTimeout(() => {
    heroBrand.classList.add('is-shimmering');
    window.setTimeout(() => heroBrand.classList.remove('is-shimmering'), 1350);
  }, 260);
};

const loadedClassObserver = new MutationObserver(() => {
  if (document.body.classList.contains('is-loaded')) {
    runHeroShimmer();
    loadedClassObserver.disconnect();
  }
});
loadedClassObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

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
  document.querySelectorAll('[data-reveal], [data-card], [data-step], [data-showcase], .audience-grid article, .quality-points span').forEach((item) => {
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

  gsap.set('.preloader-mark', { autoAlpha: 0, y: 18, clipPath: 'inset(100% 0 0 0)', filter: 'blur(7px) contrast(1.05)', scale: 0.975 });
  gsap.set('.preloader-line', { autoAlpha: 0, scaleX: 0 });
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
    .addLabel('atmosphere', 0.05)
    .addLabel('brandReveal', 0.18)
    .addLabel('handoff', 1.15)
    .addLabel('heroReveal', 1.42)
    .to('.preloader-veil', { autoAlpha: 0.3, duration: 0.5, ease: 'power2.out' }, 'atmosphere')
    .to('.preloader-spot', { autoAlpha: 0.42, scale: 1, duration: 0.62, ease: 'power2.out' }, 'atmosphere')
    .to('.preloader-smoke', { autoAlpha: 0.2, scale: 1, x: 0, y: 0, duration: 0.7, ease: 'power2.out' }, 'atmosphere')
    .to('.preloader-mark', { autoAlpha: 1, y: 0, clipPath: 'inset(0% 0 0 0)', filter: 'blur(0px) contrast(1.04)', scale: 1, duration: 0.65, ease: 'power3.out' }, 'brandReveal')
    .to('.preloader-line', { autoAlpha: 1, scaleX: 1, duration: 0.78, ease: 'power3.inOut' }, 'brandReveal+=0.18')
    .to('.preloader-mark', { scale: 1.006, duration: 0.48, ease: 'sine.inOut' }, 'brandReveal+=0.5')
    .to('.preloader-content', { autoAlpha: 0, y: -8, filter: 'blur(4px)', duration: 0.36, ease: 'power2.inOut' }, 'handoff')
    .to('.preloader-spot', { autoAlpha: 0.12, scale: 1.1, duration: 0.48, ease: 'power2.inOut' }, 'handoff')
    .to('.preloader', { autoAlpha: 0, duration: 0.55, ease: 'power2.inOut' }, 'handoff+=0.04')
    .call(() => {
      document.body.classList.remove('is-loading');
      document.body.classList.add('is-loaded');
    }, null, 'handoff+=0.34')
    .to('.spotlight', { opacity: 0.32, duration: 0.72, ease: 'power2.out' }, 'handoff+=0.12')
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

  gsap.to('.hero-inner', {
    y: touchDevice ? -12 : -28,
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: touchDevice ? 0.6 : 0.85
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
    y: touchDevice ? 6 : 12,
    opacity: 0.86,
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: touchDevice ? 0.5 : 0.9 }
  });

  document.querySelectorAll('[data-reveal]').forEach((item) => {
    const textBits = item.querySelectorAll('.line, .word');
    const section = item.closest('.section');
    const sectionIndex = Math.max(0, sections.indexOf(section));
    const entranceX = touchDevice ? 0 : (sectionIndex % 2 === 0 ? 34 : -34);
    gsap.fromTo(item, {
      autoAlpha: 0,
      x: entranceX,
      y: touchDevice ? 14 : 34,
      clipPath: touchDevice ? 'inset(0 0 0 0)' : 'inset(0 0 14% 0)'
    }, {
      autoAlpha: 1,
      x: 0,
      y: 0,
      clipPath: 'inset(0 0 0% 0)',
      duration: touchDevice ? 0.62 : 0.95,
      ease: 'power4.out',
      scrollTrigger: { trigger: item, start: 'top 86%', once: true }
    });

    if (textBits.length) {
      gsap.from(textBits, {
        yPercent: touchDevice ? 30 : 72,
        autoAlpha: 0,
        rotateX: touchDevice ? 0 : -18,
        transformOrigin: '50% 100%',
        stagger: touchDevice ? 0.022 : 0.045,
        duration: touchDevice ? 0.56 : 0.82,
        ease: 'power4.out',
        scrollTrigger: { trigger: item, start: 'top 86%', once: true }
      });
    }
  });

  gsap.utils.toArray('[data-card]').forEach((card, index) => {
    gsap.fromTo(card, {
      autoAlpha: 0,
      y: touchDevice ? 18 : 52,
      scale: touchDevice ? 0.985 : 0.94,
      rotateY: touchDevice ? 0 : (index % 2 === 0 ? -5 : 5),
      transformOrigin: '50% 100%'
    }, {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      rotateY: 0,
      duration: touchDevice ? 0.62 : 0.92,
      delay: index * (touchDevice ? 0.035 : 0.075),
      ease: 'power4.out',
      scrollTrigger: { trigger: card, start: 'top 90%', once: true }
    });

    const paths = card.querySelectorAll('path, rect');
    paths.forEach((path) => {
      const length = path.getTotalLength?.() || 80;
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
      gsap.to(path, {
        strokeDashoffset: 0,
        duration: touchDevice ? 0.8 : 1.15,
        ease: 'power3.out',
        scrollTrigger: { trigger: card, start: 'top 86%', once: true }
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
        gsap.fromTo(step, {
          autoAlpha: 0,
          x: touchDevice ? 0 : -26,
          y: touchDevice ? 16 : 30,
          scale: 0.97
        }, {
          autoAlpha: 1,
          x: 0,
          y: 0,
          scale: 1,
          duration: touchDevice ? 0.58 : 0.82,
          ease: 'power4.out'
        });
        const number = step.querySelector('.process-number');
        const finalValue = Number(step.dataset.final || index + 1);
        gsap.fromTo({ value: 0 }, { value: 0 }, {
          value: finalValue,
          duration: touchDevice ? 0.55 : 0.75,
          ease: 'power3.out',
          onUpdate() {
            number.textContent = String(Math.round(this.targets()[0].value)).padStart(2, '0');
          }
        });
      }
    });
  });

  gsap.utils.toArray('.audience-grid article, .quality-points span').forEach((item, index) => {
    gsap.fromTo(item, {
      autoAlpha: 0,
      y: touchDevice ? 14 : 38,
      scale: touchDevice ? 0.985 : 0.95,
      clipPath: touchDevice ? 'inset(0)' : 'inset(12% 0 0 0)'
    }, {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      clipPath: 'inset(0% 0 0 0)',
      duration: touchDevice ? 0.56 : 0.78,
      delay: index * (touchDevice ? 0.03 : 0.065),
      ease: 'power4.out',
      scrollTrigger: { trigger: item, start: 'top 90%', once: true }
    });
  });

  const selectedWork = document.querySelector('[data-showcase]');
  if (selectedWork) {
    const showcaseTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: selectedWork,
        start: 'top 82%',
        once: true
      }
    });

    showcaseTimeline
      .fromTo(selectedWork, {
        autoAlpha: 0,
        y: touchDevice ? 24 : 70,
        scale: touchDevice ? 0.99 : 0.96
      }, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: touchDevice ? 0.72 : 1.05,
        ease: 'power4.out'
      })
      .from('.selected-work-copy > *', {
        autoAlpha: 0,
        y: touchDevice ? 14 : 28,
        stagger: touchDevice ? 0.045 : 0.075,
        duration: touchDevice ? 0.5 : 0.7,
        ease: 'power3.out'
      }, touchDevice ? '-=0.42' : '-=0.68')
      .from('.dashboard-frame', {
        autoAlpha: 0,
        x: touchDevice ? 24 : 90,
        rotateY: touchDevice ? -4 : -20,
        duration: touchDevice ? 0.72 : 1.08,
        ease: 'power4.out'
      }, touchDevice ? '-=0.48' : '-=0.78')
      .from('.phone-frame', {
        autoAlpha: 0,
        x: touchDevice ? 18 : 54,
        y: touchDevice ? 18 : 46,
        rotate: 12,
        duration: touchDevice ? 0.68 : 0.92,
        ease: 'back.out(1.25)'
      }, '-=0.6')
      .from('.chart-bars i', {
        scaleY: 0,
        transformOrigin: 'bottom',
        stagger: 0.045,
        duration: 0.55,
        ease: 'power3.out'
      }, '-=0.55')
      .from('.showcase-note', {
        autoAlpha: 0,
        scale: 0.8,
        stagger: 0.08,
        duration: 0.45,
        ease: 'back.out(1.5)'
      }, '-=0.35');
  }

  gsap.fromTo('.contact', {
    autoAlpha: 0,
    y: touchDevice ? 18 : 58,
    scale: touchDevice ? 0.99 : 0.96,
    clipPath: touchDevice ? 'inset(0)' : 'inset(10% 4% 10% 4%)'
  }, {
    autoAlpha: 1,
    y: 0,
    scale: 1,
    clipPath: 'inset(0% 0% 0% 0%)',
    duration: touchDevice ? 0.7 : 1.05,
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
