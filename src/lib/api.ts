const TOKEN_KEY = "almox_token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // localStorage indisponível
  }
}

function isLoginRequest(url: string): boolean {
  return url.includes("/api/auth/login");
}

function authHeaders(url: string, hasBody: boolean): Record<string, string> {
  const headers: Record<string, string> = {};
  if (hasBody) headers["Content-Type"] = "application/json";
  if (!isLoginRequest(url)) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function parseResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (res.status === 401) {
    clearToken();
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
  }

  if (!res.ok) {
    throw new Error(data?.error || text || `Erro ${res.status}`);
  }

  return data as T;
}

export const api = {
  get: async <T = any>(url: string): Promise<T> => {
    const res = await fetch(url, { headers: authHeaders(url, false) });
    return parseResponse<T>(res);
  },
  post: async <T = any>(url: string, data: any): Promise<T> => {
    const res = await fetch(url, {
      method: "POST",
      headers: authHeaders(url, true),
      body: JSON.stringify(data),
    });
    return parseResponse<T>(res);
  },
  put: async <T = any>(url: string, data: any): Promise<T> => {
    const res = await fetch(url, {
      method: "PUT",
      headers: authHeaders(url, true),
      body: JSON.stringify(data),
    });
    return parseResponse<T>(res);
  },
  delete: async <T = any>(url: string): Promise<T> => {
    const res = await fetch(url, { method: "DELETE", headers: authHeaders(url, false) });
    return parseResponse<T>(res);
  },
};