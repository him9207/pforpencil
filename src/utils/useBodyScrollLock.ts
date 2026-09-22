import { useEffect } from 'react';
import { lockBodyScroll, unlockBodyScroll } from './scrollLock';

/**
 * React hook to lock body scrolling when a modal or drawer is open on mobile and desktop.
 * Automatically restores background scroll when the component unmounts or isLocked becomes false.
 */
export function useBodyScrollLock(isLocked: boolean = true): void {
  useEffect(() => {
    if (!isLocked) return;
    lockBodyScroll();
    return () => {
      unlockBodyScroll();
    };
  }, [isLocked]);
}
