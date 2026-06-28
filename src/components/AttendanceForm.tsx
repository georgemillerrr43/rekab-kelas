'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface Siswa { id: string; nis: string; nama: string; whatsappOrangTua: string; }
interface Kelas { id: string; nama: string; waliKelas: string; }
type StatusKehadiran = 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPA';
interface StudentState {
  siswaId: string; status: StatusKehadiran; alasan?: string;
  buktiUrl?: string; buktiPreview?: string; uploadError?: string;
}

function AttendanceFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [kelas, setKelas] = useState<string>(searchParams.get('kelas') || '');
  const [tanggal, setTanggal] = useState<string>(searchParams.get('tanggal') || new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Siswa[]>([]);
  const [attendance, setAttendance] = useState<Record<string, StudentState>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/kelas');
        const list = (await res.json()).kelas || [];
        setKelasList(list);
        if (list.length > 0 && !kelas) setKelas(list[0].id);
      } catch { /* empty */ }
    })();
  }, []);

  useEffect(() => {
    if (!kelas) return;
    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/admin/absensi?kelas=${kelas}&tanggal=${tanggal}`);
        const data = await res.json();
        const studentList = data.students || [];
        setStudents(studentList);
        setIsSuccess(!!data.alreadySubmitted);
        const init: Record<string, StudentState> = {};
        studentList.forEach((s: any) => { init[s.id] = { siswaId: s.id, status: s.status, alasan: s.alasan, buktiUrl: s.buktiUrl, buktiPreview: s.buktiUrl || '', uploadError: '' }; });
        setAttendance(init);
      } catch { /* empty */ } finally { setIsLoading(false); }
    })();
  }, [kelas, tanggal]);

  const handleStatus = (id: string, status: StatusKehadiran) => setAttendance((prev) => ({ ...prev, [id]: { ...prev[id], status, ...(status === 'HADIR' || status === 'ALPA' ? { alasan: '', buktiUrl: '', buktiPreview: '', uploadError: '' } : {}) } }));
  const handleAlasan = (id: string, v: string) => setAttendance((prev) => ({ ...prev, [id]: { ...prev[id], alasan: v } }));

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
        setAttendance((prev) => ({ ...prev, [siswaId]: { ...prev[siswaId], buktiUrl: uploadData.url, buktiPreview: reader.result as string, uploadError: '' } }));
      } catch { updateErr(siswaId, 'Gagal upload.'); }
    };
    reader.readAsDataURL(file);
  };

  const updateErr = (id: string, msg: string) => setAttendance((prev) => ({ ...prev, [id]: { ...prev[id], buktiUrl: '', buktiPreview: '', uploadError: msg } }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true); setSubmitMessage(null);
    let hasErr = false;
    for (const s of students) {
      const st = attendance[s.id];
      if (st && (st.status === 'IZIN' || st.status === 'SAKIT')) {
        if (!st.alasan?.trim()) { st.uploadError = 'Alasan wajib!'; hasErr = true; }
        if (!st.buktiUrl) { st.uploadError = 'Foto bukti wajib!'; hasErr = true; }
      }
    }
    if (hasErr) { setAttendance({ ...attendance }); setSubmitMessage({ type: 'error', text: 'Lengkapi alasan dan bukti untuk Izin/Sakit.' }); setIsSubmitting(false); return; }
    try {
      const res = await fetch('/api/admin/absensi', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tanggal, data: Object.values(attendance).map((i) => ({ siswaId: i.siswaId, status: i.status, alasan: i.alasan, buktiUrl: i.buktiUrl })) }),
      });
      if (res.ok) setIsSuccess(true);
      else setSubmitMessage({ type: 'error', text: (await res.json()).error || 'Gagal.' });
    } catch { setSubmitMessage({ type: 'error', text: 'Internal error.' }); }
    setIsSubmitting(false);
  };

  const renderDetail = (id: string, state: StudentState) => {
    if (state.status !== 'IZIN' && state.status !== 'SAKIT') return null;
    return (
      <div className="p-3 bg-[var(--bg-glass)] border border-[var(--border-subtle)] rounded-[var(--radius-card)] space-y-2 mt-2">
        <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Alasan *</label><input type="text" value={state.alasan || ''} onChange={(e) => handleAlasan(id, e.target.value)} placeholder="Tulis alasan..." className="glass-input w-full p-2 text-xs" required /></div>
        <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Foto (PNG/JPG, Maks 2MB) *</label><input type="file" accept="image/png, image/jpeg, image/jpg" onChange={(e) => handleUpload(id, e)} className="w-full text-xs text-[var(--text-muted)] file:mr-2 file:py-1 file:px-3 file:rounded-[var(--radius-pill)] file:border-0 file:text-xs file:font-semibold file:bg-[rgba(99,102,241,0.1)] file:text-[var(--brand)] hover:file:bg-[rgba(99,102,241,0.15)] cursor-pointer" />{state.uploadError && <p className="text-[11px] font-medium text-[var(--bearish)] mt-1">{state.uploadError}</p>}</div>
        {state.buktiPreview && <div className="relative w-20 h-20 border border-[var(--border-default)] rounded-[var(--radius-card)] overflow-hidden mt-1"><img src={state.buktiPreview} alt="Preview" className="object-cover w-full h-full" /></div>}
      </div>
    );
  };

  const btnRow = (id: string, state: StudentState) => {
    const btns = [
      { label: 'Hadir', val: 'HADIR' as const, a: 'bg-[var(--bullish)] text-white', b: 'text-[var(--bullish)] border-[rgba(34,197,94,0.2)]' },
      { label: 'Izin', val: 'IZIN' as const, a: 'bg-[var(--warning)] text-white', b: 'text-[var(--warning)] border-[rgba(245,158,11,0.2)]' },
      { label: 'Sakit', val: 'SAKIT' as const, a: 'bg-[var(--info)] text-white', b: 'text-[var(--info)] border-[rgba(6,182,212,0.2)]' },
      { label: 'Alpa', val: 'ALPA' as const, a: 'bg-[var(--bearish)] text-white', b: 'text-[var(--bearish)] border-[rgba(239,68,68,0.2)]' },
    ];
    return btns.map((b) => (<button key={b.val} type="button" onClick={() => handleStatus(id, b.val)} className={`btn-pill-sm ${state.status === b.val ? b.a : `${b.b} hover:bg-[var(--bg-glass-hover)]`}`}>{b.label}</button>));
  };

  const btnRowMobile = (id: string, state: StudentState) => {
    const btns = [
      { label: 'Hadir', val: 'HADIR' as const, a: 'bg-[var(--bullish)] text-white', b: 'text-[var(--bullish)] border-[rgba(34,197,94,0.2)] bg-[rgba(34,197,94,0.05)]' },
      { label: 'Izin', val: 'IZIN' as const, a: 'bg-[var(--warning)] text-white', b: 'text-[var(--warning)] border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.05)]' },
      { label: 'Sakit', val: 'SAKIT' as const, a: 'bg-[var(--info)] text-white', b: 'text-[var(--info)] border-[rgba(6,182,212,0.2)] bg-[rgba(6,182,212,0.05)]' },
      { label: 'Alpa', val: 'ALPA' as const, a: 'bg-[var(--bearish)] text-white', b: 'text-[var(--bearish)] border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.05)]' },
    ];
    return btns.map((b) => (<button key={b.val} type="button" onClick={() => handleStatus(id, b.val)} className={`py-2.5 text-center text-xs font-semibold rounded-[var(--radius-pill)] border transition-all ${state.status === b.val ? b.a : b.b}`}>{b.label}</button>));
  };

  if (isLoading && kelas) return <div className="glass-card max-w-5xl mx-auto p-6 text-center py-20 text-[var(--text-muted)] font-semibold">Memuat data absensi...</div>;

  if (!kelas) {
    return (
      <div className="glass-card max-w-5xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-[var(--radius-pill)] bg-[var(--bg-glass)] flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8 text-[var(--brand)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg></div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Pilih Kelas Terlebih Dahulu</h3>
          <p className="text-[var(--text-muted)] text-sm">Silakan pilih kelas untuk memulai input absensi.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[var(--bg-glass)] p-4 rounded-[var(--radius-card)]">
          <div><label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">Tanggal</label><input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="glass-input w-full p-2.5 text-sm" /></div>
          <div><label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">Kelas</label><select value={kelas} onChange={(e) => setKelas(e.target.value)} className="glass-select w-full p-2.5 text-sm"><option value="">-- Pilih --</option>{kelasList.map((k) => (<option key={k.id} value={k.id}>{k.nama} ({k.waliKelas})</option>))}</select></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card max-w-5xl mx-auto p-4 md:p-6">
      <div className="border-b border-[var(--border-subtle)] pb-5 mb-6">
        <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Form Absensi Harian</h2>
        <p className="text-[var(--text-muted)] text-sm">Catat kehadiran siswa secara akurat setelah kelas selesai.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[var(--bg-glass)] p-4 rounded-[var(--radius-card)] mb-6">
        <div><label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">Tanggal</label><input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="glass-input w-full p-2.5 text-sm" /></div>
        <div><label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">Kelas</label><select value={kelas} onChange={(e) => setKelas(e.target.value)} className="glass-select w-full p-2.5 text-sm">{kelasList.map((k) => (<option key={k.id} value={k.id}>{k.nama} ({k.waliKelas})</option>))}</select></div>
      </div>

      {isSuccess ? (
        <div className="max-w-2xl mx-auto mt-6 p-8 md:p-12 glass-card text-center">
          <div className="w-20 h-20 bg-gradient-to-tr from-[var(--bullish)] to-emerald-400 rounded-[var(--radius-pill)] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[var(--bullish)]/20 ring-8 ring-[rgba(34,197,94,0.1)]"><svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
          <h2 className="text-2xl font-extrabold text-[var(--text-primary)] mb-2">Rekap hari ini sudah dikirim</h2>
          <p className="text-[var(--text-muted)] text-base mb-8 font-medium">Kelas <span className="text-[var(--text-primary)] font-semibold">{kelas.replace(/-/g, ' ')}</span> - {tanggal}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button type="button" onClick={() => setIsSuccess(false)} className="btn btn-secondary px-6 py-2.5 text-sm font-bold">Kembali Edit</button>
            <a href="/rekap" className="btn-primary px-6 py-2.5 text-sm font-bold">Lihat Rekap</a>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {submitMessage && <div className={`p-4 rounded-[var(--radius-input)] text-sm ${submitMessage.type === 'success' ? 'bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] text-[#4ade80]' : 'bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] text-[#f87171]'}`}>{submitMessage.text}</div>}

          <h3 className="text-base font-bold text-[var(--text-primary)]">Daftar Kehadiran Siswa</h3>

          {students.length === 0 ? (
            <div className="text-center py-10 text-[var(--text-muted)] font-semibold">Belum ada data siswa.</div>
          ) : (
            <>
              <div className="hidden md:block overflow-hidden glass rounded-[var(--radius-card)]">
                <table className="table-premium">
                  <thead><tr><th className="text-center w-1/12">NIS</th><th className="w-3/12">Nama</th><th className="text-center w-4/12">Kehadiran</th><th className="w-4/12">Keterangan</th></tr></thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {students.map((s) => {
                      const state = attendance[s.id] || { status: 'HADIR' as const };
                      return (<tr key={s.id} className="hover:bg-[var(--bg-glass)] transition-colors"><td className="text-center font-mono">{s.nis}</td><td><p className="font-semibold text-[var(--text-primary)] text-sm">{s.nama}{(s as any).hasPending && <button type="button" onClick={() => router.push('/approval')} className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(245,158,11,0.12)] text-[var(--warning)] border border-[rgba(245,158,11,0.2)] hover:bg-[rgba(245,158,11,0.2)] transition-colors">Izin Diajukan</button>}{(s as any).hasApprovedIzin && <button type="button" onClick={() => router.push('/approval')} className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(34,197,94,0.12)] text-[var(--bullish)] border border-[rgba(34,197,94,0.2)] hover:bg-[rgba(34,197,94,0.18)] transition-colors">Izin Disetujui</button>}</p><p className="text-[var(--text-muted)] text-xs">WA: {s.whatsappOrangTua}</p></td><td><div className="flex justify-center gap-1.5">{btnRow(s.id, state)}</div></td><td>{renderDetail(s.id, state)}</td></tr>);
                    })}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-4">
                {students.map((s) => {
                  const state = attendance[s.id] || { status: 'HADIR' as const };
                  return (<div key={s.id} className="p-4 glass rounded-[var(--radius-card)] space-y-3"><div className="flex justify-between items-start"><div><p className="font-bold text-[var(--text-primary)] text-sm">{s.nama}{(s as any).hasPending && <button type="button" onClick={() => router.push('/approval')} className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(245,158,11,0.12)] text-[var(--warning)] border border-[rgba(245,158,11,0.2)] hover:bg-[rgba(245,158,11,0.2)] transition-colors">Izin Diajukan</button>}{(s as any).hasApprovedIzin && <button type="button" onClick={() => router.push('/approval')} className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(34,197,94,0.12)] text-[var(--bullish)] border border-[rgba(34,197,94,0.2)] hover:bg-[rgba(34,197,94,0.18)] transition-colors">Izin Disetujui</button>}</p><p className="text-[var(--text-muted)] text-xs">NIS: {s.nis}</p></div></div><div className="grid grid-cols-4 gap-1.5">{btnRowMobile(s.id, state)}</div>{renderDetail(s.id, state)}</div>);
                })}
              </div>
            </>
          )}

          <div className="flex justify-end pt-4 border-t border-[var(--border-subtle)]">
            <button type="submit" disabled={isSubmitting || isLoading} className="btn-primary px-8 py-2.5 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed">{isSubmitting ? 'Menyimpan...' : 'Simpan dan Kirim'}</button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function AttendanceForm() {
  return (<Suspense fallback={<div className="glass-card max-w-5xl mx-auto p-10 text-center text-[var(--text-muted)] font-medium">Memuat form...</div>}><AttendanceFormInner /></Suspense>);
}
