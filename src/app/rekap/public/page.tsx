'use client';

import React, { useState, useEffect } from 'react';
import { exportAttendanceToPDF } from '@/utils/pdfExport';

interface RekapItem { nis: string; nama: string; hadir: number; izin: number; sakit: number; alpa: number; persentase: number; totalHari: number; }

export default function PublicRekapPage() {
  const [list, setList] = useState<RekapItem[]>([]);
  const [kelas, setKelas] = useState('XI-RPL-1');
  const [bulan, setBulan] = useState('Juni 2026');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/rekap?kelas=${kelas}&bulan=${bulan}`);
        setList((await res.json()).rekap || []);
      } catch { /* ignore */ } finally { setLoading(false); }
    })();
  }, [kelas, bulan]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <span className="badge badge-gray mb-2">Publik</span>
        <h1>Rekapitulasi Kehadiran</h1>
        <p>Akses publik tanpa login. Unduh PDF untuk arsip.</p>
      </div>

      <div className="glass-card p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Kelas</label><select value={kelas} onChange={(e) => setKelas(e.target.value)} className="glass-select w-full p-2 rounded-lg text-sm"><option value="XI-RPL-1">XI RPL 1</option><option value="XI-RPL-2">XI RPL 2</option><option value="XII-RPL-1">XII RPL 1</option></select></div>
          <div><label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Bulan</label><select value={bulan} onChange={(e) => setBulan(e.target.value)} className="glass-select w-full p-2 rounded-lg text-sm"><option value="Juni 2026">Juni 2026</option><option value="Mei 2026">Mei 2026</option><option value="April 2026">April 2026</option></select></div>
        </div>
      </div>

      {list.length > 0 && (
        <div className="flex justify-end">
          <button onClick={() => exportAttendanceToPDF(list, { kelas, periode: bulan, waliKelas: '-' })} className="btn-primary px-5 py-3 text-sm font-semibold">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 inline mr-2 -mt-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>Export PDF
          </button>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex justify-between items-center">
          <h3 className="font-bold text-[var(--text-primary)]">Kehadiran {kelas.replace(/-/g, ' ')}</h3>
          <span className="badge badge-gray">{bulan}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="table-premium">
            <thead><tr><th className="text-center w-16">No</th><th>NIS</th><th>Nama</th><th className="text-center">Hadir</th><th className="text-center">Izin</th><th className="text-center">Sakit</th><th className="text-center">Alpa</th><th className="text-center">%</th></tr></thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {loading ? <tr><td colSpan={8} className="p-10 text-center text-[var(--text-muted)]">Memuat...</td></tr>
              : list.length === 0 ? <tr><td colSpan={8} className="p-10 text-center text-[var(--text-muted)]">Tidak ada data.</td></tr>
              : list.map((item, i) => (
                <tr key={item.nis} className="hover:bg-[var(--bg-glass)]">
                  <td className="text-center text-[var(--text-muted)]">{i + 1}</td>
                  <td className="font-mono">{item.nis}</td>
                  <td><span className="font-bold text-[var(--text-primary)] text-sm">{item.nama}</span></td>
                  <td className="text-center text-[var(--text-secondary)]">{item.hadir}</td>
                  <td className="text-center text-[var(--warning)]">{item.izin}</td>
                  <td className="text-center text-[var(--info)]">{item.sakit}</td>
                  <td className="text-center text-[var(--bearish)]">{item.alpa}</td>
                  <td className="text-center"><span className={`text-sm font-bold ${item.persentase >= 90 ? 'text-[var(--bullish)]' : item.persentase >= 75 ? 'text-[var(--warning)]' : 'text-[var(--bearish)]'}`}>{item.persentase}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-center py-4">
        <p className="text-xs text-[var(--text-muted)]">Data publik. Untuk kelola absensi <a href="/login" className="text-[var(--text-accent)] hover:underline">login</a>.</p>
      </div>
    </div>
  );
}
