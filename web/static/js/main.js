/* texin - find your career. Entry point: routes, guards and the one set of event listeners.

   js/state.js        configuration from the server + the student's progress (localStorage)
   js/router.js       go(), render()
   js/api.js          calls to web/app.py
   js/sync.js         keeps this browser and the account on the server in step
   js/components/     building blocks shared by pages (ui, charts, shell)
   js/views/          one file per page or group of pages

   Views return HTML strings. Elements ask for behaviour with data attributes:
     data-act="name"      runs actions.name()            data-nav="route"   side menu
     data-answer="0..4"   answers the open question      data-tab="n"       detail tab
     data-pick="code"     selects a career in the graph  data-star="x:n"    star rating
     data-scroll="id"     scrolls the landing page       data-open="id"    opens an earlier result
     data-peek="id"       shows or hides a password
     data-section="key"   admin page tab             data-reset="id"   new password for a user
           <form data-form="name">  runs forms.name() */
import {
  S,
  CONFIG,
  NEEDS_RESULT,
  setConfig,
  sessionExpired,
  answered,
  total,
  hasResult,
} from "./state.js";
import { go, render, onRender, currentRoute } from "./router.js";
import { api, onUnauthorized } from "./api.js";
import { toast, whileBusy } from "./components/ui.js";
import { applyState } from "./sync.js";
import * as shell from "./components/shell.js";
import * as landing from "./views/landing.js";
import * as auth from "./views/auth.js";
import { viewDasbor } from "./views/dashboard.js";
import * as quiz from "./views/quiz.js";
import * as results from "./views/results.js";
import * as network from "./views/network.js";
import * as feedback from "./views/feedback.js";
import * as history from "./views/history.js";
import * as admin from "./views/admin.js";
import * as account from "./views/account.js";

const app = document.getElementById("app");

const VIEWS = {
  "": landing.viewLanding,
  masuk: auth.viewMasuk,
  daftar: auth.viewDaftar,
  lupa: auth.viewLupa,
  reset: auth.viewReset,
  akun: account.viewAkun,
  dasbor: viewDasbor,
  tes: quiz.viewTes,
  kuis: quiz.viewKuis,
  ringkasan: quiz.viewRingkasan,
  analisis: quiz.viewAnalisis,
  hasil: results.viewHasil,
  karier: results.viewKarier,
  jaringan: network.viewJaringan,
  feedback: feedback.viewFeedback,
  riwayat: history.viewRiwayat,
  admin: admin.viewAdmin,
};
const PUBLIC = ["", "masuk", "daftar", "lupa", "reset"];
const ADMIN_PAGES = ["admin", "akun"];
const actions = {
  ...shell.actions,
  ...quiz.actions,
  ...history.actions,
  ...admin.actions,
  ...auth.actions,
};
const forms = { ...auth.forms, ...feedback.forms, ...account.forms };
// data attribute -> what a click on it does
const CLICKS = {
  act: (name) => actions[name](),
  nav: shell.onNav,
  answer: (value) => quiz.onAnswer(Number(value)),
  tab: results.onTab,
  pick: network.onPick,
  star: feedback.onStar,
  scroll: landing.onScroll,
  open: history.onOpen,
  peek: auth.onPeek,
  section: admin.onSection,
  reset: admin.onReset,
};
const CLICKABLE = Object.keys(CLICKS)
  .map((key) => `[data-${key}]`)
  .join(",");

let lastHash = null;

onRender(() => {
  if (!CONFIG) return; // a hash change before the first load finished
  const [route, arg] = currentRoute();
  if (!VIEWS[route]) return go(S.user ? "dasbor" : "");
  if (!PUBLIC.includes(route) && !S.user) return go("masuk");
  if (route === "admin" && !S.user.admin) return go("dasbor");
  if (S.user && S.user.admin && !ADMIN_PAGES.includes(route) && !PUBLIC.includes(route))
    return go("admin", true); // the admin only has the admin page and Ubah Password
  if (NEEDS_RESULT.includes(route) && !hasResult()) return go("dasbor");
  if ((route === "ringkasan" || route === "analisis") && answered() < total())
    return go("tes", true);
  if (route === "analisis" && hasResult()) return go("hasil", true); // already analysed
  const arrived = location.hash !== lastHash;
  lastHash = location.hash;
  if (arrived && route === "karier") results.resetTab();
  app.innerHTML = VIEWS[route](arg);
  if (route === "kuis") quiz.paintQuiz();
  if (arrived) {
    // the entrance animation plays when a page is opened, not each time it is redrawn
    const page = app.querySelector("[data-page]");
    if (page) page.classList.add("animate-rise");
    window.scrollTo(0, 0);
    if (route === "analisis") quiz.runAnalysis();
  }
});

document.addEventListener("click", (event) => {
  const el = event.target.closest(CLICKABLE);
  if (!el || el.hasAttribute("aria-busy")) return;
  const key = Object.keys(CLICKS).find((k) => el.dataset[k] !== undefined);
  const work = CLICKS[key](el.dataset[key], event);
  // an action that waits on the server: its button stays disabled, with a spinner, until it is done
  if (work && typeof work.then === "function") whileBusy(el, work).catch(() => {});
});

let submitting = false;

document.addEventListener("submit", async (event) => {
  event.preventDefault();
  const handler = forms[event.target.dataset.form];
  if (!handler || submitting) return; // a second click while the first is still on its way
  submitting = true;
  try {
    await whileBusy(event.target.querySelector("button:not([type=button])"), handler());
  } finally {
    submitting = false;
  }
});

document.addEventListener("change", (event) => {
  if (event.target.id === "centre") network.onCentre(event.target.value);
});

document.addEventListener("input", (event) => {
  if (event.target.id === "admin-search") admin.onSearch(event.target.value);
});

document.addEventListener("keydown", (event) => {
  if (location.hash === "#/kuis") quiz.onKeydown(event);
});

window.addEventListener("hashchange", render);

onUnauthorized(() => {
  if (!S.user) return;
  sessionExpired(); // the test stays in this browser for when its owner signs in again
  toast("Sesi masukmu berakhir. Silakan masuk lagi.");
  go("masuk");
});

Promise.all([api("/api/config"), api("/api/state")])
  .then(([config, state]) => {
    setConfig(config);
    applyState(state);
    render();
  })
  .catch(() => {
    app.innerHTML = `<p class="p-8 text-center text-mute">Tidak bisa memuat aplikasi. Muat ulang halaman.</p>`;
  });
