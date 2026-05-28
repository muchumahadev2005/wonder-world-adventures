const DEFAULT_SERVER_URL = import.meta.env.DEV
  ? "http://localhost:5000"
  : "https://wonder-world-adventures.onrender.com";
const API_BASE_URL = `${import.meta.env.VITE_SERVER_URL || DEFAULT_SERVER_URL}/api`;

 type ApiOptions = Omit<RequestInit, "body"> & { body?: Record<string, unknown> };

export const apiFetch = async <T>(path: string, options: ApiOptions = {}, token?: string | null) => {
  const url = `${API_BASE_URL}${path}`;
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (import.meta.env.DEV) {
    console.log("[api] request", {
      url,
      method: options.method || "GET",
      body: options.body || null,
    });
  }

  const response = await fetch(url, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json();
  if (import.meta.env.DEV) {
    console.log("[api] response", {
      url,
      status: response.status,
      ok: response.ok,
      data,
    });
  }
  if (!response.ok || data?.success === false) {
    const message = data?.message || "Request failed";
    const error = new Error(message) as Error & { code?: string };
    if (data?.code) {
      error.code = data.code;
    }
    throw error;
  }

  return data as T;
};
