'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

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
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[var(--brand)]/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[var(--accent)]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[14px] bg-gradient-to-br from-[var(--brand)] to-[#60a5fa] text-white font-extrabold text-2xl mb-5 shadow-xl shadow-[var(--brand-glow)]">
            RK
          </div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Rekap<span className="text-[var(--brand)]">Kelas</span>
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1.5">Masuk ke akun Anda</p>
        </div>

        <div className="glass rounded-[var(--radius-card)] p-8 space-y-6">
          {error && (
            <div className="p-4 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-[var(--radius-input)]">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-[var(--bearish)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-[#f87171] text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="glass-input w-full px-4 py-3 text-sm"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="glass-input w-full px-4 py-3 text-sm pr-12"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} viewBox="0 0 24 24">
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
              className="btn-primary w-full py-3 text-sm font-bold mt-2"
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

          <div className="pt-2">
            <div className="p-4 rounded-[var(--radius-input)] bg-[rgba(99,102,241,0.06)] border border-[rgba(99,102,241,0.12)]">
              <p className="text-xs font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Demo Credentials</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="badge badge-green w-14">Admin</span>
                  <span className="font-mono text-[var(--text-secondary)]">admin / admin123</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge badge-amber w-14">Guru</span>
                  <span className="font-mono text-[var(--text-secondary)]">guru_xirpl1 / guru123</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge badge-sky w-14">Siswa</span>
                  <span className="font-mono text-[var(--text-secondary)]">10001 / siswa123</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-[var(--text-muted)]">Sistem absensi terintegrasi untuk sekolah</p>
        </div>
      </div>
    </div>
  );
}
