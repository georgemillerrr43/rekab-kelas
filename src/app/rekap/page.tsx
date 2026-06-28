'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { exportAttendanceToPDF, StudentRecap } from '@/utils/pdfExport';

interface DailyStudent { siswaId: string; nis: string; nama: string; status: string; alasan: string; buktiUrl: string; }
interface DailySummary { hadir: number; izin: number; sakit: number; alpa: number; belum: number; total: number; }
type TabType = 'bulanan' | 'harian';

const MONTH_MAP: Record<string, { month: number; year: number }> = {
  'Juni 2026': { month: 5, year: 2026 },
  'Mei 2026': { month: 4, year: 2026 },
  'April 2026': { month: 3, year: 2026 },
};

function exportDailyPDF(students: DailyStudent[], kelas: string, tanggal: string) {
  if (!kelas) return;
  import('jspdf').then((m) => {
    import('jspdf-autotable').then(() => {
      const { default: jsPDF } = m;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pc: [number, number, number] = [30, 41, 59];
      doc.setFont('Helvetica', 'bold'); doc.setFontSize(16);
      doc.setTextColor(pc[0], pc[1], pc[2]);
      doc.text('LAPORAN REKAP KEHADIRAN HARIAN', 14, 20);
      doc.setFont('Helvetica', 'normal'); doc.setFontSize(10);
      doc.text('Sistem Informasi Akademik & Manajemen Absensi', 14, 25);
      doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.5); doc.line(14, 28, 196, 28);

      const fd = new Date(tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      doc.setFontSize(10); doc.setFont('Helvetica', 'bold');
      doc.text('Informasi Laporan:', 14, 36); doc.setFont('Helvetica', 'normal');
      doc.text(`Kelas: ${kelas.replace(/-/g, ' ')}`, 14, 42);
      doc.text(`Tanggal: ${fd}`, 110, 42);
      const h = students.filter(s => s.status === 'HADIR').length;
      const iz = students.filter(s => s.status === 'IZIN').length;
      const sk = students.filter(s => s.status === 'SAKIT').length;
      const al = students.filter(s => s.status === 'ALPA').length;
      doc.text(`Hadir: ${h}  |  Izin: ${iz}  |  Sakit: ${sk}  |  Alpa: ${al}  |  Total: ${students.length}`, 14, 48);

      const hd = [[{ content: 'No', styles: { halign: 'center' } }, 'NIS', 'Nama Siswa', { content: 'Status', styles: { halign: 'center' } }, 'Keterangan']];
      const rows = students.map((s, i) => [
        { content: (i + 1).toString(), styles: { halign: 'center' } }, s.nis, s.nama,
        { content: s.status === 'BELUM' ? '-' : s.status, styles: { halign: 'center', fontStyle: 'bold', textColor: s.status === 'HADIR' ? [16, 185, 129] : s.status === 'IZIN' ? [245, 158, 11] : s.status === 'SAKIT' ? [14, 165, 233] : s.status === 'ALPA' ? [225, 29, 72] : [100, 116, 139] } },
        s.alasan || '-',
      ]);

      (doc as any).autoTable({
        startY: 55, head: hd, body: rows, theme: 'grid',
        headStyles: { fillColor: pc, textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 12 }, 1: { cellWidth: 25 }, 2: { cellWidth: 60 }, 3: { cellWidth: 25 }, 4: { cellWidth: 60 } },
        styles: { font: 'Helvetica', fontSize: 9, cellPadding: 3 },
        alternateRowStyles: { fillColor: [241, 245, 249] },
        margin: { left: 14, right: 14 },
      });
      doc.save(`rekap_harian_${kelas.replace(/[^a-z0-9]/gi, '_')}_${tanggal.replace(/[^0-9-]/g, '')}.pdf`);
    });
  });
}

