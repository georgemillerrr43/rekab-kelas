# Sistem Rekap Kehadiran (Absensi) Kelas

Aplikasi web modern, responsif, dan efisien untuk manajemen absensi kelas harian yang dirancang khusus untuk Guru, Wali Kelas, dan Admin Sekolah. Memiliki fitur visualisasi statistik kehadiran, persetujuan izin digital dengan lampiran foto bukti fisik, download rekap otomatis berformat PDF, serta simulasi notifikasi otomatis ke nomor WhatsApp orang tua siswa jika siswa alpa.

---

## 1. Arsitektur Sistem & Alur Data

Sistem ini dirancang menggunakan konsep arsitektur **Three-Tier Architecture** (Client-Server-Database) dengan framework **Next.js (React)** untuk menyatukan frontend yang interaktif dan backend API yang cepat, serta **Prisma ORM** sebagai jembatan ke database relational (MySQL/PostgreSQL).

```mermaid
graph TD
    A[Guru / Ketua Kelas] -->|Input Absensi & Unggah Bukti| B(Next.js App)
    B -->|Validasi Ukuran <2MB & Mime Image| C[Next.js Server API]
    C -->|Simpan Foto Fisik| D[(Penyimpanan Server /public/uploads)]
    C -->|Simpan Record| E[(Database MySQL/Postgres)]
    
    F[Wali Kelas / Admin] -->|Review & Approval Izin| B
    B -->|Ubah Status Izin| E
    E -->|Kueri Rekap| B
    B -->|Ekspor PDF Client-Side| G[Download File Laporan PDF]
    
    E -->|Pemicu Notifikasi WA| H[Simulasi API Notifikasi WhatsApp]
    H -->|Kirim Pesan Teks| I[WhatsApp Orang Tua Siswa]
```

### Penjelasan Alur Data:
1. **Pencatatan Kehadiran**: Guru membuka aplikasi di Mobile/Laptop, memilih mata pelajaran, tanggal, dan kelas, lalu menekan tombol cepat status kehadiran per siswa.
2. **Pengajuan Izin/Sakit**: Apabila siswa memiliki status `IZIN` atau `SAKIT`, input alasan dan upload foto bukti fisik wajib diisi. Validasi ketat diterapkan di client & server untuk menolak file selain gambar (seperti video `.mp4`, `.avi`, dll) serta membatasi ukuran maksimal file sebesar **2MB**.
3. **Simulasi WhatsApp**: Ketika formulir disubmit, sistem menyaring siswa dengan status `ALPA` atau status izin baru, kemudian memanggil modul simulasi notifikasi untuk mencetak teks alert yang siap dikirim langsung ke nomor WhatsApp orang tua siswa yang terdaftar.
4. **Persetujuan (Approval)**: Data izin masuk dalam antrean status `PENDING` pada dasbor Wali Kelas. Wali kelas dapat menyetujui (`APPROVED`) atau menolak (`REJECTED`) berdasarkan bukti foto. Status kehadiran otomatis ter-update di database.
5. **Ekspor PDF**: Data kehadiran dikompilasi secara berkala. Wali kelas dapat mengunduh laporan PDF siap cetak hanya dengan satu kali klik.

---

## 2. Rancangan Tabel Database (Prisma Schema)

Berikut adalah struktur hubungan data antar tabel (`Siswa`, `Kehadiran`, dan `Izin`) yang didefinisikan dalam Prisma ORM:

### Tabel `Siswa` (Data Induk Murid)
* Menyimpan profil unik setiap siswa dan informasi kontak orang tua untuk pengiriman notifikasi WhatsApp.
* **Kolom**: `id` (PK, UUID), `nis` (Unique), `nama`, `whatsappOrangTua`, `createdAt`, `updatedAt`.

### Tabel `Kehadiran` (Data Transaksi Absensi Harian)
* Mencatat kehadiran harian siswa pada tanggal tertentu. Memiliki indeks unik gabungan (`siswaId` + `tanggal`) untuk memastikan tidak terjadi duplikasi pencatatan absensi di hari yang sama.
* **Kolom**: `id` (PK, UUID), `tanggal` (Date), `status` (Enum: `HADIR`, `IZIN`, `SAKIT`, `ALPA`), `siswaId` (FK -> Siswa), `izinId` (FK -> Izin, Nullable), `createdAt`, `updatedAt`.

### Tabel `Izin` (Data Pengajuan Bukti Tidak Hadir)
* Menyimpan dokumen alasan dan foto fisik bukti perizinan yang memerlukan verifikasi administrasi.
* **Kolom**: `id` (PK, UUID), `alasan` (Text), `buktiFoto` (String/Path URL), `statusApproval` (Enum: `PENDING`, `APPROVED`, `REJECTED`), `siswaId` (FK -> Siswa), `createdAt`, `updatedAt`.

---

## 3. Struktur Folder Proyek

