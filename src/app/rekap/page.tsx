'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { exportAttendanceToPDF, StudentRecap, PDFReportMetadata } from '@/utils/pdfExport';

// ============================================================
// Types
// ============================================================
interface DailyStudent {
  siswaId: string;
  nis: string;
  nama: string;
  status: string;
  alasan: string;
  buktiUrl: string;
}

interface DailySummary {
  hadir: number;
  izin: number;
  sakit: number;
  alpa: number;
  belum: number;
  total: number;
}

interface KelasItem {
  id: string;
  nama: string;
  waliKelas: string;
  _count: {
    siswa: number;
  };
}

type TabType = 'bulanan' | 'harian';

const MONTH_MAP: Record<string, { month: number; year: number }> = {
  'Juni 2026': { month: 5, year: 2026 },
  'Mei 2026': { month: 4, year: 2026 },
  'April 2026': { month: 3, year: 2026 },
};

// ============================================================
// Utility: Export Daily to PDF
// ============================================================
function exportDailyToPDF(students: DailyStudent[], kelas: string, tanggal: string) {
  // Dynamic import jsPDF
  import('jspdf').then((jsPDFModule) => {
    import('jspdf-autotable').then(() => {
      const jsPDF = jsPDFModule.default;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const primaryColor: [number, number, number] = [30, 41, 59];
      const secondaryColor: [number, number, number] = [71, 85, 105];
      const lightGray: [number, number, number] = [241, 245, 249];

      // Header
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('LAPORAN REKAP KEHADIRAN HARIAN', 14, 20);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text('Sistem Informasi Akademik & Manajemen Absensi', 14, 25);

      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(14, 28, 196, 28);

      // Metadata
      const formattedDate = new Date(tanggal).toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      });
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'bold');
      doc.text('Informasi Laporan:', 14, 36);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Kelas: ${kelas.replace(/-/g, ' ')}`, 14, 42);
      doc.text(`Tanggal: ${formattedDate}`, 110, 42);

      // Summary stats
      const hadir = students.filter(s => s.status === 'HADIR').length;
      const izin = students.filter(s => s.status === 'IZIN').length;
      const sakit = students.filter(s => s.status === 'SAKIT').length;
      const alpa = students.filter(s => s.status === 'ALPA').length;
      doc.text(`Hadir: ${hadir}  |  Izin: ${izin}  |  Sakit: ${sakit}  |  Alpa: ${alpa}  |  Total: ${students.length}`, 14, 48);

      // Table
      const tableHeaders = [[
        { content: 'No', styles: { halign: 'center' } },
        'NIS',
        'Nama Siswa',
        { content: 'Status', styles: { halign: 'center' } },
        'Keterangan',
      ]];

      const tableRows = students.map((s, i) => [
        { content: (i + 1).toString(), styles: { halign: 'center' } },
        s.nis,
        s.nama,
        {
          content: s.status === 'BELUM' ? '-' : s.status,
          styles: {
            halign: 'center',
            fontStyle: 'bold',
            textColor: s.status === 'HADIR' ? [16, 185, 129] :
              s.status === 'IZIN' ? [245, 158, 11] :
              s.status === 'SAKIT' ? [14, 165, 233] :
              s.status === 'ALPA' ? [225, 29, 72] : [100, 116, 139],
          },
        },
        s.alasan || '-',
      ]);

      (doc as any).autoTable({
        startY: 55,
        head: tableHeaders,
        body: tableRows,
        theme: 'grid',
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { cellWidth: 12 },
          1: { cellWidth: 25 },
          2: { cellWidth: 60 },
          3: { cellWidth: 25 },
          4: { cellWidth: 60 },
        },
        styles: { font: 'Helvetica', fontSize: 9, cellPadding: 3 },
        alternateRowStyles: { fillColor: lightGray },
        margin: { left: 14, right: 14 },
      });

      const safeKelas = kelas.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const safeTanggal = tanggal.replace(/[^0-9-]/g, '');
      doc.save(`rekap_harian_${safeKelas}_${safeTanggal}.pdf`);
    });
  });
}

// ============================================================
// Inner Component (uses useSearchParams)
// ============================================================
function RekapPageInner() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabType) || 'bulanan';

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // ---- KELAS LIST state ----
  const [kelasList, setKelasList] = useState<KelasItem[]>([]);
  const [kelasLoading, setKelasLoading] = useState(true);

  // ---- BULANAN state ----
  const [kelas, setKelas] = useState('');
  const [bulan, setBulan] = useState('Juni 2026');
  const [waliKelas, setWaliKelas] = useState('');
  const [rekapList, setRekapList] = useState<StudentRecap[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ---- HARIAN state ----
  const [harianKelas, setHarianKelas] = useState('');
  const [harianBulan, setHarianBulan] = useState('Juni 2026');
  const [selectedHarianTanggal, setSelectedHarianTanggal] = useState<string | null>(null);
  const [harianStudents, setHarianStudents] = useState<DailyStudent[]>([]);
  const [harianSummary, setHarianSummary] = useState<DailySummary>({ hadir: 0, izin: 0, sakit: 0, alpa: 0, belum: 0, total: 0 });
  const [harianLoading, setHarianLoading] = useState(false);
  const [harianFetched, setHarianFetched] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [filledDates, setFilledDates] = useState<string[]>([]);

  // ---- KELAS fetch ----
  useEffect(() => {
    const fetchKelas = async () => {
      setKelasLoading(true);
      try {
        const res = await fetch('/api/admin/kelas');
        const data = await res.json();
        const kelasList = data.kelas || [];
        setKelasList(kelasList);

        // Set default kelas to first in list if available
        if (kelasList.length > 0 && !kelas) {
          setKelas(kelasList[0].id);
          setWaliKelas(kelasList[0].waliKelas);
        }
        if (kelasList.length > 0 && !harianKelas) {
          setHarianKelas(kelasList[0].id);
        }
      } catch (err) {
        console.error('Error fetching kelas:', err);
      } finally {
        setKelasLoading(false);
      }
    };
    fetchKelas();
  }, []);

  // Auto-populate waliKelas when kelas changes
  useEffect(() => {
    if (kelas && kelasList.length > 0) {
      const selectedKelas = kelasList.find(k => k.id === kelas);
      if (selectedKelas) {
        setWaliKelas(selectedKelas.waliKelas);
      }
    }
  }, [kelas, kelasList]);

  // ---- BULANAN fetch ----
  useEffect(() => {
    if (activeTab !== 'bulanan') return;
    const fetchRekap = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/rekap?kelas=${kelas}&bulan=${bulan}`);
        const data = await res.json();
        setRekapList(data.rekap || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRekap();
  }, [kelas, bulan, activeTab]);

  // ---- HARIAN fetch ----
  useEffect(() => {
    if (activeTab !== 'harian' || !selectedHarianTanggal) {
      setHarianStudents([]);
      setHarianFetched(false);
      return;
    }
    const fetchHarian = async () => {
      setHarianLoading(true);
      try {
        const res = await fetch(`/api/rekap/harian?tanggal=${selectedHarianTanggal}&kelas=${harianKelas}`);
        const data = await res.json();
        setHarianStudents(data.students || []);
        setHarianSummary(data.summary || { hadir: 0, izin: 0, sakit: 0, alpa: 0, belum: 0, total: 0 });
        setHarianFetched(true);
      } catch (err) {
        console.error(err);
      } finally {
        setHarianLoading(false);
      }
    };
    fetchHarian();
  }, [harianKelas, selectedHarianTanggal, activeTab]);

  // ---- HARIAN STATUS fetch ----
  useEffect(() => {
    if (activeTab !== 'harian') return;
    const fetchDailyStatus = async () => {
      try {
        const res = await fetch(`/api/rekap/harian/status?kelas=${harianKelas}&bulan=${harianBulan}`);
        if (res.ok) {
          const data = await res.json();
          setFilledDates(data.filledDates || []);
        }
      } catch (err) {
        console.error('Error loading daily status:', err);
      }
    };
    fetchDailyStatus();
  }, [harianKelas, harianBulan, activeTab]);

  // ---- Stats for BULANAN ----
  const totalSiswa = rekapList.length;
  const avgKehadiran = totalSiswa > 0
    ? rekapList.reduce((acc, curr) => acc + curr.persentase, 0) / totalSiswa
    : 0;
  const totalAlpa = rekapList.reduce((acc, curr) => acc + curr.alpa, 0);
  const totalIzinSakit = rekapList.reduce((acc, curr) => acc + curr.izin + curr.sakit, 0);

  const handleExportPDF = () => {
    const metadata: PDFReportMetadata = {
      kelas: kelas.replace(/-/g, ' '),
      periode: bulan,
      waliKelas: waliKelas,
    };
    exportAttendanceToPDF(rekapList, metadata);
  };

  const handleExportHarianPDF = () => {
    if (selectedHarianTanggal) {
      exportDailyToPDF(harianStudents, harianKelas, selectedHarianTanggal);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'HADIR': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'IZIN': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'SAKIT': return 'bg-sky-100 text-sky-700 border-sky-200';
      case 'ALPA': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  const formattedHarianDate = selectedHarianTanggal
    ? new Date(selectedHarianTanggal).toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : '';

  const getDaysInMonth = (bulanStr: string) => {
    const info = MONTH_MAP[bulanStr] || { month: 5, year: 2026 };
    const date = new Date(info.year, info.month, 1);
    const days = [];
    while (date.getMonth() === info.month) {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const formatted = `${yyyy}-${mm}-${dd}`;
      days.push({
        dateStr: formatted,
        dayNum: date.getDate(),
        displayDate: date.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      });
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Page Header with Tabs */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Rekapitulasi Kehadiran Kelas</h1>
            <p className="text-slate-500 text-sm">Akumulasi otomatis dan download laporan siap cetak.</p>
          </div>

          {/* Tab Switcher */}
          <div className="inline-flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('bulanan')}
              className={`px-5 py-2.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'bulanan'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              📅 Rekap Bulanan
            </button>
            <button
              onClick={() => setActiveTab('harian')}
              className={`px-5 py-2.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'harian'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              📋 Rekap Harian
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* TAB: REKAP BULANAN */}
        {/* ============================================================ */}
        {activeTab === 'bulanan' && (
          <div className="space-y-6">
            {/* Export Button */}
            <div className="flex justify-end">
              <button
                onClick={handleExportPDF}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all rounded-xl shadow-lg shadow-indigo-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Export PDF Bulanan
              </button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <p className="text-slate-400 text-xs font-semibold uppercase">Total Siswa</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{totalSiswa} Siswa</p>
                <span className="text-[10px] text-slate-400">Terdaftar Aktif</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <p className="text-slate-400 text-xs font-semibold uppercase">Rata-rata Kehadiran</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{avgKehadiran.toFixed(1)}%</p>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${avgKehadiran}%` }}></div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <p className="text-slate-400 text-xs font-semibold uppercase">Akumulasi Alpa</p>
                <p className="text-2xl font-bold text-rose-600 mt-1">{totalAlpa} Kali</p>
                <span className="text-[10px] text-rose-500 font-medium">Memerlukan Atensi Orang Tua</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <p className="text-slate-400 text-xs font-semibold uppercase">Total Izin / Sakit</p>
                <p className="text-2xl font-bold text-amber-500 mt-1">{totalIzinSakit} Kali</p>
                <span className="text-[10px] text-slate-400">Disertai Bukti Fisik Foto</span>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 mb-3">Pengaturan Filter & Kop Laporan</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Pilih Kelas</label>
                  <select value={kelas} onChange={(e) => setKelas(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 outline-none focus:border-indigo-500">
                    <option value="XI-RPL-1">XI RPL 1</option>
                    <option value="XI-RPL-2">XI RPL 2</option>
                    <option value="XII-RPL-1">XII RPL 1</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Pilih Bulan</label>
                  <select value={bulan} onChange={(e) => setBulan(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 outline-none focus:border-indigo-500">
                    <option value="Juni 2026">Juni 2026</option>
                    <option value="Mei 2026">Mei 2026</option>
                    <option value="April 2026">April 2026</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Wali Kelas (Penandatangan)</label>
                  <input type="text" value={waliKelas} onChange={(e) => setWaliKelas(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 outline-none focus:border-indigo-500" />
                </div>
              </div>
            </div>

            {/* Monthly Recap Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-base">Detail Kehadiran Siswa ({kelas})</h3>
                <span className="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-600 rounded-full">{bulan}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-16 text-center">No</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">NIS</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Hadir</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Izin</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Sakit</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Alpa</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-32">% Kehadiran</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr><td colSpan={8} className="p-10 text-center text-slate-400 text-sm font-semibold">Memuat rekap...</td></tr>
                    ) : rekapList.length === 0 ? (
                      <tr><td colSpan={8} className="p-10 text-center text-slate-400 text-sm font-semibold">Tidak ada data rekap untuk kelas dan bulan ini.</td></tr>
                    ) : rekapList.map((item, index) => (
                      <tr key={item.nis} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 text-sm text-slate-400 text-center font-mono">{index + 1}</td>
                        <td className="p-4 text-sm text-slate-600 font-mono">{item.nis}</td>
                        <td className="p-4"><p className="font-bold text-slate-800 text-sm">{item.nama}</p></td>
                        <td className="p-4 text-sm text-slate-600 text-center font-semibold">{item.hadir}</td>
                        <td className="p-4 text-sm text-amber-600 text-center font-semibold">{item.izin}</td>
                        <td className="p-4 text-sm text-sky-600 text-center font-semibold">{item.sakit}</td>
                        <td className="p-4 text-sm text-rose-600 text-center font-semibold">{item.alpa}</td>
                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <span className={`text-sm font-bold ${
                              item.persentase >= 90 ? 'text-emerald-600' :
                              item.persentase >= 75 ? 'text-amber-500' : 'text-rose-600'
                            }`}>{item.persentase}%</span>
                            <div className="w-20 bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                              <div className={`h-1.5 rounded-full ${
                                item.persentase >= 90 ? 'bg-emerald-500' :
                                item.persentase >= 75 ? 'bg-amber-400' : 'bg-rose-500'
                              }`} style={{ width: `${item.persentase}%` }}></div>
                            </div>
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

        {/* ============================================================ */}
        {/* TAB: REKAP HARIAN */}
        {/* ============================================================ */}
        {activeTab === 'harian' && (
          <div className="space-y-6">
            {/* Harian Filters */}
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Kelas</label>
                  <select
                    value={harianKelas}
                    onChange={(e) => setHarianKelas(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 outline-none focus:border-indigo-500"
                  >
                    <option value="XI-RPL-1">XI RPL 1</option>
                    <option value="XI-RPL-2">XI RPL 2</option>
                    <option value="XII-RPL-1">XII RPL 1</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Bulan</label>
                  <select
                    value={harianBulan}
                    onChange={(e) => {
                      setHarianBulan(e.target.value);
                      setSelectedHarianTanggal(null); // Reset date selection when month changes
                    }}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 outline-none focus:border-indigo-500"
                  >
                    <option value="Juni 2026">Juni 2026</option>
                    <option value="Mei 2026">Mei 2026</option>
                    <option value="April 2026">April 2026</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Days Grid Selector */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">Pilih Tanggal Laporan</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {getDaysInMonth(harianBulan).map((day) => {
                  const isActive = selectedHarianTanggal === day.dateStr;
                  const isFilled = filledDates.includes(day.dateStr);
                  return (
                    <button
                      key={day.dateStr}
                      onClick={() => setSelectedHarianTanggal(day.dateStr)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all relative overflow-hidden ${
                        isActive
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm ring-2 ring-indigo-500/20'
                          : 'border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {/* Check/Cross Indicator Badge */}
                      <span className={`absolute top-1 right-2 text-xs font-black ${
                        isFilled ? 'text-emerald-500' : 'text-rose-500'
                      }`}>
                        {isFilled ? '✓' : '✗'}
                      </span>

                      <span className="text-[10px] font-semibold text-slate-400 uppercase">
                        {day.displayDate.split(',')[0]}
                      </span>
                      <span className="text-lg font-extrabold mt-0.5">
                        {day.dayNum}
                      </span>
                      <span className={`text-[8px] font-bold mt-1.5 uppercase tracking-wider scale-90 ${
                        isFilled ? 'text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded' : 'text-rose-500 bg-rose-50 px-1 py-0.5 rounded'
                      }`}>
                        {isFilled ? 'Sudah Input' : 'Belum Input'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Details Section */}
            {selectedHarianTanggal ? (
              <div className="space-y-6">
                {/* Actions & Selected Info */}
                <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-5 rounded-xl border border-slate-100 shadow-sm gap-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Laporan Kehadiran Hari:</h3>
                    <p className="text-xs text-indigo-600 font-semibold">{formattedHarianDate}</p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={handleExportHarianPDF}
                      disabled={harianStudents.length === 0}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all rounded-xl shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Export PDF
                    </button>
                    <a
                      href={`/absensi?kelas=${harianKelas}&tanggal=${selectedHarianTanggal}`}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all rounded-xl"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                      </svg>
                      Edit Absensi
                    </a>
                  </div>
                </div>

                {/* Harian Summary Cards */}
                {harianFetched && !harianLoading && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                      { label: 'Hadir', value: harianSummary.hadir, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                      { label: 'Izin', value: harianSummary.izin, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
                      { label: 'Sakit', value: harianSummary.sakit, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100' },
                      { label: 'Alpa', value: harianSummary.alpa, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
                      { label: 'Total', value: harianSummary.total, color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' },
                    ].map((stat) => (
                      <div key={stat.label} className={`${stat.bg} ${stat.border} border p-4 rounded-xl`}>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                        <p className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Harian Table */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 text-base">Kehadiran Per Hari</h3>
                    <p className="text-xs text-slate-400">{formattedHarianDate} — {harianKelas.replace(/-/g, ' ')}</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-16 text-center">No</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">NIS</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Siswa</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {harianLoading ? (
                          <tr><td colSpan={5} className="p-10 text-center text-slate-400 text-sm font-semibold">Memuat data harian...</td></tr>
                        ) : !harianFetched || harianStudents.length === 0 ? (
                          <tr><td colSpan={5} className="p-10 text-center text-slate-400 text-sm font-semibold">
                            Tidak ada data absensi untuk hari ini.
                          </td></tr>
                        ) : harianStudents.map((student, idx) => (
                          <tr key={student.siswaId} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 text-sm text-slate-400 text-center font-mono">{idx + 1}</td>
                            <td className="p-4 text-sm text-slate-600 font-mono">{student.nis}</td>
                            <td className="p-4">
                              <p className="font-bold text-slate-800 text-sm">{student.nama}</p>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`px-3 py-1 text-xs font-bold rounded-lg border ${statusColor(student.status)}`}>
                                {student.status === 'BELUM' ? 'Belum Input' : student.status}
                              </span>
                            </td>
                            <td className="p-4 text-sm text-slate-600">
                              <div className="flex items-center gap-2">
                                <span>{student.alasan || <span className="text-slate-300">-</span>}</span>
                                {(student.status === 'IZIN' || student.status === 'SAKIT') && student.buktiUrl && (
                                  <button
                                    onClick={() => setSelectedPhoto(student.buktiUrl.startsWith('/uploads') ? student.buktiUrl.replace('/uploads', '/api/uploads') : student.buktiUrl)}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-all ml-auto shrink-0"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375 3.75 0 1 1-.75 0 .375 3.75 0 0 1 .75 0Z" />
                                    </svg>
                                    Lihat Foto
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
              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center text-slate-400 font-semibold">
                Silakan pilih salah satu hari di atas untuk melihat rekapitulasi kehadiran secara detail.
              </div>
            )}
          </div>
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

// ============================================================
// Main Export with Suspense wrapper
// ============================================================
export default function RekapPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400 font-semibold">Memuat halaman rekap...</div>}>
      <RekapPageInner />
    </Suspense>
  );
}
