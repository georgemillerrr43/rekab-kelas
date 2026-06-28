'use client';

import React, { useState, useEffect } from 'react';

interface IzinRequest {
  id: string; nis: string; nama: string; kelas: string;
  tanggal: string; tipe: 'IZIN' | 'SAKIT'; alasan: string;
  buktiFoto: string; status: 'PENDING' | 'APPROVED' | 'REJECTED'; whatsappOrangTua: string;
}

export default function ApprovalPage() {
  const [requests, setRequests] = useState<IzinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/approval');
      setRequests((await res.json()).requests || []);
    } catch { /* ignore */ } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchRequests(); }, []);

  const filtered = requests.filter((r) => r.status === activeTab);

  const handleDecision = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch('/api/admin/approval', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: decision }),
      });
      if (res.ok) {
        const name = requests.find((r) => r.id === id)?.nama;
        setNotification(`Izin ${name} berhasil ${decision === 'APPROVED' ? 'DISETUJUI' : 'DITOLAK'}!`);
        fetchRequests();
      } else { setNotification((await res.json()).error || 'Gagal.'); }
    } catch { setNotification('Gagal terhubung ke server.'); }
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="badge badge-amber mb-2">Approval</span>
          <h1>Sistem Approval Izin Siswa</h1>
          <p>Review dan verifikasi surat keterangan atau foto bukti tidak hadir siswa.</p>
        </div>
        <div className="tab-switcher">
          {(['PENDING', 'APPROVED', 'REJECTED'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={activeTab === tab ? 'active' : ''}>
              {tab === 'PENDING' ? 'Menunggu' : tab === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
            </button>
          ))}
        </div>
      </div>

      {notification && (
        <div className="p-4 bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] rounded-[var(--radius-input)] text-xs font-semibold text-[#4ade80]">{notification}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-[var(--text-muted)] font-semibold">Memuat data...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full glass-card p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3 opacity-50">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801-12c.065.21.1.433.1.664a2.25 2.25 0 0 1-2.25 2.25 2.25 2.25 0 0 1-2.25-2.25c0-.231.035-.454.1-.664M6.75 7.5H4.81c-1.096 0-1.97.892-1.97 1.97V19.5a2.25 2.25 0 0 0 2.25 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25V9.47c0-1.077-.874-1.97-1.97-1.97h-1.94" />
            </svg>
            <p className="text-[var(--text-muted)] text-sm font-bold">Tidak ada surat izin dalam daftar ini</p>
          </div>
        ) : filtered.map((req) => (
          <div key={req.id} className="glass-card overflow-hidden flex flex-col justify-between">
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-[var(--text-primary)] text-base">{req.nama}</h3>
                  <p className="text-[var(--text-muted)] text-xs">{req.kelas} - NIS: {req.nis}</p>
                </div>
                <span className={`badge ${req.tipe === 'IZIN' ? 'badge-amber' : 'badge-sky'}`}>{req.tipe}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider block">Tanggal Pengajuan</span>
                <p className="text-xs text-[var(--text-secondary)] font-semibold mt-0.5">
                  {new Date(req.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider block">Alasan</span>
                <p className="text-[var(--text-secondary)] text-xs leading-relaxed bg-[var(--bg-glass)] p-3 rounded-[var(--radius-input)] border border-[var(--border-subtle)] mt-1">{req.alasan}</p>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider block">Bukti Foto</span>
                <div onClick={() => setSelectedPhoto(req.buktiFoto.startsWith('/uploads') ? req.buktiFoto.replace('/uploads', '/api/uploads') : req.buktiFoto)}
                  className="relative w-full h-32 rounded-[var(--radius-card)] overflow-hidden cursor-zoom-in border border-[var(--border-subtle)] hover:brightness-110 transition-all group mt-1">
                  <img src={req.buktiFoto.startsWith('/uploads') ? req.buktiFoto.replace('/uploads', '/api/uploads') : req.buktiFoto} alt="Bukti" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                    <span className="px-3 py-1.5 bg-black/80 text-white rounded-[var(--radius-pill)] text-xs font-bold">Perbesar</span>
                  </div>
                </div>
              </div>
            </div>
            {req.status === 'PENDING' ? (
              <div className="p-4 border-t border-[var(--border-subtle)] flex gap-2">
                <button onClick={() => handleDecision(req.id, 'REJECTED')} className="btn btn-secondary flex-1 py-2.5 text-xs font-semibold">Tolak Izin</button>
                <button onClick={() => handleDecision(req.id, 'APPROVED')} className="btn-primary flex-1 py-2.5 text-xs font-bold">Setujui Izin</button>
              </div>
            ) : (
              <div className="p-4 border-t border-[var(--border-subtle)] text-center">
                <span className={`inline-flex items-center gap-1 text-xs font-bold ${req.status === 'APPROVED' ? 'text-[var(--bullish)]' : 'text-[var(--bearish)]'}`}>
                  <span className={`w-2 h-2 rounded-full ${req.status === 'APPROVED' ? 'bg-[var(--bullish)]' : 'bg-[var(--bearish)]'}`} />
                  Telah {req.status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedPhoto && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative glass rounded-[var(--radius-card)] overflow-hidden max-w-2xl w-full shadow-2xl">
            <button onClick={() => setSelectedPhoto(null)}
              className="absolute right-4 top-4 p-2 bg-black/60 text-white hover:bg-black/80 rounded-[var(--radius-pill)] transition-colors z-10">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="p-1">
              <img src={selectedPhoto} alt="Bukti zoom" className="w-full h-auto max-h-[80vh] object-contain rounded-[var(--radius-card)]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
