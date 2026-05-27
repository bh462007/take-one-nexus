export async function fetchWithCSRF(url, options = {}) {
  const csrfRes = await fetch("/api/csrf-token", {
    credentials: "include"
  });

  const { csrfToken } = await csrfRes.json();

  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
      ...(options.headers || {})
    }
  });
}
