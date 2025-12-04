import { describe, it, beforeEach, expect } from 'vitest';
import { fireEvent, waitFor } from '@testing-library/dom';
import { initBlogLayoutInteractions } from '../../src/scripts/blog-layout-interactions';

const buildMenuDom = () => {
  document.body.innerHTML = `
    <button id="blog-hamburger-btn">menu</button>
    <div id="blog-mobile-menu" class="mobile-menu">
      <div id="blog-mobile-menu-overlay"></div>
      <button id="blog-mobile-menu-close">close</button>
    </div>
  `;
};

const buildImageDom = () => {
  document.body.innerHTML = `
    <img src="/guru.png" alt="guru" />
    <p>regular text</p>
  `;
};

describe('initBlogLayoutInteractions - mobile menu', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('toggles the mobile drawer via button and overlay clicks', () => {
    buildMenuDom();
    initBlogLayoutInteractions();

    const trigger = document.getElementById('blog-hamburger-btn')!;
    const drawer = document.getElementById('blog-mobile-menu')!;
    const overlay = document.getElementById('blog-mobile-menu-overlay')!;
    const close = document.getElementById('blog-mobile-menu-close')!;

    fireEvent.click(trigger);
    expect(drawer.classList.contains('active')).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.click(overlay);
    expect(drawer.classList.contains('active')).toBe(false);
    expect(document.body.style.overflow).toBe('');

    fireEvent.click(trigger);
    expect(drawer.classList.contains('active')).toBe(true);

    fireEvent.click(close);
    expect(drawer.classList.contains('active')).toBe(false);
  });

  it('closes the menu when Escape is pressed', () => {
    buildMenuDom();
    initBlogLayoutInteractions();

    const trigger = document.getElementById('blog-hamburger-btn')!;
    const drawer = document.getElementById('blog-mobile-menu')!;

    fireEvent.click(trigger);
    expect(drawer.classList.contains('active')).toBe(true);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(drawer.classList.contains('active')).toBe(false);
  });
});

describe('initBlogLayoutInteractions - image guards', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('prevents context menu and drag events on images only', () => {
    buildImageDom();
    initBlogLayoutInteractions();

    const img = document.querySelector('img')!;
    const paragraph = document.querySelector('p')!;

    const contextMenu = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    const dragStart = new Event('dragstart', { bubbles: true, cancelable: true });

    expect(img.dispatchEvent(contextMenu)).toBe(false);
    expect(img.dispatchEvent(dragStart)).toBe(false);

    const ctxNonImage = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    expect(paragraph.dispatchEvent(ctxNonImage)).toBe(true);
  });

  it('marks new images as undraggable via MutationObserver', async () => {
    document.body.innerHTML = '<div id="gallery"></div>';
    initBlogLayoutInteractions();

    const container = document.getElementById('gallery')!;
    const img = document.createElement('img');
    container.appendChild(img);

    await waitFor(() => {
      expect(img.getAttribute('draggable')).toBe('false');
    });
  });
});
