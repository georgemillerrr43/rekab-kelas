'use client';

import React from 'react';

interface DashboardChartProps {
  dataDistribusi?: { label: string; value: number; color: string }[];
  perKelas?: { nama: string; persen: number; siswa: number }[];
}

export default function DashboardChart({ dataDistribusi = [], perKelas = [] }: DashboardChartProps) {
  const maxPerKelas = perKelas.length > 0 ? Math.max(...perKelas.map(k => k.persen), 0) : 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Distribution */}
      <div className="glass-card p-5">
        <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">Distribusi Kehadiran</h3>
        <p className="text-xs text-[var(--text-muted)] mb-4">Akumulasi bulan ini.</p>
        {dataDistribusi.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-muted)] text-xs">Belum ada data.</div>
        ) : (
          <div className="space-y-3">
            {dataDistribusi.map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-[var(--text-secondary)]">{item.label}</span>
                  <span className="font-bold text-[var(--text-primary)]">{item.value}%</span>
                </div>
                <div className="h-2 bg-[var(--bg-glass)] rounded-[var(--radius-pill)] overflow-hidden">
                  <div className={`h-full rounded-[var(--radius-pill)] transition-all duration-500 ${item.color}`}
                    style={{ width: `${Math.min(Math.max(item.value, 0), 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Per-class */}
      <div className="glass-card p-5">
        <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">Kehadiran Per Kelas</h3>
        <p className="text-xs text-[var(--text-muted)] mb-4">Rata-rata kehadiran bulan ini.</p>
        {perKelas.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-muted)] text-xs">Belum ada data kelas.</div>
        ) : (
          <div className="space-y-4">
            {perKelas.map((k) => {
              const pct = Math.min(k.persen, 100);
              return (
                <div key={k.nama}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-[var(--text-secondary)]">{k.nama}</span>
                    <span className={`font-bold ${pct >= 90 ? 'text-[var(--bullish)]' : pct >= 75 ? 'text-[var(--warning)]' : 'text-[var(--bearish)]'}`}>
                      {k.persen}%
                    </span>
                  </div>
                  <div className="h-3 bg-[var(--bg-glass)] rounded-[var(--radius-pill)] overflow-hidden relative">
                    <div className="h-full rounded-[var(--radius-pill)] transition-all duration-500 bg-gradient-to-r from-[var(--brand)] to-[#60a5fa]"
                      style={{ width: `${pct}%` }} />
                    <span className="absolute right-1 top-0 text-[8px] font-bold text-[var(--text-muted)] leading-3">{k.siswa} siswa</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
