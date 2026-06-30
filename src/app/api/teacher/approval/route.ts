export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { sendWhatsAppNotification } from '@/utils/waNotification';

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session || session.role !== 'GURU') {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  try {
    const guru = await prisma.guru.findUnique({
      where: { id: session.userId },
      select: { kelasId: true },
    });
    if (!guru) return NextResponse.json({ error: 'Guru tidak ditemukan' }, { status: 404 });

    const requests = await prisma.izin.findMany({
      where: { siswa: { kelasId: guru.kelasId } },
      include: {
        siswa: { select: { nis: true, nama: true, whatsappOrangTua: true, kelas: { select: { nama: true } } } },
        kehadiran: { select: { tanggal: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = requests.map((r) => ({
      id: r.id,
      nis: r.siswa.nis,
      nama: r.siswa.nama,
      kelas: r.siswa.kelas.nama,
      tanggal: r.tanggal?.toISOString?.()?.split('T')[0] || '',
      tipe: r.tipe || r.kehadiran?.status || 'IZIN',
      alasan: r.alasan,
      buktiFoto: r.buktiFoto,
      status: r.statusApproval,
      whatsappOrangTua: r.siswa.whatsappOrangTua,
    }));

    return NextResponse.json({ requests: result });
  } catch (e) {
    console.error('GET /api/teacher/approval:', e);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session || session.role !== 'GURU') {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  try {
    const { id, status } = await request.json();
    if (!id || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 });
    }

    const izin = await prisma.izin.findUnique({
      where: { id },
      include: { siswa: { select: { nama: true, nis: true, whatsappOrangTua: true, kelasId: true } } },
    });
    if (!izin) return NextResponse.json({ error: 'Izin tidak ditemukan' }, { status: 404 });

    const guru = await prisma.guru.findUnique({
      where: { id: session.userId },
      select: { kelasId: true },
    });
    if (!guru || izin.siswa.kelasId !== guru.kelasId) {
      return NextResponse.json({ error: 'Bukan siswa di kelas Anda' }, { status: 403 });
    }

    await prisma.izin.update({ where: { id }, data: { statusApproval: status } });

    const tanggal = izin.tanggal || new Date();
    if (status === 'APPROVED') {
      // Izin disetujui → bikin/update Kehadiran status sesuai tipe izin
      await prisma.kehadiran.upsert({
        where: { siswaId_tanggal: { siswaId: izin.siswaId, tanggal } },
        update: { status: (izin.tipe as any) || 'IZIN', izinId: id },
        create: { siswaId: izin.siswaId, tanggal, status: (izin.tipe as any) || 'IZIN', izinId: id },
      });

      // Kirim notif WA — izin disetujui
      const waResult = await sendWhatsAppNotification({
        namaSiswa: izin.siswa.nama,
        nis: izin.siswa.nis,
        tanggal: tanggal.toISOString().split('T')[0],
        status: (izin.tipe as any) || 'IZIN',
        whatsappOrangTua: izin.siswa.whatsappOrangTua,
        alasan: izin.alasan || undefined,
      });
      if (!waResult.success) console.error('[WA] Approval teacher - Gagal kirim WA ke', izin.siswa.nama, waResult.error);
    } else {
      // Izin ditolak → Kehadiran status ALPA + kirim WA notif
      const khd = await prisma.kehadiran.findFirst({ where: { izinId: id } });
      if (khd) {
        await prisma.kehadiran.update({ where: { id: khd.id }, data: { status: 'ALPA', izinId: null } });
      } else {
        await prisma.kehadiran.upsert({
          where: { siswaId_tanggal: { siswaId: izin.siswaId, tanggal } },
          update: { status: 'ALPA' },
          create: { siswaId: izin.siswaId, tanggal, status: 'ALPA' },
        });
      }

      const waAlpa = await sendWhatsAppNotification({
        namaSiswa: izin.siswa.nama,
        nis: izin.siswa.nis,
        tanggal: tanggal.toISOString().split('T')[0],
        status: 'ALPA',
        whatsappOrangTua: izin.siswa.whatsappOrangTua,
      });
      if (!waAlpa.success) console.error('[WA] Approval teacher - Gagal WA ALPA ke', izin.siswa.nama, waAlpa.error);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('POST /api/teacher/approval:', e);
    return NextResponse.json({ error: 'Gagal memproses' }, { status: 500 });
  }
}
