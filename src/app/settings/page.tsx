'use client';

import React, { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [session, setSession] = useState<{ isLoggedIn: boolean; role: string | null; nama?: string; username?: string }>({
    isLoggedIn: false, role: null,
  });
  const [userLoading, setUserLoading] = useState(false);
  const [userMsg, setUserMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          setSession(data);
        }
      } catch { /* ignore */ }
    })();
  }, []);

  const handleChangeUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserLoading(true);
    setUserMsg(null);
    try {
      const res = await fetch('/api/auth/username', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newUsername }),
      });
      const data = await res.json();
      if (!res.ok) setUserMsg({ type: 'error', text: data.error });
      else { setUserMsg({ type: 'success', text: 'Username berhasil diubah!' }); setSession(s => ({ ...s, username: newUsername })); setNewUsername(''); }
    } catch { setUserMsg({ type: 'error', text: 'Gagal menghubungi server' }); }
    setUserLoading(false);
    setTimeout(() => setUserMsg(null), 5000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwLoading(true);
    setPwMsg(null);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwCurrent, newPassword: pwNew }),
      });
      const data = await res.json();
      if (!res.ok) setPwMsg({ type: 'error', text: data.error });
      else { setPwMsg({ type: 'success', text: 'Password berhasil diubah!' }); setPwCurrent(''); setPwNew(''); }
    } catch { setPwMsg({ type: 'error', text: 'Gagal menghubungi server' }); }
    setPwLoading(false);
    setTimeout(() => setPwMsg(null), 5000);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 pt-4">
      <div className="page-header">
        <span className="badge badge-gray mb-2">Pengaturan</span>
        <h1>Pengaturan Akun</h1>
        <p>Ubah password akun Anda.</p>
      </div>

      <div className="glass-card p-6">
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-[var(--border-subtle)]">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--brand)] to-[#60a5fa] flex items-center justify-center text-white font-extrabold text-xl shadow-lg">
            {(session.nama || 'A').charAt(0)}
          </div>
          <div>
            <h2 className="font-bold text-[var(--text-primary)]">{session.nama || '-'}</h2>
            <p className="text-sm text-[var(--text-muted)]">Username: {session.username || '-'}</p>
          </div>
        </div>

        {/* Ganti Username */}
        <h3 className="font-bold text-[var(--text-primary)] text-sm mb-4">Ganti Username</h3>
        {userMsg && (
          <div className={`p-3 rounded-[var(--radius-input)] text-sm font-semibold border mb-4 ${userMsg.type === 'success' ? 'bg-[rgba(34,197,94,0.1)] border-[rgba(34,197,94,0.2)] text-[#4ade80]' : 'bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.2)] text-[#f87171]'}`}>
            {userMsg.text}
          </div>
        )}
        <form onSubmit={handleChangeUsername} className="space-y-4 mb-6 pb-6 border-b border-[var(--border-subtle)]">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Username Baru</label>
            <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} required minLength={3} maxLength={50} className="glass-input w-full p-2.5 text-sm" />
            <p className="text-[10px] text-[var(--text-muted)] mt-1">Minimal 3 karakter.</p>
          </div>
          <button type="submit" disabled={userLoading} className="btn-primary w-full py-2.5 text-sm font-bold">
            {userLoading ? 'Menyimpan...' : 'Simpan Username Baru'}
          </button>
        </form>

        {/* Ganti Password */}
        <h3 className="font-bold text-[var(--text-primary)] text-sm mb-4">Ganti Password</h3>
        {pwMsg && (
          <div className={`p-3 rounded-[var(--radius-input)] text-sm font-semibold border mb-4 ${pwMsg.type === 'success' ? 'bg-[rgba(34,197,94,0.1)] border-[rgba(34,197,94,0.2)] text-[#4ade80]' : 'bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.2)] text-[#f87171]'}`}>
            {pwMsg.text}
          </div>
        )}
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Password Lama</label>
            <input type="password" value={pwCurrent} onChange={(e) => setPwCurrent(e.target.value)} required className="glass-input w-full p-2.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Password Baru</label>
            <input type="password" value={pwNew} onChange={(e) => setPwNew(e.target.value)} required minLength={6} className="glass-input w-full p-2.5 text-sm" />
            <p className="text-[10px] text-[var(--text-muted)] mt-1">Minimal 6 karakter.</p>
          </div>
          <button type="submit" disabled={pwLoading} className="btn-primary w-full py-2.5 text-sm font-bold">
            {pwLoading ? 'Menyimpan...' : 'Simpan Password Baru'}
          </button>
        </form>
      </div>
    </div>
  );
}
