/* Ubah Password: a signed-in student sets a new password. Other devices are signed out. */
import { Field, fieldValue, h, toast } from "../components/ui.js";
import { appShell } from "../components/shell.js";
import { S } from "../state.js";
import { api } from "../api.js";
import { go } from "../router.js";
import { MIN_PASSWORD } from "./auth.js";

export const viewAkun = () =>
  appShell(
    "akun",
    `
    <h1 class="text-3xl font-extrabold">Ubah Password</h1>
    <p class="mt-1 text-mute">Akun ${h(S.user.email)}. Setelah diganti, perangkat lain yang masuk dengan akun ini akan keluar.</p>
    <div class="card mt-6 max-w-md p-6">
      <form data-form="ubah-password" class="space-y-4" novalidate>
        ${Field("current", "Password Lama", "password", "Masukkan password sekarang", "lock", "current-password")}
        ${Field("password", "Password Baru", "password", `Minimal ${MIN_PASSWORD} karakter`, "lock", "new-password")}
        ${Field("password2", "Konfirmasi Password Baru", "password", "Masukkan ulang password baru", "lock", "new-password")}
        <button class="btn-primary w-full py-3">Simpan password</button>
      </form>
    </div>`,
  );

export const forms = {
  async "ubah-password"() {
    const current = fieldValue("current");
    const password = fieldValue("password");
    if (!current) return toast("Isi password lama kamu.");
    if (password.length < MIN_PASSWORD)
      return toast(`Password baru minimal ${MIN_PASSWORD} karakter.`);
    if (password !== fieldValue("password2"))
      return toast("Konfirmasi password baru tidak sama.");
    try {
      await api("/api/auth/password", { current, password });
      toast("Password berhasil diganti.");
      go(S.user.admin ? "admin" : "dasbor");
    } catch (error) {
      toast(error.message);
    }
  },
};
