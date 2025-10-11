# 📊 UT Tracker

### 🎓 Dashboard Pembelajaran Modern untuk Mahasiswa Universitas Terbuka

*Pantau mata kuliah, progres tutorial, praktik, dan target UAS dalam satu aplikasi web statis yang ringan dan elegan.*

---

## 🎯 What is UT Tracker?

UT Tracker adalah **aplikasi web statis** untuk mahasiswa Universitas Terbuka. Aplikasi ini membantu mengelola daftar mata kuliah, memantau presensi & diskusi tutorial, mencatat tugas/latihan praktik, dan menyiapkan target UAS — semuanya tersimpan aman di perangkat melalui `localStorage`. Versi terbaru menghadirkan indikator progres belajar per mata kuliah beserta guarding yang memastikan aplikasi hanya dijalankan pada perangkat dengan layar lebar (desktop, laptop, atau tablet).

## ✨ Features

### 🧭 Produktivitas Akademik
- Tambah mata kuliah dengan berbagai skema penilaian
- Ringkasan Nilai Tutorial, Nilai UAS, Nilai Akhir, Nilai Huruf, dan Nilai Mutu
- Indikator progres belajar per mata kuliah (menggabungkan presensi, diskusi, tugas, praktik, dan modul UAS)
- Hitung otomatis total mata kuliah, total SKS, IP hingga statistik nilai tertinggi/terendah/rata-rata
- Checklist modul UAS yang menyesuaikan jumlah SKS (1 SKS = 3 modul)
- Kolom catatan diskusi per sesi tutorial

### 🎨 Pengalaman Modern
- Antarmuka minimalis dan responsif untuk layar lebar
- Mode terang/gelap mengikuti sistem & bisa diganti manual
- Navigasi mata kuliah dan filter kategori secara instan
- Transisi halus serta penyimpanan data lokal tanpa backend
- Desktop / tablet guard: saat dibuka di ponsel akan menampilkan pesan "Silakan buka di Laptop/PC/Tablet" beserta layar kosong yang aman

### 🔐 Privasi & Keamanan Data
- Semua input (presensi, diskusi, target nilai, catatan, dsb.) disimpan **hanya di penyimpanan lokal peramban** (`localStorage`).
- Data **tidak pernah dikirim** ke server mana pun ataupun layanan pihak ketiga. Anda tetap bisa menggunakan aplikasi ini secara offline setelah halaman dimuat.
- Menghapus riwayat peramban atau menjalankan mode penyamaran (incognito) akan menghapus data, sehingga disarankan menggunakan peramban reguler saat mencatat progres studi.

---

## 🛠️ Installation

### 1️⃣ Clone & Navigate
```bash
git clone https://github.com/imrosyd/ut-tracker.git
cd ut-tracker
```

### 2️⃣ Install Dependencies (for development)
Jika Anda ingin memodifikasi Tailwind atau JavaScript, Anda memerlukan Node.js 16+ dan npm.
```bash
npm install
```

---

## 💡 Usage

### 🌐 Web Interface
1.  Buka file `src/index.html` di peramban modern (Chrome/Edge/Firefox/Safari).
2.  Pastikan resolusi layar ≥ 768px agar tampilan utama tidak diblokir.
3.  Aplikasi siap digunakan. Semua data akan tersimpan di `localStorage` peramban Anda.

### 🔌 For Development
Jika Anda melakukan perubahan pada file `tailwind.css`, jalankan perintah berikut untuk membangun ulang file CSS:
```bash
npm run build:css
```
Perintah ini akan menghasilkan file `dist/css/tailwind.build.css`.

---

## 🚀 Deployment

UT Tracker adalah aplikasi statis sehingga dapat di-host di Vercel, Netlify, Firebase Hosting, GitHub Pages, dan layanan sejenis. Alur umumnya:

```bash
npm install
npm run build:css
# deploy seluruh isi repositori (terutama folder src/ dan dist/)
```

Pastikan untuk menyesuaikan pengaturan build di platform hosting Anda:
- **Build Command**: `npm run build:css`
- **Output/Publish Directory**: `src` (atau sesuaikan agar `index.html` menjadi halaman utama)

---

## ⚙️ Configuration

### Directory Structure
```
ut-tracker/
├── dist/
│   └── css/
│       └── tailwind.build.css
├── src/
│   ├── index.html
│   └── assets/
│       ├── css/
│       │   ├── tailwind.css
│       │   └── styles.css
│       ├── js/
│       │   ├── app.js
│       │   └── theme-init.js
│       └── images/
│           └── favicon.svg
├── package.json
├── package-lock.json
├── postcss.config.js
└── tailwind.config.js
```

### Available Scripts
| Perintah | Deskripsi |
|----------|-----------|
| `npm run build:css` | Mengompilasi Tailwind (`src/assets/css/tailwind.css`) menjadi `dist/css/tailwind.build.css` |

---

## 🤝 Contributing

Ide fitur, laporan bug, atau perbaikan dokumentasi sangat diterima. Silakan gunakan tab *Issues* atau ajukan pull request langsung di repo resmi: https://github.com/imrosyd/ut-tracker.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments
*   **Tailwind CSS** - Untuk framework CSS yang modern dan fleksibel.
*   **Heroicons** & **Feather Icons** - Untuk ikon-ikon yang digunakan di aplikasi.
