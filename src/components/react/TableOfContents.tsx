import React, { useState, useEffect, useCallback, useRef } from 'react';

interface Heading {
  depth: number;
  slug: string;
  text: string;
}

interface TableOfContentsProps {
  headings: Heading[];
}

export default function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const headingElementsRef = useRef<Map<string, IntersectionObserverEntry>>(new Map());

  // Filter to only h2 and h3 headings
  const filteredHeadings = headings.filter((h) => h.depth === 2 || h.depth === 3);

  // Set up intersection observer to track active section
  useEffect(() => {
    const callback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        headingElementsRef.current.set(entry.target.id, entry);
      });

      // Find the first visible heading
      const visibleHeadings: IntersectionObserverEntry[] = [];
      headingElementsRef.current.forEach((entry) => {
        if (entry.isIntersecting) {
          visibleHeadings.push(entry);
        }
      });

      if (visibleHeadings.length > 0) {
        // Sort by position on page and get the topmost
        const sorted = visibleHeadings.sort(
          (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
        );
        setActiveId(sorted[0].target.id);
      } else {
        // No visible headings - find the one most recently scrolled past
        const allEntries = Array.from(headingElementsRef.current.values());
        const aboveViewport = allEntries.filter(
          (entry) => entry.boundingClientRect.top < 0
        );
        if (aboveViewport.length > 0) {
          const sorted = aboveViewport.sort(
            (a, b) => b.boundingClientRect.top - a.boundingClientRect.top
          );
          setActiveId(sorted[0].target.id);
        }
      }
    };

    observerRef.current = new IntersectionObserver(callback, {
      rootMargin: '-80px 0px -60% 0px',
      threshold: [0, 0.5, 1],
    });

    // Observe all headings
    filteredHeadings.forEach((heading) => {
      const element = document.getElementById(heading.slug);
      if (element) {
        observerRef.current?.observe(element);
      }
    });

    return () => {
      observerRef.current?.disconnect();
      headingElementsRef.current.clear();
    };
  }, [filteredHeadings]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, slug: string) => {
      e.preventDefault();
      const element = document.getElementById(slug);
      if (element) {
        // Update URL hash
        window.history.pushState(null, '', `#${slug}`);
        // Scroll to element with offset for fixed header
        const yOffset = -100;
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
        setActiveId(slug);
        // Close drawer on mobile
        setIsDrawerOpen(false);
      }
    },
    []
  );

  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen((prev) => !prev);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  // Close drawer on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  if (filteredHeadings.length === 0) {
    return null;
  }

  const renderLinks = () => (
    <ul className="toc-list">
      {filteredHeadings.map((heading) => (
        <li
          key={heading.slug}
          className={`toc-item toc-depth-${heading.depth}`}
        >
          <a
            href={`#${heading.slug}`}
            onClick={(e) => handleClick(e, heading.slug)}
            className={`toc-link ${activeId === heading.slug ? 'toc-active' : ''}`}
            data-active={activeId === heading.slug ? 'true' : 'false'}
          >
            <span className="toc-indicator">{heading.depth === 2 ? '>' : '>>'}</span>
            <span className="toc-text">{heading.text}</span>
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="toc-sidebar" data-toc-sidebar>
        <div className="toc-header">
          <span className="toc-title">$ contents</span>
        </div>
        {renderLinks()}
      </aside>

      {/* Mobile FAB */}
      <button
        className="toc-mobile-button"
        data-toc-mobile-button
        onClick={toggleDrawer}
        aria-label="Open table of contents"
        aria-expanded={isDrawerOpen}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="toc-icon"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="15" y2="12" />
          <line x1="3" y1="18" x2="18" y2="18" />
        </svg>
      </button>

      {/* Mobile Drawer */}
      <div
        className={`toc-drawer-overlay ${isDrawerOpen ? 'toc-drawer-open' : ''}`}
        onClick={closeDrawer}
      />
      <div
        className={`toc-drawer ${isDrawerOpen ? 'toc-drawer-open' : ''}`}
        data-toc-drawer
      >
        <div className="toc-drawer-header">
          <span className="toc-title">$ contents</span>
          <button
            className="toc-drawer-close"
            onClick={closeDrawer}
            aria-label="Close table of contents"
          >
            &times;
          </button>
        </div>
        {renderLinks()}
      </div>

      <style>{`
        /* Desktop Sidebar */
        .toc-sidebar {
          position: fixed;
          left: max(1rem, calc((100vw - 1200px) / 2 - 280px));
          top: 120px;
          width: 240px;
          max-height: calc(100vh - 160px);
          overflow-y: auto;
          background: var(--slate-900);
          border: 1px solid var(--slate-800);
          border-radius: 8px;
          padding: 1rem;
          z-index: 50;
          scrollbar-width: thin;
          scrollbar-color: var(--slate-700) transparent;
        }

        .toc-sidebar::-webkit-scrollbar {
          width: 6px;
        }

        .toc-sidebar::-webkit-scrollbar-track {
          background: transparent;
        }

        .toc-sidebar::-webkit-scrollbar-thumb {
          background: var(--slate-700);
          border-radius: 3px;
        }

        .toc-header {
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--slate-800);
        }

        .toc-title {
          color: var(--terminal-cyan);
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .toc-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .toc-item {
          margin: 0.25rem 0;
        }

        .toc-depth-3 {
          margin-left: 1rem;
        }

        .toc-link {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          color: var(--terminal-gray);
          text-decoration: none;
          font-size: 0.8rem;
          line-height: 1.4;
          padding: 0.35rem 0.5rem;
          border-radius: 4px;
          transition: all 0.2s ease;
          border-left: 2px solid transparent;
        }

        .toc-link:hover {
          color: var(--terminal-green);
          background: rgba(34, 197, 94, 0.1);
        }

        .toc-link.toc-active {
          color: var(--terminal-green);
          border-left-color: var(--terminal-green);
          background: rgba(34, 197, 94, 0.1);
        }

        .toc-indicator {
          color: var(--terminal-cyan);
          flex-shrink: 0;
          font-family: 'JetBrains Mono', monospace;
        }

        .toc-active .toc-indicator {
          color: var(--terminal-yellow);
        }

        .toc-text {
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        /* Mobile FAB - hidden on desktop */
        .toc-mobile-button {
          display: none;
        }

        /* Mobile Drawer - hidden on desktop */
        .toc-drawer-overlay,
        .toc-drawer {
          display: none;
        }

        /* Mobile Styles */
        @media (max-width: 1400px) {
          .toc-sidebar {
            display: none;
          }

          .toc-mobile-button {
            display: flex;
            position: fixed;
            bottom: 1.5rem;
            left: 1.5rem;
            width: 48px;
            height: 48px;
            background: var(--slate-900);
            border: 2px solid var(--terminal-cyan);
            border-radius: 50%;
            color: var(--terminal-cyan);
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 90;
            box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
            transition: all 0.2s ease;
          }

          .toc-mobile-button:hover {
            background: var(--terminal-cyan);
            color: var(--slate-950);
            transform: scale(1.05);
          }

          .toc-icon {
            width: 22px;
            height: 22px;
          }

          .toc-drawer-overlay {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(2, 6, 23, 0.9);
            backdrop-filter: blur(4px);
            z-index: 998;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
          }

          .toc-drawer-overlay.toc-drawer-open {
            opacity: 1;
            visibility: visible;
          }

          .toc-drawer {
            display: flex;
            flex-direction: column;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            max-height: 70vh;
            background: var(--slate-900);
            border-top: 2px solid var(--terminal-cyan);
            border-radius: 16px 16px 0 0;
            z-index: 999;
            transform: translateY(100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow: hidden;
          }

          .toc-drawer.toc-drawer-open {
            transform: translateY(0);
          }

          .toc-drawer-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 1.5rem;
            border-bottom: 1px solid var(--slate-800);
            flex-shrink: 0;
          }

          .toc-drawer-close {
            width: 32px;
            height: 32px;
            background: var(--slate-800);
            border: 1px solid var(--terminal-cyan);
            border-radius: 4px;
            color: var(--terminal-cyan);
            font-size: 1.5rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
            transition: all 0.2s ease;
          }

          .toc-drawer-close:hover {
            background: var(--terminal-cyan);
            color: var(--slate-950);
          }

          .toc-drawer .toc-list {
            padding: 1rem 1.5rem;
            overflow-y: auto;
            flex: 1;
          }

          .toc-drawer .toc-link {
            padding: 0.75rem 0.5rem;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </>
  );
}
