import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET - List all classes
export async function GET(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const kelas = await prisma.kelas.findMany({
      include: {
        _count: {
          select: { siswa: true }
        }
      },
      orderBy: { nama: 'asc' }
    });

    return NextResponse.json({ kelas });
  } catch (error) {
    console.error('Error fetching kelas:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new class
export async function POST(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { nama, waliKelas } = body;

    if (!nama || !waliKelas) {
      return NextResponse.json({ error: 'Nama kelas dan nama wali kelas harus diisi' }, { status: 400 });
    }

    // Check if class already exists
    const existing = await prisma.kelas.findUnique({
      where: { nama }
    });

    if (existing) {
      return NextResponse.json({ error: 'Kelas dengan nama ini sudah ada' }, { status: 400 });
    }

    const newKelas = await prisma.kelas.create({
      data: {
        nama,
        waliKelas
      }
    });

    return NextResponse.json({ kelas: newKelas }, { status: 201 });
  } catch (error) {
    console.error('Error creating kelas:', error);
    return NextResponse.json({ error: 'Gagal membuat kelas' }, { status: 500 });
  }
}

// DELETE - Delete class
export async function DELETE(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID kelas harus disediakan' }, { status: 400 });
    }

    // Check if class has students
    const kelas = await prisma.kelas.findUnique({
      where: { id },
      include: {
        _count: {
          select: { siswa: true }
        }
      }
    });

    if (!kelas) {
      return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 });
    }

    if (kelas._count.siswa > 0) {
      return NextResponse.json({
        error: `Tidak dapat menghapus kelas karena masih ada ${kelas._count.siswa} siswa terdaftar`
      }, { status: 400 });
    }

    await prisma.kelas.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Kelas berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting kelas:', error);
    return NextResponse.json({ error: 'Gagal menghapus kelas' }, { status: 500 });
  }
}
