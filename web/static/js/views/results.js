/* Hasil Rekomendasi and the detail page of one career. */
import {
  h,
  icon,
  ring,
  bar,
  toast,
  CheckList,
  Meter,
  Note,
} from "../components/ui.js";
import { appShell, stepper } from "../components/shell.js";
import { S } from "../state.js";
import { api } from "../api.js";
import { go, render } from "../router.js";

export function viewHasil() {
  const cards = S.result.cards
    .map(
      (c, k) => `
    <article class="card flex flex-col gap-4 transition hover:border-brand-200 hover:shadow-md sm:flex-row sm:items-center" style="animation-delay:${k * 40}ms">
      <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${k < 3 ? "bg-brand-500 text-white" : "bg-brand-50 text-brand-700"} text-sm font-extrabold">${k + 1}</span>
      <div class="min-w-0 flex-1">
        <h2 class="text-lg font-bold">${h(c.title)}</h2>
        <p class="mt-1 text-sm leading-relaxed text-mute">${h(c.description)}</p>
        <div class="mt-3 flex flex-wrap gap-2"><span class="chip">${h(c.fit_label)}</span><span class="chip bg-slate-100 text-mute">${h(c.job_zone_name)}</span></div>
      </div>
      <div class="flex shrink-0 items-center gap-4 sm:flex-col sm:gap-2">${ring(c.match)}
        <a href="#/karier/${c.code}" class="btn-ghost px-4 py-2">Lihat Detail</a></div>
    </article>`,
    )
    .join("");
  return appShell(
    "hasil",
    `${stepper(4)}
    <h1 class="text-3xl font-extrabold">Rekomendasi Karier Kamu</h1>
    <p class="mt-1 text-mute">Berikut adalah karier yang paling sesuai dengan minat kamu.</p>
    <div class="mt-3">${Note("Kecocokan = korelasi Pearson antara enam skor minatmu dan profil minat pekerjaan, dalam persen. Anggap sebagai bahan eksplorasi, bukan keputusan.")}</div>
    <div class="mt-5 space-y-4">${cards}</div>
    <div class="mt-6 flex flex-wrap gap-3"><a href="#/jaringan" class="btn-primary">${icon("graph")} Lihat Jaringan Karier</a>
      <a href="#/feedback" class="btn-ghost">Beri Feedback</a><button class="btn-link text-sm" data-act="restart">Ulangi tes</button></div>`,
  );
}

const TABS = [
  "Deskripsi",
  "Mengapa Cocok",
  "Skill yang Dibutuhkan",
  "Karier Serupa",
];
let detailTab = 0;
const detailCache = {};

export function viewKarier(code) {
  const o = detailCache[code];
  if (!o) {
    api(`/api/occupations/${encodeURIComponent(code)}`)
      .then((data) => {
        detailCache[code] = data;
        render();
      })
      .catch((error) => {
        toast(error.message);
        go("hasil");
      });
    return appShell(
      "hasil",
      `<p class="py-16 text-center text-mute">Memuat detail karier…</p>`,
    );
  }
  const match = S.result.cards.find((c) => c.code === code);
  const panels = [
    () => `<p class="leading-relaxed">${h(o.description)}</p>
      <p class="mt-4 text-sm"><span class="font-bold">Persiapan:</span> ${h(o.job_zone_name)}</p>
      ${
        o.education && o.education.length
          ? `<h3 class="mt-6 font-bold">Pendidikan yang dibutuhkan</h3>
        <p class="mb-3 text-xs text-mute">Persentase pekerja di bidang ini (data Amerika Serikat) yang menyebut jenjang tersebut diperlukan.</p>
        <div class="space-y-3">${o.education.map((e) => Meter(e.label, `${e.percent}%`, e.percent)).join("")}</div>`
          : ""
      }`,
    () =>
      match
        ? `${CheckList(match.reasons)}
      <h3 class="mt-6 font-bold">Perbandingan minat (RIASEC)</h3>
      <div class="mb-3 mt-1 flex gap-4 text-xs text-mute"><span class="flex items-center gap-1.5"><i class="h-2.5 w-2.5 rounded-full bg-brand-500"></i>Kamu</span><span class="flex items-center gap-1.5"><i class="h-2.5 w-2.5 rounded-full bg-slate-400"></i>Pekerjaan ini</span></div>
      <div class="space-y-4">${match.comparison.map((p) => `<div><div class="mb-1 flex justify-between text-sm font-semibold"><span>${h(p.label)}</span><span class="text-mute">${p.student}% · ${p.job}%</span></div><div class="space-y-1">${bar(p.student)}${bar(p.job, "bg-slate-400")}</div></div>`).join("")}</div>`
        : `<p class="text-sm text-mute">Karier ini tidak termasuk sepuluh rekomendasimu, jadi tidak ada perbandingan minat. Kamu melihatnya karena berhubungan dengan salah satu rekomendasimu.</p>`,
    () => `<p class="mb-4 text-xs text-mute">Tingkat menunjukkan seberapa tinggi penguasaan yang dituntut pekerjaan ini, pada skala 0 sampai 7.</p>
      <div class="space-y-3">${o.skills.map((s) => Meter(s.name, s.level.toFixed(1), (100 * s.level) / 7)).join("")}</div>
      ${o.work_styles && o.work_styles.length ? `<h3 class="mt-6 font-bold">Sifat kerja yang penting</h3><div class="mt-2 flex flex-wrap gap-2">${o.work_styles.map((w) => `<span class="chip">${h(w)}</span>`).join("")}</div>` : ""}
      ${o.software && o.software.length ? `<h3 class="mt-6 font-bold">Perangkat lunak yang banyak dipakai</h3><div class="mt-2 flex flex-wrap gap-2">${o.software.map((w) => `<span class="chip bg-slate-100 text-mute">${h(w)}</span>`).join("")}</div>` : ""}`,
    () => `<div class="grid gap-2.5 sm:grid-cols-2">${o.related.map((r) => `<a href="#/karier/${r.code}" class="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold transition hover:border-brand-300 hover:bg-brand-50">${h(r.title)}${icon("arrow", "h-4 w-4 text-brand-500")}</a>`).join("")}</div>
      <a href="#/jaringan/${code}" class="btn-primary mt-5">${icon("graph")} Lihat di Jaringan Karier</a>`,
  ];
  return appShell(
    "hasil",
    `
    <a href="#/hasil" class="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-mute hover:text-brand-600">${icon("back", "h-4 w-4")}Kembali ke Hasil Rekomendasi</a>
    <div class="card flex items-center justify-between gap-4 p-6">
      <div class="min-w-0"><h1 class="text-2xl font-extrabold md:text-3xl">${h(o.title)}</h1>
        <p class="mt-1 text-xs text-mute">Nama di O*NET: ${h(o.title_en)} (${h(o.code)})</p></div>
      ${match ? `<div class="text-center">${ring(match.match, 84)}<p class="mt-1 text-xs font-semibold text-mute">Kecocokan</p></div>` : ""}
    </div>
    <div class="mt-5 flex gap-1 overflow-x-auto border-b border-slate-200" role="tablist">${TABS.map(
      (name, k) => `
      <button role="tab" data-tab="${k}" class="whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition ${k === detailTab ? "border-brand-500 text-brand-600" : "border-transparent text-mute hover:text-ink"}">${name}</button>`,
    ).join("")}</div>
    <div class="card mt-5 animate-rise p-6">${panels[detailTab]()}</div>`,
  );
}

export const onTab = (index) => {
  detailTab = Number(index);
  render();
};
export const resetTab = () => {
  detailTab = 0;
};
