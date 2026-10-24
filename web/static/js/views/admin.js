/* Admin: every account and every feedback, and a new password for a student who forgot theirs.
   Only the account named by ADMIN_EMAIL on the server sees this page. */
import { h, toast } from "../components/ui.js";
import { appShell } from "../components/shell.js";
import { S } from "../state.js";
import { api } from "../api.js";
import { render } from "../router.js";

let users = null; // null = not loaded yet
let feedback = null;
let failed = false;
let loadedFor = null;
let section = "users";
let query = "";
let issued = null; // {name, email, password} just reset, shown until dismissed

function load() {
  loadedFor = S.user.id;
  Promise.all([api("/api/admin/users"), api("/api/admin/feedback")])
    .then(([u, f]) => {
      failed = false;
      users = u.users;
      feedback = f.feedback;
      render();
    })
    .catch(() => {
      failed = true;
      users = [];
      feedback = [];
      render();
    });
}

const date = (iso) =>
  iso
    ? new Date(iso).toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "-";

const Th = (text) => `<th class="px-3 py-2.5">${text}</th>`;
const Table = (heads, body) => `<div class="card mt-4 overflow-x-auto p-0 print:overflow-visible print:shadow-none"><table class="w-full text-left text-sm print:text-xs">
    <thead class="bg-slate-50 text-xs uppercase tracking-wide text-mute"><tr>${heads.map(Th).join("")}</tr></thead>
    <tbody id="admin-rows">${body}</tbody></table></div>`;

const Empty = (text) =>
  `<div class="card mt-4 p-8 text-center text-mute">${text}</div>`;

const matches = (u) =>
  !query ||
  u.name.toLowerCase().includes(query) ||
  u.email.toLowerCase().includes(query);

const UserRow = (u) => `<tr class="border-t border-slate-100 align-top">
    <td class="px-3 py-2.5 font-semibold">${h(u.name)}</td>
    <td class="px-3 py-2.5">${h(u.email)}</td>
    <td class="whitespace-nowrap px-3 py-2.5 text-mute">${h(date(u.created_at))}</td>
    <td class="px-3 py-2.5 text-center">${u.tests}</td>
    <td class="whitespace-nowrap px-3 py-2.5 text-mute">${h(date(u.last_test))}</td>
    <td class="px-3 py-2.5 text-right">${u.admin ? "" : `<button class="btn-ghost whitespace-nowrap px-3 py-1.5" data-reset="${h(u.id)}">Reset password</button>`}</td></tr>`;

const userRows = () => {
  const shown = users.filter(matches);
  return shown.length
    ? shown.map(UserRow).join("")
    : `<tr><td colspan="6" class="px-4 py-6 text-center text-mute">Tidak ada user yang cocok.</td></tr>`;
};

const Issued = () =>
  issued
    ? `<div class="card mt-4 border-brand-300 bg-brand-50">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-sm font-semibold">Password baru untuk ${h(issued.name)} (${h(issued.email)})</p>
        <p class="mt-2 select-all rounded-xl bg-white px-4 py-2 font-mono text-lg font-bold tracking-wider">${h(issued.password)}</p>
        <p class="mt-2 text-xs text-brand-700">Berikan password ini ke user. Password ini hanya ditampilkan sekali. Semua sesi masuknya sudah diakhiri.</p>
      </div>
      <button class="btn-link text-sm" data-act="admin-dismiss">Tutup</button>
    </div></div>`
    : "";

const Users = () => `${Issued()}
  <div class="mt-4 flex flex-wrap items-center gap-3">
    <input id="admin-search" type="search" class="field max-w-sm" placeholder="Cari nama atau email" value="${h(query)}" autocomplete="off">
    <span class="text-sm text-mute">${users.length} user terdaftar</span>
  </div>
  ${Table(["Nama", "Email", "Terdaftar", "Jumlah tes", "Tes terakhir", ""], userRows())}`;

