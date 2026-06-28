export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// POST /api/siswa/izin - Siswa mengajukan izin/sakit mandiri
export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session || session.role !== 'SISWA') {
    return NextResponse.json({ error: 'Akses ditolak. Hanya Siswa.' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const alasan = formData.get('alasan') as string;
    const tipe = formData.get('tipe') as 'IZIN' | 'SAKIT';
    const tanggal = formData.get('tanggal') as string;
    const file = formData.get('file') as File | null;

    if (!alasan || !tipe || !tanggal || !file) {
      return NextResponse.json({ error: 'Semua field wajib diisi termasuk foto bukti!' }, { status: 400 });
    }

    // Validasi file foto
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedMimes.includes(file.type)) {
      return NextResponse.json({ error: 'Hanya menerima foto JPEG/PNG!' }, { status: 400 });
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Ukuran foto maksimal 2MB!' }, { status: 400 });
    }

    // Simpan file bukti
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const fileName = `bukti-${session.userId}-${Date.now()}.${fileExt}`;
    const filePath = join(uploadDir, fileName);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const buktiFotoUrl = `/api/uploads/${fileName}`;
    const parsedDate = new Date(tanggal);

    // Buat record Izin — jangan bikin Kehadiran, nunggu approval dulu
    await prisma.izin.create({
      data: {
        alasan,
        buktiFoto: buktiFotoUrl,
        statusApproval: 'PENDING',
        siswaId: session.userId,
        tanggal: parsedDate,
        tipe,
      },
    });

    return NextResponse.json({ success: true, message: 'Pengajuan izin berhasil dikirim, menunggu persetujuan.' });
  } catch (error: any) {
    console.error('Error pengajuan izin:', error);
    return NextResponse.json({ error: 'Gagal memproses pengajuan izin.' }, { status: 500 });
  }
}

// GET /api/siswa/izin - Ambil riwayat izin milik siswa yang login
export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session || session.role !== 'SISWA') {
    return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
  }

  const izinList = await prisma.izin.findMany({
    where: { siswaId: session.userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const kehadiran = await prisma.kehadiran.findMany({
    where: { siswaId: session.userId },
    orderBy: { tanggal: 'desc' },
  });

  const stats = {
    hadir: kehadiran.filter((k) => k.status === 'HADIR').length,
    izin: kehadiran.filter((k) => k.status === 'IZIN').length,
    sakit: kehadiran.filter((k) => k.status === 'SAKIT').length,
    alpa: kehadiran.filter((k) => k.status === 'ALPA').length,
    total: kehadiran.length,
  };

  return NextResponse.json({ izinList, stats });
}
