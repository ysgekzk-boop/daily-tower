import { GameEventDefinition } from './types';

export const EVENT_REGISTRY: Record<string, GameEventDefinition> = {
  sanctuary_campfire: {
    id: 'sanctuary_campfire',
    title: '微睡みの篝火',
    category: 'rest',
    isRestEvent: true,
    description:
      '静かな空洞に蒼い篝火が揺れている。ここでは敵の気配はなく、傷を癒やすか、秘薬の力を充填することができる。',
    speakerSpriteId: 'shrine',
    palette: 'golden_shrine',
    options: [
      {
        id: 'rest_heal',
        label: '篝火のそばで休息する（HP 50%回復）',
        description: '最大HPの50%を回復する。',
        outcome: {
          healHpPercent: 50,
          logMessage: '篝火の温もりに包まれ、HPが50%回復した！',
        },
      },
      {
        id: 'rest_refill',
        label: '霊薬の器に魔力を注ぐ（秘薬 +1回分）',
        description: '秘薬の使用回数を 1 補充する。',
        outcome: {
          refillConsumable: 1,
          logMessage: '篝火の魔力を器に集め、秘薬を 1回分 補充した！',
        },
      },
    ],
  },

  emerald_spring: {
    id: 'emerald_spring',
    title: '翠玉の湧水',
    category: 'shrine',
    description:
      '樹海の奥深くで、魔力を帯びた湧水が滾々と溢れている。水底には古の冒険者が残した金貨も光っている。',
    speakerSpriteId: 'shrine',
    palette: 'emerald_slime',
    options: [
      {
        id: 'drink_spring',
        label: '湧水を飲む（HP 35%回復）',
        description: '清らかな水で傷を癒やす。',
        outcome: {
          healHpPercent: 35,
          logMessage: '清涼な湧水を飲み干し、HPが35%回復した！',
        },
      },
      {
        id: 'collect_coins',
        label: '水底の金貨を拾う（+35 G）',
        description: '濡れるのを厭わず金貨を回収する。',
        outcome: {
          grantGold: 35,
          logMessage: '水底から輝く金貨を拾い上げ、35 G を手に入れた！',
        },
      },
    ],
  },

  crimson_pact_altar: {
    id: 'crimson_pact_altar',
    title: '紅の契約祭壇',
    category: 'shrine',
    description:
      '「血か黄金を捧げよ。さすれば汝に新たな武具か秘術を授けん」――古びた石碑に文字が浮かび上がっている。',
    speakerSpriteId: 'shrine',
    palette: 'crimson_knight',
    options: [
      {
        id: 'blood_for_relic',
        label: '生命力を捧げる（HP 20%消費 ➔ レリック獲得）',
        description: '最大HPの20%を代償に、古代のレリックを授かる。',
        cost: {
          hpPercent: 20,
        },
        outcome: {
          grantItemType: 'relic',
          logMessage: '紅の祭壇に生命力を捧げ、古代のレリックを授かった！',
        },
      },
      {
        id: 'gold_for_skill',
        label: '黄金を捧げる（40 G消費 ➔ スキル習得）',
        description: '40 Gを奉納し、新たな秘伝スキルを得る。',
        cost: {
          gold: 40,
        },
        outcome: {
          grantItemType: 'skill',
          logMessage: '黄金が光へと変わり、新たなスキルの知識が脳裏に刻まれた！',
        },
      },
      {
        id: 'respectful_prayer',
        label: '静かに一礼して立ち去る（HP 15%回復）',
        description: '代償を払わず敬意を示し、ささやかな祝福を受ける。',
        outcome: {
          healHpPercent: 15,
          logMessage: '祭壇に敬意を表し、穏やかな祝福でHPが15%回復した。',
        },
      },
    ],
  },

  wandering_blacksmith: {
    id: 'wandering_blacksmith',
    title: '彷徨う鍛冶師の工房',
    category: 'forge',
    description:
      '塔の狭間で槌を振るう老鍛冶師と出会った。「いい目をしているな。金貨があれば良い武具を譲ってやろう」',
    speakerSpriteId: 'hero_knight',
    palette: 'steel_knight',
    options: [
      {
        id: 'buy_weapon',
        label: '業物の武器を購入する（45 G ➔ 武器獲得）',
        description: '45 Gを支払い、より強力な武器を受け取る。',
        cost: {
          gold: 45,
        },
        outcome: {
          grantItemType: 'weapon',
          logMessage: '老鍛冶師から鍛え抜かれた武器を受け取った！',
        },
      },
      {
        id: 'buy_armor',
        label: '堅牢な防具を購入する（45 G ➔ 防具獲得）',
        description: '45 Gを支払い、より堅牢な防具を受け取る。',
        cost: {
          gold: 45,
        },
        outcome: {
          grantItemType: 'armor',
          logMessage: '老鍛冶師から重厚な防具を受け取った！',
        },
      },
      {
        id: 'assist_bellows',
        label: 'ふいご作業を手伝う（+25 G）',
        description: '鍛冶作業を手伝い、手間賃を受け取る。',
        outcome: {
          grantGold: 25,
          logMessage: '鍛冶師の作業を手伝い、礼として 25 G を受け取った！',
        },
      },
    ],
  },

  starlight_archive: {
    id: 'starlight_archive',
    title: '星光の碑文',
    category: 'lore',
    description:
      '塔の歴史を記した光の碑文が宙に浮いている。文字を読み解けば戦いの知恵が身につくという。',
    speakerSpriteId: 'hero_mage',
    palette: 'astral_mage',
    options: [
      {
        id: 'decipher_tactics',
        label: '戦術の章を解読する（HP 15%消費 ➔ スキル習得）',
        description: '集中力を極限まで使い（HP15%消費）、秘伝の技を習得する。',
        cost: {
          hpPercent: 15,
        },
        outcome: {
          grantItemType: 'skill',
          logMessage: '碑文の奥義を解読し、新たなスキルを習得した！',
        },
      },
      {
        id: 'meditate_under_light',
        label: '星の光を浴びて瞑想する（HP 25%回復）',
        description: '無理な解読をせず、優しい星光で心身を癒やす。',
        outcome: {
          healHpPercent: 25,
          logMessage: '星光のエネルギーが巡り、HPが25%回復した！',
        },
      },
    ],
  },

  apprentice_desk: {
    id: 'apprentice_desk',
    title: '司書の見習いの机',
    category: 'lore',
    description:
      '静まり返った書架の片隅に、見習い司書が使っていた机が残されている。書きかけの羊皮紙と散らばった銀貨、そして魔力を帯びたインク壺が置かれている。',
    speakerSpriteId: 'tome',
    palette: 'arcane_tome',
    options: [
      {
        id: 'collect_silver',
        label: '散らばった銀貨を整理して受け取る',
        description: '机の上の銀貨を拾い集める（+25 G）。',
        outcome: {
          grantGold: 25,
          logMessage: '机の上に散らばっていた銀貨を整理し、25 G を受け取った！',
        },
      },
      {
        id: 'transcribe_forbidden_margin',
        label: '指先をインクに浸し、禁書の余白を書き写す',
        description: '最大HPの12%を代償に、秘術の知識を書き写し銀貨も回収する（スキル習得 + 15 G）。',
        cost: {
          hpPercent: 12,
        },
        outcome: {
          grantItemType: 'skill',
          grantGold: 15,
          logMessage: '魔力のインクに生命力を吸われつつも、禁書の術式を書き写し新たなスキルと 15 G を得た！',
        },
      },
      {
        id: 'close_page_and_leave',
        label: '静かにページを閉じて立ち去る',
        description: '深追いをせず、静寂の中で一息つく（HP 10%回復）。',
        outcome: {
          healHpPercent: 10,
          logMessage: '静かにページを閉じて深呼吸し、HPが10%回復した。',
        },
      },
    ],
  },

  mossy_stump_shrine: {
    id: 'mossy_stump_shrine',
    title: '苔むした切り株の祠',
    category: 'shrine',
    description:
      '樹海の小道に、古い大樹の切り株をくり抜いた小さな祠が佇んでいる。木肌のくぼみには、森の精霊への捧げ物を求める文字が刻まれている。',
    speakerSpriteId: 'shrine',
    palette: 'ancient_bark',
    options: [
      {
        id: 'offer_vitality_to_stump',
        label: '森の精霊に血の契りを捧げる（HP 20%消費 ➔ レリック獲得）',
        description: '最大HPの20%を代償に、切り株の奥に納められた森のレリックを授かる。',
        cost: {
          hpPercent: 20,
        },
        outcome: {
          grantItemType: 'relic',
          logMessage: '切り株の祠に生命力を捧げ、森の精霊から古のレリックを授かった！',
        },
      },
      {
        id: 'offer_gold_to_stump',
        label: '旅の金貨を祠に納める（40 G消費 ➔ スキル習得）',
        description: '40 Gを納め、木霊が囁く森の戦闘術を習得する。',
        cost: {
          gold: 40,
        },
        outcome: {
          grantItemType: 'skill',
          logMessage: '木霊の囁きが風に乗って響き、新たなスキルの極意を習得した！',
        },
      },
      {
        id: 'rest_by_stump',
        label: '切り株に手を当てて一礼する（HP 15%回復）',
        description: '無理な捧げ物はせず、森の息吹に感謝して傷を癒やす。',
        outcome: {
          healHpPercent: 15,
          logMessage: '古樹の穏やかな木漏れ日に包まれ、HPが15%回復した。',
        },
      },
    ],
  },

  carved_worldtree_bark: {
    id: 'carved_worldtree_bark',
    title: '古樹の刻み文',
    category: 'lore',
    description:
      '巨木の幹に、かつて樹海を踏破した先人たちの戦術図と狩りの心得が深く刻み込まれている。読み解けば新たな技が身につくかもしれない。',
    speakerSpriteId: 'treant',
    palette: 'ancient_bark',
    options: [
      {
        id: 'trace_carved_tactics',
        label: '幹の刻み文を指で辿り読み解く（HP 15%消費 ➔ スキル習得）',
        description: '樹皮の魔力に集中力を削られつつも（HP15%消費）、先人の秘術を習得する。',
        cost: {
          hpPercent: 15,
        },
        outcome: {
          grantItemType: 'skill',
          logMessage: '古樹に刻まれた狩人の技を読み解き、新たなスキルを習得した！',
        },
      },
      {
        id: 'breathe_forest_air',
        label: '大樹の木陰で深呼吸する（HP 25%回復）',
        description: '刻み文の解読は控え、清浄な森の空気で心身を休める。',
        outcome: {
          healHpPercent: 25,
          logMessage: '大樹の澄んだ木陰で休息し、HPが25%回復した！',
        },
      },
    ],
  },

  misty_totem_stone: {
    id: 'misty_totem_stone',
    title: '霧深き古樹の石碑',
    category: 'lore',
    description:
      '濃霧に包まれた古木の根元に、苔むした石碑が静かに佇んでいる。霧の合間に浮かび上がる古代文字には、森を生き抜く戦技が記されているようだ。',
    speakerSpriteId: 'treant',
    palette: 'ancient_bark',
    options: [
      {
        id: 'decipher_mist_tactics',
        label: '霧の戦技を解読する（HP 15%消費 ➔ スキル習得）',
        description: '集中力を極限まで使い（HP15%消費）、古樹林の秘伝技を習得する。',
        cost: {
          hpPercent: 15,
        },
        outcome: {
          grantItemType: 'skill',
          logMessage: '霧に浮かぶ石碑の奥義を解読し、新たなスキルを習得した！',
        },
      },
      {
        id: 'rest_in_silent_mist',
        label: '静かな霧の中で瞑想する（HP 25%回復）',
        description: '無理な解読はせず、ひんやりと澄んだ森の霧で心身を癒やす。',
        outcome: {
          healHpPercent: 25,
          logMessage: '古樹林の清浄な霧が傷を包み、HPが25%回復した！',
        },
      },
    ],
  },

  foggy_hollow_spring: {
    id: 'foggy_hollow_spring',
    title: '霧隠れの古泉',
    category: 'shrine',
    description:
      '古木のうろの奥、白い霧が立ち込める静かな泉を見つけた。澄み切った水面の底には、かつての探索者が落とした金貨が淡く光っている。',
    speakerSpriteId: 'shrine',
    palette: 'emerald_slime',
    options: [
      {
        id: 'drink_foggy_spring',
        label: '古泉の水を掬って飲む（HP 35%回復）',
        description: '冷たく清らかな泉の水で傷を癒やす。',
        outcome: {
          healHpPercent: 35,
          logMessage: '霧隠れの古泉を飲み干し、HPが35%回復した！',
        },
      },
      {
        id: 'gather_sunken_coins',
        label: '水底の金貨を拾い集める（+35 G）',
        description: '冷たい水に手を伸ばし、沈んだ金貨を回収する。',
        outcome: {
          grantGold: 35,
          logMessage: '古泉の底から輝く金貨を拾い上げ、35 G を手に入れた！',
        },
      },
    ],
  },

  marsh_reed_shrine: {
    id: 'marsh_reed_shrine',
    title: '葦原の水辺祠',
    category: 'shrine',
    description:
      '背の高い葦に囲まれた湿地の中に、水鏡のように澄んだ石盤の祠が建っている。「命の雫か黄金を捧げよ。さすれば水辺の秘宝か戦技を授けん」と刻まれている。',
    speakerSpriteId: 'shrine',
    palette: 'crimson_knight',
    options: [
      {
        id: 'offer_vitality_to_marsh',
        label: '生命力を捧げる（HP 20%消費 ➔ レリック獲得）',
        description: '最大HPの20%を代償に、水辺に眠る古代のレリックを授かる。',
        cost: {
          hpPercent: 20,
        },
        outcome: {
          grantItemType: 'relic',
          logMessage: '水辺の祠に生命力を捧げ、古代のレリックを授かった！',
        },
      },
      {
        id: 'offer_gold_to_marsh',
        label: '黄金を捧げる（40 G消費 ➔ スキル習得）',
        description: '40 Gを水盤に沈め、沼地を踏破する秘伝スキルを得る。',
        cost: {
          gold: 40,
        },
        outcome: {
          grantItemType: 'skill',
          logMessage: '水盤に沈めた黄金が光の波紋となり、新たなスキルの知識が脳裏に刻まれた！',
        },
      },
      {
        id: 'bow_to_reed_shrine',
        label: '静かに一礼して立ち去る（HP 15%回復）',
        description: '代償を払わず敬意を示し、水辺の穏やかな祝福を受ける。',
        outcome: {
          healHpPercent: 15,
          logMessage: '水辺の祠に敬意を表し、清らかな潤いでHPが15%回復した。',
        },
      },
    ],
  },

  sunken_mirror_stele: {
    id: 'sunken_mirror_stele',
    title: '水鏡の沈み石碑',
    category: 'lore',
    description:
      '浅瀬の水面に、星と葦の紋様が彫られた石碑が半分沈んでいる。水鏡に映る文字を辿れば、湿地を生き抜く戦術の奥義が読み解けそうだ。',
    speakerSpriteId: 'hero_mage',
    palette: 'astral_mage',
    options: [
      {
        id: 'decipher_mirror_tactics',
        label: '水鏡の文字を解読する（HP 15%消費 ➔ スキル習得）',
        description: '集中力を極限まで使い（HP15%消費）、水辺の秘伝技を習得する。',
        cost: {
          hpPercent: 15,
        },
        outcome: {
          grantItemType: 'skill',
          logMessage: '水鏡に映る石碑の奥義を解読し、新たなスキルを習得した！',
        },
      },
      {
        id: 'rest_by_mirror_water',
        label: '静かな水鏡を眺めて瞑想する（HP 25%回復）',
        description: '無理な解読はせず、澄んだ水辺の気配で心身を癒やす。',
        outcome: {
          healHpPercent: 25,
          logMessage: '水鏡の静寂が傷を癒やし、HPが25%回復した！',
        },
      },
    ],
  },

  lotus_spring_pool: {
    id: 'lotus_spring_pool',
    title: '睡蓮の湧き水',
    category: 'shrine',
    description:
      '湿地の奥に、大輪の睡蓮が浮かぶ澄んだ湧き水を見つけた。清涼な水が傷を癒やすだけでなく、水底には古の旅人が落とした金貨もきらめいている。',
    speakerSpriteId: 'shrine',
    palette: 'emerald_slime',
    options: [
      {
        id: 'drink_lotus_pool',
        label: '睡蓮の湧水を飲む（HP 35%回復）',
        description: '清らかな水で傷を癒やす。',
        outcome: {
          healHpPercent: 35,
          logMessage: '睡蓮の湧水を飲み干し、HPが35%回復した！',
        },
      },
      {
        id: 'collect_lotus_coins',
        label: '水底の金貨を拾う（+35 G）',
        description: '浅瀬に手を伸ばし、沈んだ金貨を回収する。',
        outcome: {
          grantGold: 35,
          logMessage: '睡蓮の池底から輝く金貨を拾い上げ、35 G を手に入れた！',
        },
      },
    ],
  },

  mossy_ruin_tablet: {
    id: 'mossy_ruin_tablet',
    title: '苔石遺跡の古碑',
    category: 'lore',
    description:
      '古樹の根に抱かれた遺跡の奥で、苔に覆われた石碑を見つけた。刻まれた古代文字には、樹洞と根の回廊を生き抜くための戦技が記されているようだ。',
    speakerSpriteId: 'treant',
    palette: 'ancient_bark',
    options: [
      {
        id: 'decipher_ruin_tactics',
        label: '苔石の戦技を解読する（HP 15%消費 ➔ スキル習得）',
        description: '集中力を極限まで使い（HP15%消費）、古樹遺跡の秘伝技を習得する。',
        cost: {
          hpPercent: 15,
        },
        outcome: {
          grantItemType: 'skill',
          logMessage: '苔石の古碑に刻まれた奥義を解読し、新たなスキルを習得した！',
        },
      },
      {
        id: 'rest_by_ruin_tablet',
        label: '根の回廊で静かに瞑想する（HP 25%回復）',
        description: '無理な解読はせず、古樹の穏やかな息吹で心身を癒やす。',
        outcome: {
          healHpPercent: 25,
          logMessage: '苔石の静寂が傷を癒やし、HPが25%回復した！',
        },
      },
    ],
  },

  hollow_root_basin: {
    id: 'hollow_root_basin',
    title: '樹洞の石盤泉',
    category: 'shrine',
    description:
      '太い古根が組み合わさってできた樹洞の中に、苔石の盤へ澄んだ雫が滴り落ちる泉がある。底にはかつての探索者が残した金貨も淡く光っている。',
    speakerSpriteId: 'shrine',
    palette: 'emerald_slime',
    options: [
      {
        id: 'drink_hollow_basin',
        label: '石盤の雫を飲む（HP 35%回復）',
        description: '清らかな雫で傷を癒やす。',
        outcome: {
          healHpPercent: 35,
          logMessage: '樹洞の清らかな雫を飲み干し、HPが35%回復した！',
        },
      },
      {
        id: 'collect_hollow_coins',
        label: '石盤の底の金貨を拾う（+35 G）',
        description: '冷たい水に手を伸ばし、沈んだ金貨を回収する。',
        outcome: {
          grantGold: 35,
          logMessage: '石盤泉の底から輝く金貨を拾い上げ、35 G を手に入れた！',
        },
      },
    ],
  },

  ancient_root_altar: {
    id: 'ancient_root_altar',
    title: '古根の石祭壇',
    category: 'shrine',
    description:
      '古樹の根が石柱を貫く祭壇が佇んでいる。「命の鼓動か黄金を捧げよ。さすれば樹洞に眠る秘宝か戦技を授けん」と苔石に刻まれている。',
    speakerSpriteId: 'shrine',
    palette: 'crimson_knight',
    options: [
      {
        id: 'offer_vitality_to_roots',
        label: '生命力を捧げる（HP 20%消費 ➔ レリック獲得）',
        description: '最大HPの20%を代償に、古樹の根に眠る古代のレリックを授かる。',
        cost: {
          hpPercent: 20,
        },
        outcome: {
          grantItemType: 'relic',
          logMessage: '古根の祭壇に生命力を捧げ、古代のレリックを授かった！',
        },
      },
      {
        id: 'offer_gold_to_roots',
        label: '黄金を捧げる（40 G消費 ➔ スキル習得）',
        description: '40 Gを石皿に納め、樹洞の遺跡を踏破する秘伝スキルを得る。',
        cost: {
          gold: 40,
        },
        outcome: {
          grantItemType: 'skill',
          logMessage: '石皿に納めた黄金が緑光へと変わり、新たなスキルの知識が脳裏に刻まれた！',
        },
      },
      {
        id: 'bow_to_root_altar',
        label: '静かに一礼して立ち去る（HP 15%回復）',
        description: '代償を払わず敬意を示し、古樹の穏やかな祝福を受ける。',
        outcome: {
          healHpPercent: 15,
          logMessage: '古根の祭壇に敬意を表し、穏やかな祝福でHPが15%回復した。',
        },
      },
    ],
  },

  worldtree_sap_altar: {
    id: 'worldtree_sap_altar',
    title: '世界樹液の契約祭壇',
    category: 'shrine',
    description:
      '黄金の樹液が脈打つ世界樹の根元に、古代の祭壇が鎮座している。「命の鼓動か黄金を捧げよ。さすれば樹冠に伝わる秘宝か秘術を授けん」と刻まれている。',
    speakerSpriteId: 'shrine',
    palette: 'crimson_knight',
    options: [
      {
        id: 'offer_vitality_to_worldtree',
        label: '生命力を捧げる（HP 20%消費 ➔ レリック獲得）',
        description: '最大HPの20%を代償に、世界樹の根に眠る古代のレリックを授かる。',
        cost: {
          hpPercent: 20,
        },
        outcome: {
          grantItemType: 'relic',
          logMessage: '世界樹の祭壇に生命力を捧げ、古代のレリックを授かった！',
        },
      },
      {
        id: 'offer_gold_to_worldtree',
        label: '黄金を捧げる（40 G消費 ➔ スキル習得）',
        description: '40 Gを樹液の器に納め、新たな秘伝スキルを得る。',
        cost: {
          gold: 40,
        },
        outcome: {
          grantItemType: 'skill',
          logMessage: '黄金の樹液が光へと変わり、新たなスキルの知識が脳裏に刻まれた！',
        },
      },
      {
        id: 'bow_to_worldtree_altar',
        label: '静かに一礼して立ち去る（HP 15%回復）',
        description: '代償を払わず敬意を示し、世界樹の穏やかな祝福を受ける。',
        outcome: {
          healHpPercent: 15,
          logMessage: '世界樹の祭壇に敬意を表し、穏やかな祝福でHPが15%回復した。',
        },
      },
    ],
  },

  canopy_seed_stele: {
    id: 'canopy_seed_stele',
    title: '樹冠種子の碑文',
    category: 'lore',
    description:
      '天を突く世界樹の枝葉の合間に、光の種子を象った石碑が浮かんでいる。刻まれた古代文字を読み解けば、神域を生き抜く戦いの知恵が身につくという。',
    speakerSpriteId: 'hero_mage',
    palette: 'astral_mage',
    options: [
      {
        id: 'decipher_canopy_tactics',
        label: '種子の戦技を解読する（HP 15%消費 ➔ スキル習得）',
        description: '集中力を極限まで使い（HP15%消費）、秘伝の技を習得する。',
        cost: {
          hpPercent: 15,
        },
        outcome: {
          grantItemType: 'skill',
          logMessage: '樹冠の碑文に記された奥義を解読し、新たなスキルを習得した！',
        },
      },
      {
        id: 'meditate_under_canopy',
        label: '聖なる樹冠の下で瞑想する（HP 25%回復）',
        description: '無理な解読をせず、優しい木漏れ日と種子の光で心身を癒やす。',
        outcome: {
          healHpPercent: 25,
          logMessage: '世界樹の穏やかな光が巡り、HPが25%回復した！',
        },
      },
    ],
  },

  yggdrasil_golden_spring: {
    id: 'yggdrasil_golden_spring',
    title: '世界樹の黄金泉',
    category: 'shrine',
    description:
      '巨樹の幹が抱く神域の泉から、樹液を溶かした黄金の湧水が滾々と溢れている。水底にはかつて頂を目指した冒険者の金貨もきらめいている。',
    speakerSpriteId: 'shrine',
    palette: 'emerald_slime',
    options: [
      {
        id: 'drink_yggdrasil_spring',
        label: '黄金泉の水を飲む（HP 35%回復）',
        description: '清らかな樹液の泉で傷を癒やす。',
        outcome: {
          healHpPercent: 35,
          logMessage: '黄金泉の霊水を飲み干し、HPが35%回復した！',
        },
      },
      {
        id: 'collect_yggdrasil_coins',
        label: '水底の金貨を拾う（+35 G）',
        description: '濡れるのを厭わず金貨を回収する。',
        outcome: {
          grantGold: 35,
          logMessage: '黄金泉の底から輝く金貨を拾い上げ、35 G を手に入れた！',
        },
      },
    ],
  },
};



