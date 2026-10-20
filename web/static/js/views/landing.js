/* The public landing page, one component per section. */
import { h, icon, logo, ring, bar } from "../components/ui.js";
import { footer } from "../components/shell.js";
import { S, CONFIG } from "../state.js";

const FEATURES = [
  [
    "target",
    "Berbasis Minat",
    "60 pertanyaan aktivitas kerja dari O*NET Interest Profiler, mengukur enam tipe minat RIASEC.",
  ],
  [
    "spark",
    "Analisis Kecocokan",
    "Profil minatmu dibandingkan dengan 878 profil pekerjaan O*NET memakai Pearson Correlation.",
  ],
  [
    "graph",
    "Jaringan Karier",
    "Jelajahi karier lain yang berhubungan dengan rekomendasimu, lengkap dengan kompetensi dan pendidikannya.",
  ],
];
const HOW = [
  [
    "quiz",
    "Jawab 60 pertanyaan",
    "Seberapa suka kamu melakukan berbagai aktivitas kerja, dari sangat tidak suka sampai sangat suka. Sekitar 10–15 menit.",
  ],
  [
    "target",
    "Lihat profil minatmu",
    "Jawabanmu dijumlahkan menjadi skor enam tipe minat RIASEC dan ditampilkan dalam satu diagram.",
  ],
  [
    "spark",
    "Dapatkan rekomendasi",
    "Profilmu dibandingkan dengan 878 profil pekerjaan. Sepuluh yang paling cocok muncul dengan persentase dan alasannya.",
  ],
  [
    "graph",
    "Jelajahi lebih jauh",
    "Buka kompetensi, pendidikan, dan jaringan karier terkait untuk tiap rekomendasi.",
  ],
];
const DEMO_PROFILE = [
  ["Investigatif", 92],
  ["Konvensional", 78],
  ["Sosial", 41],
]; // the sample card in the hero

// Visitors without a session go through the login page first.
const startRoute = () => (S.user ? "tes" : "masuk");

const AccountButtons = () =>
  S.user
    ? `<a href="#/dasbor" class="btn-primary">Dasbor</a>`
    : `<a href="#/masuk" class="btn-ghost">Masuk</a><a href="#/daftar" class="btn-primary">Daftar</a>`;

const Header = () => `
<header class="sticky top-0 z-30 border-b border-slate-100 bg-white/85 backdrop-blur">
  <div class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
    ${logo()}
    <nav class="hidden items-center gap-8 text-sm font-semibold md:flex">
      <a class="hover:text-brand-600" data-scroll="beranda" href="#beranda">Beranda</a>
      <a class="hover:text-brand-600" data-scroll="fitur" href="#fitur">Fitur</a>
      <a class="hover:text-brand-600" data-scroll="tentang" href="#tentang">Tentang</a>
      <a class="hover:text-brand-600" data-scroll="cara-kerja" href="#cara-kerja">Cara Kerja</a>
      <a class="hover:text-brand-600" data-scroll="karier" href="#karier">Karier</a>
    </nav>
    <div class="flex items-center gap-2">${AccountButtons()}</div>
  </div>
</header>`;

const Hero = () => `
<section id="beranda" class="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white">
  <div class="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 md:grid-cols-2 md:py-24">
    <div class="animate-rise">
      <h1 class="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">Temukan Karier yang Tepat Berdasarkan Minat Kamu</h1>
      <p class="mt-5 max-w-lg text-base leading-relaxed text-mute">Jawab 60 pertanyaan sederhana tentang aktivitas kerja yang mungkin kamu sukai, lalu dapatkan rekomendasi karier berdasarkan kecocokan minatmu dengan ratusan profil pekerjaan.</p>
      <div class="mt-7 flex flex-wrap items-center gap-4">
        <a href="#/${startRoute()}" class="btn-primary px-6 py-3 text-base">Mulai Sekarang ${icon("arrow")}</a>
        <span class="text-sm text-mute">Gratis · sekitar 10–15 menit</span>
      </div>
    </div>
    <div class="relative mx-auto w-full max-w-md">
      <div class="absolute -left-6 -top-6 h-28 w-28 rounded-3xl bg-brand-200/60 blur-2xl"></div>
      <div class="card animate-float relative p-6 shadow-xl shadow-brand-500/10">
        <div class="flex items-center justify-between">
          <div><p class="text-xs font-semibold text-mute">Contoh hasil</p><p class="text-lg font-bold">Ilmuwan Data</p></div>
          ${ring(96, 68)}
        </div>
        <div class="mt-5 space-y-3">${DEMO_PROFILE.map(
          ([name, value]) => `
          <div><div class="mb-1 flex justify-between text-xs font-semibold"><span>${name}</span><span class="text-mute">${value}%</span></div>${bar(value)}</div>`,
        ).join("")}
        </div>
        <div class="mt-5 flex flex-wrap gap-2"><span class="chip">Statistikawan</span><span class="chip">Analis Riset Operasi</span></div>
      </div>
      <div class="card absolute -bottom-6 -right-3 hidden w-40 p-4 text-center shadow-lg sm:block">
        <p class="text-2xl font-extrabold text-brand-500">878</p><p class="text-xs text-mute">profil pekerjaan</p>
      </div>
    </div>
  </div>
</section>`;

