import type { Metadata } from 'next';
import { Playfair_Display, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
  axes: ['opsz'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'BiblioFlow — Portal del Socio',
    template: '%s | BiblioFlow',
  },
  description: 'Accede al catálogo, gestiona tus préstamos y reserva espacios en tu biblioteca.',
  keywords: ['biblioteca', 'catálogo', 'préstamos', 'libros', 'BiblioFlow'],
  authors: [{ name: 'Isabella UCC' }],
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: 'BiblioFlow',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${playfair.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        {/* Subtle noise overlay for depth */}
        <div className="noise-overlay" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
