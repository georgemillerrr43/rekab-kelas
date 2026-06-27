import React from 'react';

export default function SiswaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-6 md:py-8">
      {children}
    </div>
  );
}
