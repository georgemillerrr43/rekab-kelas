'use client';

import React from 'react';

interface DashboardChartProps {
  dataMingguan?: { hari: string; persen: number }[];
  dataDistribusi?: { label: string; value: number; color: string }[];
}

export default function DashboardChart({
  dataMingguan = [
    { hari: 'Senin', persen: 96 },
    { hari: 'Selasa', persen: 92 },
    { hari: 'Rabu', persen: 94 },
    { hari: 'Kamis', persen: 88 },
    { hari: 'Jumat', persen: 91 },
  ],
  dataDistribusi = [
    { label: 'Hadir', value: 89.2, color: 'bg-emerald-500' },
    { label: 'Izin', value: 5.1, color: 'bg-amber-400' },
    { label: 'Sakit', value: 3.4, color: 'bg-sky-400' },
    { label: 'Alpa', value: 2.3, color: 'bg-rose-500' },
  ]
}: DashboardChartProps) {
  const hadirItem = dataDistribusi.find((d) => d.label === 'Hadir');
  const hadirValue = hadirItem ? hadirItem.value : 100;
  const hadirRasio = hadirValue / 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 1. Bar Chart Kehadiran Mingguan (SVG) */}
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-800">Tren Kehadiran Mingguan (%)</h3>
          <p className="text-xs text-slate-400 mt-0.5">Persentase rata-rata kehadiran harian kelas minggu ini.</p>
        </div>
        
        {/* SVG Bar Chart Area */}
        <div className="mt-6 relative h-48 w-full flex items-end justify-between px-2">
          {dataMingguan.map((item) => {
            const barHeight = `${item.persen}%`;
            return (
              <div key={item.hari} className="flex flex-col items-center group w-1/5">
                {/* Tooltip on Hover */}
                <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded-md -translate-y-12 shadow-sm pointer-events-none z-10">
                  {item.persen}%
                </div>
                
                {/* SVG Bar with Gradient */}
                <div className="w-8 sm:w-12 bg-slate-50 rounded-lg overflow-hidden flex items-end h-36">
                  <div
                    className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-lg transition-all duration-500 ease-out group-hover:brightness-110"
                    style={{ height: barHeight }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-500 mt-2">{item.hari}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Distribusi Persentase Kehadiran */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-800">Distribusi Status Kehadiran</h3>
          <p className="text-xs text-slate-400 mt-0.5">Rasio akumulasi status kehadiran murid.</p>
        </div>

        {/* Circular Donut Diagram (SVG) */}
        <div className="flex items-center justify-center my-4 relative">
          <svg className="w-32 h-32 transform -rotate-90">
            {/* Background Circle */}
            <circle cx="64" cy="64" r="50" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
            
            {/* Hadir Circle */}
            <circle
              cx="64"
              cy="64"
              r="50"
              fill="transparent"
              stroke="#10b981"
              strokeWidth="12"
              strokeDasharray={`${2 * Math.PI * 50}`}
              strokeDashoffset={`${2 * Math.PI * 50 * (1 - hadirRasio)}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute text-center">
            <span className="text-2xl font-black text-slate-800">{hadirValue}%</span>
            <span className="text-[10px] text-slate-400 block -mt-1">Kehadiran</span>
          </div>
        </div>

        {/* Legend / Bar Info */}
        <div className="space-y-2 mt-2">
          {dataDistribusi.map((item) => (
            <div key={item.label} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                <span className="font-semibold text-slate-600">{item.label}</span>
              </div>
              <span className="font-bold text-slate-800">{item.value}%</span>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}
