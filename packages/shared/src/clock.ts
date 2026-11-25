/** Limits on how much game time the client credits at once. */
export const CLOCK = {
  /** Real time between game ticks. */
  tickMs: 100,
  /** Most offline time credited to Device output when the game loads (8 h). */
  maxOfflineSeconds: 8 * 60 * 60,
  /** Most game time one tick catches up after a backgrounded tab. */
  maxCatchUpSeconds: 5,
} as const;
