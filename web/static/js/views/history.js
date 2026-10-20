/* Riwayat: the signed-in student's earlier results, kept on the server. */
import { h, toast } from "../components/ui.js";
import { appShell } from "../components/shell.js";
import { S, save, clearTest } from "../state.js";
import { api } from "../api.js";
import { go, render } from "../router.js";

let rows = null; // null = not loaded yet
let failed = false;
let loadedFor = null;

function load() {
  loadedFor = S.user.id;
  api("/api/history")
    .then((data) => {
      failed = false;
      rows = data.results;
      render();
    })
    .catch((error) => {
      failed = true;
      rows = [];
      render();
    });
}

/** Called after a new test, so the next visit shows it. */
export const forgetHistory = () => {
  rows = null;
};

const date = (iso) =>
  new Date(iso).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const Row = (r) => `<tr class="border-t border-slate-100 align-top">
    <td class="whitespace-nowrap px-4 py-3 text-mute">${h(date(r.at))}</td>
    <td class="px-4 py-3 font-semibold">${h(r.interest)}</td>
    <td class="px-4 py-3">${r.top.map((t) => `${h(t.title)} <span class="text-mute">(${t.match}%)</span>`).join("<br>")}</td>
    <td class="px-4 py-3 text-right"><button class="btn-ghost px-3 py-1.5" data-open="${h(r.id)}">Lihat</button></td></tr>`;

const Table = () => `<div class="card mt-6 overflow-x-auto p-0"><table class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase tracking-wide text-mute"><tr><th class="px-4 py-3">Tanggal</th><th class="px-4 py-3">Minat terkuat</th><th class="px-4 py-3">Tiga rekomendasi teratas</th><th class="px-4 py-3"></th></tr></thead>
        <tbody>${rows.map(Row).join("")}</tbody></table></div>
      <button class="btn-link mt-4 text-sm" data-act="clear-history">Hapus riwayat</button>`;

const Empty = (text) =>
  `<div class="card mt-6 p-8 text-center text-mute">${text}</div>`;

export function viewRiwayat() {
  if (rows === null || loadedFor !== S.user.id) {
    rows = null;
    load();
  }
  const body =
    rows === null
      ? Empty("Memuat riwayat…")
      : failed
        ? Empty("Riwayat tidak bisa dimuat. Muat ulang halaman ini.")
        : rows.length
          ? Table()
          : Empty(
              "Belum ada riwayat. Selesaikan tes minat karier untuk melihat hasilnya di sini.",
            );
  return appShell(
    "riwayat",
    `
    <h1 class="text-3xl font-extrabold">Riwayat Rekomendasi</h1>
    <p class="mt-1 text-mute">Hasil tes yang pernah kamu selesaikan dengan akun ini.</p>
    ${body}`,
  );
}

/** Open an earlier result again in the result pages. */
export async function onOpen(id) {
  try {
    S.result = await api(`/api/history/${encodeURIComponent(id)}`);
    S.feedbackSent = Boolean(S.result.feedback_given);
    save();
    go("hasil");
  } catch (error) {
    toast(error.message);
  }
}

export const actions = {
  async "clear-history"() {
    try {
      await api("/api/history", undefined, "DELETE");
      rows = [];
      clearTest(); // the result that was open is gone with the rest
      render();
    } catch (error) {
      toast(error.message);
    }
  },
};
