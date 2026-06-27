'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/lib/theme';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [session, setSession] = useState<{ isLoggedIn: boolean; role: 'ADMIN' | 'GURU' | 'SISWA' | null; nama?: string }>({
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
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchSession(); }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setSession({ isLoggedIn: false, role: null });
    window.location.href = '/login';
  };

  let logoHref = '/rekap';
  if (session.isLoggedIn) {
    logoHref = session.role === 'ADMIN' ? '/' : '/siswa';
  }

  let navLinks: { href: string; label: string }[] = [];
  if (session.isLoggedIn) {
    if (session.role === 'ADMIN') {
      navLinks = [
        { href: '/', label: 'Dashboard' },
        { href: '/absensi', label: 'Absensi' },
        { href: '/approval', label: 'Approval' },
        { href: '/rekap', label: 'Rekap' },
        { href: '/manajemen', label: 'Manajemen' },
      ];
    } else if (session.role === 'GURU') {
      navLinks = [
        { href: '/guru', label: 'Dashboard' },
        { href: '/guru/absensi', label: 'Absensi' },
        { href: '/rekap', label: 'Rekap' },
      ];
    } else {
      navLinks = [
        { href: '/siswa', label: 'Beranda' },
        { href: '/rekap', label: 'Rekap' },
      ];
    }
  } else {
    navLinks = [
      { href: '/rekap', label: 'Rekap' },
      { href: '/login', label: 'Masuk' },
    ];
  }

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-[var(--border-subtle)]">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 md:h-16">
          <Link href={logoHref} className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-[var(--brand)] to-[#60a5fa] flex items-center justify-center text-white font-extrabold text-sm shadow-lg shadow-[var(--brand-glow)] group-hover:shadow-[0_6px_20px_var(--brand-glow)] transition-shadow">
              RK
            </div>
            <span className="text-base font-extrabold text-[var(--text-primary)] tracking-tight">
              Rekap<span className="text-[var(--brand)]">Kelas</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <button onClick={toggle} className="btn-ghost w-8 h-8 rounded-[var(--radius-pill)] grid place-items-center shrink-0" title="Toggle theme">
              {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )}
            </button>
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 rounded-[var(--radius-pill)] text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-[var(--bg-glass-active)] text-[var(--text-primary)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass-hover)]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            {session.isLoggedIn && (
              <button
                onClick={handleLogout}
                className="ml-1 btn-ghost px-3.5 py-2 rounded-[var(--radius-pill)] text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--bearish)] hover:bg-[rgba(239,68,68,0.1)] transition-all"
              >
                Keluar
              </button>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden btn-ghost p-2 rounded-[var(--radius-pill)]"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--border-subtle)] glass">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-2.5 rounded-[var(--radius-pill)] text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-[var(--bg-glass-active)] text-[var(--text-primary)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass-hover)]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            {session.isLoggedIn && (
              <button
                onClick={() => { setMobileOpen(false); handleLogout(); }}
                className="w-full text-left px-4 py-2.5 rounded-[var(--radius-pill)] text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--bearish)] hover:bg-[rgba(239,68,68,0.1)] transition-all"
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
