import type { Department, InterestId } from "./data";

const BASE = process.env.REACT_APP_BACKEND_URL;
const API = BASE ? `${BASE}/api` : "";

export interface Person {
  id: string;
  name: string;
  phone_masked: string;
  interests: InterestId[];
  department: Department;
  accepts_location_requests: boolean;
  is_demo: boolean;
  created_at: string;
}

export interface Me extends Person {
  phone: string;
}

export interface SharedLocation {
  lat: number;
  lng: number;
  accuracy_m: number | null;
  shared_at: string;
  expires_at: string;
}

export type RequestStatus = "pending" | "shared" | "declined" | "revoked" | "expired" | "cancelled";

export interface LocationRequest {
  id: string;
  status: RequestStatus;
  note: string;
  created_at: string;
  responded_at: string | null;
  counterpart: Person | null;
  location: SharedLocation | null;
  is_demo: boolean;
}

export interface Meta {
  total: number;
  interests: Partial<Record<InterestId, number>>;
  departments: Partial<Record<Department, number>>;
}

export interface Inbox {
  incoming: LocationRequest[];
  outgoing: LocationRequest[];
}

interface Opts {
  method?: string;
  body?: unknown;
  token?: string;
}

async function req<T>(path: string, opts: Opts = {}): Promise<T> {
  if (!API) throw new Error("Backend is not configured");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.token) headers["X-Person-Token"] = opts.token;
  const res = await fetch(`${API}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = data?.detail;
    const msg = typeof detail === "string" ? detail : Array.isArray(detail) ? String(detail[0]?.msg ?? "") : "";
    throw new Error(msg.replace(/^Value error, /, "") || "Something went wrong");
  }
  return data as T;
}

export interface RegisterInput {
  name: string;
  phone: string;
  interests: InterestId[];
  department: Department;
  accepts_location_requests: boolean;
}

export const api = {
  meta: () => req<Meta>("/meta"),
  people: (params: Record<string, string>) => {
    const s = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && s.set(k, v));
    return req<Person[]>(`/people?${s.toString()}`);
  },
  register: (body: RegisterInput) => req<{ person: Me; token: string }>("/people", { method: "POST", body }),
  inbox: (token: string) => req<Inbox>("/location-requests", { token }),
  requestLocation: (token: string, target_id: string, note: string) =>
    req<LocationRequest>("/location-requests", { method: "POST", token, body: { target_id, note } }),
  respond: (token: string, id: string, body: { accept: boolean; lat?: number; lng?: number; accuracy?: number }) =>
    req<LocationRequest>(`/location-requests/${id}/respond`, { method: "POST", token, body }),
  revoke: (token: string, id: string) => req<LocationRequest>(`/location-requests/${id}/revoke`, { method: "POST", token }),
  cancel: (token: string, id: string) => req<LocationRequest>(`/location-requests/${id}/cancel`, { method: "POST", token }),
};
