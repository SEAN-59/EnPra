'use client';

import { ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

type AdminNavigationLinkProps = {
  active: boolean;
  closeMenu?: () => void;
};

const cacheKey = 'enpra-admin-access';

export function AdminNavigationLink({ active, closeMenu }: AdminNavigationLinkProps) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (window.sessionStorage.getItem(cacheKey) === 'admin') {
      setIsAdmin(true);
      return;
    }

    let live = true;
    void fetch('/api/admin/access', { cache: 'no-store' })
      .then(async (response) => ({ response, body: await response.json() as { isAdmin?: unknown } }))
      .then(({ response, body }) => {
        if (!live || !response.ok || body.isAdmin !== true) return;
        window.sessionStorage.setItem(cacheKey, 'admin');
        setIsAdmin(true);
      })
      .catch(() => undefined);

    return () => { live = false; };
  }, []);

  if (!isAdmin) return null;

  return (
    <>
      <div className="my-3 border-t border-[#dfd8cb]" aria-hidden="true" />
      <a onClick={closeMenu} href="/admin" className={active ? 'flex items-center gap-3 rounded-lg bg-[#e9e5dc] px-3 py-2.5 text-sm font-semibold' : 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#66706d] hover:bg-[#ebe7dd]'}>
        <ShieldCheck className={active ? 'size-4 text-[#e9784f]' : 'size-4'} aria-hidden="true" />MANAGE
      </a>
    </>
  );
}
