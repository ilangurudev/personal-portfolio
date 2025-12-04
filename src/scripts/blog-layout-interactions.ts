type BlogEnv = {
  document: Document;
  window: Window & typeof globalThis;
};

const isImageTarget = (target: EventTarget | null): target is Element =>
  target instanceof Element && Boolean(target.closest('img'));

function getEnv(env?: Partial<BlogEnv>): BlogEnv | null {
  if (env?.document && env?.window) {
    return env as BlogEnv;
  }

  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return null;
  }

  return {
    document,
    window,
  };
}

export function initImageGuards(env?: Partial<BlogEnv>) {
  const context = getEnv(env);
  if (!context) return;

  const { document: doc } = context;

  const blockImageEvent = (event: Event) => {
    if (isImageTarget(event.target)) {
      event.preventDefault();
    }
  };

  const markImagesUndraggable = () => {
    doc.querySelectorAll('img').forEach(img => {
      if (!img.hasAttribute('draggable')) {
        img.setAttribute('draggable', 'false');
      }
    });
  };

  doc.addEventListener('contextmenu', blockImageEvent);
  doc.addEventListener('dragstart', blockImageEvent);

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', markImagesUndraggable, { once: true });
  } else {
    markImagesUndraggable();
  }

  const observer = new MutationObserver(mutations => {
    if (mutations.some(mutation => mutation.addedNodes.length > 0)) {
      markImagesUndraggable();
    }
  });

  observer.observe(doc.documentElement, {
    childList: true,
    subtree: true,
  });
}

export function initMobileMenuControls(env?: Partial<BlogEnv>) {
  const context = getEnv(env);
  if (!context) return;

  const { document: doc } = context;
  const hamburgerBtn = doc.getElementById('blog-hamburger-btn');
  const mobileMenu = doc.getElementById('blog-mobile-menu');
  const mobileMenuClose = doc.getElementById('blog-mobile-menu-close');
  const mobileMenuOverlay = doc.getElementById('blog-mobile-menu-overlay');

  if (!mobileMenu) return;

  const openMobileMenu = () => {
    mobileMenu.classList.add('active');
    if (doc.body) {
      doc.body.style.overflow = 'hidden';
    }
  };

  const closeMobileMenu = () => {
    mobileMenu.classList.remove('active');
    if (doc.body) {
      doc.body.style.overflow = '';
    }
  };

  hamburgerBtn?.addEventListener('click', openMobileMenu);
  mobileMenuClose?.addEventListener('click', closeMobileMenu);
  mobileMenuOverlay?.addEventListener('click', closeMobileMenu);

  doc.addEventListener('keydown', event => {
    if (event.key === 'Escape' && mobileMenu.classList.contains('active')) {
      closeMobileMenu();
    }
  });
}

export function initBlogLayoutInteractions(env?: Partial<BlogEnv>) {
  initImageGuards(env);
  initMobileMenuControls(env);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  initBlogLayoutInteractions();
}
