# Daily Tower - Autonomous Production Specification v4 for Antigravity & Muse

## Revision Notes (v4, 2026-11-12)

Changes from v3, decided by the user and refined with Muse:

1. **Enemy AI Action Patterns (§4.6, §5.1):** Enemies do not heal. Action choices are attacks, buffs, and debuffs. Actions use an HP-threshold phase table: early in battle, actions are selected from a random pool; as HP drops, stronger actions (damage multipliers, status debuffs) gain higher weight or become available in enraged phases.
2. **Event Platform (§5.5):** Events are now an extensible platform under `src/extensible/events/` (matching statuses and effects). Strict rule: **No pure-negative events** (traps that only inflict damage/loss). Trade-offs (paying HP/gold for rewards) and pure-positive choices are allowed.
3. **Skill Resource / Battle Charges (§3.2):** Skills have a `maxChargesPerBattle` (1–3 uses per combat encounter), fully refreshed at the start of every battle. Basic attacks remain infinite, but encounters are balanced so that players must strategically utilize skill charges to survive.
4. **Encounter-Granular Autosave & State Resilience (§7):** Autosave occurs at the start of each encounter and upon floor/reward completion. Reloading resumes mid-floor at the current encounter index with current HP and charges preserved, preventing reset-marathons while handling browser closures cleanly.
5. **Multiplicative & Paired Damage/Buff Pipeline (§4.7):** Flat and percentage modifiers are decoupled. Base ATK/DEF are modified by flat effects, then modified multiplicatively by paired positive/negative multipliers before final damage resolution and shield absorption.
6. **Balance Tuning Strategy (§5.6):** Prototype-first approach. Initial enemies and equipment are deployed with estimated values, verified via headless combat simulation tests in Vitest, and refined into standardized scaling baseline formulas iteratively.
7. **Dimensional Leap Evolution (§6.2):** Soft-reset upon defeating the 50F Apex Arbiter. Equipment and skills reset to the next Realm's baseline power. Instead of permanent combat stat boosts (which cause endless power creep), players receive **Cosmetic Gems** (for pixel art skins, UI color themes, prestige titles) and their run build is permanently recorded in a shareable **Run Archive**.

---

## 1. System Overview & Deployment Target

### 1.1 Architecture & Pipeline Overview
```text
[Gemini / Tasks]
  └─ Daily Concept Draft (Google Docs: Theme, dialogue, 1 daily floor, boss mechanics)
       │
[Muse]
  └─ Refines spec & generates strict prompt for Antigravity CLI
       │
[Antigravity CLI]
  └─ Branch -> Add extensible data/code -> Run Vitest & Build -> Git Push / PR
       │
[GitHub Actions -> Cloudflare Pages]
  └─ Auto-deployed globally at edge (Zero bandwidth limits, free commercial support)
```

### 1.2 Target Deployment: Cloudflare Pages
- **Framework:** Vite + React + TypeScript + Tailwind CSS (Pure Client-Side SPA)
- **Hosting:** Cloudflare Pages (Free Plan: Unlimited bandwidth, up to 500 builds/month, commercial-friendly)
- **Build Command:** `npm run build`
- **Build Output Directory:** `dist`

---

## 2. Directory Boundaries & AI Modification Rules

Antigravity CLI agents are constrained to specific directories to prevent core regressions.

