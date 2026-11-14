> **Status revisi (14 November 2026):** perbaikan pemberitahuan lisensi O*NET dan rencana validasi sudah di-commit pada `52b81f4` (branch `main`) dan berhasil di-deploy ke Production `https://textin-sooty.vercel.app/`. Workflow GitHub Actions untuk commit tersebut berstatus **Success**. Halaman `#/modifikasi`, pemberitahuan sebelum asesmen (`#/tes`), dan awal kuis (`#/kuis`) sudah diperiksa melalui screenshot Production. **Validasi psikometrik formal terhadap adaptasi Bahasa Indonesia belum dilakukan; aplikasi tetap dibatasi sebagai prototipe eksplorasi karier dan penggunaan lebih lanjut perlu mempertimbangkan ketentuan O*NET Tools Developer License.**

# crs-onet — texin, find your career

Sistem rekomendasi karier untuk siswa SMA berbasis data O*NET 31.0 (capstone project). Siswa menjawab
60 pertanyaan minat (RIASEC, O*NET Interest Profiler Short Form) dan mendapat sepuluh karier paling cocok
beserta alasan, kompetensi, pendidikan, dan jaringan karier terkait.

Metode: Content-Based Filtering. TEXIN menghitung korelasi Pearson antara enam skor RIASEC siswa dan
profil minat pekerjaan. Hanya korelasi positif yang ditampilkan sebagai rekomendasi; urutan nilai yang
sama dipecahkan berdasarkan kode O*NET-SOC agar hasil deterministik. Persentase adalah 100 × korelasi,
bukan probabilitas keberhasilan kerja atau ukuran validitas psikometrik.

**Catatan validasi:** 60 butir O*NET Interest Profiler Short Form telah diterjemahkan dan diadaptasi ke
Bahasa Indonesia, tetapi adaptasi ini belum menjalani validasi psikometrik formal pada populasi siswa
SMA/SMK Indonesia. Gunakan hasil hanya sebagai bahan eksplorasi, bukan instrumen psikometri tervalidasi,
diagnosis, atau dasar tunggal keputusan pendidikan/pekerjaan. Rincian adaptasi dan penyangkalan tersedia
di halaman website **Modifikasi dan Penyangkalan** (`#/modifikasi`).

## Menjalankan di komputer sendiri

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
cp .env.example .env          # isi seperlunya, boleh kosong
.venv/bin/uvicorn web.app:app --reload --env-file .env     # http://127.0.0.1:8000
```

Windows: ganti `.venv/bin/` dengan `.venv\Scripts\`, `python3` dengan `py`, dan `cp` dengan `Copy-Item`.

- Tes: `.venv/bin/python -m unittest discover tests`
- Setelah mengubah class Tailwind: `npm install` (sekali), lalu `npm run css`. Hasilnya
  (`web/static/tailwind.css`) ikut di-commit, jadi hosting tidak butuh Node.js.

## Pengaturan

Di lokal diisi di `.env`, di Vercel di Settings → Environment Variables (lalu redeploy). Jangan pernah
commit isinya.

| Variabel | Untuk |
|---|---|
| `DATABASE_URL` | Postgres (Neon). **Wajib di Vercel**; tanpa itu situs sengaja gagal jalan (lihat log Vercel). Di lokal kosong = `data/crs.sqlite3` |
| `ADMIN_EMAIL` | Satu-satunya akun admin |
| `ADMIN_PASSWORD` | Membuat akun admin saat pertama dipakai; boleh dihapus setelahnya |
| `SMTP_USER`, `SMTP_PASSWORD` | Gmail + App Password untuk email lupa password. Kosong = fitur tidak ditampilkan |
| `SITE_URL` | Alamat situs untuk link di email, mis. `https://texin.vercel.app`. **Wajib** agar Lupa password aktif (kecuali di lokal) |
| `ADMIN_TOKEN` | Ekspor feedback anonim: `/api/admin/feedback.csv?token=...` |

