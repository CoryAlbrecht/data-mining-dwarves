import { describe, expect, it } from 'vitest';
import { migrateSavedLevel, migratePort, type StoredLevel } from './saveMigrations.ts';

describe('migratePort', () => {
  it('keeps a port saved before technology ids on the same technology', () => {
    const saved = [0, 1, 2, 3, 4, 5].map((tech) => migratePort({ tech, level: 3, duplex: true, passed: 2 }).tech);
    expect(saved).toEqual([
      'net:serial',
      'net:ethernet-1m',
      'net:token-ring-2m',
      'net:ethernet-10m',
      'net:fast-ethernet',
      'net:gigabit',
    ]);
  });

  it('keeps the rest of an old port as it was', () => {
    expect(migratePort({ tech: 1, level: 3, duplex: true, passed: 2 })).toEqual({
      tech: 'net:ethernet-1m',
      level: 3,
      duplex: true,
      passed: 2,
    });
  });

  it('leaves a port that already has a technology id alone', () => {
    const port = { tech: 'net:gigabit', level: 2, duplex: false, passed: 0 } as const;
    expect(migratePort(port)).toEqual(port);
  });
});

describe('migrateSavedLevel', () => {
  it('loads a Mine saved before technology ids with its port on the same technology', () => {
    const old: StoredLevel = {
      depth: 3,
      blocks: [],
      devices: [],
      exit: { buried: false, remaining: 0 },
      buffers: [],
      automated: [2],
      port: { tech: 2, level: 4, duplex: false, passed: 1 },
    };
    expect(migrateSavedLevel(old)).toEqual({
      ...old,
      port: { tech: 'net:token-ring-2m', level: 4, duplex: false, passed: 1 },
    });
  });
});
