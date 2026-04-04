import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/layout/sidebar';
import TopBar from '@/components/layout/topbar';

export const metadata: Metadata = {
  title: {
    default: 'BiblioFlow — Intranet Bibliotecaria',
    template: '%s | BiblioFlow Staff',
  },
  description: 'Panel de administración y operaciones para el personal bibliotecario de BiblioFlow.',
  robots: 'noindex, nofollow',
  authors: [{ name: 'Isabella UCC' }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="flex h-screen overflow-hidden">
        {/* Animated scan line */}
        <div className="scanline" aria-hidden="true" />

        {/* Sidebar */}
        <Sidebar />

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-6 bg-surface-base">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
