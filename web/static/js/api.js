/* Calls to web/app.py. GET without a body, POST with one; `method` overrides (for DELETE).
   The login cookie travels with every call. */
let unauthorized = () => {};
/** What to do when the server says the login has ended. */
export const onUnauthorized = (fn) => {
  unauthorized = fn;
};

export async function api(path, body, method) {
  const options = { credentials: "same-origin" };
  if (body !== undefined) {
    options.method = "POST";
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(body);
  }
  if (method) options.method = method;
  const response = await fetch(path, options);
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    const error = new Error(
      typeof detail.detail === "string"
        ? detail.detail
        : "Terjadi kesalahan. Coba lagi.",
    );
    error.status = response.status;
    if (response.status === 401 && !path.startsWith("/api/auth/")) unauthorized();
    throw error;
  }
  return response.json();
}
