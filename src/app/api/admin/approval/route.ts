import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { sendWhatsAppNotification } from '@/utils/waNotification';

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const izinList = await prisma.izin.findMany({
      include: {
        siswa: {
          select: {
            nis: true,
            nama: true,
            kelas: true,
            whatsappOrangTua: true,
          },
        },
        kehadiran: {
          select: {
            tanggal: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = izinList.map((item) => ({
      id: item.id,
      nis: item.siswa.nis,
      nama: item.siswa.nama,
      kelas: item.siswa.kelas.nama,
      tanggal: item.kehadiran?.tanggal.toISOString().split('T')[0] || item.createdAt.toISOString().split('T')[0],
      tipe: item.kehadiran?.status || 'IZIN',
      alasan: item.alasan,
      buktiFoto: item.buktiFoto,
      status: item.statusApproval,
      whatsappOrangTua: item.siswa.whatsappOrangTua,
    }));

    return NextResponse.json({ requests: result });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { id, status } = await request.json();
    if (!id || !status || (status !== 'APPROVED' && status !== 'REJECTED')) {
      return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
    }

    const targetIzin = await prisma.izin.findUnique({
      where: { id },
      include: {
        siswa: true,
        kehadiran: true,
      },
    });

    if (!targetIzin) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    await prisma.izin.update({
      where: { id },
      data: { statusApproval: status },
    });

    if (targetIzin.kehadiran) {
      if (status === 'REJECTED') {
        await prisma.kehadiran.update({
          where: { id: targetIzin.kehadiran.id },
          data: { status: 'ALPA', izinId: null },
        });

        await sendWhatsAppNotification({
          namaSiswa: targetIzin.siswa.nama,
          nis: targetIzin.siswa.nis,
          tanggal: targetIzin.kehadiran.tanggal.toISOString().split('T')[0],
          status: 'ALPA',
          whatsappOrangTua: targetIzin.siswa.whatsappOrangTua,
        });
      } else {
        await prisma.kehadiran.update({
          where: { id: targetIzin.kehadiran.id },
          data: { status: targetIzin.kehadiran.status },
        });

        await sendWhatsAppNotification({
          namaSiswa: targetIzin.siswa.nama,
          nis: targetIzin.siswa.nis,
          tanggal: targetIzin.kehadiran.tanggal.toISOString().split('T')[0],
          status: targetIzin.kehadiran.status,
          whatsappOrangTua: targetIzin.siswa.whatsappOrangTua,
          alasan: targetIzin.alasan,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
