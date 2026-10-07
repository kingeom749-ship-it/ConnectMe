import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { Inbox, Meta, Person } from "./api";
import { useSession } from "./session";

const EMPTY_INBOX: Inbox = { incoming: [], outgoing: [] };

export function useMeta() {
  const q = useQuery<Meta>({ queryKey: ["meta"], queryFn: api.meta, retry: 1 });
  return q.data ?? null;
}

export function usePeople(params: Record<string, string>) {
  return useQuery<Person[]>({ queryKey: ["people", params], queryFn: () => api.people(params), retry: 1 });
}

export function useInbox() {
  const { active } = useSession();
  const token = active?.token ?? "";
  const q = useQuery<Inbox>({
    queryKey: ["inbox", token],
    queryFn: () => api.inbox(token),
    enabled: Boolean(token),
    refetchInterval: 12000,
    retry: 1,
  });
  return { inbox: q.data ?? EMPTY_INBOX, loading: q.isLoading && Boolean(token), error: q.error as Error | null };
}

export function useRefresh() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["inbox"] });
    qc.invalidateQueries({ queryKey: ["people"] });
    qc.invalidateQueries({ queryKey: ["meta"] });
  };
}
