import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

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
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-cover bg-center bg-fixed" style={{backgroundImage: "url('/globe-bg.jpg')"}}>
        <div className="absolute inset-0 bg-black/50" />
        <main className="relative z-10">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
