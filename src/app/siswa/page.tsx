'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface IzinItem {
  id: string; alasan: string; buktiFoto: string;
  statusApproval: 'PENDING' | 'APPROVED' | 'REJECTED'; createdAt: string;
}
interface Stats { hadir: number; izin: number; sakit: number; alpa: number; total: number; }

export default function SiswaDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ hadir: 0, izin: 0, sakit: 0, alpa: 0, total: 0 });
  const [izinList, setIzinList] = useState<IzinItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formTanggal, setFormTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [formTipe, setFormTipe] = useState<'IZIN' | 'SAKIT'>('IZIN');
  const [formAlasan, setFormAlasan] = useState('');
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formPreview, setFormPreview] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/siswa/izin');
      if (res.status === 403) { router.push('/login'); return; }
      const data = await res.json();
      if (data.stats && data.izinList) { setStats(data.stats); setIzinList(data.izinList); }
    } catch { /* ponytail: keep defaults on error */ } finally { setIsLoading(false); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith('video/')) { setFormError('Video tidak diperbolehkan!'); e.target.value = ''; return; }
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) { setFormError('Hanya JPEG/PNG!'); e.target.value = ''; return; }
    if (file.size > 2 * 1024 * 1024) { setFormError('Maksimal 2MB!'); e.target.value = ''; return; }
    setFormError(''); setFormFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setFormPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmitIzin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAlasan.trim()) { setFormError('Alasan wajib diisi!'); return; }
    if (!formFile) { setFormError('Foto bukti wajib!'); return; }
    setFormLoading(true); setFormError('');
    const fd = new FormData();
    fd.append('alasan', formAlasan); fd.append('tipe', formTipe);
    fd.append('tanggal', formTanggal); fd.append('file', formFile);
    const res = await fetch('/api/siswa/izin', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) { setFormError(data.error); }
    else {
      setFormSuccess('Pengajuan berhasil dikirim! Menunggu persetujuan.');
      setShowForm(false); setFormAlasan(''); setFormFile(null); setFormPreview('');
      fetchData(); setTimeout(() => setFormSuccess(''), 5000);
    }
    setFormLoading(false);
  };

  const pct = stats.total > 0 ? ((stats.hadir / stats.total) * 100).toFixed(1) : '0.0';
  const sb: Record<string, string> = { PENDING: 'badge-amber', APPROVED: 'badge-green', REJECTED: 'badge-red' };
  const sl: Record<string, string> = { PENDING: 'Menunggu', APPROVED: 'Disetujui', REJECTED: 'Ditolak' };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="badge badge-green mb-2">Portal Siswa</span>
          <h1>Dashboard Kehadiran Saya</h1>
          <p>Pantau rekap absensi dan ajukan izin atau sakit secara mandiri.</p>
        </div>
      </div>

      {formSuccess && <div className="p-4 bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] rounded-[var(--radius-input)] text-sm font-semibold text-[#4ade80]">{formSuccess}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Hadir', value: stats.hadir, color: 'text-[var(--bullish)]' },
          { label: 'Izin', value: stats.izin, color: 'text-[var(--warning)]' },
          { label: 'Sakit', value: stats.sakit, color: 'text-[var(--info)]' },
          { label: 'Alpa', value: stats.alpa, color: 'text-[var(--bearish)]' },
        ].map((item) => (
          <div key={item.label} className="stat-card">
            <p className="label">{item.label}</p>
            <p className={`value ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="glass-card p-5">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-[var(--text-primary)] text-sm">Persentase Kehadiran Saya</h3>
          <span className={`text-lg font-black ${Number(pct) >= 75 ? 'text-[var(--bullish)]' : 'text-[var(--bearish)]'}`}>{pct}%</span>
        </div>
        <div className="progress-bar">
          <div className={`progress-bar-fill ${Number(pct) >= 75 ? 'bg-[var(--bullish)]' : 'bg-[var(--bearish)]'}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between text-xs text-[var(--text-muted)] mt-2">
          <span>0%</span><span className="text-[var(--warning)] font-semibold">Min. 75%</span><span>100%</span>
        </div>
        {Number(pct) < 75 && (
          <p className="text-[var(--bearish)] text-xs font-bold mt-3 p-3 bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.15)] rounded-[var(--radius-input)]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 inline mr-1 -mt-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
            Kehadiran Anda di bawah batas minimum 75%. Segera hubungi Wali Kelas.
          </p>
        )}
      </div>

      <div className="glass-card p-5">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="font-bold text-[var(--text-primary)] text-sm">Riwayat Pengajuan Izin/Sakit</h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Daftar 10 pengajuan terbaru Anda.</p>
          </div>
          <button onClick={() => setShowForm(v => !v)} className={`btn-primary px-4 py-2 text-xs font-bold transition-all ${showForm ? 'opacity-70' : ''}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-4 h-4 inline mr-1.5 -mt-0.5 transition-transform duration-300 ${showForm ? 'rotate-45' : ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            {showForm ? 'Tutup' : 'Ajukan Izin'}
          </button>
        </div>

        {/* ponytail: inline form — expands/collapses via grid-rows transition instead of a modal */}
        <div
          className={`grid transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${showForm ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            }`}
        >
          <div className="overflow-hidden">
            <div className="mt-4 p-5 rounded-[var(--radius-card)] border border-[var(--accent-border)] bg-gradient-to-br from-[rgba(99,102,241,0.04)] to-[rgba(139,92,246,0.08)] relative">
              <div className="absolute -top-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-[var(--brand)] to-transparent opacity-40" />
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">Ajukan Izin / Sakit</h4>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Lengkapi data di bawah untuk mengajukan izin atau sakit.</p>
                </div>
                <button onClick={() => setShowForm(false)} className="btn-ghost w-7 h-7 rounded-[var(--radius-pill)] grid place-items-center shrink-0 hover:bg-[rgba(255,255,255,0.06)] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              {formError && <p className="text-[var(--bearish)] text-xs font-semibold bg-[rgba(239,68,68,0.1)] p-3 rounded-[var(--radius-input)] border border-[rgba(239,68,68,0.2)] mb-4">{formError}</p>}
              <form onSubmit={handleSubmitIzin} className="space-y-4" id="izinFormInline">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Tanggal</label>
                    <input type="date" value={formTanggal} onChange={(e) => setFormTanggal(e.target.value)} required className="glass-input w-full p-2.5 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Jenis</label>
                    <select value={formTipe} onChange={(e) => setFormTipe(e.target.value as 'IZIN' | 'SAKIT')} className="glass-select w-full p-2.5 text-sm">
                      <option value="IZIN">Izin</option>
                      <option value="SAKIT">Sakit</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Alasan</label>
                  <textarea value={formAlasan} onChange={(e) => setFormAlasan(e.target.value)} required rows={3} placeholder="Jelaskan alasan secara lengkap..." className="glass-input w-full p-2.5 text-sm resize-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Foto Bukti</label>
                  <div className="flex items-start gap-3">
                    <input type="file" accept="image/png,image/jpeg,image/jpg" onChange={handleFileChange} required className="flex-1 text-xs text-[var(--text-muted)] file:mr-3 file:py-2 file:px-4 file:rounded-[var(--radius-pill)] file:border-0 file:text-xs file:font-semibold file:bg-[rgba(99,102,241,0.1)] file:text-[var(--brand)] hover:file:bg-[rgba(99,102,241,0.18)] transition-all cursor-pointer file:transition-all" />
                    {formPreview && (
                      <div className="w-14 h-14 rounded-[var(--radius-card)] overflow-hidden border border-[var(--border-default)] shrink-0 bg-[var(--bg-card)]">
                        <img src={formPreview} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary px-4 py-2 text-xs font-bold">Batal</button>
                  <button type="submit" disabled={formLoading} className="btn-primary px-5 py-2 text-xs font-bold">{formLoading ? 'Mengirim...' : 'Kirim Pengajuan'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-sm text-[var(--text-muted)]">Memuat data...</div>
        ) : izinList.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm font-semibold text-[var(--text-muted)]">Belum ada riwayat pengajuan izin.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {izinList.map((item) => (
              <div key={item.id} className="p-4 border border-[var(--border-subtle)] rounded-xl flex justify-between items-start gap-4 hover:bg-[var(--bg-glass)] transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-secondary)] font-medium line-clamp-2">{item.alasan}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <span className={`badge ${sb[item.statusApproval]} flex-shrink-0`}>{sl[item.statusApproval]}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
