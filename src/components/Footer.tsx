import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white/70 backdrop-blur-sm border-t border-slate-200/60 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-slate-500 text-sm">
            &copy; {currentYear} <span className="font-semibold text-slate-700">RekapKelas</span>. Hak Cipta Dilindungi.
          </p>
          <p className="text-slate-400 text-xs">
            Sistem Informasi Absensi Digital Sekolah
          </p>
        </div>
      </div>
    </footer>
  );
}
