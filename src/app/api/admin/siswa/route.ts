import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, getSession } from '@/lib/auth';

// Endpoint: GET /api/admin/siswa - Ambil daftar semua siswa
export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Akses ditolak. Hanya Admin.' }, { status: 403 });
  }

  const students = await prisma.siswa.findMany({
    select: {
      id: true,
      nis: true,
      nama: true,
      kelasId: true,
      kelas: {
        select: {
          id: true,
          nama: true,
          waliKelas: true,
        },
      },
      username: true,
      whatsappOrangTua: true,
      createdAt: true,
    },
    orderBy: { nis: 'asc' },
  });

  return NextResponse.json({ students });
}

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Akses ditolak. Hanya Admin.' }, { status: 403 });
  }

  try {
    const { nis, nama, kelasId, username, password, whatsappOrangTua } = await request.json();

    if (!nis || !nama || !kelasId || !username || !password) {
      return NextResponse.json(
        { error: 'NIS, Nama, Kelas, Username, dan Password wajib diisi!' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal 6 karakter!' },
        { status: 400 }
      );
    }

    const existingNis = await prisma.siswa.findUnique({ where: { nis } });
    if (existingNis) {
      return NextResponse.json({ error: 'NIS tersebut sudah terdaftar!' }, { status: 409 });
    }

    const existingUsername = await prisma.siswa.findUnique({ where: { username } });
    if (existingUsername) {
      return NextResponse.json({ error: 'Username tersebut sudah digunakan!' }, { status: 409 });
    }

    const siswa = await prisma.siswa.create({
      data: {
        nis,
        nama,
        kelasId,
        username,
        password: await hashPassword(password),
        whatsappOrangTua: whatsappOrangTua || '',
      },
      include: {
        kelas: true,
      },
    });

    return NextResponse.json({
      success: true,
      siswa: {
        id: siswa.id,
        nis: siswa.nis,
        nama: siswa.nama,
        kelasId: siswa.kelasId,
        kelas: siswa.kelas,
        username: siswa.username,
      },
    });
  } catch (error: any) {
    console.error('Error menambah siswa:', error);
    return NextResponse.json({ error: 'Gagal menyimpan data siswa ke database.' }, { status: 500 });
  }
}

// Endpoint: DELETE /api/admin/siswa - Hapus siswa berdasarkan ID
export async function DELETE(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token')?.value;
  if (!sessionToken || !sessionToken.startsWith('ADMIN.')) {
    return NextResponse.json({ error: 'Akses ditolak. Hanya Admin.' }, { status: 403 });
  }

  const session = getSession(request);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Akses ditolak. Hanya Admin.' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID siswa wajib disertakan.' }, { status: 400 });
    }

    const existing = await prisma.siswa.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Siswa tidak ditemukan.' }, { status: 404 });
    }

    await prisma.siswa.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error menghapus siswa:', error);
    return NextResponse.json({ error: 'Gagal menghapus data siswa.' }, { status: 500 });
  }
}