```text
src/
├── core/                  # [PROTECTED - HUMAN ONLY] Core game loop & engine
│   ├── CombatEngine.ts    # Turn resolution, damage math & skill charges
│   ├── StatusEngine.ts    # Status lifecycle, duration decay & stacking arbitration ONLY
│   ├── EventEngine.ts     # Event resolution & choice consequence handling
│   ├── FloorRunner.ts     # Encounter sequence progression within a floor
│   ├── StorageValidator.ts# Save data integrity & checkpoint fallback
│   ├── SaveSlotManager.ts # 3-slot save persistence, switching & summaries
│   ├── DropPacingEngine.ts# Enforces reward scarcity and consumable distribution
│   └── AreaEngine.ts      # 50-Floor realm leap & normalization logic
├── extensible/            # [OPEN FOR DAILY AGENT UPDATES]
│   ├── effects/           # AI registers custom active/passive handlers
│   │   ├── effectRegistry.ts
│   │   └── types.ts
│   ├── statusEffects/     # AI registers status effect definitions (see §4)
│   │   ├── statusRegistry.ts
│   │   └── types.ts
│   ├── events/            # AI registers daily events (shrine, merchant, rest, choices)
│   │   ├── eventRegistry.ts
│   │   └── types.ts
│   ├── enemies/           # AI defines enemy stats and phased action AI tables
│   │   ├── enemyRegistry.ts
│   │   └── types.ts
│   ├── sprites/           # AI adds pixel grids & palette variants
│   │   ├── matrixRegistry.ts
│   │   └── spriteRegistry.ts
│   ├── items/             # AI defines daily weapons, skills, consumables, relics
│   │   └── itemCatalog.ts
│   └── realms/            # Partitioned 50-floor area datasets (floor = encounter sequence)
│       ├── realm_01_greenwood.ts  (Floors 1-50)
│       ├── realm_02_volcano.ts    (Floors 51-100)
│       └── realmIndex.ts
├── store/
│   └── useGameStore.ts    # 6-slot inventory, mid-floor state & persist store
└── components/            # UI, Canvas renderer, and modals
```

---

## 3. Inventory Architecture & Skill Battle Charges

The player inventory maintains an invariant capacity of **exactly 6 slots**:

| Slot Name | Count | Type Rule | Overwrite / Replacement Rule |
| :--- | :---: | :--- | :--- |
| **Weapon** | 1 | Flat ATK & element | Overwrite old weapon or salvage into Gold. |
| **Armor** | 1 | Flat DEF & Max HP bonus | Overwrite old armor or salvage into Gold. |
| **Skills** | 3 | Attack, Heal, Buff, Debuff | Free to equip any 3. If all 3 are filled, choose 1 to replace. |
| **Consumable** | 1 | Usable item (Max 2-3 charges, **Scarce**) | Charges do NOT automatically refill. Strategic preservation required. |
| **Relic (Passive)**| 1 | Trigger-based permanent aura | Overwrite old relic or salvage into Gold. |

### 3.1 Consumable Scarcity & Refill Protocol
1. **No Routine Drop:** Consumables are **prohibited** from standard non-boss floor reward card slots.
2. **Designated Replenishment Nodes:**
   - **Rest Events:** Guaranteed at least once every 4–5 floors (§5.2). Player chooses: 50% HP recovery OR +1 Consumable charge.
   - **Apex Boss Victories (Floor 50, 100, etc.):** Guaranteed +1 consumable charge upon Dimensional Leap.
   - **Rare Elite Reward (~15% probability):** Offered on Card 3 only for designated miniboss encounters.

### 3.2 Skill Battle Charges
- Each equipped skill declares `maxChargesPerBattle: number` (typically 1 to 3).
- **At the start of every combat encounter**, all equipped skills reset to full charges.
- Once a skill's charges reach 0, it cannot be cast again during that battle.
- The standard **Basic Attack** (equipped weapon) has unlimited uses.
- Combat balance requires using skills strategically: spamming them early may leave the player helpless against an enraged boss phase, while hoarding them leads to defeat from attrition.

---

## 4. Combat, Status Platform & Damage Pipeline

### 4.1 Status Effect Registry (`src/extensible/statusEffects/`)

Status definitions declare their category, stacking rules, and lifecycle phase hooks:

