'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface KelasItem {
  id: string;
  nama: string;
  waliKelas: string;
  _count: {
    siswa: number;
  };
}

interface SiswaItem {
  id: string;
  nis: string;
  nama: string;
  username: string;
  whatsappOrangTua: string;
  kelasId: string;
  kelas: {
    id: string;
    nama: string;
    waliKelas: string;
  };
}

type TabType = 'kelas' | 'siswa';

export default function ManagementPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('kelas');

  // Kelas state
  const [kelasList, setKelasList] = useState<KelasItem[]>([]);
  const [kelasLoading, setKelasLoading] = useState(false);
  const [showAddKelasForm, setShowAddKelasForm] = useState(false);
  const [addKelasLoading, setAddKelasLoading] = useState(false);
  const [kelasMsg, setKelasMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newKelasNama, setNewKelasNama] = useState('');
  const [newWaliKelas, setNewWaliKelas] = useState('');

  // Siswa state
  const [siswaList, setSiswaList] = useState<SiswaItem[]>([]);
  const [siswaLoading, setSiswaLoading] = useState(false);
  const [showAddSiswaForm, setShowAddSiswaForm] = useState(false);
  const [addSiswaLoading, setAddSiswaLoading] = useState(false);
  const [siswaMsg, setSiswaMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filterKelas, setFilterKelas] = useState<string>('all');
  const [newNis, setNewNis] = useState('');
  const [newNama, setNewNama] = useState('');
  const [newKelasId, setNewKelasId] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newWa, setNewWa] = useState('');

  useEffect(() => {
    if (activeTab === 'kelas') {
      fetchKelas();
    } else if (activeTab === 'siswa') {
      fetchKelas(); // Need class list for dropdown
      fetchSiswa();
    }
  }, [activeTab]);

  const fetchKelas = async () => {
    setKelasLoading(true);
    try {
      const res = await fetch('/api/admin/kelas');
      if (res.status === 403) { router.push('/login'); return; }
      const data = await res.json();
      setKelasList(data.kelas || []);
    } catch (e) {
      console.error(e);
    } finally {
      setKelasLoading(false);
    }
  };

  const fetchSiswa = async () => {
    setSiswaLoading(true);
    try {
      const res = await fetch('/api/admin/siswa');
      if (res.status === 403) { router.push('/login'); return; }
      const data = await res.json();
      setSiswaList(data.students || []);
    } catch (e) {
      console.error(e);
    } finally {
      setSiswaLoading(false);
    }
  };

  const handleAddKelas = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddKelasLoading(true);
    setKelasMsg(null);

    const res = await fetch('/api/admin/kelas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama: newKelasNama, waliKelas: newWaliKelas }),
    });

    const data = await res.json();

    if (!res.ok) {
      setKelasMsg({ type: 'error', text: data.error });
    } else {
      setKelasMsg({ type: 'success', text: `Kelas "${newKelasNama}" berhasil ditambahkan!` });
      setNewKelasNama('');
      setNewWaliKelas('');
      setShowAddKelasForm(false);
      fetchKelas();
    }

    setAddKelasLoading(false);
    setTimeout(() => setKelasMsg(null), 5000);
  };

  const handleDeleteKelas = async (id: string, nama: string) => {
    if (!confirm(`Yakin ingin menghapus kelas "${nama}"?`)) return;

    const res = await fetch(`/api/admin/kelas?id=${id}`, { method: 'DELETE' });

    if (res.ok) {
      setKelasMsg({ type: 'success', text: `Kelas "${nama}" berhasil dihapus.` });
      fetchKelas();
    } else {
      const data = await res.json();
      setKelasMsg({ type: 'error', text: data.error || 'Gagal menghapus kelas.' });
    }

    setTimeout(() => setKelasMsg(null), 4000);
  };

  const handleAddSiswa = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddSiswaLoading(true);
    setSiswaMsg(null);

    const res = await fetch('/api/admin/siswa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nis: newNis,
        nama: newNama,
        kelasId: newKelasId,
        username: newUsername,
        password: newPassword,
        whatsappOrangTua: newWa
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setSiswaMsg({ type: 'error', text: data.error });
    } else {
      setSiswaMsg({ type: 'success', text: `Akun "${newNama}" berhasil dibuat!` });
      setNewNis('');
      setNewNama('');
      setNewKelasId('');
      setNewUsername('');
      setNewPassword('');
      setNewWa('');
      setShowAddSiswaForm(false);
      fetchSiswa();
    }

    setAddSiswaLoading(false);
    setTimeout(() => setSiswaMsg(null), 5000);
  };

  const handleDeleteSiswa = async (id: string, nama: string) => {
    if (!confirm(`Yakin ingin menghapus akun siswa "${nama}"?`)) return;

    const res = await fetch(`/api/admin/siswa?id=${id}`, { method: 'DELETE' });

    if (res.ok) {
      setSiswaMsg({ type: 'success', text: `Akun "${nama}" berhasil dihapus.` });
      fetchSiswa();
    } else {
      const data = await res.json();
      setSiswaMsg({ type: 'error', text: data.error || 'Gagal menghapus.' });
    }

    setTimeout(() => setSiswaMsg(null), 4000);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const filteredSiswa = filterKelas === 'all'
    ? siswaList
    : siswaList.filter(s => s.kelasId === filterKelas);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-950 p-6 md:p-7 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-violet-600/20 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <span className="px-2.5 py-1 bg-violet-500/20 text-violet-300 border border-violet-500/30 rounded-full text-xs font-bold uppercase tracking-wider">Manajemen</span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2">Kelola Kelas & Siswa</h1>
          <p className="text-slate-300 text-sm">Tambahkan kelas dengan nama guru/wali kelas, dan kelola data siswa.</p>
        </div>
        <button onClick={handleLogout} className="relative z-10 inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/10 transition-all self-start">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
          </svg>
          Keluar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl w-fit">
        {(['kelas', 'siswa'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {tab === 'kelas' ? 'Kelola Kelas' : 'Kelola Siswa'}
          </button>
        ))}
      </div>

      {/* Kelas Tab */}
      {activeTab === 'kelas' && (
        <div className="space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Manajemen Kelas</h2>
              <p className="text-slate-400 text-xs mt-0.5">Tambahkan kelas baru dengan nama guru/wali kelas. Nama guru tidak dapat diubah setelah dibuat.</p>
            </div>
            <button onClick={() => setShowAddKelasForm(!showAddKelasForm)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-95 self-start">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Tambah Kelas Baru
            </button>
          </div>

          {kelasMsg && (
            <div className={`p-4 rounded-xl text-sm font-semibold border ${kelasMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
              {kelasMsg.text}
            </div>
          )}

          {showAddKelasForm && (
            <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100">Form Tambah Kelas Baru</h3>
              <form onSubmit={handleAddKelas} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nama Kelas *</label>
                    <input type="text" value={newKelasNama} onChange={(e) => setNewKelasNama(e.target.value)} required placeholder="Contoh: XI-RPL-1" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all" />
                    <p className="text-xs text-slate-400 mt-1">Format: [Tingkat]-[Jurusan]-[Nomor]</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nama Guru / Wali Kelas *</label>
                    <input type="text" value={newWaliKelas} onChange={(e) => setNewWaliKelas(e.target.value)} required placeholder="Contoh: Budi Santoso, S.Pd" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all" />
                    <p className="text-xs text-slate-400 mt-1">Nama tidak dapat diubah setelah dibuat</p>
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
                  <button type="button" onClick={() => setShowAddKelasForm(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all">Batal</button>
                  <button type="submit" disabled={addKelasLoading} className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all disabled:opacity-50 active:scale-95">
                    {addKelasLoading ? 'Menyimpan...' : 'Simpan Kelas'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Daftar Kelas ({kelasList.length} kelas)</h3>
              {kelasLoading && <span className="text-xs text-slate-400 animate-pulse">Memuat...</span>}
            </div>
            <div className="p-6">
              {kelasList.length === 0 && !kelasLoading ? (
                <div className="text-center py-10 text-slate-400 text-sm">Belum ada kelas. Klik "Tambah Kelas Baru".</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {kelasList.map((kelas) => (
                    <div key={kelas.id} className="p-5 bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-200 rounded-xl hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md">
                            {kelas.nama.split('-')[0]}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-base">{kelas.nama.replace(/-/g, ' ')}</h4>
                            <p className="text-xs text-slate-500">{kelas._count.siswa} siswa</p>
                          </div>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-slate-200">
                        <div className="flex items-center gap-2 mb-3">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-indigo-600">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                          </svg>
                          <span className="text-xs font-semibold text-slate-600">Wali Kelas:</span>
                        </div>
                        <p className="text-sm font-bold text-slate-800 mb-3">{kelas.waliKelas}</p>
                        <button
                          onClick={() => handleDeleteKelas(kelas.id, kelas.nama)}
                          disabled={kelas._count.siswa > 0}
                          className="w-full px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 hover:border-rose-300 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          title={kelas._count.siswa > 0 ? 'Tidak dapat menghapus kelas yang memiliki siswa' : 'Hapus kelas'}>
                          Hapus Kelas
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Siswa Tab */}
      {activeTab === 'siswa' && (
        <div className="space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Manajemen Akun Siswa</h2>
              <p className="text-slate-400 text-xs mt-0.5">Tambah, lihat, atau hapus akun siswa. Setiap siswa terhubung ke satu kelas.</p>
            </div>
            <button onClick={() => setShowAddSiswaForm(!showAddSiswaForm)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-95 self-start">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
              </svg>
              Tambah Siswa Baru
            </button>
          </div>

          {/* Filter */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <label className="block text-xs font-semibold text-slate-600 mb-2">Filter berdasarkan Kelas</label>
            <select value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)}
              className="w-full md:w-64 p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 bg-white transition-all">
              <option value="all">Semua Kelas</option>
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>{k.nama.replace(/-/g, ' ')}</option>
              ))}
            </select>
          </div>

          {siswaMsg && (
            <div className={`p-4 rounded-xl text-sm font-semibold border ${siswaMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
              {siswaMsg.text}
            </div>
          )}

          {showAddSiswaForm && (
            <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100">Form Tambah Akun Siswa Baru</h3>
              <form onSubmit={handleAddSiswa} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">NIS *</label>
                    <input type="text" value={newNis} onChange={(e) => setNewNis(e.target.value)} required placeholder="Contoh: 10011" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nama Lengkap *</label>
                    <input type="text" value={newNama} onChange={(e) => setNewNama(e.target.value)} required placeholder="Contoh: Ahmad Fauzan" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Kelas *</label>
                    <select value={newKelasId} onChange={(e) => setNewKelasId(e.target.value)} required className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 bg-white transition-all">
                      <option value="">Pilih Kelas</option>
                      {kelasList.map((k) => (
                        <option key={k.id} value={k.id}>{k.nama.replace(/-/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Username Login *</label>
                    <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} required placeholder="Contoh: 10011" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password * (min. 6 karakter)</label>
                    <input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} placeholder="Contoh: siswa123" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all font-mono" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">No. WA Orang Tua (628xxx)</label>
                    <input type="text" value={newWa} onChange={(e) => setNewWa(e.target.value)} placeholder="Contoh: 6281234567890" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all font-mono" />
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
                  <button type="button" onClick={() => setShowAddSiswaForm(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all">Batal</button>
                  <button type="submit" disabled={addSiswaLoading} className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all disabled:opacity-50 active:scale-95">
                    {addSiswaLoading ? 'Menyimpan...' : 'Simpan Akun Siswa'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Daftar Akun Siswa ({filteredSiswa.length} siswa)</h3>
              {siswaLoading && <span className="text-xs text-slate-400 animate-pulse">Memuat...</span>}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-left">NIS</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-left">Nama Siswa</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-left">Kelas</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-left">Username</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-left hidden md:table-cell">No. WA Ortu</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredSiswa.length === 0 && !siswaLoading ? (
                    <tr><td colSpan={6} className="p-10 text-center text-slate-400 text-sm">
                      {filterKelas === 'all' ? 'Belum ada data. Klik "Tambah Siswa Baru".' : 'Tidak ada siswa di kelas ini.'}
                    </td></tr>
                  ) : filteredSiswa.map((siswa) => (
                    <tr key={siswa.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 text-sm text-slate-600 font-mono">{siswa.nis}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xs flex-shrink-0">{siswa.nama.charAt(0)}</div>
                          <span className="font-semibold text-slate-800 text-sm">{siswa.nama}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-600">{siswa.kelas.nama.replace(/-/g, ' ')}</td>
                      <td className="p-4 text-sm text-slate-600 font-mono">{siswa.username}</td>
                      <td className="p-4 text-sm text-slate-500 hidden md:table-cell font-mono">{siswa.whatsappOrangTua || '-'}</td>
                      <td className="p-4 text-center">
                        <button onClick={() => handleDeleteSiswa(siswa.id, siswa.nama)} className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-100 hover:border-rose-200 rounded-lg transition-all">Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
