/* The test: instructions, the 60 questions, the interest summary and the analysis screen. */
import { h, icon, bar, toast, CheckList } from "../components/ui.js";
import { radar } from "../components/charts.js";
import { appShell, stepper } from "../components/shell.js";
import {
  S,
  CONFIG,
  save,
  clearTest,
  sessionExpired,
  answered,
  total,
  hasResult,
  typeLabel,
} from "../state.js";
import { api } from "../api.js";
import { go, render } from "../router.js";
import { forgetHistory } from "./history.js";
import { pushProgress, stopProgress } from "../sync.js";

export function viewTes() {
  const plans = CONFIG.plans
    .map(
      (p, k) =>
        `<option value="${k}" ${k === S.plan ? "selected" : ""}>${h(p.label)}</option>`,
    )
    .join("");
  const rules = [
    "Tidak ada jawaban benar atau salah.",
    "Jawab sesuai minat kamu yang sebenarnya, jangan pikirkan gaji atau pendidikan yang dibutuhkan.",
    "Durasi sekitar 10–15 menit.",
    "Hasil akan digunakan untuk merekomendasikan karier yang sesuai untuk kamu.",
  ];
  return appShell(
    "tes",
    `${stepper(0)}
    <div class="card p-6 md:p-8">
      <h1 class="text-2xl font-extrabold">Tes Minat Karier</h1>
      <p class="mt-2 text-mute">Kamu akan menjawab 60 pertanyaan tentang aktivitas yang mungkin kamu suka lakukan dalam pekerjaan.</p>
      <div class="mt-5">${CheckList(rules)}</div>
      <div class="mt-6"><label class="label" for="plan">Rencana pendidikanmu</label>
        <select id="plan" class="field max-w-md">${plans}</select>
        <p class="mt-1.5 text-xs text-mute">Dipakai untuk menyaring pekerjaan yang butuh pendidikan lebih tinggi dari rencanamu.</p></div>
      <p class="mt-5 text-xs text-mute">Hasilnya bahan eksplorasi, bukan keputusan atau tes psikologi resmi. Jawaban dan hasilmu disimpan di akunmu supaya bisa dibuka lagi.</p>
      <button class="btn-primary mt-7 w-full py-3 text-base sm:w-auto" data-act="start">${answered() && !hasResult() ? "Lanjutkan Tes" : "Mulai Tes Minat Karier"} ${icon("arrow")}</button>
      ${answered() ? `<button class="btn-link ml-0 mt-3 block text-sm sm:ml-4 sm:inline" data-act="restart">Mulai dari awal</button>` : ""}
    </div>`,
  );
}

/* The question page is drawn once; after that only its parts change (the options, the progress
   bar, the question card), so answering does not redraw and flash the whole page. */
const Options = (chosen) =>
  CONFIG.responses
    .map(
      (label, value) => `
    <button data-answer="${value}" class="group flex flex-1 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition duration-150 active:scale-[.97] sm:flex-col sm:gap-2 sm:px-2 sm:py-4 sm:text-center ${chosen === value ? "border-brand-500 bg-brand-50" : "border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50/50"}">
      <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition duration-150 ${chosen === value ? "bg-brand-500 text-white" : "bg-slate-100 text-mute group-hover:bg-brand-100 group-hover:text-brand-700"}">${value + 1}</span>
      <span class="text-sm font-semibold leading-tight">${h(label)}</span>
    </button>`,
    )
    .join("");

const Question = (item) => `
      <span class="chip">Kategori: ${h(typeLabel(item.type))}</span>
      <p class="mt-4 text-sm text-mute">${h(CONFIG.prompt)}</p>
      <h1 class="mt-2 flex min-h-[4.5rem] items-center text-2xl font-extrabold leading-snug md:min-h-20 md:text-3xl">${h(item.text)}</h1>
      <div id="quiz-options" class="mt-6 flex flex-col gap-2.5 sm:flex-row">${Options(S.answers[item.number])}</div>
      <p class="mt-4 hidden text-xs text-mute sm:block">Tips: tekan angka 1–5 di keyboard untuk menjawab, panah kiri/kanan untuk pindah.</p>`;

const CARD = "card q-card mt-5 p-6 md:p-8";

