<div align="center">

# 📊 UT Tracker

### 🎓 Dashboard Pembelajaran Modern untuk Mahasiswa Universitas Terbuka

*Kelola mata kuliah, progres tutorial, praktik, dan target UAS dalam satu aplikasi web statis yang elegan.*

[![HTML](https://img.shields.io/badge/HTML-5-e54d26?logo=html5&logoColor=white)](https://developer.mozilla.org/docs/Web/HTML)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![LocalStorage](https://img.shields.io/badge/Storage-LocalStorage-8b5cf6)](https://developer.mozilla.org/docs/Web/API/Window/localStorage)
[![Status](https://img.shields.io/badge/Status-Static%20Web-blue)](#-deployment)

[🚀 Quick Start](#-quick-start) • [📖 Features](#-features) • [🖥️ Localhost 3333](#%EF%B8%8F-local-installation-port-3333) • [☁️ Deployment](#%EF%B8%8F-deployment) • [📂 Project Structure](#-project-structure)

---

</div>

## 🎯 What is UT Tracker?

UT Tracker adalah **aplikasi web statis** untuk memantau perjalanan studi di Universitas Terbuka. Aplikasi ini menyatukan pencatatan mata kuliah, progres tutorial (presensi, diskusi, tugas), kegiatan praktik, dan perencanaan UAS — lengkap dengan mode terang/gelap yang mengikuti sistem dan dapat diganti manual.

<div align="center">

### ✨ Didesain untuk
**📚 Mahasiswa UT** • **🗂️ Pengelola Studi Mandiri** • **📈 Pemantau IP**

</div>

## ✨ Features

<table>
<tr>
<td width="50%">

### 🧭 Manajemen Akademik
- Tambah mata kuliah dengan skema penilaian beragam
- Hitung otomatis total mata kuliah, SKS, dan IP
- Checklist modul UAS berdasarkan jumlah SKS
- Catatan diskusi per sesi tutorial

</td>
<td width="50%">

### 🎨 Pengalaman Modern
- Antar muka responsif dan minimalis
- Mode gelap/terang sesuai preferensi sistem
- Transisi halus dan navigasi kursus dinamis
- Penyimpanan lokal menggunakan `localStorage`

</td>
</tr>
</table>

## 🚀 Quick Start

### 1️⃣ Clone Repositori
```bash
git clone https://github.com/imrosyd/ut-tracker.git
cd ut-tracker
```

### 2️⃣ Instal Dependensi & Build CSS
```bash
npm install
npm run build:css
```

### 3️⃣ Jalankan Secara Lokal
- Buka langsung `public/index.html` di peramban **atau**
- Jalankan server statis:
  ```bash
  npx serve public -l 3333
  ```

> 🔁 **Tips:** Pasang global `serve` (`npm install -g serve`) jika ingin perintah permanen `serve public -l 3333`.

## 🖥️ Local Installation (Port 3333)

Gunakan langkah berikut bila ingin selalu memakai port `http://localhost:3333`:

```bash
npm install           # sekali di awal
npm run build:css     # ulangi saat mengubah kelas Tailwind
npx serve public -l 3333
```
## 📦 Project Structure

```
ut-tracker/
├── public/
│   ├── index.html              # Halaman utama
│   └── assets/
│       ├── css/
│       │   ├── tailwind.build.css # CSS hasil build Tailwind
│       │   └── styles.css          # Gaya kustom tambahan
│       ├── js/
│       │   ├── app.js              # Logika aplikasi
│       │   └── theme-init.js       # Inisialisasi tema awal
│       └── favicon.svg             # Ikon aplikasi
├── assets/
│   └── css/
│       └── tailwind.css            # Sumber utama Tailwind
├── package.json
├── postcss.config.js
└── tailwind.config.js
```

## 🛠️ Available Scripts

| Perintah | Deskripsi |
|----------|-----------|
| `npm run build:css` | Mengompilasi Tailwind (`assets/css/tailwind.css`) menjadi `public/assets/css/tailwind.build.css` |

> ⚠️ **Wajib** jalankan `npm run build:css` setiap kali menambahkan atau mengubah kelas Tailwind sebelum deploy.

## ☁️ Deployment

UT Tracker dapat di-deploy di berbagai layanan hosting statis. Pastikan `npm run build:css` dijalankan sehingga `public/assets/css/tailwind.build.css` terbaru tersedia.

### ▲ Vercel
1. `npm install`
2. `npm run build:css`
3. Buat project baru di Vercel dan hubungkan ke repositori ini.
4. Setelan build:
   - **Build Command**: `npm run build:css`
   - **Output Directory**: `public`
5. Deploy – Vercel otomatis menyajikan `public/` beserta `public/assets`.

### 🌐 Netlify
1. `npm install`
2. `npm run build:css`
3. Pada dashboard Netlify, pilih **New site from Git** dan hubungkan repositori.
4. Setelan build:
   - **Build command**: `npm run build:css`
   - **Publish directory**: `public`
5. Deploy – Netlify akan melayani `public/index.html` beserta `public/assets`.

### 🔥 Firebase Hosting
1. `npm install`
2. `npm run build:css`
3. Instal CLI Firebase: `npm install -g firebase-tools`
4. `firebase login`
5. Inisialisasi hosting: `firebase init hosting`
   - Pilih proyek Firebase
   - **Public directory**: `public`
   - Jawab *No* untuk SPA rewrite (kecuali ingin single-page routing)
6. Deploy: `firebase deploy`

> 💡 **Catatan:** Selama `npm run build:css` dijalankan sebelum deploy, seluruh aset siap pakai berada di `public/`.

## 🤝 Contributing

Saran perbaikan, laporan bug, atau ide fitur baru sangat diterima. Buka *issue* atau pull request di repositori ini.

## 📄 License

Belum ada lisensi resmi yang ditentukan. Silakan hubungi pemilik repositori untuk penggunaan lebih lanjut.

<div align="center">

---

### ⭐ Star repositori ini jika UT Tracker bermanfaat!

**Dibuat dengan ❤️ oleh [imrosyd](https://github.com/imrosyd)**

</div>