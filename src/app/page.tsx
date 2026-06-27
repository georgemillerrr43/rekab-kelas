'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardChart from '@/components/DashboardChart';

interface SiswaItem {
  id: string;
  nis: string;
  nama: string;
  username: string;
  whatsappOrangTua: string;
}

interface ApprovalItem {
  id: string;
  nis: string;
  nama: string;
  kelas: string;
  tipe: 'IZIN' | 'SAKIT';
  alasan: string;
  buktiFoto: string;
}

const ABSENTEES = [
  { nis: '10010', nama: 'Joko Susilo', alpa: 5 },
  { nis: '10004', nama: 'Dedi Wijaya', alpa: 4 },
  { nis: '10006', nama: 'Farhan Ramadhan', alpa: 1 },
  { nis: '10003', nama: 'Citra Lestari', alpa: 1 },
];

const INITIAL_APPROVALS: ApprovalItem[] = [
  { id: 'ap-1', nis: '10003', nama: 'Citra Lestari', kelas: 'XI RPL 1', tipe: 'IZIN', alasan: 'Menghadiri acara pernikahan keluarga.', buktiFoto: '' },
  { id: 'ap-2', nis: '10006', nama: 'Farhan Ramadhan', kelas: 'XI RPL 1', tipe: 'SAKIT', alasan: 'Demam tinggi, surat dokter terlampir.', buktiFoto: '' },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [approvalMsg, setApprovalMsg] = useState('');
  const [stats, setStats] = useState<{
    avgAttendance: string;
    todayStats: string;
    pendingIzinCount: number;
    totalStudents: number;
    topAbsentees: { nis: string; nama: string; alpa: number }[];
    distribution: { label: string; value: number; color: string }[];
    dataMingguan: { hari: string; persen: number }[];
  }>({
    avgAttendance: '0.0',
    todayStats: '0/0',
    pendingIzinCount: 0,
    totalStudents: 0,
    topAbsentees: [],
    distribution: [],
    dataMingguan: [],
  });

  const fetchDashboardData = async () => {
    try {
      const statsRes = await fetch('/api/admin/stats');
      if (statsRes.status === 403) { router.push('/login'); return; }
      const statsData = await statsRes.json();
      setStats(statsData);

      const appRes = await fetch('/api/admin/approval');
      const appData = await appRes.json();
      const pendingRequests = (appData.requests || []).filter((r: any) => r.status === 'PENDING');
      setApprovals(pendingRequests);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleApproval = async (id: string, act: 'APPROVED' | 'REJECTED', name: string) => {
    try {
      const res = await fetch('/api/admin/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: act }),
      });
      if (res.ok) {
        setApprovalMsg(`Izin ${name} berhasil ${act === 'APPROVED' ? 'disetujui' : 'ditolak'}!`);
        fetchDashboardData();
      } else {
        const data = await res.json();
        setApprovalMsg(data.error || 'Gagal memproses approval.');
      }
    } catch (err) {
      setApprovalMsg('Terjadi kesalahan koneksi.');
    }
    setTimeout(() => setApprovalMsg(''), 3500);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 md:p-7 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-600/20 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-bold uppercase tracking-wider">Panel Admin</span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2">Dashboard Guru / Wali Kelas</h1>
          <p className="text-slate-300 text-sm">Kelola absensi, setujui izin, dan atur akun siswa di sini.</p>
        </div>
        <button onClick={handleLogout} className="relative z-10 inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/10 transition-all self-start">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
          </svg>
          Keluar
        </button>
      </div>

      {/* Dashboard Content */}
        <div className="space-y-6">
          {approvalMsg && <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-sm font-semibold">{approvalMsg}</div>}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Rata-rata Kehadiran', value: `${stats.avgAttendance}%`, color: 'text-emerald-600' },
              { label: 'Hadir Hari Ini', value: stats.todayStats, color: 'text-indigo-600' },
              { label: 'Izin Menunggu', value: `${stats.pendingIzinCount}`, color: 'text-amber-600' },
              { label: 'Total Siswa', value: `${stats.totalStudents}`, color: 'text-slate-800' },
            ].map((s) => (
              <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{s.label}</span>
                <p className={`text-3xl font-black mt-3 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
          <DashboardChart dataMingguan={stats.dataMingguan} dataDistribusi={stats.distribution} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center pb-4 border-b border-slate-50 mb-4">
                <h3 className="font-bold text-slate-800">Siswa Sering Tidak Hadir</h3>
                <Link href="/rekap" className="text-xs font-semibold text-indigo-600">Rekap â†’</Link>
              </div>
              <div className="space-y-3">
                {stats.topAbsentees.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm font-semibold">Tidak ada siswa alpa bulan ini.</div>
                ) : stats.topAbsentees.map((s) => (
                  <div key={s.nis} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600 text-sm">{s.nama.charAt(0)}</div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{s.nama}</p>
                        <p className="text-slate-400 text-xs">NIS: {s.nis}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-lg border border-rose-100">{s.alpa} Alpa</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center pb-4 border-b border-slate-50 mb-4">
                <h3 className="font-bold text-slate-800">Menunggu Persetujuan ({approvals.length})</h3>
                <Link href="/approval" className="text-xs font-semibold text-indigo-600">Selengkapnya â†’</Link>
              </div>
              <div className="space-y-3">
                {approvals.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm font-semibold">Semua sudah diproses!</div>
                ) : approvals.map((a) => (
                  <div key={a.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{a.nama}</p>
                        <p className="text-slate-400 text-xs">{a.kelas} â€¢ NIS {a.nis}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${a.tipe === 'IZIN' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-sky-50 text-sky-700 border-sky-200'}`}>{a.tipe}</span>
                    </div>
                    <p className="text-slate-600 text-xs line-clamp-2">{a.alasan}</p>
                    <div className="flex gap-2 justify-end border-t border-slate-100 pt-2">
                      <button onClick={() => handleApproval(a.id, 'REJECTED', a.nama)} className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">Tolak</button>
                      <button onClick={() => handleApproval(a.id, 'APPROVED', a.nama)} className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all">Setujui</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Input Absensi', desc: 'Catat kehadiran siswa.', href: '/absensi', color: 'bg-indigo-50 border-indigo-100 text-indigo-700' },
              { label: 'Approval Izin', desc: 'Review surat izin & foto.', href: '/approval', color: 'bg-amber-50 border-amber-100 text-amber-700' },
              { label: 'Rekap & PDF', desc: 'Unduh laporan bulanan.', href: '/rekap', color: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
              { label: 'Manajemen', desc: 'Kelola kelas & siswa.', href: '/manajemen', color: 'bg-violet-50 border-violet-100 text-violet-700' },
            ].map((link) => (
              <Link key={link.href} href={link.href} className={`p-4 rounded-xl border ${link.color} hover:brightness-95 transition-all`}>
                <p className="font-bold text-sm">{link.label}</p>
                <p className="text-xs opacity-70 mt-0.5">{link.desc}</p>
              </Link>
            ))}
          </div>
        </div>
    </div>
  );
}