const FeedbackRow = (f) => `<tr class="border-t border-slate-100 align-top">
    <td class="whitespace-nowrap px-3 py-2.5 text-mute">${h(date(f.created_at))}</td>
    <td class="px-3 py-2.5"><span class="font-semibold">${h(f.name)}</span><br><span class="text-mute">${h(f.email)}</span></td>
    <td class="px-3 py-2.5">${h(f.summary.interest)}${f.summary.top && f.summary.top[0] ? `<br><span class="text-mute">${h(f.summary.top[0].title)} (${f.summary.top[0].match}%)</span>` : ""}</td>
    <td class="px-3 py-2.5 text-center font-semibold">${f.relevance}/5</td>
    <td class="px-3 py-2.5 text-center font-semibold">${f.ease}/5</td>
    <td class="px-3 py-2.5">${f.comment ? h(f.comment) : `<span class="text-mute">-</span>`}</td></tr>`;

const Feedback = () =>
  feedback.length
    ? `<div class="mt-4 flex flex-wrap items-center gap-2 print:hidden">
        <a href="/api/admin/feedback/export.csv" download class="btn-ghost px-3 py-1.5">Unduh CSV</a>
        <button class="btn-ghost px-3 py-1.5" data-act="admin-print">Cetak / Simpan PDF</button>
        <span class="text-sm text-mute">${feedback.length} feedback</span>
      </div>
      <div class="hidden print:block">
        <h2 class="text-xl font-extrabold">Feedback texin</h2>
        <p class="text-sm text-mute">${feedback.length} feedback, dicetak ${h(date(new Date().toISOString()))}</p>
      </div>
      ${Table(
        ["Tanggal", "User", "Minat & rekomendasi teratas", "Relevansi", "Kemudahan", "Komentar"],
        feedback.map(FeedbackRow).join(""),
      )}`
    : Empty("Belum ada feedback.");

const SECTIONS = [
  ["users", "User"],
  ["feedback", "Feedback"],
];

export function viewAdmin() {
  if (users === null || loadedFor !== S.user.id) {
    users = null;
    load();
  }
  const count = (key) =>
    users === null ? "" : ` (${key === "users" ? users.length : feedback.length})`;
  const body =
    users === null
      ? Empty("Memuat data…")
      : failed
        ? Empty("Data tidak bisa dimuat. Muat ulang halaman ini.")
        : section === "users"
          ? Users()
          : Feedback();
  return appShell(
    "admin",
    `
    <div class="flex flex-wrap items-end justify-between gap-3 print:hidden">
      <div><h1 class="text-3xl font-extrabold">Admin</h1>
        <p class="mt-1 text-mute">Kelola user dan lihat feedback hasil tes.</p></div>
      <button class="btn-ghost px-3 py-1.5" data-act="admin-refresh">Muat ulang</button>
    </div>
    <div class="mt-5 flex gap-1 overflow-x-auto border-b border-slate-200 print:hidden" role="tablist">${SECTIONS.map(
      ([key, name]) => `
      <button role="tab" data-section="${key}" class="whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition ${key === section ? "border-brand-500 text-brand-600" : "border-transparent text-mute hover:text-ink"}">${name}${count(key)}</button>`,
    ).join("")}</div>
    ${body}`,
  );
}

export const onSection = (key) => {
  section = key;
  render();
};

/** Typing in the search box redraws only the table, so the box keeps its focus. */
export function onSearch(value) {
  query = value.trim().toLowerCase();
  const rows = document.getElementById("admin-rows");
  if (rows && users) rows.innerHTML = userRows();
}

export async function onReset(id) {
  const user = users.find((u) => u.id === id);
  if (!user) return;
  if (!confirm(`Buat password baru untuk ${user.name} (${user.email})? Password lamanya tidak bisa dipakai lagi.`))
    return;
  try {
    issued = await api(`/api/admin/users/${encodeURIComponent(id)}/password`, {});
    render();
  } catch (error) {
    toast(error.message);
  }
}

export const actions = {
  "admin-dismiss"() {
    issued = null;
    render();
  },
  "admin-print"() {
    window.print(); // the browser's print dialog offers "Save as PDF"; only the table is printed
  },
  "admin-refresh"() {
    users = null;
    render();
  },
};
