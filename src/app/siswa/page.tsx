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
      setStats(data.stats); setIzinList(data.izinList);
    } catch { /* ignore */ } finally { setIsLoading(false); }
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
          <button onClick={() => setShowForm(true)} className="btn-primary px-4 py-2 text-xs font-bold">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 inline mr-1.5 -mt-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Ajukan Izin
          </button>
        </div>

        {/* Modal */}
        {showForm && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
            <div className="w-full max-w-md glass rounded-2xl shadow-2xl animate-slide-up border border-white/10" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <h3 className="font-bold text-white text-base">Ajukan Izin / Sakit</h3>
                <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-white/60"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="px-6 py-5 space-y-4">
                {formError && <p className="text-red-400 text-xs font-semibold bg-red-500/10 p-3 rounded-xl border border-red-500/20">{formError}</p>}
                <form onSubmit={handleSubmitIzin} className="space-y-4" id="izinForm">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider">Tanggal</label>
                      <input type="date" value={formTanggal} onChange={(e) => setFormTanggal(e.target.value)} required className="w-full px-3 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider">Jenis</label>
                      <select value={formTipe} onChange={(e) => setFormTipe(e.target.value as 'IZIN' | 'SAKIT')} className="w-full px-3 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all appearance-none">
                        <option value="IZIN" className="bg-gray-900">Izin</option>
                        <option value="SAKIT" className="bg-gray-900">Sakit</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider">Alasan</label>
                    <textarea value={formAlasan} onChange={(e) => setFormAlasan(e.target.value)} required rows={3} placeholder="Jelaskan alasan..." className="w-full px-3 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all resize-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider">Foto Bukti</label>
                    <input type="file" accept="image/png,image/jpeg,image/jpg" onChange={handleFileChange} required className="w-full text-xs text-white/50 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20 transition-all cursor-pointer" />
                    {formPreview && <div className="mt-2 w-16 h-16 rounded-xl overflow-hidden border border-white/10"><img src={formPreview} alt="" className="w-full h-full object-cover" /></div>}
                  </div>
                </form>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-semibold rounded-full bg-white/5 text-white/60 hover:bg-white/10 transition-all">Batal</button>
                <button type="submit" form="izinForm" disabled={formLoading} className="px-5 py-2 text-sm font-bold rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:brightness-110 transition-all disabled:opacity-40">{formLoading ? 'Mengirim...' : 'Kirim'}</button>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-10 text-sm text-white/40">Memuat data...</div>
        ) : izinList.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm font-semibold text-white/40">Belum ada riwayat pengajuan izin.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {izinList.map((item) => (
              <div key={item.id} className="p-4 border border-white/5 rounded-xl flex justify-between items-start gap-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/70 font-medium line-clamp-2">{item.alasan}</p>
                  <p className="text-xs text-white/40 mt-1">{new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
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
