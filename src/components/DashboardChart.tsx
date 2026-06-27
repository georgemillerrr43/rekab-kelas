'use client';

import React from 'react';

interface DashboardChartProps {
  dataMingguan?: { hari: string; persen: number }[];
  dataDistribusi?: { label: string; value: number; color: string }[];
}

const DEFAULT_MINGGUAN = [
  { hari: 'Senin', persen: 96 }, { hari: 'Selasa', persen: 92 },
  { hari: 'Rabu', persen: 94 }, { hari: 'Kamis', persen: 88 }, { hari: 'Jumat', persen: 91 },
];
const DEFAULT_DISTRIBUSI = [
  { label: 'Hadir', value: 89.2, color: 'bg-[var(--bullish)]' },
  { label: 'Izin', value: 5.1, color: 'bg-[var(--warning)]' },
  { label: 'Sakit', value: 3.4, color: 'bg-[var(--info)]' },
  { label: 'Alpa', value: 2.3, color: 'bg-[var(--bearish)]' },
];

export default function DashboardChart({
  dataMingguan = DEFAULT_MINGGUAN,
  dataDistribusi = DEFAULT_DISTRIBUSI,
}: DashboardChartProps) {
  const hadirItem = dataDistribusi.find((d) => d.label === 'Hadir');
  const hadirValue = hadirItem ? hadirItem.value : 100;
  const hadirRasio = hadirValue / 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 glass-card p-5 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-[var(--text-primary)]">Tren Kehadiran Mingguan (%)</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Rata-rata kehadiran harian kelas minggu ini.</p>
        </div>
        <div className="mt-6 relative h-44 w-full flex items-end justify-between px-2">
          {dataMingguan.map((item) => (
            <div key={item.hari} className="flex flex-col items-center group w-1/5">
              <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 text-white text-[10px] font-bold px-2 py-1 rounded-md -translate-y-12 shadow-sm pointer-events-none z-10 backdrop-blur-sm border border-white/10">
                {item.persen}%
              </div>
              <div className="w-8 sm:w-12 bg-[var(--bg-glass)] rounded-[var(--radius-pill)] overflow-hidden flex items-end h-36">
                <div className="w-full bg-gradient-to-t from-[var(--brand)] to-[#60a5fa] rounded-[var(--radius-pill)] transition-all duration-500 ease-out group-hover:brightness-110"
                  style={{ height: `${item.persen}%` }} />
              </div>
              <span className="text-xs font-semibold text-[var(--text-muted)] mt-2">{item.hari}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-5 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-[var(--text-primary)]">Distribusi Status</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Rasio akumulasi kehadiran.</p>
        </div>
        <div className="flex items-center justify-center my-4 relative">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle cx="64" cy="64" r="50" fill="transparent" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
            <circle cx="64" cy="64" r="50" fill="transparent" stroke="var(--bullish)" strokeWidth="12"
              strokeDasharray={`${2 * Math.PI * 50}`}
              strokeDashoffset={`${2 * Math.PI * 50 * (1 - hadirRasio)}`}
              strokeLinecap="round" />
          </svg>
          <div className="absolute text-center">
            <span className="text-2xl font-black text-[var(--text-primary)]">{hadirValue}%</span>
            <span className="text-[10px] text-[var(--text-muted)] block -mt-1">Kehadiran</span>
          </div>
        </div>
        <div className="space-y-2 mt-2">
          {dataDistribusi.map((item) => (
            <div key={item.label} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-[var(--radius-pill)] ${item.color}`} />
                <span className="font-semibold text-[var(--text-secondary)]">{item.label}</span>
              </div>
              <span className="font-bold text-[var(--text-primary)]">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