```typescript
export type StatusCategory = 'buff' | 'debuff' | 'neutral';
export type StackingRule = 'refresh' | 'stack_value' | 'extend_duration' | 'none';
export type LifecyclePhase = 'turn_start' | 'pre_action' | 'action_resolution' | 'post_action' | 'turn_end';

export interface StatusContext {
  value: number;            // Current potency
  duration: number;         // Remaining turns
  ownerCurrentHp: number;
  ownerMaxHp: number;
  opponentCurrentHp: number;
  opponentMaxHp: number;
  turnNumber: number;
}

export interface StatusResult {
  damageDealt?: number;
  healAmount?: number;
  skipAction?: boolean;              // e.g. freeze
  outgoingDamageMultiplier?: number; // e.g. atk_buff
  incomingDamageMultiplier?: number; // e.g. def_debuff
  absorbAmount?: number;             // e.g. shield
  logMessage: string;
}

export interface StatusDefinition {
  id: string;                       // Unique, snake_case
  name: string;
  category: StatusCategory;
  stacking: StackingRule;
  maxValue?: number;                // Required when stacking = 'stack_value'
  maxDuration?: number;
  cleansable: boolean;
  blocksAction?: boolean;
  hooks: Partial<Record<LifecyclePhase, (ctx: StatusContext) => StatusResult>>;
}
```

### 4.2 Initial Registered Statuses (Paired Design)
Buffs and debuffs exist in symmetric pairs:

| ID | Category | Counterpart | Hook / Behaviour |
| :--- | :--- | :--- | :--- |
| `atk_buff` | buff | `atk_debuff` | `action_resolution`: Multiplies outgoing damage |
| `atk_debuff`| debuff | `atk_buff` | `action_resolution`: Reduces outgoing damage multiplier |
| `def_buff` | buff | `def_debuff` | `action_resolution`: Reduces incoming damage multiplier |
| `def_debuff`| debuff | `def_buff` | `action_resolution`: Increases incoming damage multiplier |
| `shield` | buff | — | `action_resolution`: Absorbs incoming damage up to `value` |
| `burn` | debuff | — | `turn_start`: Damage = % of owner's max HP |
| `poison` | debuff | — | `turn_start`: Damage scales with accumulated `value` |
| `freeze` | debuff | — | `blocksAction: true`, duration 1 |

### 4.3 Damage Resolution Pipeline
`CombatEngine` resolves attacks in strict deterministic phases:
1. **Raw Base:** `RawAtk = WeaponAtk + FlatBuffs - FlatDebuffs`
2. **Multiplier Resolution:**
   $$\text{AtkMult} = \max(0.1, 1.0 + \sum \text{AtkBuffRates} - \sum \text{AtkDebuffRates})$$
   $$\text{DefMult} = \max(0.1, 1.0 + \sum \text{DefBuffRates} - \sum \text{DefDebuffRates})$$
3. **Effective Stats:**
   $$\text{EffAtk} = \text{RawAtk} \times \text{AtkMult}$$
   $$\text{EffDef} = (\text{ArmorDef} + \text{FlatDefBuffs}) \times \text{DefMult}$$
4. **Calculated Damage:**
   $$\text{RawDamage} = \max(1, \lfloor \text{EffAtk} - \text{EffDef} \rfloor) \times \text{SkillMultiplier}$$
5. **Shield Absorption:** If target has `shield`, shield absorbs damage first; leftover penetrates to HP.

### 4.4 Enemy Action Model & Phased AI (`src/extensible/enemies/`)
Enemies **never heal**. Their actions consist of attacks, buffs, and debuffs.

