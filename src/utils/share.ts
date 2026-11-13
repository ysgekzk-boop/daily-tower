import type { RunArchiveRecord } from '../core/AreaEngine';

/**
 * Conservative X (Twitter) weighted character length:
 * ASCII characters count as 1, non-ASCII (CJK, emoji, etc.) count as 2.
 * X allows 280 weighted units total; reserving ~25 units for the attached URL + separator
 * leaves 255 weighted units for the tweet text itself.
 */
export const MAX_X_TEXT_WEIGHT = 250;
const HASHTAG = '#DailyTower';

export function calcXWeight(text: string): number {
  let weight = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    weight += code <= 0x7f ? 1 : 2;
  }
  return weight;
}

export function fitLinesToXWeight(lines: string[], maxWeight = MAX_X_TEXT_WEIGHT): string {
  const hashtagWeight = calcXWeight(`\n${HASHTAG}`);
  const budget = Math.max(40, maxWeight - hashtagWeight);

  const kept: string[] = [];
  let used = 0;

  for (const line of lines) {
    const sep = kept.length > 0 ? 1 : 0;
    const w = calcXWeight(line) + sep;
    if (used + w <= budget) {
      kept.push(line);
      used += w;
    } else if (kept.length === 0) {
      // Truncate the first line if even a single line exceeds budget
      let trimmed = '';
      let tw = 0;
      for (const ch of line) {
        const cw = (ch.codePointAt(0) ?? 0) <= 0x7f ? 1 : 2;
        if (tw + cw + 2 > budget) break;
        trimmed += ch;
        tw += cw;
      }
      kept.push(`${trimmed}…`);
      break;
    }
  }

  return `${kept.join('\n')}\n${HASHTAG}`;
}

export function formatArchiveXShareText(
  record: RunArchiveRecord,
  activeTitle?: string
): string {
  const titlePrefix = activeTitle ? `${activeTitle} ` : '';
  const skillsShort =
    record.skillNames.length === 0
      ? 'なし'
      : record.skillNames.length <= 2
        ? record.skillNames.join(' / ')
        : `${record.skillNames[0]} / ${record.skillNames[1]} 他${record.skillNames.length - 2}`;

  const lines = [
    `🏰 ${titlePrefix}Daily Tower「${record.realmName}」(${record.clearedFloor}F) 制覇！`,
    `⚔️ ${record.weaponName} / 🛡️ ${record.armorName}`,
    `✨ ${skillsShort} / 🔮 ${record.relicName}`,
    `💎 +${record.gemsAwarded} | 💰 ${record.goldEarned}G`,
  ];

  return fitLinesToXWeight(lines);
}

export function formatProgressXShareText(params: {
  floor: number;
  realmName: string;
  weaponName: string;
  activeTitle?: string;
  maxFloorReached?: number;
}): string {
  const titlePrefix = params.activeTitle ? `${params.activeTitle} ` : '';
  const bestNote =
    params.maxFloorReached && params.maxFloorReached > params.floor
      ? `（最高 第${params.maxFloorReached}層）`
      : '';
  const lines = [
    `🗼 ${titlePrefix}Daily Tower 第${params.floor}層「${params.realmName}」に挑戦中！${bestNote}`,
    `⚔️ 装備: ${params.weaponName}`,
  ];
  return fitLinesToXWeight(lines);
}

export function formatDefeatXShareText(params: {
  floor: number;
  realmName: string;
  activeTitle?: string;
  respawnFloor: number;
}): string {
  const titlePrefix = params.activeTitle ? `${params.activeTitle} ` : '';
  const lines = [
    `💀 ${titlePrefix}Daily Tower 第${params.floor}層「${params.realmName}」で力尽きた…`,
    `🔄 第${params.respawnFloor}層から再挑戦！`,
  ];
  return fitLinesToXWeight(lines);
}

export function formatFrontierXShareText(params: {
  clearedFloor: number;
  realmName: string;
  weaponName: string;
  activeTitle?: string;
}): string {
  const titlePrefix = params.activeTitle ? `${params.activeTitle} ` : '';
  const lines = [
    `🚩 ${titlePrefix}Daily Tower 最新実装フロア（第${params.clearedFloor}層「${params.realmName}」）を踏破し、最前線に到達！`,
    `⚔️ 装備: ${params.weaponName}`,
  ];
  return fitLinesToXWeight(lines);
}

export function buildXIntentUrl(text: string, shareUrl?: string): string {
  const url =
    shareUrl ??
    (typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : undefined);

  const params = new URLSearchParams({ text });
  if (url && /^https?:\/\//.test(url)) {
    params.set('url', url);
  }
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

export async function openXShare(
  text: string,
  shareUrl?: string
): Promise<{ status: 'opened' | 'copied_fallback' | 'failed'; message: string }> {
  const intentUrl = buildXIntentUrl(text, shareUrl);
  const resolvedUrl =
    shareUrl ??
    (typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : '');
  const fullFallbackText = resolvedUrl ? `${text}\n${resolvedUrl}` : text;

  try {
    const win = window.open(intentUrl, '_blank', 'noopener,noreferrer');
    if (win) {
      return {
        status: 'opened',
        message: 'X（Twitter）の投稿画面を開きました。',
      };
    }
  } catch {
    // Fall through to clipboard fallback
  }

  // Fallback when popup is blocked
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(fullFallbackText);
      return {
        status: 'copied_fallback',
        message:
          'ポップアップがブロックされたため、投稿文とURLをクリップボードにコピーしました。Xに貼り付けて投稿できます。',
      };
    }
  } catch {
    // Ignore clipboard error
  }

  return {
    status: 'failed',
    message:
      '共有画面を開けませんでした。ブラウザのポップアップ許可を確認するか、記録をコピーしてご利用ください。',
  };
}
