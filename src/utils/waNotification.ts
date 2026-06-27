/**
 * Modul Simulasi Integrasi Notifikasi WhatsApp untuk Orang Tua Siswa.
 * Menggunakan pendekatan mock API untuk mensimulasikan pengiriman pesan real-time.
 */

interface WANotificationPayload {
  namaSiswa: string;
  nis: string;
  tanggal: string;
  status: 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPA';
  whatsappOrangTua: string;
  alasan?: string;
}

export async function sendWhatsAppNotification(payload: WANotificationPayload): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const { namaSiswa, nis, tanggal, status, whatsappOrangTua, alasan } = payload;

  // 1. Validasi format nomor telepon sederhana
  if (!whatsappOrangTua || !whatsappOrangTua.startsWith('62')) {
    return {
      success: false,
      error: 'Nomor WhatsApp Orang Tua tidak valid. Harus dimulai dengan kode negara 62 (contoh: 628123456789).',
    };
  }

  // 2. Susun template pesan berdasarkan status kehadiran
  let messageText = '';

  const formatTanggal = new Date(tanggal).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (status === 'ALPA') {
    messageText = `*PEMBERITAHUAN KETIDAKHADIRAN (ALPA)*\n\n` +
      `Yth. Orang Tua/Wali dari siswa *${namaSiswa}* (${nis}),\n\n` +
      `Dengan ini kami menginformasikan bahwa putra/putri Anda tercatat *TIDAK HADIR (ALPA)* tanpa keterangan pada hari *${formatTanggal}*.\n\n` +
      `Mohon segera menghubungi Wali Kelas untuk memberikan konfirmasi atau surat keterangan resmi.\n\n` +
      `Terima kasih.\n` +
      `_Sistem Absensi Otomatis Sekolah_`;
  } else if (status === 'IZIN' || status === 'SAKIT') {
    const keterangan = status === 'IZIN' ? 'IZIN' : 'SAKIT';
    messageText = `*PEMBERITAHUAN KEHADIRAN (${keterangan})*\n\n` +
      `Yth. Orang Tua/Wali dari siswa *${namaSiswa}* (${nis}),\n\n` +
      `Kami menginformasikan bahwa putra/putri Anda tercatat *${keterangan}* pada hari *${formatTanggal}* dengan alasan: _"${alasan || 'Tidak ada alasan khusus'}"_.\n\n` +
      `Status ini telah masuk dalam antrean persetujuan (approval) oleh Wali Kelas.\n\n` +
      `Terima kasih atas laporan Anda.\n` +
      `_Sistem Absensi Otomatis Sekolah_`;
  } else {
    // Untuk HADIR, biasanya tidak dikirim atau hanya opsional.
    messageText = `*PEMBERITAHUAN KEHADIRAN (HADIR)*\n\n` +
      `Yth. Orang Tua/Wali dari siswa *${namaSiswa}* (${nis}),\n\n` +
      `Kami menginformasikan bahwa putra/putri Anda telah tercatat *HADIR* di kelas pada hari *${formatTanggal}*.\n\n` +
      `Terima kasih atas dukungannya.\n` +
      `_Sistem Absensi Otomatis Sekolah_`;
  }

  // 3. Simulasi pemanggilan API Gateway (Fonnte/Twilio/Wablas)
  console.log('==================================================');
  console.log(`[WA GATEWAY SIMULATION] Mengirim pesan ke: ${whatsappOrangTua}`);
  console.log(`[PESAN SENT]:\n${messageText}`);
  console.log('==================================================');

  // Meniru latency jaringan (delay 500ms)
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    success: true,
    messageId: `msg_${Math.random().toString(36).substring(2, 15)}`,
  };
}