function RekapPageInner() {
  const sp = useSearchParams();
  const [tab, setTab] = useState<TabType>((sp.get('tab') as TabType) || 'bulanan');
  const [session, setSession] = useState<{ isLoggedIn: boolean; role: 'ADMIN' | 'GURU' | 'SISWA' | null }>({ isLoggedIn: false, role: null });
  const [kelas, setKelas] = useState('');
  const [bulan, setBulan] = useState('Juni 2026');
  const [kelasList, setKelasList] = useState<{ id: string; nama: string; waliKelas: string }[]>([]);
  const [waliKelas, setWaliKelas] = useState('');
  const [rekapList, setRekapList] = useState<StudentRecap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hKelas, setHKelas] = useState('');
  const [hBulan, setHBulan] = useState('Juni 2026');
  const [hTanggal, setHTanggal] = useState<string | null>(null);
  const [hStudents, setHStudents] = useState<DailyStudent[]>([]);
  const [hSummary, setHSummary] = useState<DailySummary>({ hadir: 0, izin: 0, sakit: 0, alpa: 0, belum: 0, total: 0 });
  const [hLoading, setHLoading] = useState(false);
  const [hFetched, setHFetched] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [filledDates, setFilledDates] = useState<string[]>([]);

  // Get session for role detection
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) setSession(await res.json());
      } catch { /* empty */ }
    })();
  }, []);

  // Fetch kelas list (gak butuh session — langsung dari /api/kelas)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/kelas');
        const list = (await res.json()).kelas || [];
        setKelasList(list);
        if (list.length > 0) { setKelas(list[0].id); setWaliKelas(list[0].waliKelas); setHKelas(list[0].id); }
      } catch { /* empty */ }
    })();
  }, []);

  useEffect(() => {
    if (tab !== 'bulanan' || !kelas) return;
    (async () => { setIsLoading(true); try { setRekapList((await (await fetch(`/api/rekap?kelas=${kelas}&bulan=${bulan}`)).json()).rekap || []); } catch { /* empty */ } finally { setIsLoading(false); } })();
  }, [kelas, bulan, tab]);

  useEffect(() => {
    if (tab !== 'harian' || !hTanggal || !hKelas) { setHStudents([]); setHFetched(false); return; }
    (async () => {
      setHLoading(true);
      try {
        const res = await fetch(`/api/rekap/harian?tanggal=${hTanggal}&kelas=${hKelas}`);
        const d = await res.json();
        setHStudents(d.students || []); setHSummary(d.summary || { hadir: 0, izin: 0, sakit: 0, alpa: 0, belum: 0, total: 0 }); setHFetched(true);
      } catch { /* empty */ } finally { setHLoading(false); }
    })();
  }, [hKelas, hTanggal, tab]);

  useEffect(() => {
    if (tab !== 'harian' || !hKelas) return;
    (async () => { try { const res = await fetch(`/api/rekap/harian/status?kelas=${hKelas}&bulan=${hBulan}`); if (res.ok) setFilledDates((await res.json()).filledDates || []); } catch { /* empty */ } })();
  }, [hKelas, hBulan, tab]);

  const isAdmin = session.role === 'ADMIN';
  const selectedKelasNama = kelasList.find(k => k.id === kelas)?.nama || kelas.replace(/-/g, ' ') || '';

  const total = rekapList.length;
  const avg = total > 0 ? rekapList.reduce((a, c) => a + c.persentase, 0) / total : 0;
  const totalAlpa = rekapList.reduce((a, c) => a + c.alpa, 0);
  const totalIzinSakit = rekapList.reduce((a, c) => a + c.izin + c.sakit, 0);

  const sc = (s: string) => { switch (s) { case 'HADIR': return 'badge-green'; case 'IZIN': return 'badge-amber'; case 'SAKIT': return 'badge-sky'; case 'ALPA': return 'badge-red'; default: return 'badge-gray'; } };
  const fmtDate = hTanggal ? new Date(hTanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';

  const getDays = (b: string) => {
    const info = MONTH_MAP[b] || { month: 5, year: 2026 };
    const d = new Date(info.year, info.month, 1); const days = [];
    while (d.getMonth() === info.month) {
      const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, '0'); const dd = String(d.getDate()).padStart(2, '0');
      days.push({ dateStr: `${y}-${m}-${dd}`, dayNum: d.getDate(), displayDate: d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) });
      d.setDate(d.getDate() + 1);
    }
    return days;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div><span className="badge badge-gray mb-2">Rekapitulasi</span><h1>Rekapitulasi Kehadiran Kelas</h1><p>Akumulasi otomatis dan download laporan siap cetak.</p></div>
        <div className="tab-switcher">
          <button onClick={() => setTab('bulanan')} className={tab === 'bulanan' ? 'active' : ''}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 inline mr-1 -mt-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
            Rekap Bulanan
          </button>
          <button onClick={() => setTab('harian')} className={tab === 'harian' ? 'active' : ''}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 inline mr-1 -mt-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
            Rekap Harian
          </button>
        </div>
      </div>

      {tab === 'bulanan' && (
        <div className="space-y-6">
          <div className="flex justify-center">
            <button onClick={() => {
              const wk = kelasList.find(k => k.id === kelas)?.waliKelas || waliKelas;
              exportAttendanceToPDF(rekapList, { kelas: selectedKelasNama, periode: bulan, waliKelas: wk });
            }} className="btn-primary px-5 py-2.5 text-sm font-semibold" disabled={rekapList.length === 0}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 inline mr-2 -mt-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
              Export PDF
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="stat-card"><p className="label">Total Siswa</p><p className="value text-[var(--text-primary)]">{total} Siswa</p><span className="text-[11px] text-[var(--text-muted)]">Terdaftar Aktif</span></div>
            <div className="stat-card"><p className="label">Rata-rata Kehadiran</p><p className="value text-[var(--bullish)]">{avg.toFixed(1)}%</p><div className="progress-bar mt-2"><div className="progress-bar-fill bg-[var(--bullish)]" style={{ width: `${avg}%` }} /></div></div>
            <div className="stat-card"><p className="label">Akumulasi Alpa</p><p className="value text-[var(--bearish)]">{totalAlpa} Kali</p><span className="text-[11px] text-[var(--bearish)] font-medium">Perlu Atensi</span></div>
            <div className="stat-card"><p className="label">Total Izin / Sakit</p><p className="value text-[var(--warning)]">{totalIzinSakit} Kali</p><span className="text-[11px] text-[var(--text-muted)]">Disertai Bukti</span></div>
          </div>

          {isAdmin && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">Filter</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Kelas</label><select value={kelas} onChange={(e) => { const k = e.target.value; setKelas(k); const found = kelasList.find(x => x.id === k); if (found) setWaliKelas(found.waliKelas); }} className="glass-select w-full p-2 rounded-lg text-sm">{kelasList.map((k) => (<option key={k.id} value={k.id}>{k.nama.replace(/-/g, ' ')}</option>))}</select></div>
                <div><label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Bulan</label><select value={bulan} onChange={(e) => setBulan(e.target.value)} className="glass-select w-full p-2 rounded-lg text-sm"><option value="Juni 2026">Juni 2026</option><option value="Mei 2026">Mei 2026</option><option value="April 2026">April 2026</option></select></div>
              </div>
            </div>
          )}

          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex justify-between items-center">
              <h3 className="font-bold text-[var(--text-primary)] text-base">Detail Kehadiran {selectedKelasNama}</h3>
              <span className="badge badge-gray">{bulan}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="table-premium">
                <thead><tr><th className="text-center w-16">No</th><th>NIS</th><th>Nama</th><th className="text-center">Hadir</th><th className="text-center">Izin</th><th className="text-center">Sakit</th><th className="text-center">Alpa</th><th className="text-center w-32">% Hadir</th></tr></thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {isLoading ? <tr><td colSpan={8} className="p-10 text-center text-[var(--text-muted)] text-sm">Memuat...</td></tr>
                    : rekapList.length === 0 ? <tr><td colSpan={8} className="p-10 text-center text-[var(--text-muted)] text-sm">Belum ada data absensi bulan ini.</td></tr>
                    : rekapList.map((item, i) => (
                      <tr key={item.nis} className="hover:bg-[var(--bg-glass)] transition-colors">
                        <td className="text-center font-mono text-[var(--text-muted)]">{i + 1}</td>
                        <td className="font-mono">{item.nis}</td>
                        <td><p className="font-bold text-[var(--text-primary)] text-sm">{item.nama}</p></td>
                        <td className="text-center font-semibold text-[var(--text-secondary)]">{item.hadir}</td>
                        <td className="text-center font-semibold text-[var(--warning)]">{item.izin}</td>
                        <td className="text-center font-semibold text-[var(--info)]">{item.sakit}</td>
                        <td className="text-center font-semibold text-[var(--bearish)]">{item.alpa}</td>
                        <td className="text-center">
                          <div className="flex flex-col items-center">
                            <span className={`text-sm font-bold ${item.persentase >= 90 ? 'text-[var(--bullish)]' : item.persentase >= 75 ? 'text-[var(--warning)]' : 'text-[var(--bearish)]'}`}>{item.persentase}%</span>
                            <div className="w-20 progress-bar mt-1"><div className={`progress-bar-fill ${item.persentase >= 90 ? 'bg-[var(--bullish)]' : item.persentase >= 75 ? 'bg-[var(--warning)]' : 'bg-[var(--bearish)]'}`} style={{ width: `${item.persentase}%` }} /></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'harian' && (
        <div className="space-y-6">
          {isAdmin && (
            <div className="glass-card p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Kelas</label><select value={hKelas} onChange={(e) => setHKelas(e.target.value)} className="glass-select w-full p-2.5 rounded-lg text-sm">{kelasList.map((k) => (<option key={k.id} value={k.id}>{k.nama.replace(/-/g, ' ')}</option>))}</select></div>
                <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Bulan</label><select value={hBulan} onChange={(e) => { setHBulan(e.target.value); setHTanggal(null); }} className="glass-select w-full p-2.5 rounded-lg text-sm"><option value="Juni 2026">Juni 2026</option><option value="Mei 2026">Mei 2026</option><option value="April 2026">April 2026</option></select></div>
              </div>
            </div>
          )}

          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4 uppercase tracking-wider">Pilih Tanggal</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {getDays(isAdmin ? hBulan : bulan).map((day) => {
                const active = hTanggal === day.dateStr;
                const filled = filledDates.includes(day.dateStr);
                return (
                  <button key={day.dateStr} onClick={() => setHTanggal(day.dateStr)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all relative overflow-hidden ${active ? 'border-[var(--brand)] bg-[var(--bg-glass)] text-[var(--text-primary)] ring-1 ring-[var(--brand)]' : 'border-[var(--border-subtle)] bg-[var(--bg-glass)] text-[var(--text-muted)] hover:border-[var(--border-default)]'}`}>
                    <span className={`absolute top-1 right-2 text-xs font-black ${filled ? 'text-[var(--bullish)]' : 'text-[var(--bearish)]'}`}>{filled ? '✓' : '✗'}</span>
                    <span className="text-[10px] font-semibold uppercase">{day.displayDate.split(',')[0]}</span>
                    <span className="text-lg font-extrabold mt-0.5">{day.dayNum}</span>
                    <span className={`text-[8px] font-bold mt-1.5 uppercase tracking-wider ${filled ? 'text-[var(--bullish)]' : 'text-[var(--bearish)]'}`}>{filled ? 'Tersedia' : 'Kosong'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {hTanggal ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-center glass-card p-5 gap-3">
                <div><h3 className="font-bold text-[var(--text-primary)] text-sm">Laporan: {fmtDate}</h3></div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button onClick={() => exportDailyPDF(hStudents, selectedKelasNama || hKelas, hTanggal)} disabled={hStudents.length === 0} className="btn-primary flex-1 sm:flex-initial px-5 py-2 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 inline mr-1.5 -mt-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                    Export PDF
                  </button>
                  <a href={`/absensi?kelas=${hKelas}&tanggal=${hTanggal}`} className="btn btn-secondary flex-1 sm:flex-initial px-5 py-2 text-sm font-semibold">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 inline mr-1.5 -mt-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                    Edit
                  </a>
                </div>
              </div>

              {hLoading ? (
                <div className="text-center py-10 text-[var(--text-muted)] font-semibold">Memuat data...</div>
              ) : !hFetched ? (
                <div className="text-center py-10 text-[var(--text-muted)] font-semibold">Pilih tanggal untuk melihat data.</div>
              ) : hStudents.length === 0 ? (
                <div className="text-center py-10 text-[var(--text-muted)] font-semibold">Tidak ada data absensi untuk tanggal ini.</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                      { label: 'Hadir', value: hSummary.hadir, color: 'text-[var(--bullish)]' },
                      { label: 'Izin', value: hSummary.izin, color: 'text-[var(--warning)]' },
                      { label: 'Sakit', value: hSummary.sakit, color: 'text-[var(--info)]' },
                      { label: 'Alpa', value: hSummary.alpa, color: 'text-[var(--bearish)]' },
                      { label: 'Total', value: hSummary.total, color: 'text-[var(--text-primary)]' },
                    ].map((s) => (<div key={s.label} className="stat-card p-4"><p className="label">{s.label}</p><p className={`value text-lg ${s.color}`}>{s.value}</p></div>))}
                  </div>

                  <div className="glass-card overflow-hidden">
                    <div className="px-6 py-4 border-b border-[var(--border-subtle)]"><h3 className="font-bold text-[var(--text-primary)] text-base">Kehadiran Per Hari</h3><p className="text-xs text-[var(--text-muted)]">{fmtDate} — {selectedKelasNama || hKelas}</p></div>
                    <div className="overflow-x-auto">
                      <table className="table-premium">
                        <thead><tr><th className="text-center w-16">No</th><th>NIS</th><th>Nama</th><th className="text-center">Status</th><th>Keterangan</th></tr></thead>
                        <tbody className="divide-y divide-[var(--border-subtle)]">
                          {hStudents.map((s, idx) => (
                            <tr key={s.siswaId} className="hover:bg-[var(--bg-glass)] transition-colors">
                              <td className="text-center font-mono text-[var(--text-muted)]">{idx + 1}</td>
                              <td className="font-mono">{s.nis}</td>
                              <td><p className="font-bold text-[var(--text-primary)] text-sm">{s.nama}</p></td>
                              <td className="text-center"><span className={`badge ${sc(s.status)}`}>{s.status === 'BELUM' ? 'Belum' : s.status}</span></td>
                              <td>
                                <div className="flex items-center gap-2">
                                  <span>{s.alasan || <span className="opacity-30">-</span>}</span>
                                  {(s.status === 'IZIN' || s.status === 'SAKIT') && s.buktiUrl && (
                                    <button onClick={() => setSelectedPhoto(s.buktiUrl.startsWith('/uploads') ? s.buktiUrl.replace('/uploads', '/api/uploads') : s.buktiUrl)}
                                      className="px-2 py-1 text-[10px] font-bold text-[var(--text-accent)] bg-[rgba(59,130,246,0.1)] hover:bg-[rgba(59,130,246,0.15)] rounded-lg border border-[rgba(59,130,246,0.2)] transition-all ml-auto shrink-0">
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 inline mr-1 -mt-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375 3.75 0 1 1-.75 0 .375 3.75 0 0 1 .75 0Z" /></svg>
                                      Foto
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="glass-card p-8 text-center text-[var(--text-muted)] font-semibold">Pilih tanggal untuk melihat rekap harian.</div>
          )}
        </div>
      )}

      {selectedPhoto && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative glass rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl">
            <button onClick={() => setSelectedPhoto(null)} className="absolute right-4 top-4 p-2 bg-black/60 text-white hover:bg-black/80 rounded-full transition-colors z-10">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="p-1"><img src={selectedPhoto} alt="Bukti" className="w-full h-auto max-h-[80vh] object-contain rounded-2xl" /></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RekapPage() {
  return (<Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center text-[var(--text-muted)] font-semibold">Memuat...</div>}><RekapPageInner /></Suspense>);
}
