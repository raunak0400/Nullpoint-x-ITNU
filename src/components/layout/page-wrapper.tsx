'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { ThemeProvider } from '@/components/theme-provider';
import { Providers } from '@/components/layout/providers';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CustomScrollbar } from '../custom-scrollbar';

export function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <Providers>
        <div className="h-screen flex font-body overflow-hidden">
          <Sidebar />
          <ScrollArea className="flex-1 h-screen">
            <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 gap-6">
              <Header />
              {children}
            </div>
          </ScrollArea>
          <CustomScrollbar />
        </div>
      </Providers>
    </ThemeProvider>
  );
}