```typescript
export type EnemyActionType = 'attack' | 'buff' | 'debuff';

export interface EnemyAction {
  name: string;
  type: EnemyActionType;
  weight: number;                // Probability weight
  damageMultiplier?: number;     // For attacks (e.g. 1.0, 1.8)
  statusId?: string;             // References STATUS_REGISTRY
  statusValue?: number;
  statusDuration?: number;
  logMessage: string;
}

export interface EnemyPhase {
  hpThresholdPercent: number;    // Active when HP <= threshold (e.g. 100, 50, 25)
  actions: EnemyAction[];        // Weighted pool for this phase
}

export interface EnemyDefinition {
  id: string;
  name: string;
  spriteId: string;
  palette: string;
  hp: number;
  atk: number;
  def: number;
  phases: EnemyPhase[];          // Ordered from highest threshold to lowest
}
```
- **Phase Selection:** `FloorRunner` chooses the highest-priority phase whose `hpThresholdPercent >= (currentHp / maxHp) * 100`.
- **Early Game vs Low HP:** At 100% HP, enemy uses basic attacks and minor buffs with balanced weights. When HP falls (e.g., < 40%), an enraged phase triggers with heavier damage multipliers or multi-turn debuffs.

---

## 5. Floor, Encounter & Event Structure

### 5.1 Encounter Sequence
Floors are fixed sequences executed deterministically:
```typescript
export type EncounterType = 'battle' | 'event' | 'miniboss' | 'apex_boss';

export interface Encounter {
  type: EncounterType;
  enemyId?: string;   // For battle / miniboss / apex_boss
  eventId?: string;   // For event
}

export interface FloorDefinition {
  floor: number;
  realm: number;
  encounters: Encounter[];
}
```

### 5.2 Floor Composition Rules
- **Standard Floor:** 3–5 `battle` + exactly 1 `event`. The event is never first or last.
- **Miniboss Floor (every 5F):** 2–3 `battle`, then optional `event`, ending with `miniboss`.
- **Apex Floor (every 50F):** 0–2 `battle`, exactly 1 `event` (preparation), ending with `apex_boss`.
- **Rest Guarantee:** Within any 5 consecutive floors, at least one event must be a `rest` event.

### 5.3 Extensible Event Platform (`src/extensible/events/`)
Events allow rich text, trade-offs, and rewards, but **strictly prohibit pure negative outcomes**:

```typescript
export interface EventOption {
  label: string;
  description: string;
  cost?: {
    gold?: number;
    hpPercent?: number;          // Sacrificial trade-off (% of max HP)
  };
  outcome: {
    healHpPercent?: number;
    refillConsumable?: number;
    grantGold?: number;
    grantItemType?: 'weapon' | 'armor' | 'skill' | 'relic';
    logMessage: string;
  };
}

export interface GameEventDefinition {
  id: string;
  title: string;
  description: string;
  speakerSpriteId?: string;
  options: EventOption[];        // Must contain at least 1 safe or beneficial option
}
```
- **Invariant:** An option cannot have a `cost` without an accompanying positive `outcome`. Traps that deal unavoidable damage with no reward are disallowed.

### 5.4 Carry-Over & Rewards
- **HP carries over** between battles within a floor. No automatic between-battle healing.
- **Skill charges reset to max** at each battle start (§3.2).
- **Consumable charges carry over** across the run and require deliberate replenishment.
- **Per-battle reward:** Gold only.
- **Floor-clear reward:** 3-card choice (Card 1: Equipment, Card 2: Skill, Card 3: Utility/Relic).

### 5.5 Balance Tuning: Prototype-to-Baseline Strategy
1. **Phase 1 (Initial Prototype):** Realm 1 (Floors 1–10) begins with baseline heuristic numbers (e.g., F1: Player HP 100, Atk 12, Def 5; Enemy HP 35, Atk 8, Def 2).
2. **Phase 2 (Simulation Test):** A Vitest suite (`tests/combat_simulation.test.ts`) runs headless simulations comparing a "pure basic attack" build vs an "optimal skill-use" build.
3. **Phase 3 (Baseline Curves):** Once win-rates align (e.g., 90%+ win rate with skill usage, <20% win rate without skill usage), the formula is codified into `DropPacingEngine` for subsequent daily floors.

---

## 6. 50-Floor Area Reset, Cosmetics & Run Archive

