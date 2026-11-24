import type { StoreItem } from '@dmd/shared';

/** Everything here costs in-game bytes. There is no real-money purchase path, by design. */
export const STORE_ITEMS: StoreItem[] = [
  { id: 'pickaxe-ethernet', name: 'Ethernet Pickaxe', description: 'Cosmetic. Wired for success.', kind: 'cosmetic', price: 500 },
  { id: 'helmet-led', name: 'RGB Helmet', description: 'Cosmetic. +0 performance, +100 style.', kind: 'cosmetic', price: 1_200 },
  { id: 'boost-coffee', name: 'Java Jolt', description: 'Booster. Double dig speed for 60 seconds.', kind: 'booster', price: 300 },
  { id: 'boost-defrag', name: 'Defrag Draught', description: 'Booster. Instantly collects every device on every level, once.', kind: 'booster', price: 800 },
];
