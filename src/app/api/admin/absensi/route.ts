import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { sendWhatsAppNotification } from '@/utils/waNotification';

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const kelas = searchParams.get('kelas');
  const tanggal = searchParams.get('tanggal');

  if (!kelas || !tanggal) {
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  }

  try {
    const targetDate = new Date(tanggal);

    let kelasRecord = await prisma.kelas.findFirst({
      where: { OR: [{ id: kelas }, { nama: kelas }] },
    });
    if (!kelasRecord) {
      return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 });
    }

    const students = await prisma.siswa.findMany({
      where: { kelasId: kelasRecord.id },
      orderBy: { nis: 'asc' },
    });
    const studentIds = students.map((s) => s.id);

    const kehadiran = await prisma.kehadiran.findMany({
      where: { siswaId: { in: studentIds }, tanggal: targetDate },
      include: { izin: true },
    });

    // ponytail: check izin status — approved / pending, but never auto-set student status
    const allIzin = await prisma.izin.findMany({
      where: { siswaId: { in: studentIds }, kehadiran: { tanggal: targetDate } },
      select: { siswaId: true, statusApproval: true },
    });
    const izinStatus = new Map<string, string>();
    for (const i of allIzin) izinStatus.set(i.siswaId, i.statusApproval);

    const result = students.map((siswa) => {
      const khd = kehadiran.find((k) => k.siswaId === siswa.id);
      const izinSt = izinStatus.get(siswa.id);
      return {
        id: siswa.id, nis: siswa.nis, nama: siswa.nama, whatsappOrangTua: siswa.whatsappOrangTua,
        status: khd?.status || 'BELUM', alasan: khd?.izin?.alasan || '', buktiUrl: khd?.izin?.buktiFoto || '',
        izinAuto: false, hasPending: izinSt === 'PENDING',
        hasApprovedIzin: izinSt === 'APPROVED',
      };
    });

    // ponytail: always show the form; success screen only triggered by POST submit
    const alreadySubmitted = false;
    return NextResponse.json({ students: result, alreadySubmitted });
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
    const { tanggal, data } = await request.json();
    if (!tanggal || !Array.isArray(data)) {
      return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
    }

    const targetDate = new Date(tanggal);

    for (const item of data) {
      const { siswaId, status, alasan, buktiUrl } = item;

      const student = await prisma.siswa.findUnique({
        where: { id: siswaId },
      });

      if (!student) continue;

      const existingKhd = await prisma.kehadiran.findUnique({
        where: { siswaId_tanggal: { siswaId, tanggal: targetDate } },
      });

      if (status === 'HADIR' || status === 'ALPA') {
        if (existingKhd?.izinId) {
          await prisma.kehadiran.update({
            where: { id: existingKhd.id },
            data: { status, izin: { delete: true } },
          });
        } else {
          await prisma.kehadiran.upsert({
            where: { siswaId_tanggal: { siswaId, tanggal: targetDate } },
            update: { status },
            create: { siswaId, tanggal: targetDate, status },
          });
        }

        if (status === 'ALPA') {
          await sendWhatsAppNotification({
            namaSiswa: student.nama,
            nis: student.nis,
            tanggal,
            status: 'ALPA',
            whatsappOrangTua: student.whatsappOrangTua,
          });
        }
      } else if (status === 'IZIN' || status === 'SAKIT') {
        // ponytail: izin/sakit from teacher = PENDING, not auto-approved
        let newIzin;
        if (existingKhd?.izinId) {
          newIzin = await prisma.izin.update({
            where: { id: existingKhd.izinId },
            data: {
              alasan: alasan || '',
              buktiFoto: buktiUrl || '',
              statusApproval: 'PENDING',
            },
          });
        } else {
          newIzin = await prisma.izin.create({
            data: {
              siswaId,
              alasan: alasan || '',
              buktiFoto: buktiUrl || '',
              statusApproval: 'PENDING',
            },
          });
        }

        await prisma.kehadiran.upsert({
          where: { siswaId_tanggal: { siswaId, tanggal: targetDate } },
          update: { status, izinId: newIzin.id },
          create: { siswaId, tanggal: targetDate, status, izinId: newIzin.id },
        });

        await sendWhatsAppNotification({
          namaSiswa: student.nama,
          nis: student.nis,
          tanggal,
          status,
          whatsappOrangTua: student.whatsappOrangTua,
          alasan,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