export function viewKuis() {
  const n = total();
  if (S.pos >= n) S.pos = n - 1;
  return appShell(
    "tes",
    `${stepper(1)}
    <div class="mb-2 flex items-center justify-between text-sm font-semibold"><span id="quiz-count"></span><span id="quiz-percent" class="text-mute"></span></div>
    <div class="h-2.5 w-full overflow-hidden rounded-full bg-brand-50"><div id="quiz-bar" class="h-full rounded-full bg-brand-500 transition-all duration-500" style="width:${(100 * answered()) / n}%"></div></div>
    <div class="${CARD}" id="question">${Question(CONFIG.items[S.pos])}</div>
    <div class="mt-5 flex justify-between gap-3">
      <button class="btn-ghost" id="quiz-prev" data-act="prev">${icon("back")} Kembali</button>
      <button class="btn-primary" id="quiz-next" data-act="next"><span id="quiz-next-label"></span> ${icon("arrow")}</button>
    </div>`,
  );
}

/** Fill in what changes around the question: the counter, the progress bar and the two buttons. */
export function paintQuiz() {
  const next = document.getElementById("quiz-next");
  if (!next) return false; // the question page is not on screen
  const n = total(),
    count = answered(),
    last = S.pos === n - 1;
  const chosen = S.answers[CONFIG.items[S.pos].number];
  document.getElementById("quiz-count").textContent =
    `Pertanyaan ${S.pos + 1} dari ${n}`;
  document.getElementById("quiz-percent").textContent =
    `${Math.round((100 * count) / n)}% terjawab`;
  document.getElementById("quiz-bar").style.width = `${(100 * count) / n}%`;
  document.getElementById("quiz-prev").disabled = S.pos === 0;
  next.disabled = chosen === undefined || (last && count < n);
  document.getElementById("quiz-next-label").textContent = last
    ? "Lihat Ringkasan"
    : "Selanjutnya";
  return true;
}

let swapping = false; // a question is sliding out: ignore answers until the next one is in

/** Slide the current question out and the one at S.pos in, from the side it comes from. */
function swapQuestion(direction) {
  const card = document.getElementById("question");
  if (!card) return render();
  swapping = true;
  card.className = `${CARD} ${direction > 0 ? "q-out-left" : "q-out-right"}`;
  setTimeout(() => {
    swapping = false;
    if (!card.isConnected) return; // the student left the page meanwhile
    card.innerHTML = Question(CONFIG.items[S.pos]);
    card.className = `${CARD} ${direction > 0 ? "q-in-right" : "q-in-left"}`;
    paintQuiz();
  }, 140);
}

/** A click or key press on one of the five answers. */
export function onAnswer(value) {
  if (swapping) return;
  const item = CONFIG.items[S.pos];
  S.answers[item.number] = value;
  S.result = null;
  save();
  pushProgress();
  const options = document.getElementById("quiz-options");
  if (!options) return render();
  options.innerHTML = Options(value); // show the choice, leave the rest of the page alone
  paintQuiz();
  clearTimeout(onAnswer.timer);
  onAnswer.timer = setTimeout(() => {
    if (CONFIG.items[S.pos] === item) step(1);
  }, 280);
}

function step(delta) {
  const n = total();
  if (swapping) return;
  if (delta > 0 && S.answers[CONFIG.items[S.pos].number] === undefined) return;
  if (delta > 0 && S.pos === n - 1) {
    if (answered() === n) go("ringkasan");
    return;
  }
  const before = S.pos;
  S.pos = Math.max(0, Math.min(n - 1, S.pos + delta));
  if (S.pos === before) return;
  save();
  pushProgress();
  swapQuestion(delta);
}

function localProfile() {
  const sums = Object.fromEntries(CONFIG.types.map((t) => [t.type, 0]));
  CONFIG.items.forEach((it) => {
    sums[it.type] += S.answers[it.number] ?? 0;
  });
  const rows = CONFIG.types.map((t) => ({
    type: t.type,
    label: typeLabel(t.type),
    short: t.nickname,
    percent: Math.round((100 * sums[t.type]) / 40),
  }));
  const flat = new Set(Object.values(sums)).size === 1;
  return {
    rows,
    sorted: [...rows].sort((a, b) => b.percent - a.percent),
    flat,
  };
}

