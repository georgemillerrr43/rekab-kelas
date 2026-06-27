import jsPDF from 'jspdf';
import 'jspdf-autotable';

export interface StudentRecap {
  nis: string;
  nama: string;
  hadir: number;
  izin: number;
  sakit: number;
  alpa: number;
  totalHari: number;
  persentase: number;
}

export interface PDFReportMetadata {
  kelas: string;
  mataPelajaran?: string;
  periode: string;
  waliKelas?: string;
}

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export function exportAttendanceToPDF(
  students: StudentRecap[],
  metadata: PDFReportMetadata
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const px = 14; // left margin
  const pw = 182; // page width minus margins (210 - 14 - 14)

  const primary = [30, 41, 59];
  const secondary = [71, 85, 105];
  const accent = [37, 99, 235];
  const lightBg = [248, 250, 252];

  // ========== HEADER ==========
  // Top decorative line
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(px, 10, pw, 2, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.text('REKAP KEHADIRAN SISWA', px, 26);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(secondary[0], secondary[1], secondary[2]);
  doc.text('Sistem Informasi Akademik & Manajemen Absensi — RekapKelas', px, 31);

  // Separator
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(px, 34, px + pw, 34);

  // ========== INFO SECTION (2-column) ==========
  const infoY = 40;
  doc.setFontSize(9);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.text('INFORMASI LAPORAN', px, infoY);

  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(secondary[0], secondary[1], secondary[2]);

  // Left column
  const leftX = px;
  const rightX = px + 96;
  doc.text(`Kelas        :  ${metadata.kelas}`, leftX, infoY + 7);
  doc.text(`Periode      :  ${metadata.periode}`, leftX, infoY + 13);
  if (metadata.mataPelajaran) {
    doc.text(`Mata Pelajaran :  ${metadata.mataPelajaran}`, leftX, infoY + 19);
  }

  // Right column
  const rightStart = metadata.mataPelajaran ? infoY + 7 : infoY + 7;
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.text(`Tanggal Cetak :  ${today}`, rightX, rightStart);
  if (metadata.waliKelas) {
    doc.text(`Wali Kelas    :  ${metadata.waliKelas}`, rightX, rightStart + 6);
  }

  // ========== STATS BAR ==========
  const statsY = infoY + (metadata.mataPelajaran ? 28 : 24);
  const hadirCount = students.reduce((a, c) => a + c.hadir, 0);
  const izinCount = students.reduce((a, c) => a + c.izin, 0);
  const sakitCount = students.reduce((a, c) => a + c.sakit, 0);
  const alpaCount = students.reduce((a, c) => a + c.alpa, 0);
  const avg = students.length > 0 ? students.reduce((a, c) => a + c.persentase, 0) / students.length : 0;

  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(220, 220, 225);
  doc.roundedRect(px, statsY, pw, 12, 1.5, 1.5, 'FD');
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(secondary[0], secondary[1], secondary[2]);
  const stats = [
    `Total Siswa: ${students.length}`,
    `Hadir: ${hadirCount}`,
    `Izin: ${izinCount}`,
    `Sakit: ${sakitCount}`,
    `Alpa: ${alpaCount}`,
    `Rata-rata: ${avg.toFixed(1)}%`,
  ];
  const statsSpacing = pw / stats.length;
  stats.forEach((s, i) => {
    doc.text(s, px + statsSpacing * i + 2, statsY + 8);
  });

  // ========== TABLE ==========
  const tableHeaders = [
    [
      { content: 'No', styles: { halign: 'center' } },
      'NIS',
      'Nama Siswa',
      { content: 'Hadir', styles: { halign: 'center' } },
      { content: 'Izin', styles: { halign: 'center' } },
      { content: 'Sakit', styles: { halign: 'center' } },
      { content: 'Alpa', styles: { halign: 'center' } },
      { content: '% Hadir', styles: { halign: 'center' } },
    ],
  ];

  const tableRows = students.map((s, i) => [
    { content: (i + 1).toString(), styles: { halign: 'center' } },
    s.nis,
    s.nama,
    { content: s.hadir.toString(), styles: { halign: 'center' } },
    { content: s.izin.toString(), styles: { halign: 'center' } },
    { content: s.sakit.toString(), styles: { halign: 'center' } },
    { content: s.alpa.toString(), styles: { halign: 'center' } },
    {
      content: `${s.persentase.toFixed(1)}%`,
      styles: {
        halign: 'center',
        fontStyle: 'bold',
        textColor: s.persentase >= 90 ? [22, 163, 74] : s.persentase >= 75 ? [217, 119, 6] : [220, 38, 38],
      },
    },
  ]);

  const tableStartY = statsY + 18;
  doc.autoTable({
    startY: tableStartY,
    head: tableHeaders,
    body: tableRows,
    theme: 'grid',
    tableLineColor: [200, 200, 205],
    tableLineWidth: 0.2,
    headStyles: {
      fillColor: primary,
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 24 },
      2: { cellWidth: 64 },
      3: { cellWidth: 16, halign: 'center' },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 16, halign: 'center' },
      6: { cellWidth: 16, halign: 'center' },
      7: { cellWidth: 20, halign: 'center' },
    },
    styles: {
      font: 'Helvetica',
      fontSize: 8.5,
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: lightBg,
    },
    margin: { left: px, right: px },
  });

  // ========== SIGNATURE ==========
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const pageH = doc.internal.pageSize.height;

  if (finalY + 50 > pageH) {
    doc.addPage();
  }

  const sigY = Math.max(finalY, finalY + 20 > pageH ? 20 : finalY);

  // Note text at bottom-left
  doc.setFontSize(7.5);
  doc.setFont('Helvetica', 'italic');
  doc.setTextColor(160, 160, 165);
  doc.text('Dokumen ini dihasilkan secara otomatis oleh sistem RekapKelas.', px, sigY + 5);

  // Signature block at bottom-right
  const sigX = px + 120;
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(secondary[0], secondary[1], secondary[2]);
  const dateStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  doc.text(`Jakarta, ${dateStr}`, sigX, sigY + 18);
  doc.text('Mengetahui,', sigX, sigY + 24);

  // Signature line
  doc.setDrawColor(150, 150, 155);
  doc.setLineWidth(0.5);
  doc.line(sigX, sigY + 40, sigX + 55, sigY + 40);

  if (metadata.waliKelas) {
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(primary[0], primary[1], primary[2]);
    doc.text(metadata.waliKelas, sigX, sigY + 45);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(secondary[0], secondary[1], secondary[2]);
    doc.text('Wali Kelas', sigX, sigY + 49);
  } else {
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(secondary[0], secondary[1], secondary[2]);
    doc.text('Wali Kelas', sigX, sigY + 45);
  }

  // ========== SAVE ==========
  const safeName = metadata.kelas.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const safePeriod = metadata.periode.toLowerCase().replace(/[^a-z0-9]/g, '_');
  doc.save(`rekap_absensi_${safeName}_${safePeriod}.pdf`);
}