const Features = () => `
<section id="fitur" class="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
  <h2 class="text-center text-3xl font-extrabold">Fitur</h2>
  <p class="mx-auto mt-2 max-w-xl text-center text-mute">Dari pertanyaan sampai rekomendasi yang bisa kamu telusuri.</p>
  <div class="mt-10 grid gap-5 md:grid-cols-3">${FEATURES.map(
    ([ic, name, text]) => `
    <div class="card transition hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-500/10">
      <span class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">${icon(ic, "h-6 w-6")}</span>
      <h3 class="text-lg font-bold">${name}</h3><p class="mt-2 text-sm leading-relaxed text-mute">${h(text)}</p>
    </div>`,
  ).join("")}
  </div>
</section>`;

const HowItWorks = () => `
<section id="cara-kerja" class="scroll-mt-20">
  <div class="mx-auto max-w-6xl px-5 py-16">
    <h2 class="text-center text-3xl font-extrabold">Cara Kerja</h2>
    <p class="mx-auto mt-2 max-w-xl text-center text-mute">Empat langkah dari pertanyaan pertama sampai karier yang bisa kamu telusuri.</p>
    <ol class="relative mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <span class="absolute left-[12.500%] right-[12.500%] top-7 hidden border-t-2 border-dashed border-brand-200 lg:block" aria-hidden="true"></span>
      ${HOW.map(
        ([ic, name, text], k) => `
      <li class="relative text-center">
        <span class="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lg shadow-brand-500/30">${icon(ic, "h-6 w-6")}
          <span class="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-extrabold text-brand-600 ring-2 ring-brand-200">${k + 1}</span></span>
        <h3 class="mt-4 font-bold">${name}</h3><p class="mx-auto mt-1.5 max-w-60 text-sm leading-relaxed text-mute">${h(text)}</p>
      </li>`,
      ).join("")}
    </ol>
    <p class="mx-auto mt-10 max-w-2xl rounded-xl bg-slate-50 px-4 py-3 text-center text-xs leading-relaxed text-mute ring-1 ring-slate-200">Kecocokan dihitung dengan Pearson Correlation antara enam skor minatmu dan profil minat tiap pekerjaan di O*NET, cara yang juga dipakai O*NET Interest Profiler.</p>
  </div>
</section>`;

const About = () => `
<section id="tentang" class="scroll-mt-20 bg-slate-50">
  <div class="mx-auto max-w-6xl px-5 py-16">
    <h2 class="text-3xl font-extrabold">Tentang texin</h2>
    <p class="mt-3 max-w-3xl leading-relaxed text-mute">texin membantu siswa SMA mengenali minat kariernya dan menjelajahi pekerjaan yang sejalan dengan minat itu. Pertanyaan dan data pekerjaannya berasal dari O*NET 31.0, basis data pekerjaan milik Departemen Tenaga Kerja Amerika Serikat. Hasilnya bahan eksplorasi, bukan keputusan atau tes psikologi resmi.</p>
    <h3 class="mt-8 font-bold">Enam tipe minat (RIASEC)</h3>
    <div class="mt-3 flex flex-wrap gap-2">${CONFIG.types.map((t) => `<span class="chip bg-white ring-1 ring-brand-100">${h(t.label)} · ${h(t.nickname)}</span>`).join("")}</div>
  </div>
</section>`;

const Careers = () => `
<section id="karier" class="scroll-mt-20 bg-slate-50"><div class="mx-auto max-w-6xl px-5 py-16">
  <h2 class="text-3xl font-extrabold">Karier</h2>
  <p class="mt-2 text-mute">Beberapa dari 878 karier yang bisa muncul di rekomendasimu.</p>
  <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">${CONFIG.samples
    .map(
      (c) => `
    <div class="card transition hover:-translate-y-1 hover:border-brand-200">
      <h3 class="font-bold">${h(c.title)}</h3><p class="mt-2 text-sm leading-relaxed text-mute">${h(c.description)}</p>
      <span class="chip mt-4">${h(c.job_zone_name.split(":")[1] || c.job_zone_name)}</span>
    </div>`,
    )
    .join("")}
  </div>
</div></section>`;

const CallToAction = () => `
<section class="mx-auto max-w-6xl px-5 py-16">
  <div class="rounded-3xl bg-brand-500 px-6 py-12 text-center text-white shadow-xl shadow-brand-500/30">
    <h2 class="text-2xl font-extrabold md:text-3xl">Siap menemukan karier yang cocok?</h2>
    <p class="mx-auto mt-2 max-w-md text-brand-100">Luangkan 10–15 menit untuk mengenal minatmu.</p>
    <a href="#/${startRoute()}" class="btn mt-6 bg-white px-6 py-3 text-base text-brand-600 hover:bg-brand-50">Mulai Tes Minat Karier ${icon("arrow")}</a>
  </div>
</section>`;

export const viewLanding = () => `<div class="bg-white">
  ${Header()}${Hero()}${Features()}${About()}${HowItWorks()}${Careers()}${CallToAction()}${footer()}</div>`;

/** A click on a menu link: scroll to the section without touching the hash, which belongs to the router. */
export function onScroll(id, event) {
  event.preventDefault();
  document.getElementById(id).scrollIntoView({ behavior: "smooth" });
}
