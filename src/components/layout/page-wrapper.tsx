'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { ThemeProvider } from '@/components/theme-provider';
import { Providers } from '@/components/layout/providers';

export function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <Providers>
        <div className="h-screen flex font-body overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 gap-6 h-screen overflow-y-auto">
            <Header />
            {children}
          </div>
        </div>
      </Providers>
    </ThemeProvider>
  );
}
