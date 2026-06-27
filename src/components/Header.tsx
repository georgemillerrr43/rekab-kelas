'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const [session, setSession] = useState<{ isLoggedIn: boolean; role: 'ADMIN' | 'SISWA' | null }>({
    isLoggedIn: false,
    role: null,
  });

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        setSession(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setSession({ isLoggedIn: false, role: null });
    window.location.href = '/login';
  };

  // Determine Logo URL
  let logoHref = '/rekap';
  if (session.isLoggedIn) {
    if (session.role === 'ADMIN') {
      logoHref = '/';
    } else if (session.role === 'SISWA') {
      logoHref = '/siswa';
    }
  }

  // Generate Navigation Links
  let navLinks: { href: string; label: string }[] = [];
  if (session.isLoggedIn) {
    if (session.role === 'ADMIN') {
      navLinks = [
        { href: '/', label: 'Beranda' },
        { href: '/absensi', label: 'Absensi' },
        { href: '/approval', label: 'Approval Izin' },
        { href: '/rekap', label: 'Rekap' },
      ];
    } else if (session.role === 'SISWA') {
      navLinks = [
        { href: '/siswa', label: 'Beranda' },
        { href: '/rekap', label: 'Rekap' },
      ];
    }
  } else {
    navLinks = [
      { href: '/rekap', label: 'Rekap' },
      { href: '/login', label: 'Login' },
    ];
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href={logoHref} className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">
              RekapKelas
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            
            {session.isLoggedIn && (
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-all ml-2"
              >
                Keluar
              </button>
            )}
          </nav>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-xl">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            
            {session.isLoggedIn && (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  handleLogout();
                }}
                className="w-full text-left block px-4 py-3 rounded-xl text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-all"
              >
                Keluar
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
