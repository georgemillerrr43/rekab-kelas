import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/rekap/harian?tanggal=YYYY-MM-DD&kelas=XI-RPL-1
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tanggal = searchParams.get('tanggal');
  const kelas = searchParams.get('kelas');

  if (!tanggal || !kelas) {
    return NextResponse.json({ error: 'Parameter tanggal dan kelas wajib diisi.' }, { status: 400 });
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

    const kehadiranList = await prisma.kehadiran.findMany({
      where: {
        siswaId: { in: studentIds },
        tanggal: targetDate,
      },
      include: { izin: true },
    });

    const result = students.map((siswa) => {
      const khd = kehadiranList.find((k) => k.siswaId === siswa.id);
      return {
        siswaId: siswa.id,
        nis: siswa.nis,
        nama: siswa.nama,
        status: khd?.status || 'BELUM',
        alasan: khd?.izin?.alasan || '',
        buktiUrl: khd?.izin?.buktiFoto || '',
      };
    });

    // Summary counts
    const hadir = result.filter((r) => r.status === 'HADIR').length;
    const izin = result.filter((r) => r.status === 'IZIN').length;
    const sakit = result.filter((r) => r.status === 'SAKIT').length;
    const alpa = result.filter((r) => r.status === 'ALPA').length;
    const belum = result.filter((r) => r.status === 'BELUM').length;

    return NextResponse.json({
      tanggal,
      kelas,
      summary: { hadir, izin, sakit, alpa, belum, total: students.length },
      students: result,
    });
  } catch (error) {
    console.error('Error fetching daily recap:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
