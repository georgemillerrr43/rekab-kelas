'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface KelasItem { id: string; nama: string; waliKelas: string; _count: { siswa: number }; }
interface GuruItem { id: string; username: string; nama: string; passwordPlain: string; kelasId: string; kelas: { id: string; nama: string; waliKelas: string }; }
interface SiswaItem { id: string; nis: string; nama: string; username: string; passwordPlain: string; whatsappOrangTua: string; kelasId: string; kelas: { id: string; nama: string; waliKelas: string }; }
type TabType = 'kelas' | 'guru' | 'siswa';

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);
  if (!open) return null;
  return (
    <>
      <div className="modal-backdrop" />
      <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
            <h3 className="font-bold text-[var(--text-primary)] text-base">{title}</h3>
            <button onClick={onClose} className="btn-ghost w-8 h-8 rounded-[var(--radius-pill)] grid place-items-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="px-6 py-5">{children}</div>
        </div>
      </div>
    </>
  );
}

function ConfirmModal({ open, title, message, confirmLabel, loading, onConfirm, onCancel }: {
  open: boolean; title: string; message: string; confirmLabel: string; loading?: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <>
      <div className="modal-backdrop" />
      <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
        <div className="modal-panel max-w-sm" onClick={(e) => e.stopPropagation()}>
          <div className="px-6 py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-[rgba(239,68,68,0.12)] flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="var(--bearish)" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
            </div>
            <h3 className="font-bold text-[var(--text-primary)] text-base mb-2">{title}</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">{message}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={onCancel} className="btn btn-secondary px-5 py-2 text-sm">Batal</button>
              <button onClick={onConfirm} disabled={loading} className="px-5 py-2 text-sm font-bold rounded-[var(--radius-pill)] bg-[var(--bearish)] text-white hover:opacity-90 transition-all disabled:opacity-40">{loading ? 'Memproses...' : confirmLabel}</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ManagementPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('kelas');
  const [kelasList, setKelasList] = useState<KelasItem[]>([]);
  const [kelasLoading, setKelasLoading] = useState(false);
  const [showAddKelas, setShowAddKelas] = useState(false);
  const [addKelasLoading, setAddKelasLoading] = useState(false);
  const [kelasMsg, setKelasMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newKNama, setNewKNama] = useState('');
  const [newWKelas, setNewWKelas] = useState('');
  const [guruUsername, setGuruUsername] = useState('');
  const [guruPassword, setGuruPassword] = useState('');
  const [editKelas, setEditKelas] = useState<{ id: string; nama: string; waliKelas: string } | null>(null);
  const [editKNama, setEditKNama] = useState('');
  const [editWKelas, setEditWKelas] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nama: string; type: 'kelas' | 'guru' | 'siswa' } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [guruList, setGuruList] = useState<GuruItem[]>([]);
  const [guruLoading, setGuruLoading] = useState(false);
  const [guruMsg, setGuruMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [siswaList, setSiswaList] = useState<SiswaItem[]>([]);
  const [siswaLoading, setSiswaLoading] = useState(false);
  const [showAddSiswa, setShowAddSiswa] = useState(false);
  const [addSiswaLoading, setAddSiswaLoading] = useState(false);
  const [siswaMsg, setSiswaMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filterKelas, setFilterKelas] = useState<string>('all');
  const [fNis, setFNis] = useState(''); const [fNama, setFNama] = useState('');
  const [fKelasId, setFKelasId] = useState(''); const [fUsername, setFUsername] = useState('');
  const [fPassword, setFPassword] = useState(''); const [fWa, setFWa] = useState('');
  // Guru: password toggle, edit, export
  const [visibleGuruPassword, setVisibleGuruPassword] = useState<Record<string, boolean>>({});
  const [editGuru, setEditGuru] = useState<{ id: string; username: string; nama: string } | null>(null);
  const [editGuruUsername, setEditGuruUsername] = useState('');
  const [editGuruNama, setEditGuruNama] = useState('');
  const [editGuruPassword, setEditGuruPassword] = useState('');
  const [editGuruLoading, setEditGuruLoading] = useState(false);
  // Siswa: password toggle, edit, export
  const [visibleSiswaPassword, setVisibleSiswaPassword] = useState<Record<string, boolean>>({});
  const [editSiswa, setEditSiswa] = useState<SiswaItem | null>(null);
  const [editSiswaNis, setEditSiswaNis] = useState('');
  const [editSiswaNama, setEditSiswaNama] = useState('');
  const [editSiswaUsername, setEditSiswaUsername] = useState('');
  const [editSiswaPassword, setEditSiswaPassword] = useState('');
  const [editSiswaWa, setEditSiswaWa] = useState('');
  const [editSiswaLoading, setEditSiswaLoading] = useState(false);
  const [exportKelasFilter, setExportKelasFilter] = useState('all');

  useEffect(() => {
    if (activeTab === 'kelas') fetchKelas();
    else if (activeTab === 'guru') fetchGuru();
    else { fetchKelas(); fetchSiswa(); }
  }, [activeTab]);

  const fetchGuru = async () => {
    setGuruLoading(true);
    try {
      const res = await fetch('/api/admin/guru');
      if (res.status === 403) { router.push('/login'); return; }
      setGuruList((await res.json()).guru || []);
    } catch { /* ignore */ } finally { setGuruLoading(false); }
  };
  const fetchKelas = async () => {
    setKelasLoading(true);
    try {
      const res = await fetch('/api/admin/kelas');
      if (res.status === 403) { router.push('/login'); return; }
      setKelasList((await res.json()).kelas || []);
    } catch { /* ignore */ } finally { setKelasLoading(false); }
  };
  const fetchSiswa = async () => {
    setSiswaLoading(true);
    try {
      const res = await fetch('/api/admin/siswa');
      if (res.status === 403) { router.push('/login'); return; }
      setSiswaList((await res.json()).students || []);
    } catch { /* ignore */ } finally { setSiswaLoading(false); }
  };

  const handleAddKelas = async (e: React.FormEvent) => {
    e.preventDefault(); setAddKelasLoading(true); setKelasMsg(null);
    const res = await fetch('/api/admin/kelas', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama: newKNama, waliKelas: newWKelas, guruUsername: guruUsername || undefined, guruPassword: guruPassword || undefined }),
    });
    const data = await res.json();
    if (!res.ok) setKelasMsg({ type: 'error', text: data.error });
    else { setKelasMsg({ type: 'success', text: `Kelas "${newKNama}" berhasil ditambahkan!` }); setNewKNama(''); setNewWKelas(''); setGuruUsername(''); setGuruPassword(''); setShowAddKelas(false); fetchKelas(); }
    setAddKelasLoading(false); setTimeout(() => setKelasMsg(null), 5000);
  };

  const startEditKelas = (k: { id: string; nama: string; waliKelas: string }) => {
    setEditKelas(k); setEditKNama(k.nama); setEditWKelas(k.waliKelas);
  };

  const handleEditKelas = async (e: React.FormEvent) => {
    e.preventDefault(); setEditLoading(true); setKelasMsg(null);
    const res = await fetch('/api/admin/kelas', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editKelas!.id, nama: editKNama, waliKelas: editWKelas }),
    });
    const data = await res.json();
    if (!res.ok) setKelasMsg({ type: 'error', text: data.error });
    else { setKelasMsg({ type: 'success', text: `Kelas "${editKNama}" berhasil diperbarui!` }); setEditKelas(null); fetchKelas(); }
    setEditLoading(false); setTimeout(() => setKelasMsg(null), 5000);
  };

  const handleDeleteKelas = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const res = await fetch(`/api/admin/kelas?id=${deleteTarget.id}`, { method: 'DELETE' });
    if (res.ok) { setKelasMsg({ type: 'success', text: `"${deleteTarget.nama}" dihapus.` }); fetchKelas(); }
    else setKelasMsg({ type: 'error', text: 'Gagal menghapus.' });
    setDeleteLoading(false); setDeleteTarget(null); setTimeout(() => setKelasMsg(null), 4000);
  };

  const handleDeleteGuru = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const res = await fetch(`/api/admin/guru?id=${deleteTarget.id}`, { method: 'DELETE' });
    if (res.ok) { setGuruMsg({ type: 'success', text: `Guru "${deleteTarget.nama}" dihapus.` }); fetchGuru(); }
    else setGuruMsg({ type: 'error', text: 'Gagal.' });
    setDeleteLoading(false); setDeleteTarget(null); setTimeout(() => setGuruMsg(null), 4000);
  };

  const handleDeleteSiswa = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const res = await fetch(`/api/admin/siswa?id=${deleteTarget.id}`, { method: 'DELETE' });
    if (res.ok) { setSiswaMsg({ type: 'success', text: `"${deleteTarget.nama}" dihapus.` }); fetchSiswa(); }
    else setSiswaMsg({ type: 'error', text: 'Gagal.' });
    setDeleteLoading(false); setDeleteTarget(null); setTimeout(() => setSiswaMsg(null), 4000);
  };

  // ---- Guru Edit ----
  const startEditGuru = (g: GuruItem) => {
    setEditGuru({ id: g.id, username: g.username, nama: g.nama });
    setEditGuruUsername(g.username); setEditGuruNama(g.nama); setEditGuruPassword('');
  };
  const handleEditGuru = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editGuru) return;
    setEditGuruLoading(true); setGuruMsg(null);
    const body: Record<string, string> = { id: editGuru.id, username: editGuruUsername, nama: editGuruNama };
    if (editGuruPassword) body.password = editGuruPassword;
    const res = await fetch('/api/admin/guru', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) setGuruMsg({ type: 'error', text: data.error ?? 'Gagal update guru' });
    else { setGuruMsg({ type: 'success', text: 'Guru berhasil diperbarui!' }); setEditGuru(null); fetchGuru(); }
    setEditGuruLoading(false); setTimeout(() => setGuruMsg(null), 5000);
  };

  // ---- Siswa Edit ----
  const startEditSiswa = (s: SiswaItem) => {
    setEditSiswa(s); setEditSiswaNis(s.nis); setEditSiswaNama(s.nama); setEditSiswaUsername(s.username);
    setEditSiswaPassword(''); setEditSiswaWa(s.whatsappOrangTua);
  };
  const handleEditSiswa = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editSiswa) return;
    setEditSiswaLoading(true); setSiswaMsg(null);
    const body: Record<string, string> = { id: editSiswa.id, nis: editSiswaNis, nama: editSiswaNama, username: editSiswaUsername, whatsappOrangTua: editSiswaWa };
    if (editSiswaPassword) body.password = editSiswaPassword;
    const res = await fetch('/api/admin/siswa', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) setSiswaMsg({ type: 'error', text: data.error ?? 'Gagal update siswa' });
    else { setSiswaMsg({ type: 'success', text: 'Siswa berhasil diperbarui!' }); setEditSiswa(null); fetchSiswa(); }
    setEditSiswaLoading(false); setTimeout(() => setSiswaMsg(null), 5000);
  };

  // ---- Export PDF ----
  const exportGuruPDF = async () => {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.setFont('Helvetica', 'bold'); doc.setFontSize(14); doc.text('DAFTAR GURU', 14, 20);
    doc.setFont('Helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100);
    doc.text(`Sistem Informasi Akademik — RekapKelas`, 14, 27);
    doc.text(`Tanggal Cetak: ${today}`, 14, 33);
    doc.setDrawColor(200,200,200); doc.setLineWidth(0.3); doc.line(14, 36, 196, 36);
    const startY = 42;
    autoTable(doc, {
      startY,
      head: [['No', 'Nama', 'Username', 'Password']],
      body: guruList.map((g, i) => [i + 1, g.nama, g.username, g.passwordPlain || '']),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 41, 59] },
    });
    doc.save('daftar-guru.pdf');
  };
  const exportSiswaPDF = async () => {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
    const toExport = exportKelasFilter === 'all' ? siswaList : siswaList.filter(s => s.kelasId === exportKelasFilter);
    const kelasLabel = exportKelasFilter === 'all' ? 'Semua Kelas' : (kelasList.find(k => k.id === exportKelasFilter)?.nama.replace(/-/g, ' ') ?? 'Filter');
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.setFont('Helvetica', 'bold'); doc.setFontSize(14); doc.text('DAFTAR SISWA', 14, 20);
    doc.setFont('Helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100);
    doc.text(`Sistem Informasi Akademik — RekapKelas`, 14, 27);
    doc.text(`Kelas: ${kelasLabel}`, 14, 33);
    doc.text(`Tanggal Cetak: ${today}`, 14, 39);
    doc.setDrawColor(200,200,200); doc.setLineWidth(0.3); doc.line(14, 42, 196, 42);
    const startY = 48;
    autoTable(doc, {
      startY,
      head: [['No', 'NIS', 'Nama', 'Username', 'Password', 'WA Ortu']],
      body: toExport.map((s, i) => [i + 1, s.nis, s.nama, s.username, s.passwordPlain || '', s.whatsappOrangTua || '-']),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 41, 59] },
    });
    const label = exportKelasFilter === 'all' ? 'semua-kelas' : (kelasList.find(k => k.id === exportKelasFilter)?.nama ?? 'filter');
    doc.save(`daftar-siswa-${label}.pdf`);
  };

  const handleAddSiswa = async (e: React.FormEvent) => {
    e.preventDefault(); setAddSiswaLoading(true); setSiswaMsg(null);
    const res = await fetch('/api/admin/siswa', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nis: fNis, nama: fNama, kelasId: fKelasId, username: fUsername, password: fPassword, whatsappOrangTua: fWa }),
    });
    const data = await res.json();
    if (!res.ok) setSiswaMsg({ type: 'error', text: data.error });
    else { setSiswaMsg({ type: 'success', text: `Akun "${fNama}" berhasil dibuat!` }); setFNis(''); setFNama(''); setFKelasId(''); setFUsername(''); setFPassword(''); setFWa(''); setShowAddSiswa(false); fetchSiswa(); }
    setAddSiswaLoading(false); setTimeout(() => setSiswaMsg(null), 5000);
  };

  const filteredSiswa = filterKelas === 'all' ? siswaList : siswaList.filter(s => s.kelasId === filterKelas);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <span className="badge badge-gray mb-2">Manajemen</span>
        <h1>Kelola Kelas dan Siswa</h1>
        <p>Tambahkan kelas dengan nama guru atau wali kelas, dan kelola data siswa.</p>
      </div>

      <div className="tab-switcher animate-fade-in">
        {(['kelas', 'guru', 'siswa'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={activeTab === tab ? 'active' : ''}>{tab === 'kelas' ? 'Kelas' : tab === 'guru' ? 'Guru' : 'Siswa'}</button>
        ))}
      </div>

      {activeTab === 'kelas' && (
        <div className="space-y-5 animate-fade-in">
          <div className="glass-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div><h2 className="text-lg font-bold text-[var(--text-primary)]">Manajemen Kelas</h2><p className="text-[var(--text-muted)] text-xs mt-0.5">Tambahkan kelas baru dengan nama guru / wali kelas.</p></div>
            <button onClick={() => setShowAddKelas(true)} className="btn-primary px-5 py-2.5 text-sm font-bold">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 inline mr-1.5 -mt-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>Tambah Kelas
            </button>
          </div>

          {kelasMsg && <div className={`p-4 rounded-[var(--radius-input)] text-sm font-semibold border animate-slide-down ${kelasMsg.type === 'success' ? 'bg-[rgba(34,197,94,0.1)] border-[rgba(34,197,94,0.2)] text-[#4ade80]' : 'bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.2)] text-[#f87171]'}`}>{kelasMsg.text}</div>}

          <Modal open={showAddKelas} onClose={() => setShowAddKelas(false)} title="Tambah Kelas Baru">
            <form onSubmit={handleAddKelas} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Nama Kelas *</label><input type="text" value={newKNama} onChange={(e) => setNewKNama(e.target.value)} required placeholder="XI-RPL-1" className="glass-input w-full p-2.5 text-sm" /></div>
                <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Wali Kelas *</label><input type="text" value={newWKelas} onChange={(e) => setNewWKelas(e.target.value)} required placeholder="Budi Santoso, S.Pd" className="glass-input w-full p-2.5 text-sm" /></div>
              </div>
              <div className="border-t border-[var(--border-subtle)] pt-3">
                <p className="text-xs font-semibold text-[var(--brand)] mb-3">Akun Guru (opsional)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Username Guru</label><input type="text" value={guruUsername} onChange={(e) => setGuruUsername(e.target.value)} placeholder="guru_xirpl1" className="glass-input w-full p-2.5 text-sm font-mono" /></div>
                  <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Password Guru</label><input type="text" value={guruPassword} onChange={(e) => setGuruPassword(e.target.value)} placeholder="min 6 karakter" className="glass-input w-full p-2.5 text-sm font-mono" /></div>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2 border-t border-[var(--border-subtle)]">
                <button type="button" onClick={() => setShowAddKelas(false)} className="btn btn-secondary px-4 py-2 text-sm">Batal</button>
                <button type="submit" disabled={addKelasLoading} className="btn-primary px-6 py-2 text-sm">{addKelasLoading ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </Modal>

          <Modal open={editKelas !== null} onClose={() => setEditKelas(null)} title="Edit Kelas">
            <form onSubmit={handleEditKelas} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Nama Kelas *</label><input type="text" value={editKNama} onChange={(e) => setEditKNama(e.target.value)} required className="glass-input w-full p-2.5 text-sm" /></div>
                <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Wali Kelas *</label><input type="text" value={editWKelas} onChange={(e) => setEditWKelas(e.target.value)} required className="glass-input w-full p-2.5 text-sm" /></div>
              </div>
              <div className="flex gap-3 justify-end pt-2 border-t border-[var(--border-subtle)]">
                <button type="button" onClick={() => setEditKelas(null)} className="btn btn-secondary px-4 py-2 text-sm">Batal</button>
                <button type="submit" disabled={editLoading} className="btn-primary px-6 py-2 text-sm">{editLoading ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </Modal>

          <div className="glass-card">
            <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <h3 className="font-bold text-[var(--text-primary)]">Daftar Kelas ({kelasList.length})</h3>
              {kelasLoading && <span className="text-xs text-[var(--text-muted)] animate-pulse">Memuat...</span>}
            </div>
            <div className="p-6">
              {kelasList.length === 0 && !kelasLoading ? (
                <div className="text-center py-10 text-[var(--text-muted)] text-sm">Belum ada kelas.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-enter">
                  {kelasList.map((k) => (
                    <div key={k.id} className="p-5 glass border border-[var(--border-subtle)] rounded-[var(--radius-card)] hover:border-[var(--border-default)] hover:translate-y-[-2px] transition-all duration-300">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-[var(--radius-card)] bg-gradient-to-br from-[var(--brand)] to-[#60a5fa] flex items-center justify-center text-white font-extrabold text-sm shadow-lg shadow-[var(--brand-glow)]">{k.nama.split('-')[0]}</div>
                          <div><h4 className="font-bold text-[var(--text-primary)] text-sm">{k.nama.replace(/-/g, ' ')}</h4><p className="text-xs text-[var(--text-muted)]">{k._count.siswa} siswa</p></div>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-[var(--border-subtle)]">
                        <p className="text-xs text-[var(--text-muted)] mb-1">Wali Kelas</p>
                        <p className="text-sm font-bold text-[var(--text-primary)] mb-3">{k.waliKelas}</p>
                        <div className="flex gap-2">
                          <button onClick={() => startEditKelas(k)} className="flex-1 py-1.5 text-xs font-bold rounded-[var(--radius-pill)] bg-[var(--bg-glass)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-glass-hover)] hover:text-[var(--text-primary)] transition-all">Edit</button>
                          <button onClick={() => setDeleteTarget({ id: k.id, nama: k.nama, type: 'kelas' })} className="flex-1 py-1.5 text-xs font-bold btn-danger">Hapus</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'guru' && (
        <div className="space-y-5 animate-fade-in">
          <div className="glass-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div><h2 className="text-lg font-bold text-[var(--text-primary)]">Manajemen Akun Guru</h2><p className="text-[var(--text-muted)] text-xs mt-0.5">Lihat, edit, dan kelola akun guru.</p></div>
            <div className="flex gap-3">
              <button onClick={exportGuruPDF} className="btn ml-auto px-4 py-2.5 text-xs font-bold border border-[var(--border-default)] hover:bg-[var(--bg-glass-hover)] transition-all rounded-[var(--radius-pill)]">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 inline mr-1.5 -mt-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                Export PDF
              </button>
            </div>
          </div>
          {guruMsg && <div className={`p-4 rounded-[var(--radius-input)] text-sm font-semibold border animate-slide-down ${guruMsg.type === 'success' ? 'bg-[rgba(34,197,94,0.1)] border-[rgba(34,197,94,0.2)] text-[#4ade80]' : 'bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.2)] text-[#f87171]'}`}>{guruMsg.text}</div>}
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <h3 className="font-bold text-[var(--text-primary)]">Daftar Guru ({guruList.length})</h3>
              {guruLoading && <span className="text-xs text-[var(--text-muted)] animate-pulse">Memuat...</span>}
            </div>
            <div className="overflow-x-auto">
              <table className="table-premium">
                <thead><tr><th>Username</th><th>Nama</th><th>Kelas</th><th>Password</th><th className="text-center">Aksi</th></tr></thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {guruList.length === 0 && !guruLoading ? (<tr><td colSpan={5} className="p-10 text-center text-[var(--text-muted)] text-sm">Belum ada data.</td></tr>)
                  : guruList.map((g) => (
                    <tr key={g.id} className="hover:bg-[var(--bg-glass)] transition-colors">
                      <td className="font-mono">{g.username}</td>
                      <td><span className="font-semibold text-[var(--text-primary)] text-sm">{g.nama}</span></td>
                      <td>{g.kelas?.nama?.replace(/-/g, ' ') || '-'}</td>
                      <td>
                        <div className="flex items-center gap-2 font-mono text-sm">
                          <span>{visibleGuruPassword[g.id] ? (g.passwordPlain || '-') : '•'.repeat(8)}</span>
                          <button onClick={() => setVisibleGuruPassword(prev => ({ ...prev, [g.id]: !prev[g.id] }))} className="btn-ghost w-6 h-6 rounded-[var(--radius-pill)] grid place-items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all" title={visibleGuruPassword[g.id] ? 'Sembunyikan' : 'Lihat'}>
                            {visibleGuruPassword[g.id] ? (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => startEditGuru(g)} className="px-3 py-1.5 text-xs font-bold rounded-[var(--radius-pill)] bg-[var(--bg-glass)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-glass-hover)] hover:text-[var(--text-primary)] transition-all">Edit</button>
                          <button onClick={() => setDeleteTarget({ id: g.id, nama: g.nama, type: 'guru' })} className="btn-danger px-3 py-1.5 text-xs font-bold">Hapus</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Guru Edit Modal */}
          <Modal open={editGuru !== null} onClose={() => setEditGuru(null)} title="Edit Guru">
            <form onSubmit={handleEditGuru} className="space-y-4">
              <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Username *</label>
                <input type="text" value={editGuruUsername} onChange={(e) => setEditGuruUsername(e.target.value)} required className="glass-input w-full p-2.5 text-sm font-mono" /></div>
              <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Nama *</label>
                <input type="text" value={editGuruNama} onChange={(e) => setEditGuruNama(e.target.value)} required className="glass-input w-full p-2.5 text-sm" /></div>
              <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Password</label>
                <input type="text" value={editGuruPassword} onChange={(e) => setEditGuruPassword(e.target.value)} placeholder="Kosongkan jika tidak diubah" minLength={6} className="glass-input w-full p-2.5 text-sm font-mono" />
                <p className="text-[10px] text-[var(--text-muted)] mt-1">Min. 6 karakter. Kosongkan jika tidak ingin mengubah password.</p></div>
              <div className="flex gap-3 justify-end pt-2 border-t border-[var(--border-subtle)]">
                <button type="button" onClick={() => setEditGuru(null)} className="btn btn-secondary px-4 py-2 text-sm">Batal</button>
                <button type="submit" disabled={editGuruLoading} className="btn-primary px-6 py-2 text-sm">{editGuruLoading ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </Modal>
        </div>
      )}

      {activeTab === 'siswa' && (
        <div className="space-y-5 animate-fade-in">
          <div className="glass-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div><h2 className="text-lg font-bold text-[var(--text-primary)]">Manajemen Akun Siswa</h2><p className="text-[var(--text-muted)] text-xs mt-0.5">Tambah, edit, lihat, atau hapus akun siswa.</p></div>
            <div className="flex items-center gap-3">
              <select value={exportKelasFilter} onChange={(e) => setExportKelasFilter(e.target.value)} className="glass-select p-2.5 text-xs font-semibold">
                <option value="all">Semua Kelas</option>
                {kelasList.map((k) => (<option key={k.id} value={k.id}>{k.nama.replace(/-/g, ' ')}</option>))}
              </select>
              <button onClick={exportSiswaPDF} className="btn px-4 py-2.5 text-xs font-bold border border-[var(--border-default)] hover:bg-[var(--bg-glass-hover)] transition-all rounded-[var(--radius-pill)]">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 inline mr-1.5 -mt-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                Export PDF
              </button>
              <button onClick={() => setShowAddSiswa(true)} className="btn-primary px-5 py-2.5 text-sm font-bold">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 inline mr-1.5 -mt-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" /></svg>Tambah Siswa
              </button>
            </div>
          </div>

          <div className="glass-card p-4">
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Filter Kelas</label>
            <select value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)} className="glass-select w-full md:w-64 p-2.5 text-sm">
              <option value="all">Semua Kelas</option>
              {kelasList.map((k) => (<option key={k.id} value={k.id}>{k.nama.replace(/-/g, ' ')}</option>))}
            </select>
          </div>

          {siswaMsg && <div className={`p-4 rounded-[var(--radius-input)] text-sm font-semibold border animate-slide-down ${siswaMsg.type === 'success' ? 'bg-[rgba(34,197,94,0.1)] border-[rgba(34,197,94,0.2)] text-[#4ade80]' : 'bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.2)] text-[#f87171]'}`}>{siswaMsg.text}</div>}

          <Modal open={showAddSiswa} onClose={() => setShowAddSiswa(false)} title="Tambah Akun Siswa Baru">
            <form onSubmit={handleAddSiswa} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">NIS *</label><input type="text" value={fNis} onChange={(e) => setFNis(e.target.value)} required placeholder="10011" className="glass-input w-full p-2.5 text-sm" /></div>
                <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Nama *</label><input type="text" value={fNama} onChange={(e) => setFNama(e.target.value)} required placeholder="Ahmad Fauzan" className="glass-input w-full p-2.5 text-sm" /></div>
                <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Kelas *</label><select value={fKelasId} onChange={(e) => setFKelasId(e.target.value)} required className="glass-select w-full p-2.5 text-sm"><option value="">Pilih</option>{kelasList.map((k) => (<option key={k.id} value={k.id}>{k.nama.replace(/-/g, ' ')}</option>))}</select></div>
                <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Username *</label><input type="text" value={fUsername} onChange={(e) => setFUsername(e.target.value)} required placeholder="10011" className="glass-input w-full p-2.5 text-sm font-mono" /></div>
                <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Password *</label><input type="text" value={fPassword} onChange={(e) => setFPassword(e.target.value)} required minLength={6} placeholder="siswa123" className="glass-input w-full p-2.5 text-sm font-mono" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">WA Ortu (628xxx)</label><input type="text" value={fWa} onChange={(e) => setFWa(e.target.value)} placeholder="6281234567890" className="glass-input w-full p-2.5 text-sm font-mono" /></div>
              </div>
              <div className="flex gap-3 justify-end pt-2 border-t border-[var(--border-subtle)]">
                <button type="button" onClick={() => setShowAddSiswa(false)} className="btn btn-secondary px-4 py-2 text-sm">Batal</button>
                <button type="submit" disabled={addSiswaLoading} className="btn-primary px-6 py-2 text-sm">{addSiswaLoading ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </Modal>

          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <h3 className="font-bold text-[var(--text-primary)]">Daftar Siswa ({filteredSiswa.length})</h3>
              {siswaLoading && <span className="text-xs text-[var(--text-muted)] animate-pulse">Memuat...</span>}
            </div>
            <div className="overflow-x-auto">
              <table className="table-premium">
                <thead><tr><th>NIS</th><th>Nama</th><th>Kelas</th><th>Username</th><th>Password</th><th className="hidden md:table-cell">WA Ortu</th><th className="text-center">Aksi</th></tr></thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {filteredSiswa.length === 0 && !siswaLoading ? (
                    <tr><td colSpan={7} className="p-10 text-center text-[var(--text-muted)] text-sm">Belum ada data.</td></tr>
                  ) : filteredSiswa.map((s) => (
                    <tr key={s.id} className="hover:bg-[var(--bg-glass)] transition-colors">
                      <td className="font-mono">{s.nis}</td>
                      <td><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-[var(--radius-pill)] bg-[var(--bg-glass)] flex items-center justify-center text-[var(--text-secondary)] font-bold text-xs">{s.nama.charAt(0)}</div><span className="font-semibold text-[var(--text-primary)] text-sm">{s.nama}</span></div></td>
                      <td>{s.kelas.nama.replace(/-/g, ' ')}</td>
                      <td className="font-mono">{s.username}</td>
                      <td>
                        <div className="flex items-center gap-2 font-mono text-sm">
                          <span>{visibleSiswaPassword[s.id] ? (s.passwordPlain || '-') : '•'.repeat(8)}</span>
                          <button onClick={() => setVisibleSiswaPassword(prev => ({ ...prev, [s.id]: !prev[s.id] }))} className="btn-ghost w-6 h-6 rounded-[var(--radius-pill)] grid place-items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all" title={visibleSiswaPassword[s.id] ? 'Sembunyikan' : 'Lihat'}>
                            {visibleSiswaPassword[s.id] ? (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="hidden md:table-cell font-mono text-[var(--text-muted)]">{s.whatsappOrangTua || '-'}</td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => startEditSiswa(s)} className="px-3 py-1.5 text-xs font-bold rounded-[var(--radius-pill)] bg-[var(--bg-glass)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-glass-hover)] hover:text-[var(--text-primary)] transition-all">Edit</button>
                          <button onClick={() => setDeleteTarget({ id: s.id, nama: s.nama, type: 'siswa' })} className="btn-danger px-3 py-1.5 text-xs font-bold">Hapus</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Siswa Edit Modal */}
          <Modal open={editSiswa !== null} onClose={() => setEditSiswa(null)} title="Edit Siswa">
            <form onSubmit={handleEditSiswa} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">NIS *</label>
                  <input type="text" value={editSiswaNis} onChange={(e) => setEditSiswaNis(e.target.value)} required className="glass-input w-full p-2.5 text-sm font-mono" /></div>
                <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Nama *</label>
                  <input type="text" value={editSiswaNama} onChange={(e) => setEditSiswaNama(e.target.value)} required className="glass-input w-full p-2.5 text-sm" /></div>
                <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Username *</label>
                  <input type="text" value={editSiswaUsername} onChange={(e) => setEditSiswaUsername(e.target.value)} required className="glass-input w-full p-2.5 text-sm font-mono" /></div>
                <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Password</label>
                  <input type="text" value={editSiswaPassword} onChange={(e) => setEditSiswaPassword(e.target.value)} placeholder="Kosongkan jika tidak diubah" minLength={6} className="glass-input w-full p-2.5 text-sm font-mono" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">WA Ortu (628xxx)</label>
                  <input type="text" value={editSiswaWa} onChange={(e) => setEditSiswaWa(e.target.value)} placeholder="6281234567890" className="glass-input w-full p-2.5 text-sm font-mono" /></div>
              </div>
              <div className="flex gap-3 justify-end pt-2 border-t border-[var(--border-subtle)]">
                <button type="button" onClick={() => setEditSiswa(null)} className="btn btn-secondary px-4 py-2 text-sm">Batal</button>
                <button type="submit" disabled={editSiswaLoading} className="btn-primary px-6 py-2 text-sm">{editSiswaLoading ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </Modal>
        </div>
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        title="Konfirmasi Hapus"
        message={`Yakin ingin menghapus "${deleteTarget?.nama}"? Tindakan ini tidak bisa dibatalkan.`}
        confirmLabel="Hapus"
        loading={deleteLoading}
        onConfirm={() => {
          if (!deleteTarget) return;
          if (deleteTarget.type === 'kelas') handleDeleteKelas();
          else if (deleteTarget.type === 'guru') handleDeleteGuru();
          else handleDeleteSiswa();
        }}
        onCancel={() => { setDeleteTarget(null); setDeleteLoading(false); }}
      />
    </div>
  );
}
