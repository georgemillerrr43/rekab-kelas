'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function GuruDashboard() {
  const [stats, setStats] = useState({ avgAttendance: '0', totalStudents: 0, totalDays: 0 });
  const [kelasNama, setKelasNama] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/guru/stats');
        if (res.ok) {
          const d = await res.json();
          setStats(d);
        }
        const absRes = await fetch('/api/guru/absensi');
        if (absRes.ok) {
          const absData = await absRes.json();
          setKelasNama(absData.kelas?.nama || '');
        }
      } catch { /* ignore */ }
    })();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <span className="badge badge-green mb-2">Panel Guru</span>
        <h1>Dashboard Guru</h1>
        <p>Pantau kehadiran dan kelola absensi kelas Anda{kelasNama ? ` - ${kelasNama.replace(/-/g, ' ')}` : ''}.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-enter">
        <div className="stat-card"><p className="label">Rata-rata Kehadiran</p><p className="value text-[var(--bullish)]">{stats.avgAttendance}%</p></div>
        <div className="stat-card"><p className="label">Total Siswa</p><p className="value text-[var(--text-primary)]">{stats.totalStudents}</p></div>
        <div className="stat-card"><p className="label">Hari Aktif</p><p className="value text-[var(--brand)]">{stats.totalDays}</p></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-enter">
        <Link href="/guru/absensi" className="glass-card-hover p-5 group">
          <p className="font-bold text-sm text-[var(--text-primary)] group-hover:text-[var(--brand)]">Input Absensi</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Catat kehadiran siswa hari ini.</p>
        </Link>
        <Link href="/rekap" className="glass-card-hover p-5 group">
          <p className="font-bold text-sm text-[var(--text-primary)] group-hover:text-[var(--brand)]">Rekap dan PDF</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Lihat rekap dan unduh PDF.</p>
        </Link>
      </div>
    </div>
  );
}
