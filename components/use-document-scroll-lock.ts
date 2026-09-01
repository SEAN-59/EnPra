'use client';

import { useLayoutEffect } from 'react';

let lockCount = 0;
let savedState: { bodyCssText: string; htmlCssText: string; scrollY: number } | null = null;

export function useDocumentScrollLock(locked: boolean) {
  useLayoutEffect(() => {
    if (!locked) return;

    const { body, documentElement } = document;
    if (lockCount === 0) {
      savedState = { bodyCssText: body.style.cssText, htmlCssText: documentElement.style.cssText, scrollY: window.scrollY };
      body.style.position = 'fixed';
      body.style.top = `-${savedState.scrollY}px`;
      body.style.left = '0';
      body.style.right = '0';
      body.style.width = '100%';
      body.style.overflow = 'hidden';
      documentElement.style.overflow = 'hidden';
    }
    lockCount += 1;

    return () => {
      lockCount -= 1;
      if (lockCount !== 0 || !savedState) return;
      const state = savedState;
      body.style.cssText = state.bodyCssText;
      documentElement.style.cssText = state.htmlCssText;
      savedState = null;
      window.scrollTo(0, state.scrollY);
    };
  }, [locked]);
}
