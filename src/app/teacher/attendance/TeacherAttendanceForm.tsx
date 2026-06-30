'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Status = 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPA';
interface Student { id: string; nis: string; nama: string; status: Status; alasan?: string; buktiUrl?: string; buktiPreview?: string; uploadError?: string; }

export default function GuruAttendanceForm() {
  const router = useRouter();
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
        const res = await fetch(`/api/teacher/attendance?tanggal=${tanggal}`);
        if (res.status === 403) return;
        const d = await res.json();
        const studentList = d.students || [];
        setStudents(studentList.map((s: any) => ({ ...s, buktiPreview: s.buktiUrl || '', uploadError: '' })));
        setIsSuccess(!!d.alreadySubmitted);
      } catch { /* ignore */ } finally { setIsLoading(false); }
    })();
  }, [tanggal]);

  const handleStatus = (id: string, status: Status) => setStudents(p => p.map(s =>
    s.id === id ? { ...s, status, ...(status === 'HADIR' || status === 'ALPA' ? { alasan: '', uploadError: '' } : {}) } : s
  ));
  const handleAlasan = (id: string, v: string) => setStudents(p => p.map(s => s.id === id ? { ...s, alasan: v } : s));

  const handleUpload = (siswaId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.type.startsWith('video/')) { updateErr(siswaId, 'Video dilarang!'); e.target.value = ''; return; }
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) { updateErr(siswaId, 'Hanya JPEG/PNG!'); e.target.value = ''; return; }
    if (file.size > 2 * 1024 * 1024) { updateErr(siswaId, 'Maksimal 2MB!'); e.target.value = ''; return; }
    updateErr(siswaId, '');
    const reader = new FileReader();
    reader.onloadend = async () => {
      const fd = new FormData(); fd.append('file', file);
      try {
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) { updateErr(siswaId, uploadData.error || 'Upload gagal'); return; }
        setStudents(p => p.map(s => s.id === siswaId ? { ...s, buktiUrl: uploadData.url, buktiPreview: reader.result as string, uploadError: '' } : s));
      } catch { updateErr(siswaId, 'Gagal upload.'); }
    };
    reader.readAsDataURL(file);
  };

  const updateErr = (id: string, msg: string) => setStudents(p => p.map(s => s.id === id ? { ...s, buktiUrl: '', buktiPreview: '', uploadError: msg } : s));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasErr = false;
    const newStudents = students.map(s => {
      if ((s.status === 'IZIN' || s.status === 'SAKIT') && !s.alasan?.trim()) {
        hasErr = true; return { ...s, uploadError: 'Alasan wajib!' };
      }
      if ((s.status === 'IZIN' || s.status === 'SAKIT') && !s.buktiUrl) {
        hasErr = true; return { ...s, uploadError: 'Foto bukti wajib!' };
      }
      return s;
    });
    if (hasErr) { setStudents(newStudents); setMsg({ type: 'error', text: 'Lengkapi alasan dan foto bukti untuk Izin/Sakit.' }); return; }

    setIsSubmitting(true); setMsg(null);
    try {
      const res = await fetch('/api/teacher/attendance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tanggal, data: students.map(s => ({ siswaId: s.id, status: s.status, alasan: s.alasan, buktiUrl: s.buktiUrl })) }),
      });
      if (res.ok) setIsSuccess(true);
      else setMsg({ type: 'error', text: (await res.json()).error || 'Gagal.' });
    } catch { setMsg({ type: 'error', text: 'Error.' }); }
    setIsSubmitting(false);
  };

  const statusBtns = (id: string, cur: Status, layout: 'row' | 'grid') => {
    const btns = [
      { l: 'Hadir', v: 'HADIR' as Status, a: 'bg-[var(--bullish)] text-white', b: 'text-[var(--bullish)] border-[rgba(34,197,94,0.2)]' },
      { l: 'Izin', v: 'IZIN' as Status, a: 'bg-[var(--warning)] text-white', b: 'text-[var(--warning)] border-[rgba(245,158,11,0.2)]' },
      { l: 'Sakit', v: 'SAKIT' as Status, a: 'bg-[var(--info)] text-white', b: 'text-[var(--info)] border-[rgba(6,182,212,0.2)]' },
      { l: 'Alpa', v: 'ALPA' as Status, a: 'bg-[var(--bearish)] text-white', b: 'text-[var(--bearish)] border-[rgba(239,68,68,0.2)]' },
    ];
    if (layout === 'row') {
      return btns.map(b => (
        <button key={b.v} type="button" onClick={() => handleStatus(id, b.v)}
          className={`btn-pill-sm ${cur === b.v ? b.a : b.b}`}>{b.l}</button>
      ));
    }
    return btns.map(b => (
      <button key={b.v} type="button" onClick={() => handleStatus(id, b.v)}
        className={`py-2.5 text-center text-xs font-semibold rounded-[var(--radius-pill)] border transition-all ${cur === b.v ? b.a : b.b}`}>{b.l}</button>
    ));
  };

  const renderDetail = (s: Student) => {
    if (s.status !== 'IZIN' && s.status !== 'SAKIT') return null;
    return (
      <div className="p-3 bg-[var(--bg-glass)] border border-[var(--border-subtle)] rounded-[var(--radius-card)] space-y-2 mt-2">
        <div><input type="text" value={s.alasan || ''} onChange={(e) => handleAlasan(s.id, e.target.value)} placeholder="Alasan..." className="glass-input w-full p-2 text-xs" /></div>
        <div>
          <input type="file" accept="image/png,image/jpeg,image/jpg" onChange={(e) => handleUpload(s.id, e)}
            className="w-full text-xs text-[var(--text-muted)] file:mr-2 file:py-1 file:px-3 file:rounded-[var(--radius-pill)] file:border-0 file:text-xs file:font-semibold file:bg-[rgba(99,102,241,0.1)] file:text-[var(--brand)] hover:file:bg-[rgba(99,102,241,0.15)] cursor-pointer" />
          {s.uploadError && <p className="text-[11px] font-medium text-[var(--bearish)] mt-1">{s.uploadError}</p>}
        </div>
        {s.buktiPreview && <div className="w-16 h-16 rounded-[var(--radius-card)] overflow-hidden border border-[var(--border-default)]"><img src={s.buktiPreview} alt="" className="object-cover w-full h-full" /></div>}
      </div>
    );
  };

  if (isLoading) return <div className="glass-card max-w-5xl mx-auto p-6 text-center py-20 text-[var(--text-muted)] font-semibold">Memuat...</div>;

  return (
    <div className="glass-card max-w-5xl mx-auto p-4 md:p-6 w-full max-w-full overflow-hidden">
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
            <>
              {/* Desktop: table */}
              <div className="hidden md:block overflow-x-auto glass rounded-[var(--radius-card)]">
                <table className="table-premium">
                  <thead><tr><th className="text-center">NIS</th><th>Nama</th><th className="text-center">Kehadiran</th><th>Keterangan</th></tr></thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {students.map(s => (
                      <tr key={s.id} className="hover:bg-[var(--bg-glass)] transition-colors">
                        <td className="text-center font-mono">{s.nis}</td>
                        <td><span className="font-semibold text-[var(--text-primary)] text-sm">{s.nama}{(s as any).hasPending && <button type="button" onClick={() => router.push('/teacher/approval')} className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(245,158,11,0.12)] text-[var(--warning)] border border-[rgba(245,158,11,0.2)] hover:bg-[rgba(245,158,11,0.2)] transition-colors">Izin Diajukan</button>}{(s as any).hasApprovedIzin && <button type="button" onClick={() => router.push('/teacher/approval')} className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(34,197,94,0.12)] text-[var(--bullish)] border border-[rgba(34,197,94,0.2)] hover:bg-[rgba(34,197,94,0.18)] transition-colors">Izin Disetujui</button>}</span></td>
                        <td><div className="flex justify-center gap-1.5">{statusBtns(s.id, s.status, 'row')}</div></td>
                        <td>{renderDetail(s)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile: cards */}
              <div className="md:hidden space-y-4">
                {students.map(s => (
                  <div key={s.id} className="p-4 glass rounded-[var(--radius-card)] space-y-3">
                    <p className="font-bold text-[var(--text-primary)] text-sm">{s.nama}{(s as any).hasPending && <button type="button" onClick={() => router.push('/teacher/approval')} className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(245,158,11,0.12)] text-[var(--warning)] border border-[rgba(245,158,11,0.2)] hover:bg-[rgba(245,158,11,0.2)] transition-colors">Izin Diajukan</button>}{(s as any).hasApprovedIzin && <button type="button" onClick={() => router.push('/teacher/approval')} className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(34,197,94,0.12)] text-[var(--bullish)] border border-[rgba(34,197,94,0.2)] hover:bg-[rgba(34,197,94,0.18)] transition-colors">Izin Disetujui</button>}</p>
                    <p className="text-[var(--text-muted)] text-xs">NIS: {s.nis}</p>
                    <div className="grid grid-cols-4 gap-1.5">{statusBtns(s.id, s.status, 'grid')}</div>
                    {renderDetail(s)}
                  </div>
                ))}
              </div>
            </>
          )}
          {students.length > 0 && <div className="flex justify-end pt-4 border-t border-[var(--border-subtle)]"><button type="submit" disabled={isSubmitting} className="btn-primary px-8 py-2.5 text-sm font-semibold disabled:opacity-40">{isSubmitting ? 'Menyimpan...' : 'Simpan Absensi'}</button></div>}
        </form>
      )}
    </div>
  );
}
