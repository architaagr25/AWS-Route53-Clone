/**
 * Typed API client for the FastAPI backend.
 *
 * - Reads the backend base URL from NEXT_PUBLIC_API_URL.
 * - Stores the session token in localStorage and attaches it to every request.
 * - Surfaces backend error messages (the `detail` field) as a thrown ApiError,
 *   so UI code can show them in toasts / inline form errors.
 */
import type {
  BulkResult,
  DnsRecord,
  HostedZone,
  LoginResponse,
  RecordInput,
  RecordList,
  User,
  ZoneCreateInput,
  ZoneList,
} from "./types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

const TOKEN_KEY = "r53_token";

// --- token storage (client-side only) ---
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window !== "undefined") window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window !== "undefined") window.localStorage.removeItem(TOKEN_KEY);
}

/** Error carrying the HTTP status and the backend's human-readable message. */
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 204) return undefined as T; // No Content (e.g. delete)

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // FastAPI puts the message in `detail`; it may be a string or a list.
    const detail = (data as { detail?: unknown }).detail;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail) && detail[0]?.msg
        ? detail[0].msg
        : `Request failed (${res.status})`;
    throw new ApiError(res.status, message);
  }
  return data as T;
}

// --- Auth ---
export const auth = {
  login: (username: string, password: string) =>
    request<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  me: () => request<User>("/api/auth/me"),
  logout: () => request<{ detail: string }>("/api/auth/logout", { method: "POST" }),
};

// --- Hosted Zones ---
export const zones = {
  list: (params: { search?: string; page?: number; page_size?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.set("search", params.search);
    if (params.page) q.set("page", String(params.page));
    if (params.page_size) q.set("page_size", String(params.page_size));
    const qs = q.toString();
    return request<ZoneList>(`/api/zones${qs ? `?${qs}` : ""}`);
  },
  get: (id: string) => request<HostedZone>(`/api/zones/${id}`),
  create: (data: ZoneCreateInput) =>
    request<HostedZone>("/api/zones", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: { comment: string }) =>
    request<HostedZone>(`/api/zones/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  remove: (id: string) =>
    request<void>(`/api/zones/${id}`, { method: "DELETE" }),
};

// --- DNS Records ---
export const records = {
  list: (
    zoneId: string,
    params: { search?: string; type?: string; page?: number; page_size?: number } = {}
  ) => {
    const q = new URLSearchParams();
    if (params.search) q.set("search", params.search);
    if (params.type) q.set("type", params.type);
    if (params.page) q.set("page", String(params.page));
    if (params.page_size) q.set("page_size", String(params.page_size));
    const qs = q.toString();
    return request<RecordList>(`/api/zones/${zoneId}/records${qs ? `?${qs}` : ""}`);
  },
  create: (zoneId: string, data: RecordInput) =>
    request<DnsRecord>(`/api/zones/${zoneId}/records`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (recordId: number, data: Partial<RecordInput>) =>
    request<DnsRecord>(`/api/records/${recordId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  remove: (recordId: number) =>
    request<void>(`/api/records/${recordId}`, { method: "DELETE" }),
  bulkDelete: (zoneId: string, ids: number[]) =>
    request<BulkResult>(`/api/zones/${zoneId}/records/bulk-delete`, {
      method: "POST",
      body: JSON.stringify({ ids }),
    }),
};
