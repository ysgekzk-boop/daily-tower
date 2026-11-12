import { MATRIX_REGISTRY, PixelGrid } from './matrixRegistry';

export interface PaletteConfig {
  id: string;
  name: string;
  colors: [string, string, string, string]; // 0 = transparent, 1 = primary/outline, 2 = fill, 3 = highlight/eyes
}

export const PALETTE_REGISTRY: Record<string, PaletteConfig> = {
  steel_knight: {
    id: 'steel_knight',
    name: '白銀の騎士',
    colors: ['transparent', '#475569', '#cbd5e1', '#f59e0b'],
  },
  crimson_knight: {
    id: 'crimson_knight',
    name: '紅蓮の覇者',
    colors: ['transparent', '#7f1d1d', '#ef4444', '#fde047'],
  },
  astral_mage: {
    id: 'astral_mage',
    name: '星詠みの魔導士',
    colors: ['transparent', '#312e81', '#818cf8', '#38bdf8'],
  },
  neon_cyber: {
    id: 'neon_cyber',
    name: 'ネオン・サイバー',
    colors: ['transparent', '#0f172a', '#22d3ee', '#f43f5e'],
  },
  emerald_slime: {
    id: 'emerald_slime',
    name: '翠緑',
    colors: ['transparent', '#065f46', '#10b981', '#fef08a'],
  },
  toxic_purple: {
    id: 'toxic_purple',
    name: '猛毒紫',
    colors: ['transparent', '#4c1d95', '#a855f7', '#4ade80'],
  },
  forest_goblin: {
    id: 'forest_goblin',
    name: '深森',
    colors: ['transparent', '#14532d', '#4ade80', '#ef4444'],
  },
  shadow_wolf: {
    id: 'shadow_wolf',
    name: '黒影',
    colors: ['transparent', '#1e293b', '#64748b', '#f43f5e'],
  },
  ancient_bark: {
    id: 'ancient_bark',
    name: '古樹',
    colors: ['transparent', '#451a03', '#15803d', '#fbbf24'],
  },
  molten_iron: {
    id: 'molten_iron',
    name: '熔鉄',
    colors: ['transparent', '#450a0a', '#ea580c', '#fef08a'],
  },
  frost_blue: {
    id: 'frost_blue',
    name: '氷晶',
    colors: ['transparent', '#1e3a8a', '#60a5fa', '#e0f2fe'],
  },
  golden_shrine: {
    id: 'golden_shrine',
    name: '黄金祭壇',
    colors: ['transparent', '#78350f', '#fbbf24', '#fef9c3'],
  },
};

export interface SpriteDefinition {
  id: string;
  matrixId: keyof typeof MATRIX_REGISTRY;
  defaultPalette: keyof typeof PALETTE_REGISTRY;
}

export const SPRITE_REGISTRY: Record<string, SpriteDefinition> = {
  hero_knight: { id: 'hero_knight', matrixId: 'hero_knight', defaultPalette: 'steel_knight' },
  hero_mage: { id: 'hero_mage', matrixId: 'hero_mage', defaultPalette: 'astral_mage' },
  hero_cyber: { id: 'hero_cyber', matrixId: 'hero_cyber', defaultPalette: 'neon_cyber' },
  slime: { id: 'slime', matrixId: 'slime', defaultPalette: 'emerald_slime' },
  goblin: { id: 'goblin', matrixId: 'goblin', defaultPalette: 'forest_goblin' },
  wolf: { id: 'wolf', matrixId: 'wolf', defaultPalette: 'shadow_wolf' },
  treant: { id: 'treant', matrixId: 'treant', defaultPalette: 'ancient_bark' },
  colossus: { id: 'colossus', matrixId: 'colossus', defaultPalette: 'molten_iron' },
  shrine: { id: 'shrine', matrixId: 'shrine', defaultPalette: 'golden_shrine' },
};

export function resolveSpriteData(spriteId: string, paletteOverride?: string): {
  grid: PixelGrid;
  palette: PaletteConfig;
} {
  const def = SPRITE_REGISTRY[spriteId] ?? SPRITE_REGISTRY.slime;
  const grid = MATRIX_REGISTRY[def.matrixId] ?? MATRIX_REGISTRY.slime;
  const paletteKey = paletteOverride && PALETTE_REGISTRY[paletteOverride] ? paletteOverride : def.defaultPalette;
  const palette = PALETTE_REGISTRY[paletteKey] ?? PALETTE_REGISTRY.emerald_slime;
  return { grid, palette };
}
