import type { ReactNode } from 'react';

export default function MainLayout({ children }: { children: ReactNode }) {
  return <main className="max-w-7xl mx-auto px-[5%] pt-12 pb-0">{children}</main>;
}
