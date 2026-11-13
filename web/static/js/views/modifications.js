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
      <h1 class="text-3xl font-extrabold">Modifikasi dan Penyangkalan</h1>
      <p class="mt-3 leading-relaxed text-mute">Halaman ini menjelaskan sumber materi, lisensi, perubahan yang dibuat oleh tim TEXIN, serta batas validasi aplikasi. TEXIN merupakan proyek independen dan bukan produk resmi atau layanan yang disetujui oleh USDOL/ETA.</p>
    </section>

    <section class="card space-y-3 p-6">
      <h2 class="text-xl font-bold">1. O*NET 31.0 Database</h2>
      <p class="text-sm leading-relaxed text-mute">TEXIN menggunakan sebagian informasi pekerjaan dari O*NET 31.0 Database, yang disponsori oleh U.S. Department of Labor, Employment and Training Administration (USDOL/ETA), dan dikembangkan oleh National Center for O*NET Development.</p>
      <p class="text-sm leading-relaxed">This application includes information from the O*NET 31.0 Database by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA). Used under the <a class="font-semibold text-brand-600 underline" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0 license</a>. O*NET® is a trademark of USDOL/ETA. The TEXIN project team has modified some of this information. USDOL/ETA has not approved, endorsed, or tested these modifications.</p>
      <p class="text-sm">Sumber data: <a class="font-semibold text-brand-600 underline" href="https://www.onetcenter.org/database.html" target="_blank" rel="noopener noreferrer">O*NET 31.0 Database</a>. Ketentuan lisensi: <a class="font-semibold text-brand-600 underline" href="https://www.onetcenter.org/license_db.html" target="_blank" rel="noopener noreferrer">O*NET 31.0 Database Content License</a>.</p>
      <p class="text-sm leading-relaxed text-mute">Perubahan yang dibuat tim TEXIN mencakup penerjemahan judul dan deskripsi pekerjaan ke Bahasa Indonesia, pemilihan serta penyajian ulang sebagian atribut pekerjaan, dan penyesuaian label agar dapat dibaca oleh pengguna aplikasi. Data sumber tetap merupakan data O*NET; terjemahan dan penyajiannya merupakan hasil adaptasi proyek.</p>
    </section>

    <section class="card space-y-3 p-6">
      <h2 class="text-xl font-bold">2. O*NET Career Exploration Tools</h2>
      <p class="text-sm leading-relaxed text-mute">Kuesioner TEXIN mengadaptasi 60 aktivitas kerja dari O*NET Interest Profiler Short Form. Materi Career Exploration Tools digunakan berdasarkan O*NET Tools Developer License, bukan lisensi CC BY 4.0 untuk basis data.</p>
      <p class="text-sm leading-relaxed">This application includes information from the O*NET Career Exploration Tools by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA). Used under the <a class="font-semibold text-brand-600 underline" href="https://www.onetcenter.org/license_toolsdev.html" target="_blank" rel="noopener noreferrer">O*NET Tools Developer License</a>. O*NET® is a trademark of USDOL/ETA. The TEXIN project team has modified all or some of this information. USDOL/ETA has not approved, endorsed, or tested these modifications.</p>
      <p class="rounded-lg bg-amber-50 p-3 text-sm leading-relaxed text-ink">Status pemenuhan lisensi: syarat validasi produk pada O*NET Tools Developer License belum dapat dinyatakan selesai. Tim perlu menyelesaikan validasi produk sebelum menyatakan bahwa seluruh persyaratan lisensi telah dipenuhi.</p>
      <p class="text-sm">Sumber alat: <a class="font-semibold text-brand-600 underline" href="https://www.onetcenter.org/tools.html" target="_blank" rel="noopener noreferrer">O*NET Career Exploration Tools</a>. Informasi lisensi: <a class="font-semibold text-brand-600 underline" href="https://www.onetcenter.org/license_tools.html" target="_blank" rel="noopener noreferrer">Career Exploration Tools Content License</a> dan <a class="font-semibold text-brand-600 underline" href="https://www.onetcenter.org/license_toolsdev.html" target="_blank" rel="noopener noreferrer">O*NET Tools Developer License</a>.</p>
      <h3 class="pt-2 font-semibold">Bentuk adaptasi dalam TEXIN</h3>
      <div class="space-y-2 text-sm leading-relaxed text-mute">
        <p>• 60 aktivitas kerja diterjemahkan dari Bahasa Inggris ke Bahasa Indonesia.</p>
        <p>• Label jawaban disajikan dalam Bahasa Indonesia dengan lima pilihan, diberi skor 0–4.</p>
        <p>• Skor enam tipe RIASEC dijumlahkan; setiap tipe memiliki rentang skor 0–40.</p>
        <p>• Butir disajikan berselang-seling menurut tipe RIASEC.</p>
        <p>• Profil siswa dibandingkan dengan profil pekerjaan melalui implementasi korelasi Pearson milik TEXIN. Pemeringkatan, filter Job Zone, tampilan persentase, alasan kecocokan, dan visualisasi merupakan pengolahan aplikasi TEXIN, bukan hasil resmi O*NET.</p>
      </div>
    </section>

    <section class="card space-y-3 border-amber-200 bg-amber-50 p-6">
      <h2 class="text-xl font-bold">3. Status validasi dan batas penggunaan</h2>
      <p class="text-sm leading-relaxed">Terjemahan dan adaptasi kuesioner Bahasa Indonesia pada versi ini <strong>belum menjalani validasi psikometrik formal</strong> pada populasi sasaran siswa SMA/SMK di Indonesia. Karena itu, TEXIN belum boleh diperlakukan sebagai instrumen psikometri yang tervalidasi, alat diagnosis, penentu kelulusan, atau dasar tunggal keputusan pendidikan dan pekerjaan.</p>
      <p class="text-sm leading-relaxed">Hasil rekomendasi hanya bahan eksplorasi awal. Pengguna perlu mempertimbangkan minat, kemampuan, pengalaman, kondisi, konsultasi guru atau konselor, serta informasi pendidikan dan pekerjaan lain. Sebelum adaptasi ini digunakan sebagai instrumen asesmen resmi, tim pengembang perlu menyelesaikan telaah ahli, uji keterbacaan, uji coba pada populasi sasaran, serta evaluasi validitas dan reliabilitas sesuai lisensi dan praktik penelitian yang berlaku.</p>
    </section>

    <section class="card space-y-2 p-6">
      <h2 class="text-xl font-bold">4. Penyangkalan</h2>
      <p class="text-sm leading-relaxed text-mute">O*NET® adalah merek dagang USDOL/ETA. Penyebutan O*NET hanya menunjukkan sumber materi yang digunakan. USDOL/ETA tidak menyetujui, mendukung, mengesahkan, atau menguji TEXIN maupun perubahan yang dibuat tim proyek. TEXIN dikembangkan secara independen untuk tujuan eksplorasi karier.</p>
      <p class="text-sm leading-relaxed text-mute">Informasi pekerjaan berasal dari sumber O*NET Amerika Serikat dan tidak otomatis menggambarkan persyaratan, peluang, atau kondisi pasar kerja Indonesia. Periksa kembali informasi pendidikan, sertifikasi, regulasi, dan peluang kerja melalui sumber lokal yang relevan.</p>
    </section>
  </main>
  ${footer()}
</div>`;
