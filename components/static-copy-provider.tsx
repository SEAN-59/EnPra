'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type CopyValue = { sourceText?: unknown; text?: unknown };
type CopyDocument = { screens?: Record<string, Record<string, CopyValue>> };

const StaticCopyContext = createContext<CopyDocument>({});

function screenKeysForPath(pathname: string) {
  const keys = ['common.shell'];
  if (pathname === '/') return [...keys, 'home.landing', 'home.dashboard'];
  if (pathname === '/connect') return [...keys, 'connect'];
  if (pathname === '/mypage') return [...keys, 'mypage'];
  if (pathname === '/admin') return [...keys, 'admin', 'manage.copy'];
  if (pathname === '/voca') return [...keys, 'voca.board'];
  if (pathname.startsWith('/voca/list')) return [...keys, 'voca.list'];
  if (pathname === '/writing') return [...keys, 'writing.common', 'writing.board', 'writing.ui'];
  if (pathname === '/writing/practice') return [...keys, 'writing.common', 'writing.practice', 'writing.ui'];
  if (pathname === '/writing/placement') return [...keys, 'writing.placement', 'writing.ui'];
  if (pathname === '/writing/notebook') return [...keys, 'writing.common', 'writing.notebook', 'writing.ui'];
  if (pathname.startsWith('/writing/session/')) return [...keys, 'writing.session', 'writing.ui'];
  if (pathname === '/speaking') return [...keys, 'speaking.common', 'speaking.board'];
  if (pathname === '/speaking/practice') return [...keys, 'speaking.common', 'speaking.practice'];
  if (pathname === '/speaking/notebook') return [...keys, 'speaking.common', 'speaking.notebook'];
  if (pathname.startsWith('/speaking/part1')) return [...keys, 'speaking.part1'];
  if (pathname.startsWith('/speaking/part2')) return [...keys, 'speaking.part2'];
  if (pathname.startsWith('/speaking/part3')) return [...keys, 'speaking.part3'];
  return keys;
}

function normalized(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

export function StaticCopyProvider({ children }: { children: React.ReactNode }) {
  const [document, setDocument] = useState<CopyDocument>({});

  useEffect(() => {
    let active = true;
    void fetch('/api/ui-copy', { cache: 'no-store' })
      .then(async (response) => response.ok ? response.json() as Promise<CopyDocument> : null)
      .then((next) => { if (active && next?.screens) setDocument(next); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!document.screens || typeof window === 'undefined' || !document.body) return;
    const replacements = new Map<string, string>();
    for (const screenKey of screenKeysForPath(window.location.pathname)) {
      for (const value of Object.values(document.screens[screenKey] ?? {})) {
        const sourceText = typeof value.sourceText === 'string' ? normalized(value.sourceText) : '';
        const text = typeof value.text === 'string' ? value.text.trim() : '';
        if (sourceText && text && sourceText !== text) replacements.set(sourceText, text);
      }
    }
    if (!replacements.size) return;

    const applied = new WeakMap<Text, string>();
    const applyText = (node: Text) => {
      const sourceText = normalized(node.data);
      const replacement = replacements.get(sourceText);
      if (!replacement || applied.get(node) === replacement) return;
      node.data = replacement;
      applied.set(node, replacement);
    };
    const applyTree = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE) applyText(root as Text);
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        applyText(node as Text);
        node = walker.nextNode();
      }
    };
    applyTree(document.body);
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === 'characterData') applyText(record.target as Text);
        else record.addedNodes.forEach((node) => applyTree(node));
      }
    });
    observer.observe(document.body, { childList: true, characterData: true, subtree: true });
    return () => observer.disconnect();
  }, [document]);

  return <StaticCopyContext.Provider value={document}>{children}</StaticCopyContext.Provider>;
}

export function useStaticCopy(screenKey: string, variableName: string, fallback: string) {
  const document = useContext(StaticCopyContext);
  return useMemo(() => {
    const value = document.screens?.[screenKey]?.[variableName]?.text;
    return typeof value === 'string' && value.trim() ? value : fallback;
  }, [document, fallback, screenKey, variableName]);
}