export function viewRingkasan() {
  const p = localProfile();
  const warn = p.flat
    ? `<div class="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Keenam skor minatmu sama persis, sehingga profilmu tidak bisa dicocokkan dengan pekerjaan mana pun. Coba ulangi kuis dan jawab sesuai yang benar-benar kamu rasakan.</div>`
    : "";
  return appShell(
    "tes",
    `${stepper(2)}
    <h1 class="text-3xl font-extrabold">Hasil Minat Kamu</h1>
    <p class="mt-1 text-mute">Berdasarkan jawaban 60 pertanyaan, berikut adalah profil minat karier kamu.</p>
    <div class="mt-6 grid gap-5 md:grid-cols-2">
      <div class="card">${radar(p.rows)}</div>
      <div class="card space-y-4">${p.sorted
        .map(
          (row) => `
        <div><div class="mb-1.5 flex justify-between text-sm font-semibold"><span>${h(row.label)}</span><span class="text-brand-600">${row.percent}%</span></div>${bar(row.percent)}</div>`,
        )
        .join("")}
      </div>
    </div>${warn}
    <div class="mt-6 flex justify-between gap-3">
      <button class="btn-ghost" data-act="review">${icon("back")} Kembali</button>
      ${p.flat ? `<button class="btn-primary" data-act="restart">Ulangi Kuis</button>` : `<a href="#/analisis" class="btn-primary">Lanjut ke Analisis ${icon("arrow")}</a>`}
    </div>`,
  );
}

const ANALYSIS = [
  "Memetakan profil minat kamu",
  "Membandingkan dengan 878 profil pekerjaan O*NET",
  "Menghitung kecocokan dengan Pearson Correlation",
  "Menyusun rekomendasi karier terbaik",
];

export function viewAnalisis() {
  return appShell(
    "tes",
    `${stepper(2)}
    <div class="card mx-auto max-w-xl p-8 text-center">
      <div class="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-brand-100 border-t-brand-500"></div>
      <h1 class="mt-5 text-2xl font-extrabold">Sedang Menganalisis Data Kamu…</h1>
      <div class="mt-5" id="analysis-bar">${bar(0)}</div>
      <ul class="mt-6 space-y-3 text-left text-sm" id="analysis-steps">${ANALYSIS.map((text) => `<li class="flex items-center gap-3 text-slate-400"><span class="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100"></span>${h(text)}</li>`).join("")}</ul>
    </div>`,
  );
}

export async function runAnalysis() {
  const answers = CONFIG.items.map((it) => S.answers[it.number]);
  const request = api("/api/recommend", {
    answers,
    max_job_zone: CONFIG.plans[S.plan].max_job_zone,
  });
  const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  try {
    for (let k = 0; k < ANALYSIS.length; k++) {
      await pause(550);
      if (k === ANALYSIS.length - 1) await request;
      const row = document.querySelectorAll("#analysis-steps li")[k];
      if (!row) return; // the student left the page
      row.className = "flex items-center gap-3 font-semibold text-ink";
      row.firstElementChild.className =
        "flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white";
      row.firstElementChild.innerHTML = icon("check", "h-3.5 w-3.5");
      document.getElementById("analysis-bar").innerHTML = bar(
        (100 * (k + 1)) / ANALYSIS.length,
      );
    }
    const result = await request;
    await pause(350);
    if (result.cards.length && !result.result_id) {
      // computed, but the server no longer knows who is signed in: it was not kept in Riwayat
      sessionExpired();
      toast("Sesi masukmu berakhir. Masuk lagi untuk melihat dan menyimpan hasilmu.");
      return go("masuk", true);
    }
    stopProgress();
    S.result = { ...result, at: new Date().toISOString() };
    S.feedbackSent = false;
    forgetHistory();
    save();
    go(result.cards.length ? "hasil" : "ringkasan", true); // Back must not run the analysis again
  } catch (error) {
    toast(error.message);
    go("ringkasan");
  }
}

function restart() {
  clearTest();
  pushProgress(0);
  if (location.hash === "#/tes") render();
  else go("tes");
}

export const actions = {
  start() {
    S.plan = Number(document.getElementById("plan").value);
    if (hasResult()) {
      S.answers = {};
      S.pos = 0;
      S.result = null;
    }
    const open = CONFIG.items.findIndex(
      (it) => S.answers[it.number] === undefined,
    );
    S.pos = open === -1 ? total() - 1 : open;
    save();
    pushProgress();
    go("kuis");
  },
  restart,
  prev() {
    step(-1);
  },
  next() {
    step(1);
  },
  review() {
    S.pos = total() - 1;
    save();
    go("kuis");
  },
};

/** Keys on the question page: 1-5 answer, arrows move. */
export function onKeydown(event) {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.repeat) return; // a key held down must not answer one question after another
  if (event.key >= "1" && event.key <= "5") onAnswer(Number(event.key) - 1);
  else if (event.key === "ArrowLeft") step(-1);
  else if (event.key === "ArrowRight") step(1);
}
