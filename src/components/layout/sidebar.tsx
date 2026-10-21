'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  Calendar,
  Receipt,
  FileEdit,
  Clock,
  CheckCircle,
  CreditCard,
  BarChart2,
  Settings,
  ChevronDown,
  ChevronRight,
  X,
  Menu,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  bozzeBadge?: number;
  daIncassareBadge?: number;
}

interface NavItem {
  href?: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  children?: NavItem[];
}

export function Sidebar({ bozzeBadge = 0, daIncassareBadge = 0 }: SidebarProps) {
  const pathname = usePathname();
  const [fattureOpen, setFattureOpen] = React.useState(
    pathname.startsWith('/fatture')
  );
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/aziende', label: 'Aziende', icon: Building2 },
    { href: '/attivita', label: 'Attività', icon: ClipboardList },
    { href: '/calendar', label: 'Calendar', icon: Calendar },
    { href: '/tariffario', label: 'Tariffario', icon: Receipt },
    {
      label: 'Fatture',
      icon: FileText,
      children: [
        { href: '/fatture/bozze', label: 'Bozze', icon: FileEdit, badge: bozzeBadge },
        { href: '/fatture/da-incassare', label: 'Da incassare', icon: Clock, badge: daIncassareBadge },
        { href: '/fatture/incassate', label: 'Incassate', icon: CheckCircle },
      ],
    },
    { href: '/pagamenti', label: 'Pagamenti', icon: CreditCard },
    { href: '/report', label: 'Report', icon: BarChart2 },
    { href: '/impostazioni', label: 'Impostazioni', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <nav className="flex flex-col gap-0.5 px-3 py-4">
      {navItems.map((item) => {
        if (item.children) {
          const isGroupActive = item.children.some(
            (child) => child.href && isActive(child.href)
          );
          return (
            <div key={item.label}>
              <button
                onClick={() => setFattureOpen((prev) => !prev)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isGroupActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {fattureOpen ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </button>
              {fattureOpen && (
                <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-gray-200 pl-3">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href!}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                        child.href && isActive(child.href)
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      )}
                    >
                      <child.icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{child.label}</span>
                      {child.badge !== undefined && child.badge > 0 && (
                        <span className="inline-flex items-center justify-center rounded-full bg-blue-600 px-1.5 py-0.5 text-xs font-semibold text-white min-w-[1.25rem]">
                          {child.badge > 99 ? '99+' : child.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href!}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              item.href && isActive(item.href)
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Pulsante hamburger mobile */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-md bg-white border border-gray-200 shadow-sm"
        onClick={() => setMobileOpen(true)}
        aria-label="Apri menu"
      >
        <Menu className="h-5 w-5 text-gray-600" />
      </button>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar mobile (drawer) */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200">
          <span className="font-semibold text-gray-900">Gestionale Studio</span>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded-md hover:bg-gray-100"
            aria-label="Chiudi menu"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarContent />
        </div>
        <div className="border-t border-gray-200 px-4 py-3">
          <p className="text-[10px] text-gray-400 leading-relaxed">
            Sviluppato da<br />
            <span className="font-medium text-gray-500">Leoni Mattia</span><br />
            P.IVA IT02801150356<br />
            Tel: 3770933621<br />
            <a href="https://leonimattia.it" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">
              leonimattia.it
            </a><br />
            <a href="mailto:info@leonimattia.it" className="underline hover:text-gray-600">
              info@leonimattia.it
            </a>
          </p>
        </div>
      </aside>

      {/* Sidebar desktop (fissa) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 lg:bg-white">
        <div className="flex items-center px-6 h-16 border-b border-gray-200">
          <span className="font-semibold text-gray-900">Gestionale Studio</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarContent />
        </div>
        <div className="border-t border-gray-200 px-4 py-3">
          <p className="text-[10px] text-gray-400 leading-relaxed">
            Sviluppato da<br />
            <span className="font-medium text-gray-500">Leoni Mattia</span><br />
            P.IVA IT02801150356<br />
            Tel: 3770933621<br />
            <a href="https://leonimattia.it" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">
              leonimattia.it
            </a><br />
            <a href="mailto:info@leonimattia.it" className="underline hover:text-gray-600">
              info@leonimattia.it
            </a>
          </p>
        </div>
      </aside>
    </>
  );
}
