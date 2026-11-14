# Pemberitahuan Sumber, Lisensi, dan Modifikasi O*NET pada TEXIN

Dokumen ini menjadi rujukan pemberitahuan lisensi pada website, README, dan panduan pengguna TEXIN. Materi O*NET Database dan O*NET Career Exploration Tools menggunakan lisensi yang berbeda; keduanya tidak boleh dicampur.

## 1. O*NET 31.0 Database — CC BY 4.0

This application includes information from the O*NET 31.0 Database by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA). Used under the CC BY 4.0 license. O*NET® is a trademark of USDOL/ETA. The TEXIN project team has modified some of this information. USDOL/ETA has not approved, endorsed, or tested these modifications.

Sumber: https://www.onetcenter.org/database.html  
Lisensi: https://www.onetcenter.org/license_db.html  
Teks lisensi CC BY 4.0: https://creativecommons.org/licenses/by/4.0/

Perubahan oleh tim TEXIN pada data database meliputi pemilihan dan penyajian ulang atribut pekerjaan, pemeriksaan kelengkapan data, serta penerjemahan sebagian judul, label, dan deskripsi ke Bahasa Indonesia. Data sumber tetap berasal dari O*NET 31.0 Database; penyajian dan terjemahan merupakan adaptasi tim TEXIN.

## 2. O*NET Career Exploration Tools / Interest Profiler Short Form — O*NET Tools Developer License

### 2.1 Atribusi dan pemberitahuan modifikasi

Teks bahasa Inggris berikut dipertahankan agar rumusan atribusi lisensi dapat diperiksa:

> This application includes information from the O*NET Career Exploration Tools by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA). Used under the O*NET Tools Developer License. O*NET® is a trademark of USDOL/ETA. The TEXIN project team has modified all or some of this information. USDOL/ETA has not approved, endorsed, or tested these modifications.

Terjemahan untuk membantu pengguna Indonesia: Aplikasi ini memuat informasi dari O*NET Career Exploration Tools yang disediakan oleh U.S. Department of Labor, Employment and Training Administration (USDOL/ETA), digunakan berdasarkan O*NET Tools Developer License. O*NET® merupakan merek dagang USDOL/ETA. Tim proyek TEXIN telah mengubah sebagian informasi tersebut. USDOL/ETA tidak menyetujui, mendukung, atau menguji perubahan tersebut.

Sumber materi: https://www.onetcenter.org/tools.html dan https://www.onetcenter.org/IP.html  
Lisensi: https://www.onetcenter.org/license_toolsdev.html

### 2.2 Pemberitahuan pembatasan tanggung jawab yang diminta lisensi

Teks bahasa Inggris:

> The TEXIN project team has modified a portion of the O*NET® Career Exploration Tools. The U.S. Department of Labor, Employment and Training Administration (USDOL/ETA) has not approved, endorsed, or tested these modifications. As such, USDOL/ETA will not be liable to any third party or end-user for any damages arising out of or from the use or misuse of the modified O*NET Career Exploration Tools or any products incorporating or containing the modified O*NET Career Exploration Tools.

Terjemahan untuk membantu pengguna Indonesia: Tim proyek TEXIN telah memodifikasi sebagian O*NET® Career Exploration Tools. USDOL/ETA tidak menyetujui, mendukung, atau menguji modifikasi tersebut. Oleh karena itu, USDOL/ETA tidak bertanggung jawab kepada pihak ketiga atau pengguna akhir atas kerugian apa pun yang timbul dari penggunaan atau penyalahgunaan O*NET Career Exploration Tools yang telah dimodifikasi, atau produk apa pun yang memasukkan atau memuat materi yang telah dimodifikasi tersebut.

### 2.3 Pemberitahuan mengenai jaminan materi

O*NET Tools Developer License Section 5 menyatakan bahwa, sejauh diizinkan hukum, pemberi lisensi menyediakan materi berlisensi dalam keadaan “as-is” dan “as-available” serta tidak memberikan jaminan dalam bentuk apa pun, termasuk mengenai akurasi, kesesuaian untuk tujuan tertentu, bebas pelanggaran, atau ketiadaan kesalahan. Lihat teks lengkap Section 5 pada https://www.onetcenter.org/license_toolsdev.html. Pernyataan ini merujuk pada penyangkalan jaminan dari pemberi lisensi dan tidak menghapus tanggung jawab tim TEXIN atas penjelasan yang benar mengenai produknya.

