'use client';

import React from 'react';

interface DashboardChartProps {
  dataMingguan?: { hari: string; persen: number }[];
  dataDistribusi?: { label: string; value: number; color: string }[];
}

export default function DashboardChart({
  dataDistribusi = [],
}: DashboardChartProps) {
  return (
    <div className="glass-card p-5 max-w-md">
      <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">Distribusi Kehadiran Bulan Ini</h3>
      <p className="text-xs text-[var(--text-muted)] mb-4">Rasio akumulasi kehadiran.</p>
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
                <div className={`h-full rounded-[var(--radius-pill)] transition-all duration-500 ${item.color || 'bg-[var(--brand)]'}`}
                  style={{ width: `${Math.min(Math.max(item.value, 0), 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
