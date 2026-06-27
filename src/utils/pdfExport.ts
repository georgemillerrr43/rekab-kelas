import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Definisikan tipe untuk data rekap
export interface StudentRecap {
  nis: string;
  nama: string;
  hadir: number;
  izin: number;
  sakit: number;
  alpa: number;
  totalHari: number;
  persentase: number; // 0 - 100
}

export interface PDFReportMetadata {
  kelas: string;
  mataPelajaran?: string;
  periode: string; // Contoh: "Juni 2026" atau "Minggu ke-3 Juni"
  waliKelas?: string;
}

// Untuk mengatasi type error jspdf-autotable di TypeScript
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export function exportAttendanceToPDF(
  students: StudentRecap[],
  metadata: PDFReportMetadata
) {
  // 1. Inisialisasi dokumen jsPDF (Format A4, Portrait, unit milimeter)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // 2. Setting Style & Warna Utama (Deep Blue & Gray)
  const primaryColor = [30, 41, 59]; // Slate 800
  const secondaryColor = [71, 85, 105]; // Slate 600
  const lightGray = [241, 245, 249]; // Slate 100

  // 3. Tambahkan Header / Kop Surat Ringkas
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('LAPORAN REKAP KEHADIRAN (ABSENSI) SISWA', 14, 20);

  // Subtitle
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text('Sistem Informasi Akademik & Manajemen Absensi', 14, 25);

  // Garis Pembatas Header (Kop Surat)
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(14, 28, 196, 28);

  // 4. Tampilkan Metadata (Detail Kelas & Periode)
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'bold');
  doc.text('Informasi Laporan:', 14, 36);

  doc.setFont('Helvetica', 'normal');
  doc.text(`Kelas: ${metadata.kelas}`, 14, 42);
  if (metadata.mataPelajaran) {
    doc.text(`Mata Pelajaran: ${metadata.mataPelajaran}`, 14, 47);
  }
  doc.text(`Periode: ${metadata.periode}`, 110, 42);
  if (metadata.waliKelas) {
    doc.text(`Wali Kelas: ${metadata.waliKelas}`, 110, 47);
  }

  // 5. Susun Tabel Laporan Menggunakan autoTable
  const tableHeaders = [
    [
      { content: 'No', styles: { halign: 'center' } },
      'NIS',
      'Nama Siswa',
      { content: 'Hadir', styles: { halign: 'center' } },
      { content: 'Izin', styles: { halign: 'center' } },
      { content: 'Sakit', styles: { halign: 'center' } },
      { content: 'Alpa', styles: { halign: 'center' } },
      { content: '% Kehadiran', styles: { halign: 'center' } },
    ],
  ];

  const tableRows = students.map((s, index) => [
    { content: (index + 1).toString(), styles: { halign: 'center' } },
    s.nis,
    s.nama,
    { content: s.hadir.toString(), styles: { halign: 'center' } },
    { content: s.izin.toString(), styles: { halign: 'center' } },
    { content: s.sakit.toString(), styles: { halign: 'center' } },
    { content: s.alpa.toString(), styles: { halign: 'center' } },
    { content: `${s.persentase.toFixed(1)}%`, styles: { halign: 'center', fontStyle: 'bold' } },
  ]);

  doc.autoTable({
    startY: 55,
    head: tableHeaders,
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 10 },  // No
      1: { cellWidth: 25 },  // NIS
      2: { cellWidth: 65 },  // Nama Siswa
      3: { cellWidth: 18 },  // Hadir
      4: { cellWidth: 18 },  // Izin
      5: { cellWidth: 18 },  // Sakit
      6: { cellWidth: 18 },  // Alpa
      7: { cellWidth: 24 },  // % Kehadiran
    },
    styles: {
      font: 'Helvetica',
      fontSize: 9,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: lightGray,
    },
    margin: { left: 14, right: 14 },
  });

  // 6. Tambahkan Bagian Tanda Tangan (Signature) di kanan bawah
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  const pageHeight = doc.internal.pageSize.height;

  // Cek jika area tanda tangan melebihi tinggi halaman, buat halaman baru
  if (finalY + 35 > pageHeight) {
    doc.addPage();
    doc.text('Lanjutan - Laporan Rekap Absensi Kelas', 14, 20);
    doc.line(14, 22, 196, 22);
  }

  const signatureY = finalY + 35 > pageHeight ? 35 : finalY;

  // Teks Tanggal & Tempat Tanda Tangan
  const today = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'normal');
  doc.text(`Jakarta, ${today}`, 140, signatureY);
  doc.text('Mengetahui,', 140, signatureY + 5);
  doc.setFont('Helvetica', 'bold');
  doc.text('Wali Kelas / Kepala Sekolah', 140, signatureY + 10);

  // Garis tempat tanda tangan
  doc.line(140, signatureY + 30, 190, signatureY + 30);
  
  if (metadata.waliKelas) {
    doc.setFont('Helvetica', 'normal');
    doc.text(metadata.waliKelas, 140, signatureY + 34);
  }

  // 7. Simpan file PDF secara otomatis
  const safeClassName = metadata.kelas.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const safePeriod = metadata.periode.toLowerCase().replace(/[^a-z0-9]/g, '_');
  doc.save(`rekap_absensi_${safeClassName}_${safePeriod}.pdf`);
}