### 6.1 World Progression Lore
- **Realm 1 (1–50):** *The Verdant Spire (樹海の塔)* -> Boss: **The Primordial Treant**
- **Realm 2 (51–100):** *The Sunken Foundry (黄昏の製鉄所)* -> Boss: **The Ashen Colossus**
- **Realm 3 (101–150):** *The Starless Library (虚空の図書館)* -> Boss: **The Chrono Archivist**

### 6.2 Dimensional Leap (Anti-Inflation & Cosmetic Economy)
Defeating the 50F Apex Arbiter triggers a Dimensional Leap:
1. **Gear & Stat Reset:** Weapon and Armor reset to the base tier of the new Realm to prevent runaway stat inflation. Skills and consumable charges are refreshed.
2. **Run Archive Entry:** The complete historical summary (Realm cleared, final equipment, skills used, total turns, timestamp) is permanently logged in `player.archive`. A one-click "Copy Share Text" exports the run summary for social sharing.
3. **Cosmetic Gems (Ascendant Gems):**
   - Grants **10–20 Cosmetic Gems** per 50F clear.
   - **No combat stat upgrades.** Gems are spent exclusively in the Cosmetic Wardrobe:
     - Player character sprite variants (Knight, Mage, Rogue, Retro 1-bit, Cyber-pixel).
     - Palette swatches for UI and battle backgrounds.
     - Titles and profile banners.

### 6.3 Death & Checkpoint
$$\text{RespawnFloor} = \max(\text{RealmStartFloor}, N - \min(30, \lfloor N \times 0.3 \rfloor))$$
- Checkpoints never fall behind the current Realm starting floor (F1, F51, F101...).
- Respawn floor starts clean from its first encounter. Gold and Cosmetic Gems are never lost.

### 6.4 Frontier Reached & Daily Update Visibility
- `src/extensible/realms/realmIndex.ts` dynamically computes `LATEST_AUTHORED_FLOOR`, `isFloorAuthored(floor)`, `getRecentAuthoredFloors()`, and `getRealmProgressSummary()` from `ALL_FLOORS`.
- **No Unauthored Corridor Play:** Upon clearing `LATEST_AUTHORED_FLOOR` (and whenever `initCurrentEncounter` encounters `!isFloorAuthored(currentFloor)`), `currentFloor` is saved at `LATEST_AUTHORED_FLOOR + 1` and the game enters the `frontier_reached` stage rather than launching a template fallback encounter.
  - When a new daily floor is later published, reloading or continuing automatically resumes at that newly authored floor.
  - Players who want to keep playing immediately are guided to create or switch to a new save slot via `SaveSlotModal`.
- **Update Visibility UI:** `UpdateLogModal` displays `LATEST_AUTHORED_FLOOR`, per-realm authored floor progress bars, and the most recently added floors.

### 6.5 Social Sharing (X / Twitter)
- Implemented client-side in `src/utils/share.ts` and `src/components/XShareButton.tsx` (zero server/Paid Functions required; shares attach `window.location.origin` to render the static `public/ogp.png` card).
- **Placements:** Title screen (current progress), Wardrobe Archive (cleared run record), Dimensional Leap screen (50F clear), and Defeat / Frontier Reached screens.
- **Character Budget & Fallback:** Text is constrained to `MAX_X_TEXT_WEIGHT = 250` weighted units (CJK = 2, ASCII = 1) with `#DailyTower` appended. If `window.open` is blocked by a popup blocker, the post text + URL is automatically copied to the clipboard with an inline user notice.

---

## 7. Autosave, Multi-Slot Persistence, Backup & Error Resilience

