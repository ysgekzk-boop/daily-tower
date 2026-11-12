import { EFFECT_REGISTRY} from '../extensible/effects/effectRegistry';
import { EnemyAction, EnemyDefinition, EnemyPhase} from '../extensible/enemies/types';
import {
ArmorItem,
ConsumableItem,
RelicItem,
SkillItem,
WeaponItem,
} from '../extensible/items/itemCatalog';
import { ActiveStatusInstance} from '../extensible/statusEffects/types';
import { StatusEngine} from './StatusEngine';

export interface CombatantState {
name: string;
currentHp: number;
maxHp: number;
baseAtk: number;
baseDef: number;
statuses: ActiveStatusInstance[];
}

export interface BattleSessionState {
turn: number;
player: CombatantState;
/** Enemies in encounter order; index = target selection index. Max 3. */
enemies: CombatantState[];
enemyDefs: EnemyDefinition[];
/** Sum of every enemy's goldReward; paid out once on victory. */
totalGoldReward: number;
skillCharges: [number, number, number]; // Remaining uses in this battle for slots 0, 1, 2
consumableCharges: number;
logs: string[];
status: 'ongoing' | 'victory' | 'defeat';
}

export interface PlayerLoadout {
weapon: WeaponItem;
armor: ArmorItem;
skills: [SkillItem | null, SkillItem | null, SkillItem | null];
consumable: ConsumableItem | null;
relic: RelicItem | null;
}

export type PlayerCommand =
| { type: 'attack'; targetIndex?: number}
| { type: 'skill'; slotIndex: 0 | 1 | 2; targetIndex?: number}
| { type: 'consumable'};

export const MAX_ENEMIES_PER_BATTLE = 3;

