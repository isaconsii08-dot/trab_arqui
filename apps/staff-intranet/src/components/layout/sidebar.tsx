'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  RefreshCw,
  Users,
  ShoppingCart,
  MapPin,
  BarChart2,
  Settings,
  LogOut,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/',              icon: LayoutDashboard, label: 'Dashboard'    },
  { href: '/circulation',   icon: RefreshCw,       label: 'Circulación', badge: 'prestamos' },
  { href: '/catalog',       icon: BookOpen,        label: 'Catálogo'    },
  { href: '/patrons',       icon: Users,           label: 'Socios'      },
  { href: '/acquisitions',  icon: ShoppingCart,    label: 'Adquisiciones' },
  { href: '/spaces',        icon: MapPin,          label: 'Salas'       },
  { href: '/analytics',     icon: BarChart2,       label: 'Estadísticas' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [pendientes, setPendientes] = useState(0);

  useEffect(() => {
    const fetchPendientes = () => {
      fetch('/api/prestamos')
        .then((r) => r.json())
        .then((data: Array<{ estado: string }>) => {
          setPendientes(data.filter((s) => s.estado === 'pendiente').length);
        })
        .catch(() => {});
    };
    fetchPendientes();
    const interval = setInterval(fetchPendientes, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-surface-border bg-surface-card">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-surface-border px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-accent-green/15">
            <BookOpen className="h-3.5 w-3.5 text-accent-green" />
          </div>
          <div>
            <span className="font-display text-sm font-semibold text-text-primary">
              Biblio<span className="text-accent-green">Flow</span>
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const badgeCount = item.badge === 'prestamos' ? pendientes : 0;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={clsx(
                    'nav-link',
                    isActive && 'nav-link-active',
                  )}
                >
                  <Icon className={clsx('h-4 w-4', isActive ? 'text-accent-green' : 'text-text-muted')} />
                  <span>{item.label}</span>
                  {badgeCount > 0 && (
                    <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-amber px-1 font-mono text-[10px] font-bold text-white">
                      {badgeCount}
                    </span>
                  )}
                  {badgeCount === 0 && isActive && (
                    <span className="ml-auto h-1 w-1 rounded-full bg-accent-green" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 border-t border-surface-border pt-4">
          <Link href="/settings" className="nav-link">
            <Settings className="h-4 w-4 text-text-muted" />
            Configuración
          </Link>
          <button className="nav-link w-full text-left text-accent-red/70 hover:text-accent-red">
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </nav>

      {/* Bottom user info */}
      <div className="border-t border-surface-border p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-raised text-xs font-medium text-text-secondary">
            IU
          </div>
          <div className="min-w-0">
            <p className="truncate font-body text-xs font-medium text-text-primary">Isabella UCC</p>
            <p className="font-mono text-xs text-text-muted">Bibliotecaria</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
