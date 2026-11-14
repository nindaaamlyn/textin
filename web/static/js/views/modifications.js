/* O*NET source attribution, license notices, modifications and validation status. */
import { logo } from "../components/ui.js";
import { footer } from "../components/shell.js";

export const viewModifications = () => `<div class="min-h-screen bg-slate-50">
  <header class="border-b border-slate-100 bg-white">
    <div class="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
      ${logo()}<a href="#/" class="text-sm font-semibold text-brand-600 hover:underline">Kembali ke Beranda</a>
    </div>
  </header>
  <main data-page class="mx-auto max-w-4xl space-y-5 px-4 py-8 lg:px-8">
    <section class="card p-6 sm:p-8">
      <h1 class="text-3xl font-extrabold">Modifications and Disclaimers (Modifikasi dan Penyangkalan)</h1>
      <p class="mt-3 leading-relaxed text-mute">Halaman ini menjelaskan sumber materi, lisensi, perubahan yang dibuat oleh tim TEXIN, dan batas validasi aplikasi. TEXIN merupakan proyek independen dan bukan produk resmi atau layanan yang disetujui oleh USDOL/ETA.</p>
    </section>

    <section class="card space-y-3 p-6">
      <h2 class="text-xl font-bold">1. O*NET 31.0 Database — CC BY 4.0</h2>
      <p class="text-sm leading-relaxed text-mute">TEXIN menggunakan sebagian informasi pekerjaan dari O*NET 31.0 Database, yang disponsori oleh U.S. Department of Labor, Employment and Training Administration (USDOL/ETA), dan dikembangkan oleh National Center for O*NET Development.</p>
      <p class="text-sm leading-relaxed">This application includes information from the O*NET 31.0 Database by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA). Used under the <a class="font-semibold text-brand-600 underline" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0 license</a>. O*NET® is a trademark of USDOL/ETA. The TEXIN project team has modified some of this information. USDOL/ETA has not approved, endorsed, or tested these modifications.</p>
      <p class="text-sm">Sumber data: <a class="font-semibold text-brand-600 underline" href="https://www.onetcenter.org/database.html" target="_blank" rel="noopener noreferrer">O*NET 31.0 Database</a>. Ketentuan lisensi: <a class="font-semibold text-brand-600 underline" href="https://www.onetcenter.org/license_db.html" target="_blank" rel="noopener noreferrer">O*NET 31.0 Database Content License</a>.</p>
      <p class="text-sm leading-relaxed text-mute">Perubahan tim TEXIN pada data database meliputi pemilihan dan penyajian ulang sebagian atribut pekerjaan, pemeriksaan kelengkapan, serta penerjemahan sebagian judul, label, dan deskripsi ke Bahasa Indonesia. Data sumber tetap berasal dari O*NET 31.0 Database; terjemahan dan penyajiannya merupakan adaptasi tim TEXIN.</p>
    </section>

    <section class="card space-y-3 p-6">
      <h2 class="text-xl font-bold">2. O*NET Career Exploration Tools / Interest Profiler Short Form</h2>
      <p class="text-sm leading-relaxed text-mute">TEXIN mempertahankan 60 aktivitas kerja dari O*NET Interest Profiler Short Form. Materi diterjemahkan dan diadaptasi ke Bahasa Indonesia. Karena ada perubahan materi, lisensi yang digunakan adalah O*NET Tools Developer License, bukan lisensi CC BY 4.0 untuk database.</p>
      <p class="text-sm leading-relaxed">This application includes information from the O*NET Career Exploration Tools by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA). Used under the <a class="font-semibold text-brand-600 underline" href="https://www.onetcenter.org/license_toolsdev.html" target="_blank" rel="noopener noreferrer">O*NET Tools Developer License</a>. O*NET® is a trademark of USDOL/ETA. The TEXIN project team has modified all or some of this information. USDOL/ETA has not approved, endorsed, or tested these modifications.</p>
      <p class="text-sm">Sumber materi: <a class="font-semibold text-brand-600 underline" href="https://www.onetcenter.org/tools.html" target="_blank" rel="noopener noreferrer">O*NET Career Exploration Tools</a> dan <a class="font-semibold text-brand-600 underline" href="https://www.onetcenter.org/IP.html" target="_blank" rel="noopener noreferrer">O*NET Interest Profiler</a>. Ketentuan lisensi: <a class="font-semibold text-brand-600 underline" href="https://www.onetcenter.org/license_toolsdev.html" target="_blank" rel="noopener noreferrer">O*NET Tools Developer License</a>.</p>
    </section>

    <section class="card space-y-3 border-amber-200 bg-amber-50 p-6">
      <h2 class="text-xl font-bold">3. Pernyataan modifikasi dan pembatasan tanggung jawab</h2>
      <p class="text-sm leading-relaxed">The TEXIN project team has modified a portion of the O*NET® Career Exploration Tools. The U.S. Department of Labor, Employment and Training Administration (USDOL/ETA) has not approved, endorsed, or tested these modifications. As such, USDOL/ETA will not be liable to any third party or end-user for any damages arising out of or from the use or misuse of the modified O*NET Career Exploration Tools or any products incorporating or containing the modified O*NET Career Exploration Tools.</p>
      <p class="text-sm leading-relaxed text-mute">Terjemahan: Tim proyek TEXIN telah memodifikasi sebagian O*NET® Career Exploration Tools. USDOL/ETA tidak menyetujui, mendukung, atau menguji modifikasi tersebut. Oleh karena itu, USDOL/ETA tidak bertanggung jawab kepada pihak ketiga atau pengguna akhir atas kerugian apa pun yang timbul dari penggunaan atau penyalahgunaan materi O*NET Career Exploration Tools yang telah dimodifikasi, atau produk yang memasukkan atau memuat materi tersebut.</p>
      <p class="text-xs leading-relaxed text-mute">Pemberitahuan ini disertakan sesuai ketentuan modifikasi pada O*NET Tools Developer License. Lihat Section 3(b)(3) pada tautan lisensi di atas.</p>
    </section>

    <section class="card space-y-3 p-6">
      <h2 class="text-xl font-bold">4. Bentuk adaptasi yang dilakukan tim TEXIN</h2>
      <ul class="list-disc space-y-2 pl-5 text-sm leading-relaxed text-mute">
        <li>60 aktivitas kerja diterjemahkan dari Bahasa Inggris ke Bahasa Indonesia; jumlah butir dipertahankan.</li>
        <li>Lima pilihan respons ditampilkan dalam Bahasa Indonesia dan dikodekan 0–4.</li>
        <li>Enam dimensi RIASEC masing-masing dihitung dari 10 butir dengan rentang skor 0–40.</li>
        <li>Butir disajikan secara berselang-seling menurut dimensi RIASEC.</li>
        <li>Profil pengguna dicocokkan dengan profil pekerjaan melalui implementasi Pearson Correlation milik TEXIN.</li>
        <li>Pemeringkatan, filter Job Zone, tampilan persentase, alasan kecocokan, dan visualisasi merupakan pengolahan aplikasi TEXIN, bukan hasil resmi O*NET.</li>
      </ul>
    </section>

    <section class="card space-y-3 border-amber-200 bg-amber-50 p-6">
      <h2 class="text-xl font-bold">5. Status validasi dan batas penggunaan</h2>
      <p class="text-sm leading-relaxed">Adaptasi Bahasa Indonesia pada versi ini belum menjalani validasi psikometrik formal pada populasi sasaran siswa SMA/SMK di Indonesia. Karena itu, TEXIN belum boleh diperlakukan sebagai instrumen psikometri yang tervalidasi di Indonesia, alat diagnosis, penentu kelulusan, atau dasar tunggal keputusan pendidikan dan pekerjaan.</p>
      <p class="text-sm leading-relaxed">O*NET Tools Developer License mensyaratkan studi validasi terhadap produk yang mengandung materi adaptasi untuk memastikan hasilnya valid bagi tujuan, audiens, dan pengguna yang dituju. Pemberitahuan lisensi dan pengujian perangkat lunak tidak menggantikan studi validasi tersebut. Tim TEXIN perlu menyelesaikan studi validasi formal sebelum mengklaim produk tervalidasi atau memperkenalkan produk adaptasi sebagai produk yang telah memenuhi persyaratan validasi.</p>
      <p class="text-sm leading-relaxed">Hasil TEXIN hanya bahan eksplorasi awal dan perlu didiskusikan dengan guru BK/konselor. Pengguna harus mempertimbangkan minat, kemampuan, pengalaman, dan informasi pendidikan/pekerjaan lain. Informasi pekerjaan berasal dari sumber O*NET Amerika Serikat dan tidak otomatis menggambarkan persyaratan atau pasar kerja Indonesia.</p>
      <p class="text-sm leading-relaxed">Karena prototipe pernah tersedia secara daring sebelum studi validasi selesai, tim perlu meminta klarifikasi tertulis dari National Center for O*NET Development mengenai penanganan status produk yang telah diperkenalkan.</p>
      <p class="text-sm">Rencana penelitian: <a class="font-semibold text-brand-600 underline" href="https://www.onetcenter.org/license_toolsdev.html" target="_blank" rel="noopener noreferrer">O*NET Tools Developer License</a>; acuan adaptasi: <a class="font-semibold text-brand-600 underline" href="https://members.intestcom.org/files/guideline_test_adaptation_2ed.pdf" target="_blank" rel="noopener noreferrer">ITC Guidelines for Translating and Adapting Tests</a>.</p>
    </section>

    <section class="card space-y-3 p-6">
      <h2 class="text-xl font-bold">6. Penyangkalan jaminan dan status independen</h2>
      <p class="text-sm leading-relaxed text-mute">O*NET Tools Developer License Section 5 menyatakan bahwa, sejauh diizinkan hukum, pemberi lisensi menyediakan materi berlisensi dalam keadaan “as-is” dan “as-available”, tanpa jaminan tersurat atau tersirat, termasuk jaminan akurasi atau kesesuaian untuk tujuan tertentu. Lihat <a class="font-semibold text-brand-600 underline" href="https://www.onetcenter.org/license_toolsdev.html" target="_blank" rel="noopener noreferrer">Section 5 — Disclaimer of Warranties and Limitation of Liability</a>.</p>
      <p class="text-sm leading-relaxed text-mute">TEXIN dikembangkan secara independen. O*NET® adalah merek dagang USDOL/ETA. Penyebutan O*NET hanya menunjukkan sumber materi yang digunakan; USDOL/ETA tidak menyetujui, mendukung, mengesahkan, atau menguji TEXIN maupun perubahan yang dibuat tim proyek.</p>
    </section>
  </main>
  ${footer()}
</div>`;
