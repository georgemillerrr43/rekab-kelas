interface WANotificationPayload {
  namaSiswa: string;
  nis: string;
  tanggal: string;
  status: 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPA';
  whatsappOrangTua: string;
  alasan?: string;
}

function buildMessage(payload: WANotificationPayload): string {
  const { namaSiswa, nis, tanggal, status, alasan } = payload;

  const formatTanggal = new Date(tanggal).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (status === 'ALPA') {
    return `*PEMBERITAHUAN KETIDAKHADIRAN*\n\nYth. Orang Tua/Wali dari *${namaSiswa}* (${nis}),\n\nPutra/putri Anda tercatat *TIDAK HADIR (ALPA)* tanpa keterangan pada hari *${formatTanggal}*.\n\nMohon hubungi Wali Kelas.\n\n- Sistem Absensi Sekolah`;
  }

  if (status === 'IZIN' || status === 'SAKIT') {
    const label = status === 'IZIN' ? 'IZIN' : 'SAKIT';
    return `*PEMBERITAHUAN KEHADIRAN (${label})*\n\nYth. Orang Tua/Wali dari *${namaSiswa}* (${nis}),\n\nPutra/putri Anda tercatat *${label}* pada hari *${formatTanggal}*.\nAlasan: ${alasan || '-'}\n\n- Sistem Absensi Sekolah`;
  }

  return `*PEMBERITAHUAN KEHADIRAN*\n\nYth. Orang Tua/Wali dari *${namaSiswa}* (${nis}),\n\nPutra/putri Anda tercatat *HADIR* pada hari *${formatTanggal}*.\n\n- Sistem Absensi Sekolah`;
}

export async function sendWhatsAppNotification(payload: WANotificationPayload): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const { whatsappOrangTua } = payload;

  if (!whatsappOrangTua) {
    return {
      success: false,
      error: 'Nomor WhatsApp orang tua tidak diisi.',
    };
  }

  const token = process.env.WA_API_TOKEN;
  const gatewayUrl = process.env.WA_GATEWAY_URL || 'https://api.fonnte.com/send';

  // If no token configured, log and return (for development/testing)
  if (!token || token === 'isi_nanti' || token.startsWith('api_token_anda')) {
    console.log('[WA] Token belum dikonfigurasi. Lewati pengiriman WA ke', whatsappOrangTua);
    return {
      success: false,
      error: 'WA_API_TOKEN belum dikonfigurasi di .env',
    };
  }

  try {
    const messageText = buildMessage(payload);

    const res = await fetch(gatewayUrl, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: whatsappOrangTua,
        message: messageText,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[WA] Gagal mengirim:', data);
      return { success: false, error: data?.reason || data?.message || 'Gagal mengirim WA' };
    }

    return {
      success: true,
      messageId: data?.id || `msg_${Date.now()}`,
    };
  } catch (err) {
    console.error('[WA] Error:', err);
    return { success: false, error: 'Gagal terhubung ke gateway WA' };
  }
}
