# Daily Tower — AI Agent Extension & Development Guide

Welcome, Agent (Antigravity / Muse / Gemini). This document outlines the strict autonomous production rules and extensible registry conventions for Daily Tower.

---

## 1. Directory Boundaries & Safety Rules

To prevent game loop regressions, code ownership is strictly partitioned:

| Directory | Ownership | Permission | Purpose |
| :--- | :--- | :--- | :--- |
| `src/core/` | **PROTECTED** | **READ-ONLY** | Core damage math, status decay, event resolver, storage validator, drop rules. **Never modify without explicit human instruction.** |
| `src/extensible/` | **OPEN** | **READ & WRITE** | Registries for enemies, status effects, events, items, relics, sprites, and 50-floor realms. |
| `src/store/` | Core Store | Minimal Edits | React state store for mid-floor persistence and UI bindings. |
| `src/components/` | UI Components | Presentation | 2D battle stage, modal views, pixel art canvas. |
| `tests/` | Quality Gates | Strict Pass | Vitest regression suites that MUST pass on every build. |

---

## 2. Daily Extension Playbook

### 2.1 Adding a New Enemy (`src/extensible/enemies/enemyRegistry.ts`)
1. Enemies **never heal**. Action types must be `'attack' | 'buff' | 'debuff'`.
2. Must have at least two phases sorted descending by `hpThresholdPercent` (first phase always 100%).
3. Referenced `spriteId`, `palette`, and `statusId` must exist in their respective registries.

```typescript
// Example:
my_golem: {
  id: 'my_golem',
  name: 'ルーン・ゴーレム',
  spriteId: 'colossus',
  palette: 'molten_iron',
  hp: 90,
  atk: 18,
  def: 6,
  goldReward: 25,
  phases: [
    {
      hpThresholdPercent: 100,
      actions: [
        { name: '岩石拳', type: 'attack', weight: 60, damageMultiplier: 1.0, logMessage: '岩石拳の一撃！' },
        { name: '硬質化', type: 'buff', weight: 40, statusId: 'shield', statusValue: 20, statusDuration: 2, logMessage: '障壁を展開した！' },
      ],
    },
    {
      hpThresholdPercent: 40,
      phaseName: '過負荷',
      actions: [
        { name: 'メテオスマッシュ', type: 'attack', weight: 80, damageMultiplier: 1.6, logMessage: '【過負荷】渾身のメテオスマッシュ！' },
      ],
    },
  ],
}
```

### 2.2 Adding a New Status Effect (`src/extensible/statusEffects/statusRegistry.ts`)
1. Provide a unique snake_case `id`, category (`'buff' | 'debuff'`), stacking rule (`'refresh' | 'stack_value' | 'extend_duration' | 'none'`).
2. If `stacking === 'stack_value'`, `maxValue` is required.
3. If `blocksAction === true`, `maxDuration` must be 1–2 turns (no infinite locks).
4. Implement at least one lifecycle phase hook (`turn_start`, `pre_action`, `action_resolution`, `post_action`, `turn_end`).

### 2.3 Adding an Event (`src/extensible/events/eventRegistry.ts`)
1. **Strict Invariant: No pure-negative events.** Every choice with a cost must provide a tangible positive reward.
2. Must include at least one free/safe option so the player is never forced into taking damage.

### 2.4 Adding Skills, Weapons, Armors & Relics (`src/extensible/items/itemCatalog.ts`)
- Skills must declare `maxChargesPerBattle: number` (1 to 3 uses per combat).
- Relics must declare an `effectId` matching an entry in `src/extensible/effects/effectRegistry.ts`.
- Every item must declare a `spriteId` of the form `item_<item id>` (see §2.7). `tests/item_sprites.test.ts` fails when an item has no registered sprite.

### 2.7 Item Sprites (`src/extensible/sprites/`)
- Items are drawn with the same pixel-sprite system as enemies: an 8×8 grid in `MATRIX_REGISTRY` (`src/extensible/sprites/matrixRegistry.ts`), a 4-color palette in `PALETTE_REGISTRY`, and an entry in `SPRITE_REGISTRY` (`src/extensible/sprites/spriteRegistry.ts`), all keyed `item_<item id>`.
- Grid values: 0 = transparent, 1 = dark tone / outline, 2 = main fill, 3 = highlight / accent. Palette `colors` follow the same order (`['transparent', dark, main, accent]`).
- Style rules for a consistent look: one centered silhouette per icon, readable at 24px; bladed weapons use a diagonal composition (tip top-right, handle bottom-left); armor uses a torso silhouette; keep the accent color (index 3) to small details — gems, glows, buckles, drops.
- When adding an item, add its matrix + palette + sprite entry in the same change, and eyeball it next to the existing item sprites (a contact sheet) before committing.

