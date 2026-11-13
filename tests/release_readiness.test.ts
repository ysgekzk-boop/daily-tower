import { describe, expect, it } from 'vitest';
import { StorageValidator } from '../src/core/StorageValidator';
import {
  LATEST_AUTHORED_FLOOR,
  getRealmProgressSummary,
  getRecentAuthoredFloors,
  isFloorAuthored,
} from '../src/extensible/realms/realmIndex';
import {
  MAX_X_TEXT_WEIGHT,
  buildXIntentUrl,
  calcXWeight,
  formatArchiveXShareText,
  formatDefeatXShareText,
  formatProgressXShareText,
} from '../src/utils/share';

describe('StorageValidator.parseAndHealSaveJson', () => {
  it('accepts and restores a valid exported save JSON', () => {
    const base = StorageValidator.createDefaultSave();
    base.gold = 777;
    base.midFloor.currentFloor = 42;
    const res = StorageValidator.parseAndHealSaveJson(JSON.stringify(base));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.save.gold).toBe(777);
      expect(res.save.midFloor.currentFloor).toBe(42);
      expect(res.healed).toBe(false);
    }
  });

  it('rejects malformed JSON', () => {
    const res = StorageValidator.parseAndHealSaveJson('{not valid json');
    expect(res.ok).toBe(false);
  });

  it('rejects non-object JSON payloads and unrelated objects', () => {
    expect(StorageValidator.parseAndHealSaveJson('[1, 2, 3]').ok).toBe(false);
    expect(StorageValidator.parseAndHealSaveJson('"hello"').ok).toBe(false);
    expect(StorageValidator.parseAndHealSaveJson('{"foo":"bar"}').ok).toBe(false);
  });

  it('self-heals corrupted item IDs on import while preserving gold', () => {
    const raw = {
      version: 4,
      gold: 500,
      midFloor: { currentFloor: 10, currentEncounterIndex: 0, playerCurrentHp: 80, consumableCharges: 1 },
      inventory: {
        weapon: { id: 'nonexistent_sword' },
        armor: { id: 'leather_tunic' },
        skills: [null, null, null],
        consumable: null,
        relic: null,
      },
    };
    const res = StorageValidator.parseAndHealSaveJson(JSON.stringify(raw));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.healed).toBe(true);
      expect(res.save.gold).toBe(500);
      expect(res.save.inventory.weapon.id).toBe('rusty_shortsword');
    }
  });
});

describe('realmIndex update visibility helpers', () => {
  it('reports LATEST_AUTHORED_FLOOR >= 103 and detects authored vs fallback floors', () => {
    expect(LATEST_AUTHORED_FLOOR).toBeGreaterThanOrEqual(103);
    expect(isFloorAuthored(1)).toBe(true);
    expect(isFloorAuthored(LATEST_AUTHORED_FLOOR)).toBe(true);
    expect(isFloorAuthored(LATEST_AUTHORED_FLOOR + 1)).toBe(false);
  });

  it('returns recent authored floors in descending order starting from LATEST_AUTHORED_FLOOR', () => {
    const recent = getRecentAuthoredFloors(5);
    expect(recent).toHaveLength(5);
    expect(recent[0].floor).toBe(LATEST_AUTHORED_FLOOR);
    for (let i = 1; i < recent.length; i++) {
      expect(recent[i - 1].floor).toBeGreaterThan(recent[i].floor);
    }
  });

  it('summarizes realm authored progress accurately', () => {
    const summary = getRealmProgressSummary();
    expect(summary.length).toBeGreaterThanOrEqual(3);
    expect(summary[0].authoredCount).toBe(50);
    expect(summary[0].totalCount).toBe(50);
    expect(summary[1].authoredCount).toBe(50);
    expect(summary[1].totalCount).toBe(50);
    expect(summary[2].authoredCount).toBeGreaterThanOrEqual(3);
    expect(summary[2].totalCount).toBe(50);
  });
});

describe('X share text formatting and weight limits', () => {
  it('keeps archive share text within X weight limit and includes #DailyTower', () => {
    const text = formatArchiveXShareText(
      {
        id: 'archive_test',
        realm: 2,
        realmName: '黄昏の製鉄所・非常に長い領域名テスト',
        clearedFloor: 100,
        timestamp: '2026-11-12T00:00:00.000Z',
        weaponName: 'とても長い名前の伝説の炎の大剣＋99',
        armorName: 'とても長い名前の黒曜石の重装鎧＋99',
        skillNames: ['とても長い名前の必殺技一', 'とても長い名前の必殺技二', 'とても長い名前の必殺技三'],
        relicName: 'とても長い名前の古の聖遺物',
        goldEarned: 99999,
        gemsAwarded: 15,
      },
      '【伝説の塔の踏破者】'
    );
    expect(text).toContain('#DailyTower');
    expect(calcXWeight(text)).toBeLessThanOrEqual(MAX_X_TEXT_WEIGHT);
  });

  it('keeps progress and defeat share texts within X weight limit and includes #DailyTower', () => {
    const progress = formatProgressXShareText({
      floor: 103,
      realmName: '虚空の図書館',
      weaponName: '星詠みの銀剣',
      activeTitle: '【塔の挑戦者】',
      maxFloorReached: 103,
    });
    expect(progress).toContain('#DailyTower');
    expect(calcXWeight(progress)).toBeLessThanOrEqual(MAX_X_TEXT_WEIGHT);

    const defeat = formatDefeatXShareText({
      floor: 50,
      realmName: '樹海の塔',
      activeTitle: '【塔の挑戦者】',
      respawnFloor: 46,
    });
    expect(defeat).toContain('#DailyTower');
    expect(calcXWeight(defeat)).toBeLessThanOrEqual(MAX_X_TEXT_WEIGHT);
  });

  it('builds a valid twitter intent URL with text and optional url', () => {
    const url = buildXIntentUrl('テスト投稿 #DailyTower', 'https://daily-tower.pages.dev');
    expect(url).toMatch(/^https:\/\/twitter\.com\/intent\/tweet\?/);
    expect(url).toContain('DailyTower');
    expect(url).toContain(encodeURIComponent('https://daily-tower.pages.dev'));
  });
});
