'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login gagal. Periksa kembali kredensial Anda.');
        return;
      }

      if (data.role === 'ADMIN' || data.role === 'GURU') router.push('/');
      else if (data.role === 'SISWA') router.push('/siswa');
    } catch {
      setError('Koneksi ke server gagal. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-deep)] p-4 relative overflow-hidden">
      {/* Mesh gradient background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 -left-40 w-[500px] h-[500px] bg-[var(--brand)]/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-[#60a5fa]/8 rounded-full blur-[160px]" />
        <div className="absolute -bottom-40 left-1/3 w-[400px] h-[400px] bg-[var(--accent)]/5 rounded-full blur-[120px]" />
      </div>

      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiIGZpbGwtcnVsZT0ibm9uemVybyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Logo & Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[18px] bg-gradient-to-br from-[var(--brand)] to-[#60a5fa] text-white font-extrabold text-2xl mb-5 shadow-2xl shadow-[var(--brand-glow)] ring-[3px] ring-white/[0.06]">
            RK
          </div>
          <h1 className="text-[28px] font-extrabold text-[var(--text-primary)] tracking-tight leading-none">
            Rekap<span className="text-[var(--brand)]">Kelas</span>
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-2 font-medium">Masuk ke akun Anda</p>
        </div>

        {/* Card */}
        <div className="glass rounded-[20px] p-8 space-y-6">
          {error && (
            <div className="animate-slide-down p-4 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-[14px]">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-[var(--bearish)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-[#f87171] text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="glass-input w-full px-4 py-3 text-sm transition-all duration-200 focus:ring-[3px]"
                required
                autoComplete="username"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="glass-input w-full px-4 py-3 text-sm pr-12 transition-all duration-200 focus:ring-[3px]"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors p-1 rounded-[var(--radius-pill)] hover:bg-[var(--bg-glass-hover)]"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0Z" />
                      <circle cx="12" cy="12" r="3" />
                      <path d="M3.933 13.909A4.75 4.75 0 0 0 17.49 15.6" />
                      <path d="M11.392 16.956a5.25 5.25 0 0 1-7.46-3.046" />
                      <path d="M3.513 10.09a4.75 4.75 0 0 1 13.577-1.71" />
                      <path d="M8.542 6.124a5.25 5.25 0 0 1 7.94 3.58" />
                      <path d="M21.647 10.273a.5.5 0 0 1-.089.726l-18 13.364a.5.5 0 0 1-.637-.074l-.932-1a.5.5 0 0 1 .088-.726l18-13.364a.5.5 0 0 1 .637.074Z" />
                      <path d="M2.353 13.727a.5.5 0 0 1 .089-.726l18-13.364a.5.5 0 0 1 .637.074l.932 1a.5.5 0 0 1-.088.726l-18 13.364a.5.5 0 0 1-.637-.074Z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 text-sm font-bold mt-2 flex items-center justify-center active:scale-[0.98] transition-transform"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Memproses...
                </span>
              ) : 'Masuk'}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border-subtle)]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-[var(--bg-elevated)] text-[var(--text-muted)] font-semibold">atau</span>
            </div>
          </div>

          <Link
            href="/rekap/public"
            className="flex items-center justify-center gap-2.5 p-3 rounded-[14px] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--brand)] hover:border-[var(--brand)] hover:bg-[var(--bg-glass)] transition-all group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 group-hover:scale-110 transition-transform">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
            </svg>
            Akses Rekapitulasi Publik
          </Link>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-[var(--text-muted)]/60 font-medium">Sistem absensi terintegrasi untuk sekolah</p>
        </div>
      </div>
    </div>
  );
}
