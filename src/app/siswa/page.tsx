'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface IzinItem {
  id: string;
  alasan: string;
  buktiFoto: string;
  statusApproval: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

interface Stats {
  hadir: number;
  izin: number;
  sakit: number;
  alpa: number;
  total: number;
}

export default function SiswaDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ hadir: 0, izin: 0, sakit: 0, alpa: 0, total: 0 });
  const [izinList, setIzinList] = useState<IzinItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formTanggal, setFormTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [formTipe, setFormTipe] = useState<'IZIN' | 'SAKIT'>('IZIN');
  const [formAlasan, setFormAlasan] = useState('');
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formPreview, setFormPreview] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/siswa/izin');
      if (res.status === 403) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setStats(data.stats);
      setIzinList(data.izinList);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
      setFormError('File video tidak diperbolehkan! Hanya foto JPEG/PNG.');
      e.target.value = '';
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setFormError('Hanya menerima foto JPEG atau PNG!');
      e.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFormError('Ukuran foto maksimal 2MB!');
      e.target.value = '';
      return;
    }

    setFormError('');
    setFormFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setFormPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmitIzin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAlasan.trim()) { setFormError('Alasan wajib diisi!'); return; }
    if (!formFile) { setFormError('Foto bukti wajib diunggah!'); return; }

    setFormLoading(true);
    setFormError('');

    const fd = new FormData();
    fd.append('alasan', formAlasan);
    fd.append('tipe', formTipe);
    fd.append('tanggal', formTanggal);
    fd.append('file', formFile);

    const res = await fetch('/api/siswa/izin', { method: 'POST', body: fd });
    const data = await res.json();

    if (!res.ok) {
      setFormError(data.error);
    } else {
      setFormSuccess('Pengajuan izin berhasil dikirim! Menunggu persetujuan guru.');
      setShowForm(false);
      setFormAlasan('');
      setFormFile(null);
      setFormPreview('');
      fetchData();
      setTimeout(() => setFormSuccess(''), 5000);
    }
    setFormLoading(false);
  };

  const persentaseHadir = stats.total > 0
    ? ((stats.hadir / stats.total) * 100).toFixed(1)
    : '0.0';

  const statusBadge: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
    APPROVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    REJECTED: 'bg-rose-100 text-rose-700 border-rose-200',
  };
  const statusLabel: Record<string, string> = {
    PENDING: 'Menunggu',
    APPROVED: 'Disetujui',
    REJECTED: 'Ditolak',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-6">

      {/* Header Siswa */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900/80 to-teal-900/80 p-6 rounded-3xl border border-emerald-700/30 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-400/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10">
          <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
            Portal Siswa
          </span>
          <h1 className="text-2xl font-extrabold text-white mt-2 tracking-tight">Dashboard Kehadiran Saya</h1>
          <p className="text-emerald-200/70 text-sm">Pantau rekap absensi dan ajukan izin/sakit secara mandiri.</p>
        </div>
        <button
          onClick={handleLogout}
          className="relative z-10 inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/10 transition-all self-start"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
          </svg>
          Keluar
        </button>
      </div>

      {/* Notifikasi Sukses */}
      {formSuccess && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-sm font-semibold">
          {formSuccess}
        </div>
      )}

      {/* Grid Statistik Pribadi */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Hadir', value: stats.hadir, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: 'Izin', value: stats.izin, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
          { label: 'Sakit', value: stats.sakit, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100' },
          { label: 'Alpa', value: stats.alpa, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
        ].map((item) => (
          <div key={item.label} className={`${item.bg} ${item.border} border p-4 rounded-2xl shadow-sm`}>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{item.label}</p>
            <p className={`text-3xl font-black mt-1 ${item.color}`}>{item.value}</p>
            <p className="text-[10px] text-slate-400 mt-1">Hari</p>
          </div>
        ))}
      </div>

      {/* Progress Bar Kehadiran */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-slate-800">Persentase Kehadiran Saya</h3>
          <span className={`text-lg font-black ${Number(persentaseHadir) >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {persentaseHadir}%
          </span>
        </div>
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-700 ${
              Number(persentaseHadir) >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
            style={{ width: `${persentaseHadir}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-2">
          <span>0%</span>
          <span className="text-amber-500 font-semibold">Min. 75%</span>
          <span>100%</span>
        </div>
        {Number(persentaseHadir) < 75 && (
          <p className="text-rose-600 text-xs font-bold mt-3 p-3 bg-rose-50 rounded-xl border border-rose-100">
            ⚠️ Kehadiran Anda di bawah batas minimum 75%. Segera hubungi Wali Kelas.
          </p>
        )}
      </div>

      {/* Panel Pengajuan Izin */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="font-bold text-slate-800">Riwayat Pengajuan Izin/Sakit</h3>
            <p className="text-xs text-slate-400 mt-0.5">Daftar 10 pengajuan terbaru Anda.</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-100 transition-all active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Ajukan Izin
          </button>
        </div>

        {/* Form Pengajuan Izin */}
        {showForm && (
          <div className="mb-6 p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
            <h4 className="font-bold text-slate-800 text-sm">Form Pengajuan Izin/Sakit</h4>
            {formError && <p className="text-rose-600 text-xs font-semibold bg-rose-50 p-3 rounded-xl border border-rose-100">{formError}</p>}
            <form onSubmit={handleSubmitIzin} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal Tidak Masuk</label>
                  <input type="date" value={formTanggal} onChange={(e) => setFormTanggal(e.target.value)} required
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Jenis Ketidakhadiran</label>
                  <select value={formTipe} onChange={(e) => setFormTipe(e.target.value as 'IZIN' | 'SAKIT')}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 bg-white">
                    <option value="IZIN">Izin</option>
                    <option value="SAKIT">Sakit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Alasan / Keterangan *</label>
                <textarea value={formAlasan} onChange={(e) => setFormAlasan(e.target.value)} required rows={3}
                  placeholder="Jelaskan alasan ketidakhadiran Anda secara singkat dan jelas..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 bg-white resize-none" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Foto Bukti (JPEG/PNG, Maks. 2MB) *
                </label>
                <input type="file" accept="image/png,image/jpeg,image/jpg" onChange={handleFileChange} required
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" />
                {formPreview && (
                  <div className="mt-2 w-24 h-24 rounded-xl overflow-hidden border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={formPreview} alt="preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                  Batal
                </button>
                <button type="submit" disabled={formLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all disabled:opacity-50">
                  {formLoading ? 'Mengirim...' : 'Kirim Pengajuan'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Daftar Riwayat Izin */}
        {isLoading ? (
          <div className="text-center py-10 text-slate-400 text-sm">Memuat data...</div>
        ) : izinList.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-slate-400 font-semibold text-sm">Belum ada riwayat pengajuan izin.</p>
            <p className="text-slate-300 text-xs mt-1">Klik tombol "Ajukan Izin" di atas untuk membuat pengajuan baru.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {izinList.map((item) => (
              <div key={item.id} className="p-4 border border-slate-100 rounded-xl flex justify-between items-start gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 font-medium line-clamp-2">"{item.alasan}"</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Dikirim: {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border flex-shrink-0 ${statusBadge[item.statusApproval]}`}>
                  {statusLabel[item.statusApproval]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
