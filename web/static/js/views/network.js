/* Jaringan Karier: one career in the middle and the careers O*NET lists as related to it. */
import { h, toast, Note } from "../components/ui.js";
import { appShell } from "../components/shell.js";
import { S } from "../state.js";
import { api } from "../api.js";
import { go, render } from "../router.js";

const graphCache = {};
let graphPick = null;

export function viewJaringan(code) {
  const centre = code || S.result.cards[0].code;
  const g = graphCache[centre];
  if (!g) {
    api(`/api/network/${encodeURIComponent(centre)}`)
      .then((data) => {
        graphCache[centre] = data;
        graphPick = null;
        render();
      })
      .catch((error) => {
        toast(error.message);
        go("jaringan");
      });
    return appShell(
      "jaringan",
      `<p class="py-16 text-center text-mute">Memuat jaringan karier…</p>`,
    );
  }
  const mine = new Set(S.result.cards.map((c) => c.code));
  const place = (k) => {
    const angle = -Math.PI / 2 + (k * 2 * Math.PI) / g.nodes.length;
    return [50 + 39 * Math.cos(angle), 50 + 39 * Math.sin(angle)];
  };
  const lines = g.nodes
    .map((n, k) => {
      const [x, y] = place(k);
      return `<line x1="50" y1="50" x2="${x}" y2="${y}" stroke="${n.close ? "#5c9bff" : "#bfd6ff"}" stroke-width="${n.close ? 0.9 : 0.45}" stroke-linecap="round"/>`;
    })
    .join("");
  const nodes = g.nodes
    .map((n, k) => {
      const [x, y] = place(k);
      const picked = graphPick === n.code;
      return `<button data-pick="${n.code}" style="left:${x}%;top:${y}%" class="absolute w-[26%] -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 px-1.5 py-1.5 text-[10px] font-semibold leading-tight shadow-sm transition hover:z-10 hover:scale-105 sm:text-xs ${picked ? "border-brand-600 ring-4 ring-brand-200" : "border-brand-300"} ${mine.has(n.code) ? "bg-brand-100 text-brand-700" : "bg-white text-ink"}">${h(n.title)}</button>`;
    })
    .join("");
  const options = S.result.cards
    .map(
      (c) =>
        `<option value="${c.code}" ${c.code === centre ? "selected" : ""}>${h(c.title)}</option>`,
    )
    .join("");
  const pick = g.nodes.find((n) => n.code === graphPick);
  const panel = pick
    ? `<h3 class="font-bold">${h(pick.title)}</h3>
      <p class="mt-1 text-xs text-mute">${h(pick.job_zone_name)}</p>
      <p class="mt-2 text-sm">${pick.close ? "Hubungan dekat" : "Hubungan lebih jauh"} dengan ${h(g.centre.title)}${mine.has(pick.code) ? ", dan termasuk rekomendasimu." : "."}</p>
      <div class="mt-4 flex flex-wrap gap-2"><a href="#/jaringan/${pick.code}" class="btn-primary px-4 py-2">Jadikan pusat</a><a href="#/karier/${pick.code}" class="btn-ghost px-4 py-2">Lihat detail</a></div>`
    : `<h3 class="font-bold">Cara membaca</h3><p class="mt-2 text-sm text-mute">Klik salah satu karier untuk melihat hubungannya, lalu jadikan pusat untuk menjelajah lebih jauh.</p>`;
  return appShell(
    "jaringan",
    `
    <h1 class="text-3xl font-extrabold">Jaringan Karier Terkait</h1>
    <p class="mt-1 text-mute">Visualisasi hubungan antar karier. Garis tebal menunjukkan hubungan yang lebih dekat.</p>
    <div class="mt-5 flex flex-wrap items-end gap-3">
      <div class="min-w-0 flex-1"><label class="label" for="centre">Mulai dari rekomendasimu</label><select id="centre" class="field">${mine.has(centre) ? "" : `<option selected disabled>${h(g.centre.title)}</option>`}${options}</select></div>
    </div>
    <div class="mt-5 grid gap-5 lg:grid-cols-[1fr_17rem]">
      <div class="card p-3"><div class="relative mx-auto aspect-square w-full max-w-xl">
        <svg viewBox="0 0 100 100" class="absolute inset-0 h-full w-full">${lines}</svg>${nodes}
        <a href="#/karier/${centre}" class="absolute left-1/2 top-1/2 w-[30%] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-brand-500 px-2 py-3 text-center text-[11px] font-bold leading-tight text-white shadow-lg shadow-brand-500/40 transition hover:scale-105 sm:text-sm">${h(g.centre.title)}</a>
      </div></div>
      <div class="space-y-4"><div class="card">${panel}</div>
        <div class="card space-y-2 text-xs text-mute">
          <p class="flex items-center gap-2"><i class="h-3 w-3 rounded bg-brand-500"></i>Karier di tengah</p>
          <p class="flex items-center gap-2"><i class="h-3 w-3 rounded border-2 border-brand-300 bg-brand-100"></i>Juga ada di rekomendasimu</p>
          <p class="flex items-center gap-2"><i class="h-3 w-3 rounded border-2 border-brand-300 bg-white"></i>Karier terkait lainnya</p>
        </div></div>
    </div>
    <div class="mt-5">${Note("Hubungan antar karier diambil dari data Related Occupations O*NET, yang disusun dari kesamaan pekerjaan, pengetahuan, dan keterampilan. Jaringan ini untuk eksplorasi; urutan rekomendasimu dihitung dari kecocokan minat.")}</div>`,
  );
}

export const onPick = (code) => {
  graphPick = code;
  render();
};
export const onCentre = (code) => go("jaringan/" + code);