App Password Gmail: aktifkan Verifikasi 2 Langkah, lalu buat di https://myaccount.google.com/apppasswords.

## Fitur akun

- Daftar dan masuk dengan email + password (disimpan sebagai hash scrypt). Sesi 12 jam, atau 30 hari
  dengan "Ingat saya". Sepuluh password salah memblokir email itu 15 menit.
- Tes yang sedang dikerjakan, hasil, riwayat, dan feedback mengikuti akun ke perangkat mana pun.
- **Ubah Password** (menu samping) dan **Lupa password?** (link email, 30 menit, sekali pakai).
- **Admin** (`#/admin`, hanya untuk `ADMIN_EMAIL`): daftar user dengan pencarian, reset password
  sementara, dan semua feedback dengan Unduh CSV / Cetak PDF. Bagi selain admin, halaman ini 404.

## Memasang di Vercel

1. Buat proyek di Neon dan salin connection string (`postgresql://...`).
2. Di Vercel: **Add New → Project**, pilih repo ini (`pyproject.toml` menunjuk ke `web/app.py`).
3. Isi pengaturan di atas, minimal `DATABASE_URL`. Tabel dibuat otomatis.

Hosting Python lain (Render, Railway): `pip install -r requirements.txt`, lalu
`uvicorn web.app:app --host 0.0.0.0 --port $PORT`.

## Isi repo

| Path | Isi |
|---|---|
| `web/app.py` | Server FastAPI (semua endpoint) |
| `web/static/` | Tampilan: `index.html`, `tailwind.css` hasil bangun, gambar, `js/` (`main.js`, `views/` per halaman) |
| `crs/recommender.py`, `crs/service.py` | Pearson Correlation dan isi halaman hasil |
| `crs/questionnaire.py` | 60 butir minat dan skor RIASEC |
| `crs/accounts.py`, `crs/storage.py`, `crs/mailer.py` | Akun, basis data (SQLite/Postgres), email |
| `crs/i18n/`, `data/` | Terjemahan dan tabel O*NET 31.0 |
| `tests/` | Tes otomatis |

## Atribusi, lisensi, dan modifikasi

### O*NET 31.0 Database — CC BY 4.0

