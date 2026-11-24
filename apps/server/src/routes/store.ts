import { Hono } from 'hono';
import type { PurchaseRequest, PurchaseResponse } from '@dmd/shared';
import { STORE_ITEMS } from '../data/store.ts';

export const store = new Hono()
  .get('/', (c) => c.json(STORE_ITEMS))
  .post('/purchase', async (c) => {
    const body = (await c.req.json().catch(() => null)) as Partial<PurchaseRequest> | null;
    const item = STORE_ITEMS.find((i) => i.id === body?.itemId);
    if (!item) return c.json<PurchaseResponse>({ ok: false, error: 'No such item' }, 404);
    const balance = Number(body?.balance);
    // TODO(economy): trusts the client's balance for now; move wallets server-side.
    if (!Number.isFinite(balance) || balance < item.price) {
      return c.json<PurchaseResponse>({ ok: false, error: 'Not enough bytes. Keep digging!' }, 402);
    }
    return c.json<PurchaseResponse>({ ok: true, item, balance: balance - item.price });
  });
