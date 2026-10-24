# crs-onet — texin, find your career

Sistem rekomendasi karier untuk siswa SMA berbasis data O*NET 31.0 (capstone project). Siswa menjawab
60 pertanyaan minat (RIASEC, O*NET Interest Profiler Short Form) dan mendapat sepuluh karier paling cocok
beserta alasan, kompetensi, pendidikan, dan jaringan karier terkait.

Metode: Content-Based Filtering. Skor minat siswa dibandingkan dengan profil minat tiap pekerjaan memakai
Pearson Correlation; "kecocokan" adalah korelasi itu dalam persen (negatif ditampilkan 0%).

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

## Atribusi

Aplikasi ini memuat informasi dari O*NET 31.0 Database dan O*NET Career Exploration Tools oleh
U.S. Department of Labor, Employment and Training Administration (USDOL/ETA), digunakan di bawah
lisensi CC BY 4.0 dan O*NET Tools Developer License. O*NET® adalah merek dagang USDOL/ETA.
Pengembang aplikasi ini telah mengubah sebagian informasi tersebut. USDOL/ETA tidak menyetujui,
mendukung, atau menguji perubahan ini.
