import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { Block, Conversation, Inbox, Me, Meta, Person, Thread } from "./api";
import { useSession } from "./session";

const EMPTY_INBOX: Inbox = { incoming: [], outgoing: [] };

export function useMeta() {
  const q = useQuery<Meta>({ queryKey: ["meta"], queryFn: api.meta, retry: 1 });
  return q.data ?? null;
}

export function usePeople(params: Record<string, string>) {
  const { active } = useSession();
  const token = active?.token ?? "";
  return useQuery<Person[]>({ queryKey: ["people", params, token], queryFn: () => api.people(params, token || undefined), retry: 1 });
}

export function useMe() {
  const { active } = useSession();
  const token = active?.token ?? "";
  return useQuery<Me>({ queryKey: ["me", token], queryFn: () => api.me(token), enabled: Boolean(token), retry: 1 });
}

export function useBlocks() {
  const { active } = useSession();
  const token = active?.token ?? "";
  return useQuery<Block[]>({ queryKey: ["blocks", token], queryFn: () => api.blocks(token), enabled: Boolean(token), retry: 1 });
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

export function useConversations() {
  const { active } = useSession();
  const token = active?.token ?? "";
  return useQuery<Conversation[]>({
    queryKey: ["conversations", token],
    queryFn: () => api.conversations(token),
    enabled: Boolean(token),
    refetchInterval: 5000,
    retry: 1,
  });
}

export function useUnreadCount() {
  const { active } = useSession();
  const token = active?.token ?? "";
  const q = useQuery<{ count: number }>({
    queryKey: ["unread", token],
    queryFn: () => api.unread(token),
    enabled: Boolean(token),
    refetchInterval: 8000,
    retry: 1,
  });
  return q.data?.count ?? 0;
}

export function useThread(otherId: string | undefined) {
  const { active } = useSession();
  const token = active?.token ?? "";
  return useQuery<Thread>({
    queryKey: ["thread", token, otherId],
    queryFn: () => api.thread(token, otherId as string),
    enabled: Boolean(token && otherId),
    refetchInterval: 3000,
    retry: 1,
  });
}

export function useRefresh() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["inbox"] });
    qc.invalidateQueries({ queryKey: ["people"] });
    qc.invalidateQueries({ queryKey: ["meta"] });
    qc.invalidateQueries({ queryKey: ["conversations"] });
    qc.invalidateQueries({ queryKey: ["unread"] });
    qc.invalidateQueries({ queryKey: ["thread"] });
    qc.invalidateQueries({ queryKey: ["blocks"] });
    qc.invalidateQueries({ queryKey: ["me"] });
  };
}
