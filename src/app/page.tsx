'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardChart from '@/components/DashboardChart';

interface ApprovalItem {
  id: string; nis: string; nama: string; kelas: string;
  tipe: 'IZIN' | 'SAKIT'; alasan: string; buktiFoto: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [approvalMsg, setApprovalMsg] = useState('');
  const [stats, setStats] = useState({
    avgAttendance: '0.0', todayStats: '0/0', pendingIzinCount: 0, totalStudents: 0,
    topAbsentees: [] as { nis: string; nama: string; alpa: number }[],
    distribution: [] as { label: string; value: number; color: string }[],
    perKelas: [] as { nama: string; persen: number; siswa: number }[],
  });

  const fetchData = async () => {
    try {
      const statsRes = await fetch('/api/admin/stats');
      if (statsRes.status === 403) { router.push('/login'); return; }
      const statsData = await statsRes.json();
      if (!statsData.error) setStats(statsData);
      const appRes = await fetch('/api/admin/approval');
      const appData = await appRes.json();
      setApprovals((appData.requests || []).filter((r: any) => r.status === 'PENDING'));
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchData(); }, []);

  const handleApproval = async (id: string, act: 'APPROVED' | 'REJECTED', name: string) => {
    try {
      const res = await fetch('/api/admin/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: act }),
      });
      if (res.ok) {
        setApprovalMsg(`Izin ${name} berhasil ${act === 'APPROVED' ? 'disetujui' : 'ditolak'}!`);
        fetchData();
      } else {
        setApprovalMsg((await res.json()).error || 'Gagal.');
      }
    } catch { setApprovalMsg('Kesalahan koneksi.'); }
    setTimeout(() => setApprovalMsg(''), 3500);
  };

  return (
    <div className="space-y-6">
      <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="badge badge-sky mb-2">Panel Admin</span>
          <h1>Dashboard Guru / Wali Kelas</h1>
          <p>Kelola absensi, setujui izin, dan atur akun siswa di sini.</p>
        </div>
      </div>

      <div className="space-y-6 animate-fade-in">
        {approvalMsg && (
          <div className="p-4 bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] rounded-[var(--radius-input)] text-sm font-semibold text-[#4ade80] animate-slide-down">{approvalMsg}</div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-enter">
          {[
            { label: 'Rata-rata Kehadiran', value: `${stats.avgAttendance}%`, color: 'text-[var(--bullish)]' },
            { label: 'Hadir Hari Ini', value: stats.todayStats, color: 'text-[var(--brand)]' },
            { label: 'Izin Menunggu', value: `${stats.pendingIzinCount}`, color: 'text-[var(--warning)]' },
            { label: 'Total Siswa', value: `${stats.totalStudents}`, color: 'text-[var(--text-primary)]' },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <p className="label">{s.label}</p>
              <p className={`value ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <DashboardChart dataDistribusi={stats.distribution} perKelas={stats.perKelas} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-5">
            <div className="flex justify-between items-center pb-4 border-b border-[var(--border-subtle)] mb-4">
              <h3 className="font-bold text-[var(--text-primary)] text-sm">Siswa Sering Tidak Hadir</h3>
              <Link href="/rekap" className="text-xs font-semibold text-[var(--brand)] hover:underline">Rekap</Link>
            </div>
            <div className="space-y-3">
              {stats.topAbsentees.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-muted)] text-sm font-semibold">Tidak ada siswa alpa bulan ini.</div>
              ) : stats.topAbsentees.map((s) => (
                <div key={s.nis} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[var(--radius-pill)] bg-[var(--bg-glass)] flex items-center justify-center font-bold text-[var(--text-secondary)] text-sm">{s.nama.charAt(0)}</div>
                    <div>
                      <p className="font-bold text-[var(--text-primary)] text-sm">{s.nama}</p>
                      <p className="text-[var(--text-muted)] text-xs">NIS: {s.nis}</p>
                    </div>
                  </div>
                  <span className="badge badge-red">{s.alpa} Alpa</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="flex justify-between items-center pb-4 border-b border-[var(--border-subtle)] mb-4">
              <h3 className="font-bold text-[var(--text-primary)] text-sm">Menunggu Persetujuan ({approvals.length})</h3>
              <Link href="/approval" className="text-xs font-semibold text-[var(--brand)] hover:underline">Selengkapnya</Link>
            </div>
            <div className="space-y-3">
              {approvals.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-muted)] text-sm font-semibold">Semua sudah diproses!</div>
              ) : approvals.map((a) => (
                <div key={a.id} className="p-4 bg-[var(--bg-glass)] border border-[var(--border-subtle)] rounded-[var(--radius-card)] space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-[var(--text-primary)] text-sm">{a.nama}</p>
                      <p className="text-[var(--text-muted)] text-xs">{a.kelas} - NIS {a.nis}</p>
                    </div>
                    <span className={`badge ${a.tipe === 'IZIN' ? 'badge-amber' : 'badge-sky'}`}>{a.tipe}</span>
                  </div>
                  <p className="text-[var(--text-secondary)] text-xs line-clamp-2">{a.alasan}</p>
                  <div className="flex gap-2 justify-end border-t border-[var(--border-subtle)] pt-2">
                    <button onClick={() => handleApproval(a.id, 'REJECTED', a.nama)} className="btn btn-secondary text-xs px-3 py-1.5">Tolak</button>
                    <button onClick={() => handleApproval(a.id, 'APPROVED', a.nama)} className="btn-primary text-xs px-4 py-1.5">Setujui</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 stagger-enter">
          {[
            { label: 'Input Absensi', desc: 'Catat kehadiran siswa.', href: '/absensi' },
            { label: 'Approval Izin', desc: 'Review surat izin dan foto.', href: '/approval' },
            { label: 'Rekap dan PDF', desc: 'Unduh laporan bulanan.', href: '/rekap' },
            { label: 'Manajemen', desc: 'Kelola kelas dan siswa.', href: '/manajemen' },
          ].map((link) => (
            <Link key={link.href} href={link.href}
              className="glass-card-hover p-4 group">
              <p className="font-bold text-sm text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors">{link.label}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{link.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
