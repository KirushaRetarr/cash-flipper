'use client';

import { usePathname } from 'next/navigation';
import Header from './header/Header';

export default function ConditionalHeader() {
  const pathname = usePathname();

  const hideHeaderPaths = ['/login', '/registration'];

  const shouldHideHeader = hideHeaderPaths.includes(pathname);

  if (shouldHideHeader) return null;
  
  return <Header />;
}