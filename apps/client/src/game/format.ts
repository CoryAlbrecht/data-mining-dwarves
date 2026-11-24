const UNITS = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB'];

/** Bytes with retro 1024-based units: 1536 → "1.5 kB". */
export function formatBytes(n: number): string {
  if (n < 1024) return `${n < 10 ? n.toFixed(1).replace(/\.0$/, '') : Math.floor(n)} B`;
  const exp = Math.min(UNITS.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  return `${(n / 1024 ** exp).toFixed(2).replace(/\.?0+$/, '')} ${UNITS[exp]}`;
}

/** 30 → "30s", 95 → "1m 35s", 3960 → "1h 6m". */
export function formatDuration(seconds: number): string {
  const s = Math.round(seconds);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m${s % 60 ? ` ${s % 60}s` : ''}`;
  const m = Math.floor((s % 3600) / 60);
  return `${Math.floor(s / 3600)}h${m ? ` ${m}m` : ''}`;
}