```typescript
export interface MidFloorState {
  currentFloor: number;
  currentEncounterIndex: number; // 0 to encounters.length - 1
  playerCurrentHp: number;
  consumableCharges: number;
}

export interface SaveData {
  version: 4;
  midFloor: MidFloorState;
  inventory: {
    weapon: WeaponItem;
    armor: ArmorItem;
    skills: [SkillItem | null, SkillItem | null, SkillItem | null];
    consumable: ConsumableItem | null;
    relic: RelicItem | null;
  };
  gold: number;
  cosmeticGems: number;
  unlockedCosmetics: string[];
  activeSkinSpriteId: string;
  activeSkinPaletteId: string;
  activeTitle: string;
  archive: RunArchiveRecord[];
}
```

1. **Multi-Slot Architecture (`SaveSlotManager.ts`):**
   - Supports **3 independent save slots** (`1 | 2 | 3`) managed via `SaveSlotModal` (accessible from the Title Screen and `frontier_reached` screen).
   - **Backward Compatibility:** Slot 1 uses `DAILY_TOWER_SAVE`, Slot 2 uses `DAILY_TOWER_SAVE_SLOT_2`, Slot 3 uses `DAILY_TOWER_SAVE_SLOT_3`, and the active slot is stored in `DAILY_TOWER_ACTIVE_SLOT`. Existing single-slot saves seamlessly map to Slot 1.
2. **Autosave Trigger & Quota Alert:** Fired at the beginning of each encounter and on floor reward resolution. If `localStorage.setItem` fails (e.g. private browsing or quota exceeded), `storageError` surfaces a dismissible warning banner in the UI.
3. **State Recovery:** Browser reload immediately restores the active slot's `currentFloor` and `currentEncounterIndex` with exact HP and consumables preserved (or `frontier_reached` if `!isFloorAuthored(currentFloor)`).
4. **Schema & Fallback:** If `localStorage` data fails schema validation or contains unregistered IDs:
   - Invalid equipment or skills revert to default starter items.
   - Floor position rolls back to the safe `RespawnFloor` start.
   - Permanent records (`gold`, `cosmeticGems`, `archive`) are strictly preserved.
5. **JSON Export / Import (`DataManagementModal.tsx`):** Players can export the active slot's save as a JSON file or clipboard text and restore it via `StorageValidator.parseAndHealSaveJson`.
6. **React ErrorBoundary (`ErrorBoundary.tsx`):** Wraps `<App />` in `src/main.tsx` to catch unexpected runtime errors and offer page reload, emergency JSON save export for the active slot, and confirmed slot reset.

---

## 8. Muse -> Antigravity Daily Prompt Template

```markdown
### Antigravity Task: Implement Daily Floor [X]
1. Domain:
   - Target File: `src/extensible/realms/realm_0X.ts`
   - Floor Number: [X] (Standard / Miniboss (5F) / Apex (50F) — per Spec §5.2)
2. Content Requirements:
   - Encounters: Ordered `encounters` array per Spec §5:
     - Standard: 3–5 battles + 1 event (event never first or last).
     - Enemies: Defined in `src/extensible/enemies/enemyRegistry.ts` with phased AI (Spec §4.4).
     - Event: Defined in `src/extensible/events/eventRegistry.ts` (Spec §5.3, no pure negative options).
   - Reward Cards (on floor clear):
     - Card 1: Equipment (Weapon OR Armor)
     - Card 2: Skill with `maxChargesPerBattle` (Attack, Heal, Buff, or Debuff)
     - Card 3: Utility (Relic OR Potion refill per scarcity rules)
   - Extensibility Rules:
     - New status effects go to `src/extensible/statusEffects/statusRegistry.ts`.
     - Do NOT edit `src/core/`.
3. Quality Gate:
   - Run `npm test` -> All tests pass:
     - `tests/floor_structure.test.ts` (encounter counts, boss positions, rest guarantee)
     - `tests/status_registry.test.ts` (hooks validity, paired multipliers)
     - `tests/event_registry.test.ts` (verifies no pure-negative events exist)
     - `tests/enemy_ai.test.ts` (verifies phases are ordered and weights are positive)
   - Run `npm run build` -> Zero TypeScript diagnostics.
```
