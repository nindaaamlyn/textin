/* Dasbor: where the student stands and the one next step. */
import { h, icon, bar } from "../components/ui.js";
import { appShell } from "../components/shell.js";
import { S, answered, total, hasResult } from "../state.js";

export function viewDasbor() {
  const n = answered(),
    done = hasResult();
  const status = done
    ? "Selesai"
    : n
      ? `${n} dari ${total()} terjawab`
      : "Belum dimulai";
  const top = done ? S.result.cards[0] : null;
  const action = done
    ? [
        "hasil",
        "Lihat Hasil Rekomendasi",
        "Tes kamu sudah selesai. Lihat rekomendasi kariermu atau jelajahi jaringan karier terkait.",
      ]
    : n
      ? [
          "kuis",
          "Lanjutkan Tes",
          "Tes kamu belum selesai. Lanjutkan dari pertanyaan terakhir.",
        ]
      : [
          "tes",
          "Ke Tes Minat Karier",
          "Mulai dengan tes minat karier: 60 pertanyaan, sekitar 10–15 menit.",
        ];
  return appShell(
    "dasbor",
    `
    <h1 class="text-3xl font-extrabold">Halo, ${h(S.user.name)}</h1>
    <p class="mt-1 text-mute">Selamat datang di texin.</p>
    <div class="mt-6 grid gap-4 sm:grid-cols-3">
      <div class="card"><p class="text-xs font-semibold text-mute">Tes minat karier</p><p class="mb-3 mt-1 font-bold">${status}</p>${bar(done ? 100 : (100 * n) / total())}</div>
      <div class="card"><p class="text-xs font-semibold text-mute">Minat terkuat</p><p class="mt-1 font-bold">${done ? h(S.result.profile[0].label) : "Belum ada"}</p></div>
      <div class="card"><p class="text-xs font-semibold text-mute">Rekomendasi teratas</p><p class="mt-1 font-bold">${top ? `${h(top.title)} · ${top.match}%` : "Belum ada"}</p></div>
    </div>
    <div class="card mt-5 flex flex-col items-start justify-between gap-4 bg-gradient-to-r from-brand-500 to-brand-600 text-white sm:flex-row sm:items-center">
      <p class="max-w-md text-sm leading-relaxed text-brand-50">${action[2]}</p>
      <a href="#/${action[0]}" class="btn shrink-0 bg-white text-brand-600 hover:bg-brand-50">${action[1]} ${icon("arrow")}</a>
    </div>`,
  );
}
