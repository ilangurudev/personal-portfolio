type MotionTarget = HTMLElement & {
  dataset: DOMStringMap & {
    photoReveal?: string;
    photoRevealKey?: string;
    photoRevealState?: string;
    photoId?: string;
  };
};

const TARGET_SELECTOR = '[data-photo-reveal]';

function getMotionTargets(node: Node): MotionTarget[] {
  if (!(node instanceof Element)) return [];

  const targets: MotionTarget[] = [];
  if (node.matches(TARGET_SELECTOR)) targets.push(node as MotionTarget);
  targets.push(...Array.from(node.querySelectorAll<MotionTarget>(TARGET_SELECTOR)));
  return targets;
}

export function setupPhotoMotion(): void {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const supportsObserver = 'IntersectionObserver' in window;
  const seenKeys = new Set<string>();

  const revealImmediately = (target: MotionTarget) => {
    target.dataset.photoRevealState = 'visible';
  };

  if (reducedMotion.matches || !supportsObserver) {
    root.dataset.photoMotion = 'reduced';
    document.querySelectorAll<MotionTarget>(TARGET_SELECTOR).forEach(revealImmediately);

    const reducedObserver = new MutationObserver(records => {
      records.forEach(record => record.addedNodes.forEach(node => {
        getMotionTargets(node).forEach(revealImmediately);
      }));
    });
    reducedObserver.observe(document.body, { childList: true, subtree: true });
    return;
  }

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const target = entry.target as MotionTarget;
      const key = target.dataset.photoRevealKey || target.dataset.photoId;
      if (key) seenKeys.add(key);
      revealImmediately(target);
      revealObserver.unobserve(target);
    });
  }, {
    rootMargin: '0px 0px -10% 0px',
    threshold: 0.06,
  });

  const register = (target: MotionTarget) => {
    if (target.dataset.photoRevealState === 'visible') return;
    const key = target.dataset.photoRevealKey || target.dataset.photoId;
    if (key && seenKeys.has(key)) {
      revealImmediately(target);
      return;
    }
    revealObserver.observe(target);
  };

  document.querySelectorAll<MotionTarget>(TARGET_SELECTOR).forEach(register);

  const mutationObserver = new MutationObserver(records => {
    records.forEach(record => record.addedNodes.forEach(node => {
      getMotionTargets(node).forEach(register);
    }));
  });
  mutationObserver.observe(document.body, { childList: true, subtree: true });

  root.dataset.photoMotion = 'ready';
}
