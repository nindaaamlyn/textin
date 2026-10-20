/* Page frames: the signed-in layout with its side menu, the step indicator, the login card, the footer. */
import { h, icon, logo, toast } from "./ui.js";
import { S, CONFIG, NEEDS_RESULT, answered, hasResult, setUser } from "../state.js";
import { api } from "../api.js";
import { go } from "../router.js";

export const footer = () => `<footer class="border-t border-slate-100 px-5 py-8 text-center text-xs leading-relaxed text-mute">
  <p class="mx-auto max-w-3xl">${h(CONFIG.attribution)}</p></footer>`;

const NAV = [["dasbor", "Beranda", "home"], ["tes", "Tes Minat Karier", "quiz"], ["hasil", "Hasil Rekomendasi", "star"],
             ["jaringan", "Jaringan Karier", "graph"], ["feedback", "Feedback", "chat"], ["riwayat", "Riwayat", "clock"]];

export function appShell(active, content) {
  const items = NAV.map(([route, label, ic]) => {
    const locked = NEEDS_RESULT.includes(route) && !hasResult();
    return `<button class="nav-item ${active === route ? "active" : ""} ${locked ? "locked" : ""}" data-nav="${route}">${icon(ic)}${label}</button>`;
  }).join("");
  const initial = h((S.user.name || "P").charAt(0).toUpperCase());
  return `<div class="min-h-screen bg-slate-50 lg:flex">
    <aside id="side" class="fixed inset-y-0 left-0 z-40 flex w-64 -translate-x-full flex-col gap-1 overflow-y-auto border-r border-slate-200 bg-white p-4 transition-transform lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0">
      <div class="mb-5 px-1">${logo("dasbor")}</div>
      ${items}
      <div class="mt-auto border-t border-slate-100 pt-3">
        <button class="nav-item" data-act="logout">${icon("out")}Keluar</button>
      </div>
    </aside>
    <div id="shade" class="fixed inset-0 z-30 hidden bg-ink/40 lg:hidden" data-act="menu"></div>
    <div class="flex min-w-0 flex-1 flex-col">
      <header class="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:px-8">
        <button class="rounded-lg p-2 text-mute hover:bg-brand-50 lg:hidden" data-act="menu" aria-label="Buka menu">${icon("menu")}</button>
        <span class="hidden text-sm text-mute lg:block">Find your career</span>
        <div class="flex items-center gap-2.5">
          <span class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">${initial}</span>
          <span class="max-w-40 truncate text-sm font-semibold">${h(S.user.name)}</span>
        </div>
      </header>
      <main data-page class="mx-auto w-full max-w-4xl flex-1 px-4 py-6 lg:px-8 lg:py-8">${content}</main>
      ${footer()}
    </div>
  </div>`;
}

const STEPS = ["Pengarahan", "Isi Kuis", "Analisis", "Hasil"];
export const stepper = (current) => `<ol class="mb-6 flex items-center">${STEPS.map((name, k) => `
  <li class="flex ${k < STEPS.length - 1 ? "flex-1" : ""} items-center">
    <span class="flex items-center gap-2 text-xs font-semibold ${k <= current ? "text-brand-600" : "text-slate-400"}">
      <span class="flex h-7 w-7 items-center justify-center rounded-full ${k < current ? "bg-brand-500 text-white" : k === current ? "bg-brand-100 text-brand-700 ring-2 ring-brand-500" : "bg-slate-100"}">${k < current ? icon("check", "h-4 w-4") : k + 1}</span>
      <span class="hidden sm:inline">${name}</span>
    </span>
    ${k < STEPS.length - 1 ? `<span class="mx-2 h-0.5 flex-1 rounded ${k < current ? "bg-brand-500" : "bg-slate-200"}"></span>` : ""}
  </li>`).join("")}</ol>`;

/** The centred card used by the login and register pages. */
export function authShell(content) {
  return `<div class="flex min-h-screen flex-col bg-gradient-to-b from-brand-50 to-white">
    <header class="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-4">${logo()}
      <a href="#/" class="flex items-center gap-1.5 text-sm font-semibold text-mute hover:text-brand-600">${icon("back", "h-4 w-4")}Beranda</a></header>
    <main class="flex flex-1 items-start justify-center px-4 pb-12 pt-4"><div data-page class="card w-full max-w-md p-7 shadow-xl shadow-brand-500/10">${content}</div></main>
  </div>`;
}


export const actions = {
  menu() {
    document.getElementById("side").classList.toggle("-translate-x-full");
    document.getElementById("shade").classList.toggle("hidden");
  },
  async logout() {
    await api("/api/auth/logout", {}).catch(() => {}); // the cookie is cleared by the server
    setUser(null);
    go("");
  },
};

/** A click on the side menu. Result pages stay closed until the test is finished. */
export function onNav(route) {
  if (NEEDS_RESULT.includes(route) && !hasResult()) toast("Selesaikan tes minat karier dulu.");
  else go(route === "tes" && answered() && !hasResult() ? "kuis" : route);
}
