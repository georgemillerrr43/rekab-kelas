import React from 'react';
import './globals.css';
import LayoutWrapper from '@/components/LayoutWrapper';

export const metadata = {
  title: 'RekapKelas - Sistem Absensi Digital Sekolah',
  description: 'Platform absensi digital modern untuk guru, wali kelas, dan siswa.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-800 font-sans min-h-screen antialiased flex flex-col">
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}
