'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { reportPage } from '@/lib/metrika.mjs';

export default function Metrika() {
  const pathname = usePathname();

  useEffect(() => {
    reportPage(window, document, pathname, process.env.NODE_ENV === 'production');
  }, [pathname]);

  return null;
}
