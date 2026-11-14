# Catatan Perbaikan TEXIN

## Perubahan kode
1. Rekomendasi hanya memasukkan pekerjaan dengan korelasi Pearson lebih besar dari 1e-12. Nilai nol, negatif, NaN, dan noise numerik yang sangat kecil tidak dimasukkan.
2. Urutan untuk nilai korelasi yang sama dibuat deterministik berdasarkan kode O*NET-SOC secara menaik.
3. Halaman hasil menangani kondisi ketika profil berhasil dihitung tetapi tidak ada kandidat dengan korelasi positif.
4. Halaman publik `#/modifikasi` memisahkan atribusi O*NET 31.0 Database (CC BY 4.0) dari O*NET Career Exploration Tools (O*NET Tools Developer License), menautkan sumber dan lisensi, serta menjelaskan perubahan dan status validasi.
5. Tautan “Modifikasi dan Penyangkalan” ditambahkan pada layar beranda dan footer.
6. GitHub Actions ditambahkan untuk menjalankan suite pengujian dengan PostgreSQL 16.

## Verifikasi lokal
- 69 tes terdeteksi.
- 59 tes lulus.
- 10 tes PostgreSQL dilewati karena `TEST_DATABASE_URL` tidak tersedia pada lingkungan lokal.
- Seluruh 19 berkas JavaScript lolos pemeriksaan sintaks Node.js.

Catatan: hasil lokal 59 lulus/10 skipped di atas berasal dari lingkungan TANPA
TEST_DATABASE_URL. Ini bukan hasil CI. Pada GitHub Actions commit dasar,
suite dengan PostgreSQL 16 telah lulus (69 tes, tidak skipped menurut bukti terdokumentasi).
Workflow GitHub Actions commit revisi 52b81f4 juga berstatus Success (run 43541659140);
log rinci jumlah hasil run revisi tidak ditampilkan pada bukti screenshot yang tersedia.
Secara terpisah, 10 tes PostgreSQL pada Neon testing telah dijalankan dan lulus (10/10);
database testing tersebut bukan database PostgreSQL sementara yang dipakai GitHub Actions.

## Revisi pemberitahuan lisensi O*NET dan rencana validasi

- Memperjelas pemisahan lisensi O*NET 31.0 Database (CC BY 4.0) dan O*NET Career Exploration Tools (O*NET Tools Developer License).
- Menambahkan teks atribusi dan modifikasi Tools Developer License, termasuk pernyataan pembatasan tanggung jawab USDOL/ETA sesuai Section 3(b)(3).
- Menambahkan referensi penyangkalan jaminan Section 5.
- Menampilkan pemberitahuan pada layar pengarahan asesmen (`#/tes`) dan halaman pertanyaan (`#/kuis`), serta memperluas halaman `#/modifikasi`.
- Menambahkan `NOTICE_O_NET.md`, `PANDUAN_PENGGUNA_TEXIN.md`, dan `RENCANA_VALIDASI_PSIKOMETRIK_TEXIN.md`.
- Tidak mengubah 60 butir, label respons, struktur RIASEC, atau algoritma rekomendasi.
- Revisi ini berasal dari commit dasar `5bb3a80` dan sudah di-commit sebagai `52b81f4`
  pada branch `main` tanggal 14 November 2026; workflow GitHub Actions berstatus Success.
- Screenshot Vercel Production menunjukkan status Ready / Current untuk commit `52b81f4`.
- Pemberitahuan lisensi telah diperiksa pada `#/modifikasi`, sebelum tes (`#/tes`),
  dan pada halaman pertanyaan pertama (`#/kuis`).
- Adaptasi Bahasa Indonesia belum menjalani validasi psikometrik formal; pemberitahuan
  dan pengujian perangkat lunak tidak menggantikan studi validasi yang dipersyaratkan lisensi.
