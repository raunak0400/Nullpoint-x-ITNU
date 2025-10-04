
'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { AnimatedLayout } from '@/components/animated-layout';

export function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex font-body overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 gap-6 h-screen overflow-y-auto">
        <Header />
        <AnimatedLayout>{children}</AnimatedLayout>
      </div>
    </div>
  );
}
