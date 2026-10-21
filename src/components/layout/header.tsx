'use client';

import * as React from 'react';
import { signOut } from 'next-auth/react';
import { Bell, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  titoloPagina: string;
  nomeUtente?: string | null;
  emailUtente?: string | null;
}

export function Header({ titoloPagina, nomeUtente, emailUtente }: HeaderProps) {
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
      {/* Titolo pagina */}
      <div className="flex items-center gap-4">
        {/* Spazio per hamburger su mobile */}
        <div className="w-8 lg:w-0 lg:hidden" />
        <h1 className="text-lg font-semibold text-gray-900">{titoloPagina}</h1>
      </div>

      {/* Azioni utente */}
      <div className="flex items-center gap-3">
        {/* Notifiche (futuro) */}
        <Button variant="ghost" size="icon" aria-label="Notifiche" title="Notifiche (presto disponibile)">
          <Bell className="h-5 w-5 text-gray-500" />
        </Button>

        {/* Info utente */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-50 border border-gray-200">
          <User className="h-4 w-4 text-gray-500" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-700 leading-tight">
              {nomeUtente ?? 'Utente'}
            </span>
            {emailUtente && (
              <span className="text-xs text-gray-400 leading-tight">{emailUtente}</span>
            )}
          </div>
        </div>

        {/* Logout */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-gray-600 hover:text-red-600 hover:bg-red-50"
          aria-label="Disconnetti"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">Esci</span>
        </Button>
      </div>
    </header>
  );
}