### 2.5 Multi-Enemy Battles & AoE Skills
- A battle encounter may list `enemyIds: string[]` (1–3 enemies) instead of a single `enemyId`. The player selects a target for single-target attacks/skills; each enemy keeps its own HP, statuses and AI phases and acts in encounter order. Victory requires defeating **all** enemies; gold rewards are summed. Miniboss and Apex encounters stay solo.
- A skill may declare `targetScope: 'all_enemies'` so its damage and enemy-targeted status hit every living enemy (default: `'single'`). Keep AoE multipliers below single-target equivalents.
- `CombatEngine.createBattleSession` accepts `EnemyDefinition | EnemyDefinition[]`; sessions expose `enemies[]` / `enemyDefs[]` / `totalGoldReward`.

### 2.6 Playtest Simulation (`src/sim/`, `tests/playtest_simulation.test.ts`)
- `PlaytestBot` (`src/sim/playtestBot.ts`) plays the game with fixed heuristics (focus-fire lowest HP, AoE vs groups, heal thresholds, reward/event choices). `simulateRun` / `simulateMany` (`src/sim/runSimulation.ts`) run full 1–100F playthroughs with seeded RNG and aggregate clear rates, death hotspots and end-of-floor HP.
- Run it via `npm test` (the report test prints the balance report). Use it after any balance-affecting change: new floors, enemies, items or engine rules. The bot is dev tooling only — never import `src/sim/` from the app.

---

### 2.8 Item Stat Bands (the recorded upgrade progression)

Item data carries raw stats only — there is no tier field. The bands below are
the record of how equipment and skills scale, and every new item must fit the
band of its debut block. "Strictly better/worse" between two items is derived
from raw stats at runtime (`DropPacingEngine.isWeaponDominated` /
`isArmorDominated`): for weapons, same element + higher ATK wins; for armor,
higher DEF and HP bonus wins. Blocks are 10 floors each (B1 = floors 1–10).

- **Weapon ATK by block:** B1 13–16 / B2 16–19 / B3 19–22 / B4 21–24 /
  B5 24–27 / B6 27–31 / B7 30–34 / B8 33–37 / B9 37–41 / B10 41–45.
  Elements: B1–B5 physical / nature only. B6–B10 fire / void / physical
  (at least one fire or void weapon per block).
- **Armor DEF / HP bonus by block:** B1 4–5 / 22–30, B2 5–6 / 30–40,
  B3 6–7 / 38–48, B4 7–8 / 46–58, B5 8–9 / 55–68, B6 9–10 / 62–75,
  B7 10–11 / 72–85, B8 11–12 / 82–95, B9 11–13 / 90–105, B10 12–14 / 100–115.
- **Skills (7 per block):** attack ×3 (one with a status, one high-multiplier
  low-charge, one with a rider effect), heal ×1, buff ×1, debuff ×1, free ×1.
  Caps: single-target damage multiplier ≤ 1.75, all-enemies ≤ 0.85 (AoE only
  from B6, at most once per two blocks), heal ≤ 40% or ≤ 55 flat, charges
  1–3, self-buff ≤ 30%, shield ≤ 20% of max HP. Skills have no element of
  their own (the weapon's element applies).
- **Relics (2 per block):** effects must compose from the existing
  `effectRegistry` vocabulary. Caps: on-hit heal ≤ 5% of max HP, battle-start
  shield ≤ 15% of max HP, buffs ≤ 25%, victory gold ≤ +20.
- **Consumables (2 per block):** healPercent 30–55, optional cleanse,
  self-status from registered statuses only (shield ≤ 35, atk/def buff
  ≤ 20%, duration ≤ 3), maxCharges 2–3. Consumables never enter the normal
  reward draw (miniboss item cards and event grants only).
- **New realms:** a realm's first block restarts near the dimensional-leap
  baseline gear (weapon ATK ≈ 13–19, armor DEF ≈ 4–6 / HP ≈ 15–30) instead
  of continuing the previous realm's last band, then grows ≈ +3 ATK per
  block within the realm, mirroring the B1→B5 slope. Weapon elements follow
  the new realm's own pool design.

## 3. Mandatory Quality Gate Verification

Before committing or completing any daily agent task, you **MUST** run and pass:

```bash
# 1. Run all unit & simulation tests
npm test

# 2. Run TypeScript typecheck & production build
npm run build
```

Both commands must exit with code 0 with zero TypeScript diagnostics.
