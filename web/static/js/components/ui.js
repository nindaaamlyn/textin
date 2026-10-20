/* Small building blocks shared by every page. Everything returns an HTML string. */
export const h = (text) => String(text ?? "").replace(/[&<>"']/g, (c) => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function toast(message) {
  const box = document.getElementById("toast");
  box.innerHTML = `<div class="animate-rise rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white shadow-lg">${h(message)}</div>`;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { box.innerHTML = ""; }, 3200);
}

export const ICONS = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  quiz: "M9 5h10M9 12h10M9 19h10M4 5l1 1 2-2M4 12l1 1 2-2M4 19l1 1 2-2",
  star: "m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.500l6.100-.9z",
  graph: "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM5 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM19 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM5 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM19 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM6.500 7.500l3.300 2.700M17.500 7.500l-3.300 2.700M6.500 16.500l3.300-2.700M17.500 16.500l-3.300-2.700",
  chat: "M4 5h16v11H9l-5 4z",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2",
  out: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h9",
  arrow: "M5 12h14M13 6l6 6-6 6",
  back: "M19 12H5M11 6l-6 6 6 6",
  check: "m5 12 5 5 9-10",
  menu: "M4 6h16M4 12h16M4 18h16",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
  lock: "M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  target: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 11.500v1",
  eye: "M2 12s3.600-7 10-7 10 7 10 7-3.600 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  eyeOff: "M2 12s3.600-7 10-7 10 7 10 7-3.600 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM4 4l16 16",
  spark: "M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3",
};
export const icon = (name, cls = "h-5 w-5") =>
  `<svg class="${cls} shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICONS[name]}"/></svg>`;

export const logo = (route = "") =>
  `<a href="#/${route}" class="logo-box" aria-label="texin - find your career"><img src="/static/img/texin-putih.png" alt="texin - find your career"></a>`;

export function ring(percent, size = 76) {
  const r = 30, c = 2 * Math.PI * r;
  return `<div class="relative shrink-0" style="width:${size}px;height:${size}px">
    <svg viewBox="0 0 72 72" class="h-full w-full -rotate-90">
      <circle cx="36" cy="36" r="${r}" fill="none" stroke="#dce9ff" stroke-width="7"/>
      <circle cx="36" cy="36" r="${r}" fill="none" stroke="#2f80ff" stroke-width="7" stroke-linecap="round"
              stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - percent / 100)}" style="transition:stroke-dashoffset .8s ease"/>
    </svg>
    <div class="absolute inset-0 flex items-center justify-center text-base font-extrabold">${percent}%</div>
  </div>`;
}

export const bar = (percent, tone = "bg-brand-500") =>
  `<div class="h-2.5 w-full overflow-hidden rounded-full bg-brand-50"><div class="${tone} h-full rounded-full transition-all duration-700" style="width:${Math.max(0, Math.min(100, percent))}%"></div></div>`;

/** A labelled text input with an icon on the left. A password field also gets a show/hide button on the right. */
export const Field = (
  id,
  label,
  type,
  placeholder,
  ic,
  autocomplete = "off",
) => `<div>
  <label class="label" for="${id}">${label}</label>
  <div class="relative"><span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">${icon(ic, "h-4 w-4")}</span>
  <input id="${id}" name="${id}" type="${type}" placeholder="${placeholder}" class="field pl-10 ${type === "password" ? "pr-10" : ""}" autocomplete="${autocomplete}">${type === "password" ? `
  <button type="button" data-peek="${id}" class="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-brand-600" aria-label="Tampilkan password">${icon("eye", "h-4 w-4")}</button>` : ""}</div></div>`;

export const fieldValue = (id) => (document.getElementById(id) || {}).value || "";

/** A list of statements, each with a tick. */
export const CheckList = (lines) => `<ul class="space-y-2.5">${lines.map((line) => `<li class="flex items-start gap-3 text-sm"><span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">${icon("check", "h-3.5 w-3.5")}</span>${h(line)}</li>`).join("")}</ul>`;

/** A row with a name on the left, a value on the right and a bar under it. */
export const Meter = (label, value, percent, tone) => `<div><div class="mb-1 flex justify-between text-sm"><span>${h(label)}</span><span class="font-semibold">${value}</span></div>${bar(percent, tone)}</div>`;

export const Note = (text) => `<p class="rounded-xl bg-brand-50 px-4 py-3 text-xs leading-relaxed text-brand-700">${h(text)}</p>`;