This application includes information from the O*NET 31.0 Database by the U.S. Department of Labor,
Employment and Training Administration (USDOL/ETA). Used under the
[CC BY 4.0 license](https://creativecommons.org/licenses/by/4.0/). O*NET® is a trademark of USDOL/ETA.
The TEXIN project team has modified some of this information. USDOL/ETA has not approved, endorsed,
or tested these modifications.

Sumber: [O*NET 31.0 Database](https://www.onetcenter.org/database.html).
Ketentuan: [O*NET 31.0 Database Content License](https://www.onetcenter.org/license_db.html).

Perubahan proyek pada data ini meliputi penerjemahan judul dan deskripsi pekerjaan ke Bahasa Indonesia,
pemilihan dan penyajian ulang sebagian atribut pekerjaan, serta penyesuaian label untuk antarmuka TEXIN.

### O*NET Career Exploration Tools / Interest Profiler Short Form — O*NET Tools Developer License

TEXIN mempertahankan 60 butir aktivitas kerja O*NET Interest Profiler Short Form, tetapi menerjemahkan butir ke Bahasa Indonesia dan mengadaptasi penyajian respons serta pengolahan hasil. Karena materi Career Exploration Tools diterjemahkan/diubah, lisensi yang relevan adalah O*NET Tools Developer License, bukan CC BY 4.0 yang digunakan untuk database pekerjaan.

**Atribusi dan pemberitahuan modifikasi:**

> This application includes information from the O*NET Career Exploration Tools by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA). Used under the O*NET Tools Developer License. O*NET® is a trademark of USDOL/ETA. The TEXIN project team has modified all or some of this information. USDOL/ETA has not approved, endorsed, or tested these modifications.

**Pemberitahuan pembatasan tanggung jawab yang diminta lisensi:**

> The TEXIN project team has modified a portion of the O*NET® Career Exploration Tools. The U.S. Department of Labor, Employment and Training Administration (USDOL/ETA) has not approved, endorsed, or tested these modifications. As such, USDOL/ETA will not be liable to any third party or end-user for any damages arising out of or from the use or misuse of the modified O*NET Career Exploration Tools or any products incorporating or containing the modified O*NET Career Exploration Tools.

Sumber materi: [O*NET Career Exploration Tools](https://www.onetcenter.org/tools.html) dan [O*NET Interest Profiler](https://www.onetcenter.org/IP.html).  
Lisensi: [O*NET Tools Developer License](https://www.onetcenter.org/license_toolsdev.html).

Materi yang dilisensikan disediakan “as-is” dan “as-available” sejauh diizinkan hukum; rujuk Section 5, **Disclaimer of Warranties and Limitation of Liability**, pada [O*NET Tools Developer License](https://www.onetcenter.org/license_toolsdev.html). Pemberitahuan lengkap dan terjemahan Indonesianya ada pada [`NOTICE_O_NET.md`](NOTICE_O_NET.md).

**Status validasi:** adaptasi Bahasa Indonesia belum menjalani studi validasi formal pada populasi siswa SMA/SMK Indonesia. Produk belum boleh disebut sebagai instrumen psikometri yang tervalidasi di Indonesia. O*NET Tools Developer License mensyaratkan studi validasi terhadap produk yang memuat materi adaptasi. Karena prototipe pernah tersedia daring sebelum studi selesai, tim perlu meminta klarifikasi tertulis dari National Center for O*NET Development mengenai penanganan status produk yang telah diperkenalkan. Pemberitahuan lisensi tidak menggantikan studi validasi.

**Bentuk adaptasi yang dilakukan:**
- 60 aktivitas kerja diterjemahkan ke Bahasa Indonesia.
- Lima label respons digunakan dan dikodekan 0–4.
- Enam dimensi RIASEC masing-masing dihitung dari 10 butir (rentang skor 0–40).
- Butir disajikan secara berselang-seling.
- Profil pengguna dibandingkan dengan profil pekerjaan menggunakan implementasi Pearson Correlation TEXIN.
- Pemeringkatan, filter Job Zone, persentase, alasan kecocokan, dan visualisasi merupakan pengolahan TEXIN, bukan keluaran resmi O*NET.

**Batas penggunaan:** hasil hanya untuk eksplorasi awal dan diskusi dengan guru BK/konselor. Bukan diagnosis, bukan tes psikologi resmi tervalidasi di Indonesia, dan bukan dasar tunggal keputusan pendidikan atau pekerjaan.

Lihat pemberitahuan lengkap pada [`NOTICE_O_NET.md`](NOTICE_O_NET.md), panduan pengguna [`PANDUAN_PENGGUNA_TEXIN.md`](PANDUAN_PENGGUNA_TEXIN.md), dan rencana validasi [`RENCANA_VALIDASI_PSIKOMETRIK_TEXIN.md`](RENCANA_VALIDASI_PSIKOMETRIK_TEXIN.md). Halaman website `#/tes` menampilkan pemberitahuan sebelum asesmen dan pada halaman pertanyaan, dengan tautan **Modifications and Disclaimers (Modifikasi dan Penyangkalan)**; halaman `#/modifikasi` memuat uraian lengkap.

## Pengujian otomatis

Pengujian lokal:

```bash
.venv/bin/python -m unittest discover -s tests -v
```

Pengujian SQLite dan API berjalan secara lokal. Sepuluh tes kontrak PostgreSQL akan dilewati jika
`TEST_DATABASE_URL` tidak diisi. Untuk menguji PostgreSQL, gunakan database scratch khusus (bukan
production), lalu jalankan:

```bash
TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/texin_test" \
  .venv/bin/python -m unittest tests.test_storage -v
```

GitHub Actions pada `.github/workflows/tests.yml` menyiapkan PostgreSQL service dan menjalankan seluruh
suite, termasuk tes kontrak PostgreSQL, pada setiap push dan pull request.
