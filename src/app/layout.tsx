
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from '@/components/theme-provider';
import { AnimatedLayout } from '@/components/animated-layout';

export const metadata: Metadata = {
  title: 'AuroraAir',
  description: 'A futuristic air-quality forecast experience.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <ThemeProvider>
        <body className="font-body antialiased bg-cover bg-center bg-fixed" style={{backgroundImage: "url('/globe-bg.jpg')"}}>
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm" />
          <main className="relative z-10">
            <AnimatedLayout>{children}</AnimatedLayout>
          </main>
          <Toaster />
        </body>
      </ThemeProvider>
    </html>
  );
}
