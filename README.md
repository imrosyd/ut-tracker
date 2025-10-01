<div align="center">

# 📊 UT Tracker

### 🎓 Dashboard Pembelajaran Modern untuk Mahasiswa Universitas Terbuka

*Pantau mata kuliah, progres tutorial, praktik, dan target UAS dalam satu aplikasi web statis yang ringan dan elegan.*

[![Repo](https://img.shields.io/badge/GitHub-imrosyd/ut--tracker-181717?logo=github&logoColor=white)](https://github.com/imrosyd/ut-tracker)
[![HTML](https://img.shields.io/badge/HTML-5-e34f26?logo=html5&logoColor=white)](https://developer.mozilla.org/docs/Web/HTML)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![LocalStorage](https://img.shields.io/badge/Storage-LocalStorage-8b5cf6)](https://developer.mozilla.org/docs/Web/API/Window/localStorage)

[🚀 Quick Start](#-quick-start) • [📖 Features](#-features) • [🛠️ Dev Setup](#%EF%B8%8F-local-installation-dengan-nodejs) • [☁️ Deployment](#%EF%B8%8F-deployment) • [📂 Structure](#-project-structure)

---

</div>

## 🎯 What is UT Tracker?

UT Tracker adalah **aplikasi web statis** untuk mahasiswa Universitas Terbuka. Aplikasi ini membantu mengelola daftar mata kuliah, memantau presensi & diskusi tutorial, mencatat tugas/latihan praktik, dan menyiapkan target UAS — semuanya tersimpan aman di perangkat melalui `localStorage`.

## ✨ Features

<table>
<tr>
<td width="50%">

### 🧭 Produktivitas Akademik
- Tambah mata kuliah dengan berbagai skema penilaian
- Hitung otomatis total mata kuliah, total SKS, dan IP
- Checklist modul UAS yang menyesuaikan jumlah SKS (1 SKS = 3 modul)
- Kolom catatan diskusi per sesi tutorial

</td>
<td width="50%">

### 🎨 Pengalaman Modern
- Antarmuka minimalis dan responsif
- Mode terang/gelap mengikuti sistem & bisa diganti manual
- Navigasi mata kuliah dan filter kategori secara instan
- Transisi halus serta penyimpanan data lokal tanpa backend

</td>
</tr>
</table>

## 🚀 Quick Start

### Cara tercepat (tanpa instalasi tambahan)
1. Buka repositori resmi: **https://github.com/imrosyd/ut-tracker**
2. Klik **Code → Download ZIP** atau jalankan:
   ```bash
   git clone https://github.com/imrosyd/ut-tracker.git
   cd ut-tracker
   ```
3. Masuk ke folder `public/` dan buka `index.html` di peramban modern (Chrome/Edge/Firefox/Safari)

> Semua CSS & JavaScript sudah siap pakai di `public/assets`, jadi tidak perlu perintah build jika hanya ingin langsung menggunakan aplikasinya.

### Menjalankan server lokal (opsional)
```bash
npx serve public -l 3333   # Akses di http://localhost:3333
```
> Ingin permanen? Instal global `serve` (`npm install -g serve`) lalu jalankan `serve public -l 3333`.

## 🛠️ Local Installation dengan Node.js

Gunakan langkah berikut bila Anda ingin memodifikasi Tailwind atau JavaScript. Prasyarat: **Node.js 16+** dan **npm**.

```bash
git clone https://github.com/imrosyd/ut-tracker.git
cd ut-tracker

npm install        # jalankan sekali di awal
npm run build:css  # ulangi setiap kali mengubah kelas Tailwind
npx serve public -l 3333   # jalankan server lokal (opsional)
```

Perintah `npm run build:css` akan menghasilkan ulang `public/assets/css/tailwind.build.css` dari `assets/css/tailwind.css` menggunakan Tailwind CLI + PostCSS.

## 📦 Project Structure

```
ut-tracker/
├── public/
│   ├── index.html                # Halaman utama
│   └── assets/
│       ├── css/
│       │   ├── tailwind.build.css # CSS hasil build Tailwind
│       │   └── styles.css         # Gaya tambahan
│       ├── js/
│       │   ├── app.js             # Logika aplikasi
│       │   └── theme-init.js      # Inisialisasi tema awal
│       └── favicon.svg            # Ikon aplikasi
├── assets/
│   └── css/
│       └── tailwind.css           # Sumber utama Tailwind (untuk build)
├── package.json
├── postcss.config.js
└── tailwind.config.js
```

## 🛠️ Available Scripts

| Perintah | Deskripsi |
|----------|-----------|
| `npm run build:css` | Mengompilasi Tailwind (`assets/css/tailwind.css`) menjadi `public/assets/css/tailwind.build.css` |

> ⚠️ Jalankan `npm run build:css` setiap kali Anda menambah/mengubah kelas Tailwind sebelum deploy.

## ☁️ Deployment

UT Tracker adalah aplikasi statis sehingga dapat di-host di Vercel, Netlify, Firebase Hosting, GitHub Pages, dan layanan sejenis. Alur umumnya:

```bash
npm install
npm run build:css
```

### ▲ Vercel
1. `npm install`
2. `npm run build:css`
3. Buat project baru di Vercel, pilih repo `https://github.com/imrosyd/ut-tracker`
4. Build settings:
   - **Build Command**: `npm run build:css`
   - **Output Directory**: `public`
5. Deploy → Vercel akan melayani `public/index.html` dan semua konten di `public/assets`

### 🌐 Netlify
1. `npm install`
2. `npm run build:css`
3. Di Netlify pilih **New site from Git** lalu hubungkan repositori `https://github.com/imrosyd/ut-tracker`
4. Build settings:
   - **Build command**: `npm run build:css`
   - **Publish directory**: `public`
5. Deploy → Netlify otomatis menyajikan `public/`

> 💡 Selama `npm run build:css` dijalankan sebelum deploy, semua aset sudah berada di `public/` tanpa langkah tambahan.

## 🤝 Contributing

Ide fitur, laporan bug, atau perbaikan dokumentasi sangat diterima. Silakan gunakan tab *Issues* atau ajukan pull request langsung di repo resmi: https://github.com/imrosyd/ut-tracker.

## 📄 License

Belum ada lisensi resmi. Untuk penggunaan lebih lanjut atau kolaborasi, silakan hubungi pemilik repositori.

<div align="center">

---

### ⭐ Beri ⭐ pada repo jika UT Tracker membantu studi Anda!

**Dibuat dengan ❤️ oleh [imrosyd](https://github.com/imrosyd)**

</div>