```text
rekabkelas/
├── prisma/
│   ├── schema.prisma         # Definisi database model (Siswa, Kehadiran, Izin)
│   └── seed.ts               # Data siswa awal (Seeding) untuk bahan uji coba
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Layout Navigasi Global
│   │   ├── page.tsx          # Halaman Dashboard Ringkasan & Grafik Chart
│   │   ├── absensi/
│   │   │   └── page.tsx      # Halaman Utama Form Input Absensi Kelas
│   │   ├── approval/
│   │   │   └── page.tsx      # Halaman Wali Kelas untuk Approval Izin
│   │   ├── rekap/
│   │   │   └── page.tsx      # Halaman Tabel Laporan Mingguan/Bulanan
│   │   └── api/
│   │       ├── absensi/route.ts # endpoint penyimpanan absensi
│   │       ├── approval/route.ts# endpoint setuju/tolak izin
│   │       └── upload/route.ts  # Endpoint upload foto bukti (Validasi ketat server-side)
│   ├── components/
│   │   ├── AttendanceForm.tsx # UI Komponen Absensi (Opsi cepat & upload bukti)
│   │   └── DashboardChart.tsx # Visualisasi Chart kehadiran
│   ├── lib/
│   │   └── prisma.ts         # Inisialisasi koneksi Prisma Client
│   └── utils/
│       ├── pdfExport.ts      # Engine pembuat PDF Laporan menggunakan jsPDF
│       └── waNotification.ts # Modul log simulasi pengiriman notifikasi WhatsApp
├── public/
│   └── uploads/              # Folder penyimpanan fisik file foto bukti izin siswa
├── .env.example              # Template variabel lingkungan/kredensial database
├── package.json              # Definisi dependensi & skrip eksekusi
└── tsconfig.json             # Konfigurasi TypeScript compiler
```

---

## 4. Panduan Setup Database & Deployment di aaPanel

Panduan langkah-demi-langkah bagi administrator untuk mendeploy aplikasi Next.js ini ke server produksi menggunakan kontrol panel **aaPanel**.

### Bagian A: Membuat Database Baru di Dashboard aaPanel

1. **Login ke aaPanel**: Masuk ke panel administrasi aaPanel Anda melalui peramban web (browser).
2. **Masuk ke Menu Database**: Di sidebar kiri dashboard aaPanel, klik menu **Database**.
3. **Tambah Database Baru**:
   * Klik tombol **Add Database** di bagian atas halaman.
   * **Database Name**: Masukkan nama database pilihan Anda, misalnya `db_rekabkelas`.
   * **User Name**: Masukkan nama user database baru, misalnya `user_rekabkelas`.
   * **Password**: Generate password yang kuat atau tentukan sendiri (catat password ini dengan aman!).
   * **Access Permission**: Set ke **Localhost (127.0.0.1)** demi keamanan maksimum (aplikasi Next.js berjalan di server yang sama). Jika ingin bisa diakses remote melalui PC lokal Anda untuk debugging, pilih *Everyone* (tidak direkomendasikan di server production tanpa firewall port).
   * Klik **Submit** untuk membuat database.

### Bagian B: Konfigurasi Environment Variables (.env) di Server

1. **Masuk ke File Manager**: Di aaPanel, buka menu **Files** dan arahkan ke direktori root tempat Anda meletakkan folder proyek, misalnya `/www/wwwroot/rekabkelas`.
2. **Buat File `.env`**:
   * Duplikat file `.env.example` yang sudah disediakan dan ganti namanya menjadi `.env`.
   * Klik kanan file `.env` tersebut dan pilih **Edit**.
   * Ubah nilai variabel `DATABASE_URL` menggunakan detail database yang telah Anda buat di Langkah A.
   
   **Format Konfigurasi Database URL:**
   ```env
   DATABASE_URL="mysql://USER_DATABASE:PASSWORD_DATABASE@127.0.0.1:3306/NAMA_DATABASE"
   ```
   * *Contoh:*
     ```env
     DATABASE_URL="mysql://user_rekabkelas:Mypassword123!@127.0.0.1:3306/db_rekabkelas"
     ```
   * Simpan file `.env` tersebut.

### Bagian C: Menjalankan Migrasi Database & Seeding Awal Murid

Untuk menginisialisasi skema tabel database dan mengisi data siswa contoh ke server aaPanel:

1. **Buka Terminal / SSH**: Anda bisa menggunakan menu **Terminal** di dashboard aaPanel (di sudut kiri bawah) atau menggunakan aplikasi SSH client (seperti PuTTY atau Termius) untuk masuk sebagai user root server.
2. **Arahkan ke Folder Proyek**:
   ```bash
   cd /www/wwwroot/rekabkelas
   ```
3. **Instal Dependensi**:
   ```bash
   npm install
   ```
4. **Jalankan Migrasi Prisma**:
   Skrip ini akan otomatis membaca file `prisma/schema.prisma` dan menyusun tabel-tabel di database aaPanel Anda.
   ```bash
   npx prisma migrate dev --name init
   ```
5. **Jalankan Seeding Data Awal**:
   Gunakan perintah ini untuk memicu eksekusi `prisma/seed.ts` agar data siswa tiruan langsung masuk ke database Anda.
   ```bash
   npx prisma db seed
   ```

---

### Bagian D: Deployment Aplikasi Web Menggunakan Node.js Project Manager