export class CombatEngine {
static createBattleSession(
playerCurrentHp: number,
playerMaxHp: number,
consumableCharges: number,
loadout: PlayerLoadout,
enemyDef: EnemyDefinition | EnemyDefinition[],
statScale = 1.0
): BattleSessionState {
const defs = (Array.isArray(enemyDef)? enemyDef: [enemyDef]).slice(
0,
MAX_ENEMIES_PER_BATTLE
);

const scale = (def: EnemyDefinition) => ({
hp: Math.max(10, Math.round(def.hp * statScale)),
atk: Math.max(2, Math.round(def.atk * statScale)),
def: Math.max(0, Math.round(def.def * statScale)),
});
const scaled = defs.map(scale);

let playerStatuses: ActiveStatusInstance[] = [];
const enemyStatusesList: ActiveStatusInstance[][] = defs.map(() => []);
const logs: string[] = [
defs.length > 1
? `⚔️ ${defs.map((d) => d.name).join(' と ')} があらわれた！`
: `⚔️ ${defs[0].name} があらわれた！`,
];

// Trigger battle_start relic if equipped (context: first enemy)
if (loadout.relic) {
const eff = EFFECT_REGISTRY[loadout.relic.effectId];
if (eff && eff.trigger === 'battle_start') {
const res = eff.handler({
playerCurrentHp,
playerMaxHp,
playerAtk: loadout.weapon.atk,
playerDef: loadout.armor.def,
enemyCurrentHp: scaled[0].hp,
enemyMaxHp: scaled[0].hp,
turnNumber: 1,
});
if (res.applyStatusToPlayer) {
const applied = StatusEngine.applyStatus(playerStatuses, res.applyStatusToPlayer);
playerStatuses = applied.nextList;
}
if (res.applyStatusToEnemy) {
const applied = StatusEngine.applyStatus(enemyStatusesList[0], res.applyStatusToEnemy);
enemyStatusesList[0] = applied.nextList;
}
if (res.logMessage) logs.push(res.logMessage);
}
}

const skillCharges: [number, number, number] = [
loadout.skills[0]?.maxChargesPerBattle?? 0,
loadout.skills[1]?.maxChargesPerBattle?? 0,
loadout.skills[2]?.maxChargesPerBattle?? 0,
];

return {
turn: 1,
player: {
name: 'プレイヤー',
currentHp: Math.min(playerCurrentHp, playerMaxHp),
maxHp: playerMaxHp,
baseAtk: loadout.weapon.atk,
baseDef: loadout.armor.def,
statuses: playerStatuses,
},
enemies: defs.map((def, i) => ({
name: def.name,
currentHp: scaled[i].hp,
maxHp: scaled[i].hp,
baseAtk: scaled[i].atk,
baseDef: scaled[i].def,
statuses: enemyStatusesList[i],
})),
enemyDefs: defs,
totalGoldReward: defs.reduce((sum, d) => sum + d.goldReward, 0),
skillCharges,
consumableCharges,
logs,
status: 'ongoing',
};
}

/**
* Computes damage using Spec §4.3:
* 1. Flat modifiers on Base ATK & DEF
* 2. Paired Rate modifiers (1.0 + sum(BuffRate) - sum(DebuffRate))
* 3. Effective ATK - Effective DEF, multiplied by skillMultiplier
* 4. Shield absorption
*/
static calculateDamage(
attacker: CombatantState,
defender: CombatantState,
skillMultiplier: number,
turnNumber: number
): {
finalHpDamage: number;
shieldAbsorbed: number;
nextDefenderStatuses: ActiveStatusInstance[];
} {
const atkSummary = StatusEngine.runPhase('action_resolution', attacker.statuses, {
ownerCurrentHp: attacker.currentHp,
ownerMaxHp: attacker.maxHp,
opponentCurrentHp: defender.currentHp,
opponentMaxHp: defender.maxHp,
turnNumber,
});

const defSummary = StatusEngine.runPhase('action_resolution', defender.statuses, {
ownerCurrentHp: defender.currentHp,
ownerMaxHp: defender.maxHp,
opponentCurrentHp: attacker.currentHp,
opponentMaxHp: attacker.maxHp,
turnNumber,
});

// 1. Flat Base
const rawAtk = Math.max(1, attacker.baseAtk + atkSummary.flatAtkBonus);
const rawDef = Math.max(0, defender.baseDef + defSummary.flatDefBonus);

// 2. Paired Multiplier Resolution
const atkMult = Math.max(0.1, 1.0 + atkSummary.atkRateBonus);
const defMult = Math.max(0.1, 1.0 + defSummary.defRateBonus);

// 3. Effective Stats
const effAtk = rawAtk * atkMult;
const effDef = rawDef * defMult;

const baseMitigated = Math.max(1, Math.floor(effAtk - effDef * 0.65));
const rawDamage = Math.max(
1,
Math.round(baseMitigated * skillMultiplier * defSummary.incomingMultiplier)
);

// 4. Shield Absorption
const shieldRes = StatusEngine.consumeShield(defender.statuses, rawDamage);

return {
finalHpDamage: shieldRes.remainingDamage,
shieldAbsorbed: shieldRes.absorbed,
nextDefenderStatuses: shieldRes.nextStatuses,
};
}

/**
* Selects active enemy phase and picks an action by weight.
*/
static selectEnemyAction(
enemy: CombatantState,
enemyDef: EnemyDefinition,
rng: () => number = Math.random
): { phase: EnemyPhase; action: EnemyAction} {
const hpPercent = (enemy.currentHp / enemy.maxHp) * 100;
// Sort phases ascending to find the lowest threshold that current HP satisfies
const matchingPhases = [...enemyDef.phases]
.filter((p) => hpPercent <= p.hpThresholdPercent)
.sort((a, b) => a.hpThresholdPercent - b.hpThresholdPercent);

const activePhase = matchingPhases[0]?? enemyDef.phases[0];
const totalWeight = activePhase.actions.reduce((acc, a) => acc + Math.max(1, a.weight), 0);
let roll = rng() * totalWeight;

for (const action of activePhase.actions) {
roll -= Math.max(1, action.weight);
if (roll <= 0) {
return { phase: activePhase, action};
}
}

return {
phase: activePhase,
action: activePhase.actions[activePhase.actions.length - 1],
};
}

/** Indices of enemies still standing, in encounter order. */
private static aliveIndices(session: BattleSessionState): number[] {
const out: number[] = [];
session.enemies.forEach((e, i) => {
if (e.currentHp > 0) out.push(i);
});
return out;
}

/** Picks the commanded target if it is alive, else the first living enemy. */
private static resolveTargetIndex(
session: BattleSessionState,
targetIndex?: number
): number {
if (
targetIndex!== undefined &&
session.enemies[targetIndex] &&
session.enemies[targetIndex].currentHp > 0
) {
return targetIndex;
}
return CombatEngine.aliveIndices(session)[0]?? 0;
}

/**
* Executes a full turn:
* 1. Player turn_start & pre_action
* 2. Player action (attack, skill[0..2], or consumable) against the
* selected target — or every living enemy for `targetScope: 'all_enemies'`
* 3. Check enemy defeats (victory only when ALL enemies fall)
* 4. Each living enemy, in order: turn_start, pre_action, phased AI action
* 5. Both sides' turn_end decay
*/
static executeTurn(
session: BattleSessionState,
playerCommand: PlayerCommand,
loadout: PlayerLoadout,
environmentalRule?: {
everyNTurns: number;
statusId: string;
value: number;
duration: number;
},
rng: () => number = Math.random
): BattleSessionState {
if (session.status!== 'ongoing') return session;

const next: BattleSessionState = {
...session,
player: {...session.player, statuses: [...session.player.statuses]},
enemies: session.enemies.map((e) => ({...e, statuses: [...e.statuses]})),
enemyDefs: session.enemyDefs,
skillCharges: [...session.skillCharges] as [number, number, number],
logs: [...session.logs],
};

next.logs.push(`── ${next.turn}ターン目 ──`);

// Environmental realm condition (e.g. Realm 2 Sunken Foundry burn every 3 turns)
if (environmentalRule && next.turn % environmentalRule.everyNTurns === 0) {
const envInstance: ActiveStatusInstance = {
statusId: environmentalRule.statusId,
value: environmentalRule.value,
duration: environmentalRule.duration,
};
next.player.statuses = StatusEngine.applyStatus(next.player.statuses, envInstance).nextList;
for (const enemy of next.enemies) {
if (enemy.currentHp > 0) {
enemy.statuses = StatusEngine.applyStatus(enemy.statuses, envInstance).nextList;
}
}
next.logs.push(`🌋 周囲の熱波により双方に状態異常が付与された！`);
}

const primaryIdx = CombatEngine.resolveTargetIndex(
next,
playerCommand.type === 'consumable'? undefined: playerCommand.targetIndex
);
const primary = next.enemies[primaryIdx];

// 1. Player turn_start
const pTurnStart = StatusEngine.runPhase('turn_start', next.player.statuses, {
ownerCurrentHp: next.player.currentHp,
ownerMaxHp: next.player.maxHp,
opponentCurrentHp: primary.currentHp,
opponentMaxHp: primary.maxHp,
turnNumber: next.turn,
});
next.logs.push(...pTurnStart.logs);
if (pTurnStart.totalDamage > 0) {
next.player.currentHp = Math.max(0, next.player.currentHp - pTurnStart.totalDamage);
}
if (pTurnStart.totalHeal > 0) {
next.player.currentHp = Math.min(next.player.maxHp, next.player.currentHp + pTurnStart.totalHeal);
}
if (next.player.currentHp <= 0) {
next.status = 'defeat';
next.logs.push('💀 力尽きた…');
return next;
}

// 2. Player pre_action
const pPreAction = StatusEngine.runPhase('pre_action', next.player.statuses, {
ownerCurrentHp: next.player.currentHp,
ownerMaxHp: next.player.maxHp,
opponentCurrentHp: primary.currentHp,
opponentMaxHp: primary.maxHp,
turnNumber: next.turn,
});
next.logs.push(...pPreAction.logs);

/** Logs a defeat line for every enemy that dropped to 0 since `beforeHp`. */
const logNewDefeats = (beforeHp: number[]) => {
next.enemies.forEach((enemy, i) => {
if (beforeHp[i] > 0 && enemy.currentHp <= 0) {
next.logs.push(`🏆 ${enemy.name} を撃破した！`);
}
});
};
const allEnemiesDown = () => next.enemies.every((e) => e.currentHp <= 0);

if (!pPreAction.skipAction) {
if (playerCommand.type === 'attack') {
const target = next.enemies[primaryIdx];
const beforeHp = next.enemies.map((e) => e.currentHp);
const dmgRes = CombatEngine.calculateDamage(next.player, target, 1.0, next.turn);
target.statuses = dmgRes.nextDefenderStatuses;
target.currentHp = Math.max(0, target.currentHp - dmgRes.finalHpDamage);
const absorbNote = dmgRes.shieldAbsorbed > 0? ` (障壁が${dmgRes.shieldAbsorbed}吸収)`: '';
next.logs.push(
`🗡️ ${loadout.weapon.name}で攻撃！ ${target.name}に ${dmgRes.finalHpDamage} ダメージ！${absorbNote}`
);

// Relic on_attack trigger
if (loadout.relic) {
const eff = EFFECT_REGISTRY[loadout.relic.effectId];
if (eff && eff.trigger === 'on_attack') {
const rRes = eff.handler({
playerCurrentHp: next.player.currentHp,
playerMaxHp: next.player.maxHp,
playerAtk: next.player.baseAtk,
playerDef: next.player.baseDef,
enemyCurrentHp: target.currentHp,
enemyMaxHp: target.maxHp,
turnNumber: next.turn,
});
if (rRes.healPlayer) {
next.player.currentHp = Math.min(next.player.maxHp, next.player.currentHp + rRes.healPlayer);
}
if (rRes.logMessage) next.logs.push(rRes.logMessage);
}
}
logNewDefeats(beforeHp);
} else if (playerCommand.type === 'skill') {
const idx = playerCommand.slotIndex;
const skill = loadout.skills[idx];
if (skill && next.skillCharges[idx] > 0) {
next.skillCharges[idx] -= 1;
next.logs.push(
`✨ スキル発動(残り${next.skillCharges[idx]}/${skill.maxChargesPerBattle}回)`
);

const hitsAll = skill.targetScope === 'all_enemies';
const damageTargets = hitsAll
? CombatEngine.aliveIndices(next)
: [primaryIdx];

if (skill.damageMultiplier && skill.damageMultiplier > 0) {
const beforeHp = next.enemies.map((e) => e.currentHp);
for (const ti of damageTargets) {
const target = next.enemies[ti];
const dmgRes = CombatEngine.calculateDamage(
next.player,
target,
skill.damageMultiplier,
next.turn
);
target.statuses = dmgRes.nextDefenderStatuses;
target.currentHp = Math.max(0, target.currentHp - dmgRes.finalHpDamage);
const absorbNote =
dmgRes.shieldAbsorbed > 0? ` (障壁が${dmgRes.shieldAbsorbed}吸収)`: '';
next.logs.push(`💥 ${target.name}に ${dmgRes.finalHpDamage} ダメージ！${absorbNote}`);
}
logNewDefeats(beforeHp);
}

if (skill.healPercent || skill.healFlat) {
const healAmt =
(skill.healFlat?? 0) +
Math.floor((next.player.maxHp * (skill.healPercent?? 0)) / 100);
next.player.currentHp = Math.min(next.player.maxHp, next.player.currentHp + healAmt);
next.logs.push(`💚 HPを ${healAmt} 回復した！`);
}

if (skill.cleanse) {
const cRes = StatusEngine.cleanseDebuffs(next.player.statuses);
next.player.statuses = cRes.nextList;
if (cRes.removedCount > 0) {
next.logs.push(`✨ 状態異常を ${cRes.removedCount} 個浄化した！`);
}
}

if (skill.applyStatus) {
const instance: ActiveStatusInstance = {
statusId: skill.applyStatus.statusId,
value: skill.applyStatus.value,
duration: skill.applyStatus.duration,
};
if (skill.applyStatus.target === 'self') {
const app = StatusEngine.applyStatus(next.player.statuses, instance);
next.player.statuses = app.nextList;
if (app.log) next.logs.push(app.log);
} else {
const statusTargets = hitsAll
? CombatEngine.aliveIndices(next)
: [primaryIdx];
for (const ti of statusTargets) {
const target = next.enemies[ti];
const app = StatusEngine.applyStatus(target.statuses, instance);
target.statuses = app.nextList;
if (app.log) next.logs.push(`${target.name}に ${app.log}`);
}
}
}

// Relic on_skill_use trigger (context: primary target)
if (loadout.relic) {
const eff = EFFECT_REGISTRY[loadout.relic.effectId];
if (eff && eff.trigger === 'on_skill_use') {
const target = next.enemies[primaryIdx];
const rRes = eff.handler({
playerCurrentHp: next.player.currentHp,
playerMaxHp: next.player.maxHp,
playerAtk: next.player.baseAtk,
playerDef: next.player.baseDef,
enemyCurrentHp: target.currentHp,
enemyMaxHp: target.maxHp,
turnNumber: next.turn,
});
if (rRes.applyStatusToEnemy) {
const app = StatusEngine.applyStatus(target.statuses, rRes.applyStatusToEnemy);
target.statuses = app.nextList;
}
if (rRes.logMessage) next.logs.push(rRes.logMessage);
}
}
}
} else if (playerCommand.type === 'consumable') {
const cons = loadout.consumable;
if (cons && next.consumableCharges > 0) {
next.consumableCharges -= 1;
next.logs.push(`🧪 消耗品を使用！(残り${next.consumableCharges}チャージ)`);
if (cons.healPercent) {
const healAmt = Math.floor((next.player.maxHp * cons.healPercent) / 100);
next.player.currentHp = Math.min(next.player.maxHp, next.player.currentHp + healAmt);
next.logs.push(`💚 HPが ${healAmt} 回復した！`);
}
if (cons.cleanse) {
const cRes = StatusEngine.cleanseDebuffs(next.player.statuses);
next.player.statuses = cRes.nextList;
if (cRes.removedCount > 0) {
next.logs.push(`✨ デバフをすべて浄化した！`);
}
}
if (cons.applyStatus) {
const app = StatusEngine.applyStatus(next.player.statuses, {
statusId: cons.applyStatus.statusId,
value: cons.applyStatus.value,
duration: cons.applyStatus.duration,
});
next.player.statuses = app.nextList;
if (app.log) next.logs.push(app.log);
}
}
}
}

// Victory only once every enemy is down
if (allEnemiesDown()) {
next.status = 'victory';
return next;
}

// 3. Enemy phase: each living enemy acts in encounter order
for (let ei = 0; ei < next.enemies.length; ei++) {
const enemy = next.enemies[ei];
if (enemy.currentHp <= 0) continue;
const enemyDef = next.enemyDefs[ei];

// Enemy turn_start (damage-over-time can finish it before it acts)
const eTurnStart = StatusEngine.runPhase('turn_start', enemy.statuses, {
ownerCurrentHp: enemy.currentHp,
ownerMaxHp: enemy.maxHp,
opponentCurrentHp: next.player.currentHp,
opponentMaxHp: next.player.maxHp,
turnNumber: next.turn,
});
for (const l of eTurnStart.logs) {
next.logs.push(`[${enemy.name}] ${l}`);
}
if (eTurnStart.totalDamage > 0) {
enemy.currentHp = Math.max(0, enemy.currentHp - eTurnStart.totalDamage);
}
if (eTurnStart.totalHeal > 0) {
enemy.currentHp = Math.min(enemy.maxHp, enemy.currentHp + eTurnStart.totalHeal);
}
if (enemy.currentHp <= 0) {
next.logs.push(`🏆 状態異常ダメージにより ${enemy.name} を撃破した！`);
if (allEnemiesDown()) {
next.status = 'victory';
return next;
}
continue;
}

// Enemy pre_action
const ePreAction = StatusEngine.runPhase('pre_action', enemy.statuses, {
ownerCurrentHp: enemy.currentHp,
ownerMaxHp: enemy.maxHp,
opponentCurrentHp: next.player.currentHp,
opponentMaxHp: next.player.maxHp,
turnNumber: next.turn,
});
for (const l of ePreAction.logs) {
next.logs.push(`[${enemy.name}] ${l}`);
}

if (!ePreAction.skipAction) {
const { action} = CombatEngine.selectEnemyAction(enemy, enemyDef, rng);
next.logs.push(`👾 ${action.logMessage}`);

if (action.damageMultiplier && action.damageMultiplier > 0) {
const dmgRes = CombatEngine.calculateDamage(
enemy,
next.player,
action.damageMultiplier,
next.turn
);
next.player.statuses = dmgRes.nextDefenderStatuses;
next.player.currentHp = Math.max(0, next.player.currentHp - dmgRes.finalHpDamage);
const absorbNote =
dmgRes.shieldAbsorbed > 0? ` (障壁が${dmgRes.shieldAbsorbed}吸収)`: '';
next.logs.push(
`🩸 ${enemy.name}の攻撃！ プレイヤーに ${dmgRes.finalHpDamage} ダメージ！${absorbNote}`
);
}

if (action.statusId && action.statusDuration) {
const instance: ActiveStatusInstance = {
statusId: action.statusId,
value: action.statusValue?? 20,
duration: action.statusDuration,
};
if (action.type === 'buff') {
const app = StatusEngine.applyStatus(enemy.statuses, instance);
enemy.statuses = app.nextList;
if (app.log) next.logs.push(`[${enemy.name}] ${app.log}`);
} else if (action.type === 'debuff') {
const app = StatusEngine.applyStatus(next.player.statuses, instance);
next.player.statuses = app.nextList;
if (app.log) next.logs.push(`[プレイヤー] ${app.log}`);
}
}
}

if (next.player.currentHp <= 0) {
next.status = 'defeat';
next.logs.push('💀 力尽きた…');
return next;
}
}

// 4. Turn End duration decay
const pEnd = StatusEngine.tickTurnEnd(next.player.statuses);
next.player.statuses = pEnd.nextStatuses;

for (const enemy of next.enemies) {
const eEnd = StatusEngine.tickTurnEnd(enemy.statuses);
enemy.statuses = eEnd.nextStatuses;
}

next.turn += 1;
return next;
}
}
