'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { BookOpen, Menu, X, User, Search, LogOut, LayoutDashboard } from 'lucide-react';

interface Session {
  sub: string;
  fullName: string;
  role: string;
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const userCookie = document.cookie.split('; ').find((r) => r.startsWith('bf_user='));
    if (userCookie) {
      try {
        const raw = decodeURIComponent(userCookie.split('=').slice(1).join('='));
        setSession(JSON.parse(raw) as Session);
      } catch { /* cookie malformada */ }
    }
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setSession(null);
    window.location.href = '/';
  };

  const navLinks = [
    { href: '/search',    label: 'Catálogo'      },
    { href: '/spaces',    label: 'Salas'         },
    { href: '/about',     label: 'La biblioteca' },
  ];

  const primerNombre = session?.fullName?.split(' ')[0] ?? '';

  return (
    <header className="sticky top-0 z-50 border-b border-parchment-dark/50 bg-parchment/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-ink transition-colors group-hover:bg-ink-light">
            <BookOpen className="h-4 w-4 text-parchment" />
          </div>
          <span className="font-display text-lg font-semibold text-ink">
            Biblio<span className="text-amber-book">Flow</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="font-body text-sm text-ink-muted transition-colors hover:text-ink">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* CTA area */}
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/search" className="p-2 text-ink-muted hover:text-ink transition-colors">
            <Search className="h-4 w-4" />
          </Link>

          {session ? (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 rounded-sm border border-ink/15 px-3 py-2 font-body text-sm text-ink transition-colors hover:border-amber-book/50 hover:text-amber-book"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                {primerNombre}
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-sm p-2 text-ink-muted transition-colors hover:text-rust"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <Link href="/login" className="btn-secondary text-sm py-2 px-4">Acceder</Link>
              <Link href="/register" className="btn-primary text-sm py-2 px-4">Hacerme socio</Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="rounded-sm p-2 text-ink-muted hover:text-ink md:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-ink/10 bg-parchment-light px-6 py-4 md:hidden">
          <ul className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="font-body text-sm text-ink" onClick={() => setOpen(false)}>
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="border-t border-ink/10 pt-4">
              {session ? (
                <div className="flex flex-col gap-3">
                  <Link href="/dashboard" className="flex items-center gap-2 font-body text-sm text-ink" onClick={() => setOpen(false)}>
                    <User className="h-4 w-4" /> {session.fullName}
                  </Link>
                  <button onClick={handleLogout} className="flex items-center gap-2 font-body text-sm text-rust">
                    <LogOut className="h-4 w-4" /> Cerrar sesión
                  </button>
                </div>
              ) : (
                <>
                  <Link href="/login" className="block font-body text-sm text-ink-muted mb-3" onClick={() => setOpen(false)}>
                    Acceder
                  </Link>
                  <Link href="/register" className="btn-amber w-full justify-center" onClick={() => setOpen(false)}>
                    Hacerme socio
                  </Link>
                </>
              )}
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
