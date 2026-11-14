import { describe, it, expect } from 'vitest';
import {
  WEAPON_CATALOG,
  ARMOR_CATALOG,
  SKILL_CATALOG,
  CONSUMABLE_CATALOG,
  RELIC_CATALOG,
} from '../src/extensible/items/itemCatalog';
import { MATRIX_REGISTRY } from '../src/extensible/sprites/matrixRegistry';
import { PALETTE_REGISTRY, SPRITE_REGISTRY } from '../src/extensible/sprites/spriteRegistry';

const ALL_ITEMS = [
  ...Object.values(WEAPON_CATALOG),
  ...Object.values(ARMOR_CATALOG),
  ...Object.values(SKILL_CATALOG),
  ...Object.values(CONSUMABLE_CATALOG),
  ...Object.values(RELIC_CATALOG),
];

describe('item sprites (every catalog item has a registered pixel sprite)', () => {
  it('catalog is not empty', () => {
    expect(ALL_ITEMS.length).toBeGreaterThan(0);
  });

  it.each(ALL_ITEMS.map((item) => [item.id, item] as const))(
    '%s: spriteId resolves to an 8x8 or 32x32 grid (values 0-3) and a 4-color palette',
    (_id, item) => {
      const def = SPRITE_REGISTRY[item.spriteId];
      expect(def, `SPRITE_REGISTRY is missing "${item.spriteId}"`).toBeDefined();
      const grid = MATRIX_REGISTRY[def.matrixId];
      expect(grid, `MATRIX_REGISTRY is missing "${def.matrixId}"`).toBeDefined();
      expect([8, 32]).toContain(grid.length);
      for (const row of grid) {
        expect(row.length).toBe(grid.length);
        for (const v of row) expect([0, 1, 2, 3]).toContain(v);
      }
      const palette = PALETTE_REGISTRY[def.defaultPalette];
      expect(palette, `PALETTE_REGISTRY is missing "${def.defaultPalette}"`).toBeDefined();
      expect(palette.colors.length).toBe(4);
    },
  );
});
