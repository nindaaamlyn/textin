/* Feedback: two star ratings and a comment, kept with the result they are about. */
import { h, icon, ICONS, toast, fieldValue } from "../components/ui.js";
import { appShell } from "../components/shell.js";
import { S, save } from "../state.js";
import { api } from "../api.js";
import { render } from "../router.js";

const stars = { relevance: 0, ease: 0 };
const starRow = (name, label) =>
  `<div><p class="label">${label}</p><div class="flex gap-1.5">${[1, 2, 3, 4, 5]
    .map(
      (v) => `
  <button type="button" data-star="${name}:${v}" aria-label="${v} bintang" class="transition hover:scale-110 ${v <= stars[name] ? "text-amber-400" : "text-slate-300"}">
    <svg class="h-9 w-9" viewBox="0 0 24 24" fill="currentColor"><path d="${ICONS.star}"/></svg></button>`,
    )
    .join("")}</div></div>`;

let starsFor = null; // the result the stars on screen belong to

export function viewFeedback() {
  if (starsFor !== S.result.result_id) {
    starsFor = S.result.result_id;
    stars.relevance = stars.ease = 0;
  }
  if (S.feedbackSent) {
    return appShell(
      "feedback",
      `<div class="card mx-auto max-w-lg p-8 text-center"><span class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-600">${icon("check", "h-7 w-7")}</span>
      <h1 class="mt-4 text-2xl font-extrabold">Terima kasih!</h1><p class="mt-2 text-sm text-mute">Feedback kamu untuk hasil ini sudah tersimpan.</p>
      <a href="#/hasil" class="btn-primary mt-5">Kembali ke Hasil</a></div>`,
    );
  }
  const top = S.result.cards[0];
  return appShell(
    "feedback",
    `
    <h1 class="text-3xl font-extrabold">Berikan Feedback</h1>
    <p class="mt-1 text-mute">Bantu kami meningkatkan kualitas rekomendasi karier texin.</p>
    <form data-form="feedback" class="card mt-6 max-w-2xl space-y-6 p-6">
      <p class="rounded-xl bg-brand-50 px-4 py-3 text-sm"><span class="font-bold">Rekomendasi teratasmu:</span> ${h(top.title)} (kecocokan ${top.match}%)</p>
      ${starRow("relevance", "Seberapa sesuai rekomendasi ini?")}
      ${starRow("ease", "Seberapa mudah aplikasi ini digunakan?")}
      <div><label class="label" for="comment">Apa alasan kamu memberikan rating ini? <span class="font-normal text-mute">(opsional)</span></label>
        <textarea id="comment" rows="4" maxlength="500" class="field" placeholder="Jangan tulis nama atau kontak."></textarea></div>
      <button class="btn-primary">Kirim Feedback</button>
    </form>`,
  );
}

export function onStar(spec) {
  const [name, value] = spec.split(":");
  stars[name] = Number(value);
  render();
}

export const forms = {
  async feedback() {
    if (!stars.relevance || !stars.ease)
      return toast("Dua rating bintang perlu diisi.");
    try {
      await api("/api/feedback", {
        result_id: S.result.result_id,
        relevance: stars.relevance,
        ease: stars.ease,
        comment: fieldValue("comment"),
      });
      stars.relevance = stars.ease = 0;
      S.feedbackSent = true;
      save();
      render();
    } catch (error) {
      toast(error.message);
    }
  },
};
