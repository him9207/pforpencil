/**
 * High-performance, cross-platform body scroll lock for mobile (iOS Safari & Android Chrome) and desktop.
 * Uses the industry standard position:fixed + scroll compensation technique to prevent background scroll chaining.
 */

let lockCount = 0;
let originalOverflow = '';
let originalPosition = '';
let originalTop = '';
let originalWidth = '';
let originalTouchAction = '';
let scrollY = 0;

export function lockBodyScroll(): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  lockCount++;
  if (lockCount === 1) {
    scrollY = window.scrollY || window.pageYOffset || 0;
    originalOverflow = document.body.style.overflow;
    originalPosition = document.body.style.position;
    originalTop = document.body.style.top;
    originalWidth = document.body.style.width;
    originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.touchAction = 'none';
    document.body.classList.add('modal-open');
  }
}

export function unlockBodyScroll(): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = originalOverflow;
    document.body.style.position = originalPosition;
    document.body.style.top = originalTop;
    document.body.style.width = originalWidth;
    document.body.style.touchAction = originalTouchAction;
    document.body.classList.remove('modal-open');
    window.scrollTo(0, scrollY);
  }
}
