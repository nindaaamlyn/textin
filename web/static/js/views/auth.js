/* Masuk, Daftar, Lupa password and the page a reset link opens. The password goes to the server
   once, over the form, and is never kept here. */
import { Field, fieldValue, h, icon, toast } from "../components/ui.js";
import { authShell } from "../components/shell.js";
import { CONFIG, S, sessionExpired } from "../state.js";
import { api } from "../api.js";
import { loadState } from "../sync.js";
import { go, render } from "../router.js";

export const MIN_PASSWORD = 8;
let sentTo = null; // the email a reset link was just asked for

export const viewMasuk = () =>
  authShell(`
  <h1 class="text-center text-2xl font-extrabold">Masuk ke Akun <span class="text-brand-500">texin</span></h1>
  <p class="mt-2 text-center text-sm text-mute">Lanjutkan untuk mendapatkan rekomendasi karier berdasarkan minat kamu.</p>
  <form data-form="masuk" class="mt-6 space-y-4" novalidate>
    ${Field("email", "Email", "email", "nama@example.com", "mail", "username")}
    ${Field("password", "Password", "password", "Masukkan password", "lock", "current-password")}
    <div class="flex items-center justify-between gap-3">
      <label class="flex items-center gap-2 text-sm"><input id="remember" type="checkbox" class="h-4 w-4 rounded accent-brand-500">Ingat saya di perangkat ini</label>
      ${CONFIG.password_email ? `<a href="#/lupa" class="btn-link text-sm">Lupa password?</a>` : ""}
    </div>
    <button class="btn-primary w-full py-3">Masuk</button>
  </form>
  <p class="mt-5 text-center text-sm text-mute">Belum punya akun? <a href="#/daftar" class="btn-link">Daftar di sini</a></p>`);

export const viewDaftar = () =>
  authShell(`
  <h1 class="text-center text-2xl font-extrabold">Buat Akun Baru</h1>
  <p class="mt-2 text-center text-sm text-mute">Mulai perjalanan karier kamu sekarang</p>
  <form data-form="daftar" class="mt-6 space-y-4" novalidate>
    ${Field("name", "Nama Lengkap", "text", "Masukkan nama lengkap", "user", "name")}
    ${Field("email", "Email", "email", "nama@example.com", "mail", "username")}
    ${Field("password", "Password", "password", `Minimal ${MIN_PASSWORD} karakter`, "lock", "new-password")}
    ${Field("password2", "Konfirmasi Password", "password", "Masukkan ulang password", "lock", "new-password")}
    <button class="btn-primary w-full py-3">Daftar</button>
  </form>
  <p class="mt-5 text-center text-sm text-mute">Sudah punya akun? <a href="#/masuk" class="btn-link">Masuk di sini</a></p>
  <p class="mt-4 rounded-xl bg-brand-50 px-3 py-2 text-center text-xs text-brand-700">Kami menyimpan nama, email, dan hasil tesmu supaya riwayatmu bisa dibuka lagi. Password disimpan dalam bentuk teracak.</p>`);

export const viewLupa = () =>
  authShell(
    sentTo
      ? `
  <h1 class="text-center text-2xl font-extrabold">Cek Email Kamu</h1>
  <p class="mt-3 text-center text-sm text-mute">Kalau <span class="font-semibold text-ink">${h(sentTo)}</span> terdaftar, link untuk membuat password baru sudah dikirim. Link berlaku 30 menit.</p>
  <p class="mt-4 rounded-xl bg-brand-50 px-3 py-2 text-center text-xs text-brand-700">Tidak ada di kotak masuk? Cek folder Spam atau Promosi.</p>
  <p class="mt-5 text-center text-sm text-mute"><a href="#/masuk" class="btn-link">Kembali ke Masuk</a> · <button class="btn-link" data-act="forgot-again">Kirim ulang</button></p>`
      : `
  <h1 class="text-center text-2xl font-extrabold">Lupa Password</h1>
  <p class="mt-2 text-center text-sm text-mute">Masukkan email akunmu. Kami kirimkan link untuk membuat password baru.</p>
  <form data-form="lupa" class="mt-6 space-y-4" novalidate>
    ${Field("email", "Email", "email", "nama@example.com", "mail", "username")}
    <button class="btn-primary w-full py-3">Kirim link</button>
  </form>
  <p class="mt-5 text-center text-sm text-mute">Ingat password? <a href="#/masuk" class="btn-link">Masuk di sini</a></p>`,
  );