aaPanel memiliki modul bawaan bernama **Node.js Project Manager** yang sangat memudahkan manajemen aplikasi Node.js/Next.js di server production.

1. **Instal Node.js Version Manager**:
   * Buka menu **App Store** di aaPanel.
   * Cari **Node.js version manager** atau **Node.js Project Manager**, lalu klik **Install**.
   * Setelah terpasang, buka aplikasi tersebut, masuk ke bagian *Registry/Version* dan pilih versi Node.js yang stabil (misalnya Node.js v18 atau v20 LTS).
2. **Tambahkan Proyek Node.js Baru**:
   * Klik menu **Website** di sidebar aaPanel, pilih tab **NodeJS Projects** di bagian atas.
   * Klik tombol **Add Node Project**.
   * **Project Path**: Pilih lokasi folder proyek Anda `/www/wwwroot/rekabkelas`.
   * **Project Name**: Masukkan nama proyek, misalnya `rekabkelas`.
   * **Run Command**: Pilih `npm run start` atau `npm run dev`. Untuk server production, disarankan untuk mem-build aplikasi terlebih dahulu (`npm run build` via terminal) lalu jalankan dengan mode `npm run start`.
   * **Port**: Ketik `3000` (atau port lain sesuai pengaturan file `.env`).
   * **User**: Set ke user default `www` agar manajemen hak akses file seragam.
   * Klik **Submit**. Aplikasi Anda sekarang berjalan di latar belakang (background process) server aaPanel pada port `3000`.

---

### Bagian E: Konfigurasi Reverse Proxy (Domain Utama Port 80/443)

Agar aplikasi web Next.js Anda bisa diakses langsung lewat domain utama (tanpa harus mengetik `:3000` di akhir URL), Anda perlu menyiapkan Reverse Proxy melalui Nginx di aaPanel.

1. **Masuk ke Pengaturan Web**:
   * Buka menu **Website** di sidebar aaPanel.
   * Pada daftar web, cari domain proyek Anda (misal `absensi.sekolah.sch.id`), lalu klik pada kolom nama domain tersebut untuk membuka panel **Settings**.
2. **Tambahkan Reverse Proxy**:
   * Di sebelah kiri menu pengaturan situs web, pilih opsi **Reverse Proxy**.
   * Klik tombol **Add Reverse Proxy**.
   * **Proxy Name**: Beri nama bebas, misal `nextjs_proxy`.
   * **Target URL**: Masukkan alamat lokal aplikasi Next.js Anda, yaitu `http://127.0.0.1:3000`.
   * **Sent Domain**: Biarkan default `$host`.
   * Klik **Submit**.
3. **Selesai**: Nginx sekarang akan otomatis mengarahkan seluruh lalu lintas pengunjung dari port `80` (HTTP) atau `443` (HTTPS) ke port lokal `3000` Next.js secara aman.

---

### Bagian F: Pengaturan Folder Unggahan Bukti Izin (Permissions & Security)

Karena file bukti izin berupa foto diunggah langsung ke folder `public/uploads` di server, Anda harus mengonfigurasi hak akses file (permission) yang tepat untuk keamanan data:

1. **Buat Direktori Uploads**:
   * Buka menu **Files** di aaPanel, lalu masuk ke folder `/www/wwwroot/rekabkelas/public`.
   * Jika folder `uploads` belum terbentuk, buat folder baru dengan nama `uploads`.
2. **Atur Owner & Permission Folder**:
   * Klik kanan folder `uploads` dan pilih **Permission**.
   * **Owner (Pemilik)**: Set ke **www** (User web server Nginx).
   * **Permissions Value**: Ubah nilainya menjadi **755** atau **775**. Nilai ini berarti:
     * *Owner (www)* memiliki akses penuh: **Read**, **Write**, dan **Execute** (bisa menulis file baru saat ada upload).
     * *Group* dan *Public* hanya memiliki hak akses **Read** dan **Execute** (bisa melihat/mengakses foto secara publik melalui browser, tetapi tidak bisa menghapus, memodifikasi, atau mengeksekusi file script berbahaya di folder tersebut).
   * Centang opsi **Apply to subdirectories** agar pengaturan ini otomatis berlaku ke semua file yang akan diunggah di masa mendatang.
   * Klik **Confirm**.

---

## 5. Ringkasan Fitur Keamanan Tambahan di aaPanel
* **Proteksi Folder Unggahan**: Nginx disarankan dikonfigurasi untuk memblokir eksekusi file script (seperti berkas PHP, JS, atau SH) di dalam folder `public/uploads`. Tambahkan aturan ini di tab **Configuration** website Nginx Anda untuk menghindari celah keamanan *Remote Code Execution (RCE)*:
  ```nginx
  location ~* ^/uploads/.*\.(php|php5|sh|pl|py|js)$ {
      deny all;
  }
  ```
* **HTTPS / SSL Gratis**: Di menu **Website** -> **Settings** -> **SSL**, Anda dapat mengaktifkan **Let's Encrypt** gratis hanya dengan satu-klik untuk memastikan pengiriman data absensi dan foto terenkripsi secara aman.
