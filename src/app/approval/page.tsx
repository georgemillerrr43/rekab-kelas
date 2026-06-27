'use client';

import React, { useState, useEffect } from 'react';

interface IzinRequest {
  id: string;
  nis: string;
  nama: string;
  kelas: string;
  tanggal: string;
  tipe: 'IZIN' | 'SAKIT';
  alasan: string;
  buktiFoto: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  whatsappOrangTua: string;
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
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filteredRequests = requests.filter((r) => r.status === activeTab);

  const handleDecision = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch('/api/admin/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: decision }),
      });
      if (res.ok) {
        const studentName = requests.find((r) => r.id === id)?.nama;
        setNotification(
          `Izin ${studentName} berhasil ${decision === 'APPROVED' ? 'DISETUJUI' : 'DITOLAK'}!`
        );
        fetchRequests();
      } else {
        const data = await res.json();
        setNotification(data.error || 'Gagal memproses approval.');
      }
    } catch (err) {
      setNotification('Gagal terhubung ke server.');
    }

    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Sistem Approval Izin Siswa</h1>
          <p className="text-slate-500 text-sm">Review dan verifikasi surat keterangan/foto bukti tidak hadir siswa.</p>
        </div>
        
        <div className="inline-flex bg-slate-100 p-1 rounded-xl">
          {([
            { id: 'PENDING', label: 'Menunggu' },
            { id: 'APPROVED', label: 'Disetujui' },
            { id: 'REJECTED', label: 'Ditolak' }
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-xs font-semibold shadow-md shadow-emerald-50">
          {notification}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-400 font-semibold">Memuat data pengajuan...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-slate-300 mx-auto mb-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801-12c.065.21.1.433.1.664a2.25 2.25 0 0 1-2.25 2.25 2.25 2.25 0 0 1-2.25-2.25c0-.231.035-.454.1-.664M6.75 7.5H4.81c-1.096 0-1.97.892-1.97 1.97V19.5a2.25 2.25 0 0 0 2.25 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25V9.47c0-1.077-.874-1.97-1.97-1.97h-1.94" />
            </svg>
            <p className="text-slate-400 text-sm font-bold">Tidak ada surat izin dalam daftar ini</p>
            <p className="text-slate-300 text-xs mt-1">Status database sinkron.</p>
          </div>
        ) : (
          filteredRequests.map((req) => (
            <div key={req.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
              
              {/* Card Header & Content */}
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base">{req.nama}</h3>
                    <p className="text-slate-400 text-xs">{req.kelas} • NIS: {req.nis}</p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                    req.tipe === 'IZIN'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-sky-50 text-sky-700 border-sky-200'
                  }`}>
                    {req.tipe}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tanggal Pengajuan</span>
                  <p className="text-xs text-slate-700 font-semibold">
                    {new Date(req.tanggal).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Alasan / Keterangan</span>
                  <p className="text-slate-600 text-xs leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    "{req.alasan}"
                  </p>
                </div>

                {/* Bukti Foto Thumbnail */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Bukti Fisik Foto</span>
                  <div
                    onClick={() => setSelectedPhoto(req.buktiFoto.startsWith('/uploads') ? req.buktiFoto.replace('/uploads', '/api/uploads') : req.buktiFoto)}
                    className="relative w-full h-32 rounded-xl overflow-hidden cursor-zoom-in border border-slate-100 hover:brightness-95 transition-all group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={req.buktiFoto.startsWith('/uploads') ? req.buktiFoto.replace('/uploads', '/api/uploads') : req.buktiFoto} alt="Bukti Foto" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-900/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="px-3 py-1.5 bg-white/95 rounded-lg text-slate-800 text-xs font-bold shadow-sm">
                        Perbesar Foto
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions (Only for PENDING tab) */}
              {req.status === 'PENDING' && (
                <div className="bg-slate-50 p-4 border-t border-slate-100 flex gap-2">
                  <button
                    onClick={() => handleDecision(req.id, 'REJECTED')}
                    className="flex-1 py-2.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50/40 rounded-xl transition-all border border-slate-200 bg-white"
                  >
                    Tolak Izin
                  </button>
                  <button
                    onClick={() => handleDecision(req.id, 'APPROVED')}
                    className="flex-1 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-100 transition-all"
                  >
                    Setujui Izin
                  </button>
                </div>
              )}

              {/* Status Badge in Approved/Rejected tab */}
              {req.status !== 'PENDING' && (
                <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-center">
                  <span className={`inline-flex items-center gap-1 text-xs font-bold ${
                    req.status === 'APPROVED' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      req.status === 'APPROVED' ? 'bg-emerald-500' : 'bg-rose-500'
                    }`} />
                    Telah {req.status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
                  </span>
                </div>
              )}

            </div>
          ))
        )}
      </div>

      {/* Lightbox / Zoom Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-white rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute right-4 top-4 p-2 bg-slate-900/60 text-white hover:bg-slate-900 rounded-full transition-colors z-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="p-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedPhoto} alt="Bukti zoom" className="w-full h-auto max-h-[80vh] object-contain rounded-2xl" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
