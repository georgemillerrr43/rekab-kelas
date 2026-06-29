import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

const dataKelas = [
  { nama: 'XI-RPL-1', waliKelas: 'Budi Santoso, S.Pd.' },
  { nama: 'XI-RPL-2', waliKelas: 'Siti Nurhaliza, S.Pd.' },
  { nama: 'XII-RPL-1', waliKelas: 'Ahmad Wijaya, S.Pd.' },
];

const dataSiswa = [
  { nis: '10001', nama: 'Aditya Pratama', kelas: 'XI-RPL-1', whatsappOrangTua: '6281234567890' },
  { nis: '10002', nama: 'Budi Santoso', kelas: 'XI-RPL-1', whatsappOrangTua: '6281234567891' },
  { nis: '10003', nama: 'Citra Lestari', kelas: 'XI-RPL-1', whatsappOrangTua: '6281234567892' },
  { nis: '10004', nama: 'Dedi Wijaya', kelas: 'XI-RPL-1', whatsappOrangTua: '6281234567893' },
  { nis: '10005', nama: 'Eka Putri', kelas: 'XI-RPL-2', whatsappOrangTua: '6281234567894' },
  { nis: '10006', nama: 'Farhan Ramadhan', kelas: 'XI-RPL-2', whatsappOrangTua: '6281234567895' },
  { nis: '10007', nama: 'Gita Permata', kelas: 'XI-RPL-2', whatsappOrangTua: '6281234567896' },
  { nis: '10008', nama: 'Hendra Wijaya', kelas: 'XII-RPL-1', whatsappOrangTua: '6281234567897' },
  { nis: '10009', nama: 'Indah Kusuma', kelas: 'XII-RPL-1', whatsappOrangTua: '6281234567898' },
  { nis: '10010', nama: 'Joko Susilo', kelas: 'XII-RPL-1', whatsappOrangTua: '6281234567899' },
];

async function main() {
  // Hapus data lama (urutan berantai)
  await prisma.kehadiran.deleteMany({});
  await prisma.izin.deleteMany({});
  await prisma.siswa.deleteMany({});
  await prisma.guru.deleteMany({});
  await prisma.kelas.deleteMany({});
  await prisma.admin.deleteMany({});

  // 1. Buat admin
  const adminPassword = await hashPassword('admin123');
  await prisma.admin.create({
    data: {
      username: 'admin',
      password: adminPassword,
      nama: 'Budi Setiawan, S.Pd.',
    },
  });

  // 2. Buat kelas
  const kelasMap = new Map<string, string>();
  for (const kelas of dataKelas) {
    const created = await prisma.kelas.create({
      data: { nama: kelas.nama, waliKelas: kelas.waliKelas },
    });
    kelasMap.set(kelas.nama, created.id);
  }

  // 3. Buat akun guru untuk setiap kelas
  const guruPass = await hashPassword('guru123');
  const dataGuru = [
    { username: 'budixirpl1', nama: 'Budi Santoso, S.Pd.', kelas: 'XI-RPL-1' },
    { username: 'sitinurhaliza', nama: 'Siti Nurhaliza, S.Pd.', kelas: 'XI-RPL-2' },
    { username: 'ahmadwijaya', nama: 'Ahmad Wijaya, S.Pd.', kelas: 'XII-RPL-1' },
  ];
  for (const guru of dataGuru) {
    const kelasId = kelasMap.get(guru.kelas);
    if (!kelasId) {
      console.error(`Kelas ${guru.kelas} tidak ditemukan`);
      continue;
    }
    await prisma.guru.create({
      data: {
        username: guru.username,
        password: guruPass,
        passwordPlain: 'guru123',
        nama: guru.nama,
        kelasId: kelasId,
      },
    });
  }

  // 4. Buat akun siswa
  const siswaPassword = await hashPassword('siswa123');
  for (const siswa of dataSiswa) {
    const kelasId = kelasMap.get(siswa.kelas);
    if (!kelasId) {
      console.error(`Kelas ${siswa.kelas} tidak ditemukan`);
      continue;
    }
    await prisma.siswa.create({
      data: {
        nis: siswa.nis,
        nama: siswa.nama,
        kelasId: kelasId,
        whatsappOrangTua: siswa.whatsappOrangTua,
        username: siswa.nis,
        password: siswaPassword,
        passwordPlain: 'siswa123',
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log('Seed selesai!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
