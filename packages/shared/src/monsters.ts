import type { MonsterDef, MonsterId } from './types.ts';

export const MONSTERS: Record<MonsterId, MonsterDef> = {
  bug: { glyph: 'ж', id: 'bug', name: 'Bug', pun: "It's not a feature.", hp: 6, bounty: 25 },
  worm: { glyph: '∿', id: 'worm', name: 'Worm', pun: 'Spreads itself thin.', hp: 10, bounty: 60 },
  troll: { glyph: 'Ŧ', id: 'troll', name: 'Forum Troll', pun: 'Actually, well, um…', hp: 18, bounty: 150 },
  phisher: { glyph: '¶', id: 'phisher', name: 'Phisher', pun: 'Wants your pass-word.', hp: 26, bounty: 300 },
  'kernel-panic': { glyph: '☠',
    id: 'kernel-panic',
    name: 'Kernel Panic',
    pun: "Don't panic. It will.",
    hp: 50,
    bounty: 900,
  },
};