## 3. Deskripsi perubahan yang dibuat tim TEXIN

TEXIN mempertahankan 60 butir aktivitas kerja dari O*NET Interest Profiler Short Form. Perubahan/adaptasi pada produk ini meliputi:

1. Penerjemahan teks aktivitas kerja dari Bahasa Inggris ke Bahasa Indonesia.
2. Penyajian pilihan respons dalam lima kategori Bahasa Indonesia: Sangat tidak suka, Tidak suka, Ragu-ragu, Suka, dan Sangat suka.
3. Pengkodean respons pada skala 0–4.
4. Pengelompokan 10 butir untuk masing-masing enam dimensi RIASEC dan penyajian butir secara berselang-seling.
5. Penjumlahan skor enam dimensi; setiap dimensi memiliki rentang 0–40.
6. Pengolahan profil pengguna dan pencocokan dengan profil pekerjaan menggunakan implementasi Pearson Correlation milik TEXIN.
7. Penyaringan Job Zone, pemeringkatan, tampilan persentase, alasan kecocokan, serta visualisasi yang merupakan fitur pengolahan aplikasi TEXIN, bukan hasil resmi O*NET.

Nama O*NET digunakan sebagai kata sifat untuk menyebut materi sumber, bukan sebagai nama atau dukungan terhadap produk TEXIN. TEXIN merupakan proyek independen.

## 4. Status validasi dan batas penggunaan

Adaptasi Bahasa Indonesia pada versi ini **belum menjalani studi validasi formal** pada populasi sasaran siswa SMA/SMK di Indonesia. Dengan demikian:

- Hasil TEXIN hanya untuk eksplorasi minat dan diskusi awal dengan guru BK/konselor.
- TEXIN bukan alat diagnosis, bukan tes psikologi resmi yang telah tervalidasi di Indonesia, dan bukan dasar tunggal keputusan pendidikan atau pekerjaan.
- Bukti pengujian perangkat lunak (unit test, integration test, PostgreSQL/Neon, atau CI) hanya menunjukkan fungsi teknis berjalan sesuai pengujian; bukti tersebut bukan bukti validitas atau reliabilitas psikometrik.
- Produk tidak boleh dinyatakan telah memenuhi seluruh persyaratan validasi O*NET Tools Developer License sebelum studi validasi produk selesai dan hasilnya mendukung tujuan, populasi, serta pengguna yang dituju.
- Karena prototipe pernah tersedia secara daring sebelum validasi formal, tim perlu meminta klarifikasi tertulis dari National Center for O*NET Development mengenai langkah yang tepat untuk status produk yang sudah pernah diperkenalkan. Pemberitahuan ini sendiri tidak menggantikan studi validasi.

Rencana tahapan penelitian tersedia pada `RENCANA_VALIDASI_PSIKOMETRIK_TEXIN.md`.

## 5. Penempatan pemberitahuan

Pemberitahuan dan tautan menuju halaman “Modifications and Disclaimers (Modifikasi dan Penyangkalan)” ditempatkan pada:

- Halaman `#/modifikasi`.
- Layar pengarahan `#/tes`, sebelum pengguna memulai asesmen.
- Halaman pertanyaan `#/kuis`, agar pemberitahuan tetap tampak ketika materi adaptasi digunakan.
- `README.md` dan panduan pengguna dalam paket source code.

## 6. Catatan versi

Revisi pemberitahuan lisensi dan rencana validasi berasal dari commit dasar `5bb3a8079037e78c9c35af5101aaaa54d57ece6b` dan telah di-commit pada `52b81f4` (branch `main`). Pembaruan dokumentasi berikutnya tercatat pada `1f7289b` tanggal 14 November 2026. GitHub Actions untuk `1f7289b` menunjukkan job `python-tests` berhasil, dan screenshot Vercel menunjukkan `1f7289b` sebagai deployment **Ready / Latest**, **Production / Current**. Pemberitahuan lisensi telah terverifikasi tampil pada `#/modifikasi`, `#/tes`, dan `#/kuis`. **Studi validasi psikometrik formal atas adaptasi 60 butir belum dilakukan**; pengujian teknis dan penayangan pemberitahuan tidak menggantikan studi tersebut.
