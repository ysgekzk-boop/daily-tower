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

---

## 3. Mandatory Quality Gate Verification

Before committing or completing any daily agent task, you **MUST** run and pass:

```bash
# 1. Run all unit & simulation tests
npm test

# 2. Run TypeScript typecheck & production build
npm run build
```

Both commands must exit with code 0 with zero TypeScript diagnostics.
