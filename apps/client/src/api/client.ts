import type {
  LeaderboardEntry,
  LeaderboardSubmission,
  LevelDef,
  PurchaseRequest,
  PurchaseResponse,
  StoreItem,
} from '@dmd/shared';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...init?.headers },
  });
  // The purchase endpoint returns a typed error body with 4xx; let callers read it.
  if (!res.ok && res.status !== 402 && res.status !== 404) {
    throw new Error(`${init?.method ?? 'GET'} ${path} failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export const api = {
  level: (depth: number) => request<LevelDef>(`/levels/${depth}`),
  leaderboard: (limit = 20) => request<LeaderboardEntry[]>(`/leaderboard?limit=${limit}`),
  submitScore: (s: LeaderboardSubmission) =>
    request<LeaderboardEntry>('/leaderboard', { method: 'POST', body: JSON.stringify(s) }),
  storeItems: () => request<StoreItem[]>('/store'),
  purchase: (p: PurchaseRequest) =>
    request<PurchaseResponse>('/store/purchase', { method: 'POST', body: JSON.stringify(p) }),
};
