import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session || session.role !== 'GURU') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const guru = await prisma.guru.findUnique({ where: { id: session.userId }, include: { kelas: { include: { siswa: true } } } });
    if (!guru) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const tanggal = new URL(req.url).searchParams.get('tanggal') || new Date().toISOString().split('T')[0];
    const targetDate = new Date(tanggal);
    const siswaIds = guru.kelas.siswa.map(s => s.id);
    const kehadiranList = await prisma.kehadiran.findMany({ where: { tanggal: targetDate, siswaId: { in: siswaIds } }, include: { izin: true } });
    const km = new Map(kehadiranList.map(k => [k.siswaId, k]));

    const approvedIzin = await prisma.izin.findMany({
      where: { siswaId: { in: siswaIds }, statusApproval: 'APPROVED', kehadiran: { tanggal: targetDate } },
    });

    const students = guru.kelas.siswa.map(s => {
      const k = km.get(s.id);
      const approved = approvedIzin.find(i => i.siswaId === s.id);
      if (approved) {
        const status = approved.alasan ? 'IZIN' : 'SAKIT';
        return { id: s.id, nis: s.nis, nama: s.nama, whatsappOrangTua: s.whatsappOrangTua, status: k?.status || status as any, alasan: k?.izin?.alasan || approved.alasan || '', buktiUrl: k?.izin?.buktiFoto || approved.buktiFoto || '', izinAuto: true };
      }
      return { id: s.id, nis: s.nis, nama: s.nama, whatsappOrangTua: s.whatsappOrangTua, status: k?.status || 'BELUM', alasan: k?.izin?.alasan || '', buktiUrl: k?.izin?.buktiFoto || '', izinAuto: false };
    });

    const alreadySubmitted = kehadiranList.length === siswaIds.length;
    return NextResponse.json({ kelas: { id: guru.kelas.id, nama: guru.kelas.nama, waliKelas: guru.kelas.waliKelas }, students, alreadySubmitted });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session || session.role !== 'GURU') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const guru = await prisma.guru.findUnique({ where: { id: session.userId }, include: { kelas: { include: { siswa: { select: { id: true } } } } } });
    if (!guru) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { tanggal, data } = await req.json();
    if (!tanggal || !data) return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });

    const kelasSiswaIds = new Set(guru.kelas.siswa.map(s => s.id));
    for (const item of data) {
      if (!kelasSiswaIds.has(item.siswaId)) continue;

      if (item.status === 'IZIN' || item.status === 'SAKIT') {
        const existingKhd = await prisma.kehadiran.findUnique({
          where: { siswaId_tanggal: { siswaId: item.siswaId, tanggal: new Date(tanggal) } },
        });

        let izinId = existingKhd?.izinId || undefined;
        if (!izinId && item.alasan) {
          const newIzin = await prisma.izin.create({
            data: { siswaId: item.siswaId, alasan: item.alasan, buktiFoto: item.buktiUrl || '', statusApproval: 'PENDING' },
          });
          izinId = newIzin.id;
        } else if (izinId) {
          await prisma.izin.update({
            where: { id: izinId },
            data: { alasan: item.alasan, buktiFoto: item.buktiUrl || '' },
          });
        }

        await prisma.kehadiran.upsert({
          where: { siswaId_tanggal: { siswaId: item.siswaId, tanggal: new Date(tanggal) } },
          update: { status: item.status, ...(izinId ? { izinId } : {}) },
          create: { siswaId: item.siswaId, tanggal: new Date(tanggal), status: item.status, ...(izinId ? { izinId } : {}) },
        });
      } else {
        await prisma.kehadiran.upsert({
          where: { siswaId_tanggal: { siswaId: item.siswaId, tanggal: new Date(tanggal) } },
          update: { status: item.status },
          create: { siswaId: item.siswaId, tanggal: new Date(tanggal), status: item.status },
        });
      }
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Gagal menyimpan' }, { status: 500 });
  }
}
