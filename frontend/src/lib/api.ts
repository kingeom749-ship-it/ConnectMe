import type { Department, InterestId } from "./data";

const BASE = process.env.REACT_APP_BACKEND_URL;
const API = BASE ? `${BASE}/api` : "";

export interface Person {
  id: string;
  name: string;
  phone_masked: string;
  picture: string;
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
  meetup: Meetup | null;
  contact_phone: string | null;
  is_demo: boolean;
}

export interface Meetup {
  lat: number;
  lng: number;
  label: string;
  status: "proposed" | "accepted" | "declined";
  proposed_by_me: boolean;
  proposed_at: string;
  accepted_at: string | null;
  meet_at: string | null;
}

export interface OtpSent {
  phone: string;
  mode: "sms" | "demo";
  demo_code?: string;
}

export interface Message {
  id: string;
  text: string;
  sender_id: string;
  mine: boolean;
  created_at: string;
  read_at: string | null;
}

export interface Conversation {
  person: Person;
  last_message: Message;
  unread: number;
}

export interface Thread {
  person: Person;
  messages: Message[];
  blocked_by_me: boolean;
  blocked_me: boolean;
}

export interface Block {
  person: Person;
  reason: string;
  created_at: string;
}

export interface Meta {
  total: number;
  interests: Partial<Record<InterestId, number>>;
  departments: Partial<Record<Department, number>>;
  otp_mode: "sms" | "demo";
}

export interface Inbox {
  incoming: LocationRequest[];
  outgoing: LocationRequest[];
}

interface Opts {
  method?: string;
  body?: unknown;
  token?: string;
  credentials?: RequestCredentials;
}

export interface GoogleIdentity {
  email: string;
  name: string;
  picture: string;
  session_token: string;
}

export type GoogleSessionResult =
  | { status: "signed_in"; person: Me; token: string }
  | ({ status: "needs_registration" } & GoogleIdentity);

async function req<T>(path: string, opts: Opts = {}): Promise<T> {
  if (!API) throw new Error("Backend is not configured");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.token) headers["X-Person-Token"] = opts.token;
  const res = await fetch(`${API}${path}`, {
    method: opts.method ?? "GET",
    headers,
    credentials: opts.credentials,
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
  verification_token: string;
  google_session_token?: string;
}

export const api = {
  meta: () => req<Meta>("/meta"),
  people: (params: Record<string, string>, token?: string) => {
    const s = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && s.set(k, v));
    return req<Person[]>(`/people?${s.toString()}`, { token });
  },
  register: (body: RegisterInput) => req<{ person: Me; token: string }>("/people", { method: "POST", body }),
  inbox: (token: string) => req<Inbox>("/location-requests", { token }),
  requestLocation: (token: string, target_id: string, note: string) =>
    req<LocationRequest>("/location-requests", { method: "POST", token, body: { target_id, note } }),
  respond: (token: string, id: string, body: { accept: boolean; lat?: number; lng?: number; accuracy?: number }) =>
    req<LocationRequest>(`/location-requests/${id}/respond`, { method: "POST", token, body }),
  revoke: (token: string, id: string) => req<LocationRequest>(`/location-requests/${id}/revoke`, { method: "POST", token }),
  cancel: (token: string, id: string) => req<LocationRequest>(`/location-requests/${id}/cancel`, { method: "POST", token }),
  sendOtp: (phone: string) => req<OtpSent>("/otp/send", { method: "POST", body: { phone } }),
  verifyOtp: (phone: string, code: string) =>
    req<{ phone: string; verification_token: string }>("/otp/verify", { method: "POST", body: { phone, code } }),
  proposeMeetup: (token: string, id: string, body: { lat: number; lng: number; label: string }) =>
    req<LocationRequest>(`/location-requests/${id}/meetup`, { method: "POST", token, body }),
  respondMeetup: (token: string, id: string, accept: boolean) =>
    req<LocationRequest>(`/location-requests/${id}/meetup/respond`, { method: "POST", token, body: { accept } }),
  conversations: (token: string) => req<Conversation[]>("/conversations", { token }),
  unread: (token: string) => req<{ count: number }>("/conversations/unread", { token }),
  thread: (token: string, otherId: string) => req<Thread>(`/conversations/${otherId}`, { token }),
  sendMessage: (token: string, otherId: string, text: string) =>
    req<Message[]>(`/conversations/${otherId}`, { method: "POST", token, body: { text } }),
  googleSession: (session_id: string) =>
    req<GoogleSessionResult>("/auth/google/session", { method: "POST", body: { session_id }, credentials: "include" }),
  authMe: () => req<{ person: Me; token: string }>("/auth/me", { credentials: "include" }),
  logout: (token: string) => req<{ ok: boolean }>("/auth/logout", { method: "POST", token, credentials: "include" }),
  blocks: (token: string) => req<Block[]>("/blocks", { token }),
  block: (token: string, otherId: string, body: { reason: string; report: boolean }) =>
    req<Block>(`/blocks/${otherId}`, { method: "POST", token, body }),
  unblock: (token: string, otherId: string) => req<{ ok: boolean }>(`/blocks/${otherId}`, { method: "DELETE", token }),
};
