'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/' },
  { label: 'Input Absensi', href: '/absensi' },
  { label: 'Approval Izin', href: '/approval' },
  { label: 'Rekap & PDF', href: '/rekap' },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0 flex items-center gap-2.5">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-extrabold text-base shadow-md shadow-indigo-200">
              A
            </div>
            <div>
              <span className="font-extrabold text-slate-800 text-base tracking-tight">RekapKelas</span>
              <span className="text-indigo-500 font-semibold text-[10px] block -mt-1">Admin Panel</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-1">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  pathname === item.href ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}>
                {item.label}
              </Link>
            ))}
            <button onClick={handleLogout}
              className="ml-2 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
              Keluar
            </button>
          </nav>

          <button className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-50" onClick={() => setOpen(!open)}>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {open ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
              className={`block px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${pathname === item.href ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              {item.label}
            </Link>
          ))}
          <button onClick={handleLogout} className="block w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-all">
            Keluar
          </button>
        </div>
      )}
    </header>
  );
}
