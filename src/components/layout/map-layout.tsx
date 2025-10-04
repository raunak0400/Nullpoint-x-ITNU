'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { ThemeProvider } from '@/components/theme-provider';
import { Providers } from '@/components/layout/providers';

export function MapLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <Providers>
        <div className="h-screen flex font-body overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <div className='p-4 md:p-6 lg:p-8'>
                <Header />
            </div>
            <div className="flex-1 pb-4 md:pb-6 lg:pb-8 px-4 md:px-6 lg:px-8 h-full">
              {children}
            </div>
          </div>
        </div>
      </Providers>
    </ThemeProvider>
  );
}
