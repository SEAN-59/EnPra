'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type CopyValue = { text?: unknown };
type CopyDocument = { screens?: Record<string, Record<string, CopyValue>> };

const StaticCopyContext = createContext<CopyDocument>({});

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

  return <StaticCopyContext.Provider value={document}>{children}</StaticCopyContext.Provider>;
}

export function useStaticCopy(screenKey: string, variableName: string, fallback: string) {
  const document = useContext(StaticCopyContext);
  return useMemo(() => {
    const value = document.screens?.[screenKey]?.[variableName]?.text;
    return typeof value === 'string' && value.trim() ? value : fallback;
  }, [document, fallback, screenKey, variableName]);
}