export const viewReset = () =>
  authShell(`
  <h1 class="text-center text-2xl font-extrabold">Buat Password Baru</h1>
  <p class="mt-2 text-center text-sm text-mute">Setelah disimpan, kamu keluar dari semua perangkat dan masuk lagi dengan password baru.</p>
  <form data-form="reset" class="mt-6 space-y-4" novalidate>
    ${Field("password", "Password Baru", "password", `Minimal ${MIN_PASSWORD} karakter`, "lock", "new-password")}
    ${Field("password2", "Konfirmasi Password", "password", "Masukkan ulang password", "lock", "new-password")}
    <button class="btn-primary w-full py-3">Simpan password</button>
  </form>`);

/** The eye button in a password field: shows what was typed, or hides it again. */
export function onPeek(id, event) {
  const input = document.getElementById(id);
  const button = event.target.closest("[data-peek]");
  const show = input.type === "password";
  input.type = show ? "text" : "password";
  button.innerHTML = icon(show ? "eyeOff" : "eye", "h-4 w-4");
  button.setAttribute("aria-label", show ? "Sembunyikan password" : "Tampilkan password");
}

const looksLikeEmail = (email) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);

async function enter(path, body) {
  try {
    await api(path, body);
    await loadState(); // the account, a test in progress and the latest result
    go("dasbor");
  } catch (error) {
    toast(error.message);
  }
}

export const forms = {
  masuk() {
    const email = fieldValue("email").trim();
    const password = fieldValue("password");
    if (!looksLikeEmail(email)) return toast("Isi alamat email yang benar.");
    if (!password) return toast("Isi password kamu.");
    return enter("/api/auth/login", {
      email,
      password,
      remember: document.getElementById("remember").checked,
    });
  },
  daftar() {
    const name = fieldValue("name").trim();
    const email = fieldValue("email").trim();
    const password = fieldValue("password");
    if (!name) return toast("Isi nama lengkap kamu.");
    if (!looksLikeEmail(email)) return toast("Isi alamat email yang benar.");
    if (password.length < MIN_PASSWORD)
      return toast(`Password minimal ${MIN_PASSWORD} karakter.`);
    if (password !== fieldValue("password2"))
      return toast("Konfirmasi password tidak sama.");
    return enter("/api/auth/register", { name, email, password });
  },
  async lupa() {
    const email = fieldValue("email").trim();
    if (!looksLikeEmail(email)) return toast("Isi alamat email yang benar.");
    try {
      await api("/api/auth/forgot", { email });
      sentTo = email;
      render();
    } catch (error) {
      toast(error.message);
    }
  },
  async reset() {
    const password = fieldValue("password");
    if (password.length < MIN_PASSWORD)
      return toast(`Password minimal ${MIN_PASSWORD} karakter.`);
    if (password !== fieldValue("password2"))
      return toast("Konfirmasi password tidak sama.");
    const token = location.hash.split("/")[2] || "";
    try {
      await api("/api/auth/reset", { token, password });
      if (S.user) sessionExpired(); // every login of that account has ended
      toast("Password baru tersimpan. Silakan masuk.");
      go("masuk", true); // the used link stays out of the Back history
    } catch (error) {
      toast(error.message);
    }
  },
};

export const actions = {
  "forgot-again"() {
    sentTo = null;
    render();
  },
};
