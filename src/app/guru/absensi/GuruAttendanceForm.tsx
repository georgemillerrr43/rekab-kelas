'use client';

import React, { useState, useEffect } from 'react';

type Status = 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPA';
interface Student { id: string; nis: string; nama: string; status: Status; alasan?: string; buktiUrl?: string; }

export default function GuruAttendanceForm() {
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/guru/absensi?tanggal=${tanggal}`);
        if (res.status === 403) return;
        const d = await res.json();
        setStudents(d.students || []);
        setIsSuccess(!!d.alreadySubmitted);
      } catch { /* ignore */ } finally { setIsLoading(false); }
    })();
  }, [tanggal]);

  const handleStatus = (id: string, status: Status) => setStudents(p => p.map(s => s.id === id ? { ...s, status, ...(status === 'HADIR' || status === 'ALPA' ? { alasan: '', buktiUrl: '' } : {}) } : s));
  const handleAlasan = (id: string, v: string) => setStudents(p => p.map(s => s.id === id ? { ...s, alasan: v } : s));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (students.some(s => (s.status === 'IZIN' || s.status === 'SAKIT') && !s.alasan?.trim())) {
      setMsg({ type: 'error', text: 'Lengkapi alasan untuk Izin/Sakit.' }); return;
    }
    setIsSubmitting(true); setMsg(null);
    try {
      const res = await fetch('/api/guru/absensi', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tanggal, data: students.map(s => ({ siswaId: s.id, status: s.status, alasan: s.alasan })) }),
      });
      if (res.ok) setIsSuccess(true);
      else setMsg({ type: 'error', text: (await res.json()).error || 'Gagal.' });
    } catch { setMsg({ type: 'error', text: 'Error.' }); }
    setIsSubmitting(false);
  };

  const btnRow = (id: string, cur: Status) => ([
    { l: 'Hadir', v: 'HADIR' as Status, a: 'bg-[var(--bullish)] text-white', b: 'text-[var(--bullish)] border-[rgba(34,197,94,0.2)]' },
    { l: 'Izin', v: 'IZIN' as Status, a: 'bg-[var(--warning)] text-white', b: 'text-[var(--warning)] border-[rgba(245,158,11,0.2)]' },
    { l: 'Sakit', v: 'SAKIT' as Status, a: 'bg-[var(--info)] text-white', b: 'text-[var(--info)] border-[rgba(6,182,212,0.2)]' },
    { l: 'Alpa', v: 'ALPA' as Status, a: 'bg-[var(--bearish)] text-white', b: 'text-[var(--bearish)] border-[rgba(239,68,68,0.2)]' },
  ].map(b => (
    <button key={b.v} type="button" onClick={() => handleStatus(id, b.v)}
      className={`btn-pill-sm ${cur === b.v ? b.a : b.b}`}>{b.l}</button>
  )));

  if (isLoading) return <div className="glass-card max-w-5xl mx-auto p-6 text-center py-20 text-[var(--text-muted)]">Memuat...</div>;

  return (
    <div className="glass-card max-w-5xl mx-auto p-4 md:p-6">
      <div className="border-b border-[var(--border-subtle)] pb-5 mb-6">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Form Absensi Kelas</h2>
        <p className="text-[var(--text-muted)] text-sm">Catat kehadiran siswa kelas Anda.</p>
      </div>

      <div className="bg-[var(--bg-glass)] p-4 rounded-[var(--radius-card)] mb-6">
        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">Tanggal</label>
        <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="glass-input w-full p-2.5 text-sm" />
      </div>

      {isSuccess ? (
        <div className="text-center py-12 glass-card">
          <div className="w-16 h-16 bg-gradient-to-tr from-[var(--bullish)] to-emerald-400 rounded-[var(--radius-pill)] flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Tersimpan!</h2>
          <button onClick={() => setIsSuccess(false)} className="btn btn-secondary mt-4 px-5 py-2 text-sm">Kembali</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {msg && <div className={`p-4 rounded-[var(--radius-input)] text-sm ${msg.type === 'error' ? 'bg-[rgba(239,68,68,0.1)] text-[#f87171] border border-[rgba(239,68,68,0.2)]' : ''}`}>{msg.text}</div>}
          {students.length === 0 ? <div className="text-center py-10 text-[var(--text-muted)]">Belum ada siswa.</div> : (
            <div className="overflow-hidden glass rounded-[var(--radius-card)]">
              <table className="table-premium">
                <thead><tr><th className="text-center">NIS</th><th>Nama</th><th className="text-center">Kehadiran</th><th>Keterangan</th></tr></thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {students.map(s => (
                    <tr key={s.id} className="hover:bg-[var(--bg-glass)] transition-colors">
                      <td className="text-center font-mono">{s.nis}</td>
                      <td><span className="font-semibold text-[var(--text-primary)] text-sm">{s.nama}</span></td>
                      <td><div className="flex justify-center gap-1.5">{btnRow(s.id, s.status)}</div></td>
                      <td>{(s.status === 'IZIN' || s.status === 'SAKIT') && <input type="text" value={s.alasan || ''} onChange={(e) => handleAlasan(s.id, e.target.value)} placeholder="Alasan..." className="glass-input w-full p-2 text-xs" />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {students.length > 0 && <div className="flex justify-end pt-4 border-t border-[var(--border-subtle)]"><button type="submit" disabled={isSubmitting} className="btn-primary px-8 py-2.5 text-sm font-semibold disabled:opacity-40">{isSubmitting ? 'Menyimpan...' : 'Simpan Absensi'}</button></div>}
        </form>
      )}
    </div>
  );
}
