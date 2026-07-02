export type PhpUser = {
  id: number;
  name: string;
  email: string;
};

export type PhpProject = {
  id: number;
  title: string;
  preview?: string;
  updated_at?: string;
  created_at?: string;
};

export type PhpOrder = {
  id: number;
  project_id?: number | null;
  title: string;
  preview?: string;
  status: string;
  created_at?: string;
};

export type PhpProduct = {
  id: number;
  title: string;
  description: string;
  price: number;
  image_url?: string;
  front_image_url?: string;
  back_image_url?: string;
  sort_order?: number;
  active?: number | boolean;
};

export type PhpBrilogImage = {
  id: number;
  brilog_id: number;
  image_url: string;
  sort_order?: number;
};

export type PhpBrilog = {
  id: number;
  title: string;
  description: string;
  price: number;
  image_url?: string;
  images?: PhpBrilogImage[];
  sort_order?: number;
  active?: number | boolean;
};

export type PhpCatalogImage = {
  id: number;
  product_id: number;
  image_url: string;
  sort_order?: number;
};

export type PhpCatalogProduct = {
  id: number;
  catalog_id: number;
  title: string;
  description: string;
  price: number;
  image_url?: string;
  images?: PhpCatalogImage[];
  sort_order?: number;
  active?: number | boolean;
  catalog_slug?: string;
  catalog_title?: string;
};

export type PhpCatalog = {
  id: number;
  slug: string;
  title: string;
  description: string;
  products?: PhpCatalogProduct[];
  sort_order?: number;
  active?: number | boolean;
};

export type PhpAdmin = {
  id: number;
  email: string;
};

export const PHP_API_URL = process.env.NEXT_PUBLIC_PHP_API_URL ?? "https://test4.ayu.edu.kz/cardforge-api";
export const AUTH_TOKEN_KEY = "cardforge.php.token";
export const AUTH_USER_KEY = "cardforge.php.user";
export const ADMIN_TOKEN_KEY = "cardforge.php.admin.token";
export const ADMIN_USER_KEY = "cardforge.php.admin.user";

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(AUTH_USER_KEY);
  return raw ? (JSON.parse(raw) as PhpUser) : null;
}

export function getStoredToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(AUTH_TOKEN_KEY) ?? "";
}

export function storeSession(user: PhpUser, token: string) {
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearSession() {
  window.localStorage.removeItem(AUTH_USER_KEY);
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function getStoredAdmin() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(ADMIN_USER_KEY);
  return raw ? (JSON.parse(raw) as PhpAdmin) : null;
}

export function getStoredAdminToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(ADMIN_TOKEN_KEY) ?? "";
}

export function storeAdminSession(admin: PhpAdmin, token: string) {
  window.localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(admin));
  window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminSession() {
  window.localStorage.removeItem(ADMIN_USER_KEY);
  window.localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export async function phpRequest<T>(path: string, options: RequestInit = {}) {
  const token = getStoredToken();
  const response = await fetch(`${PHP_API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}

export async function phpAdminRequest<T>(path: string, options: RequestInit = {}) {
  const token = getStoredAdminToken();
  const response = await fetch(`${PHP_API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}
