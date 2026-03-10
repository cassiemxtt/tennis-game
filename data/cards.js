/**
 * 卡牌数据库
 * 包含所有卡牌数据
 */

// 卡牌稀有度
const CARD_RARITY = {
  R: { name: 'R', color: '#ffffff', probability: 0.60 },
  SR: { name: 'SR', color: '#63b3ed', probability: 0.25 },
  SSR: { name: 'SSR', color: '#b794f4', probability: 0.10 },
  UR: { name: 'UR', color: '#ffd700', probability: 0.05 }
};

// 卡牌类型
const CARD_TYPE = {
  SERVE: 'serve',        // 发球
  RETURN: 'return',      // 接发球
  BASELINE: 'baseline',  // 底线
  VOLLEY: 'volley',      // 截击
  DROP_SHOT: 'dropShot', // 放小球
  SLICE: 'slice',        // 切削
  LOB: 'lob',            // 月亮球
  SMASH: 'smash',        // 高压球
  COACH: 'coach',        // 教练卡
  STRATEGY: 'strategy',  // 策略卡
  ITEM: 'item',         // 道具卡
  ULTIMATE: 'ultimate'  // 绝招卡
};

// 卡牌稀有度定义
const RARITY = {
  R: { name: 'R', color: '#ffffff',合成碎片: 10,分解碎片: 2 },
  SR: { name: 'SR', color: '#63b3ed',合成碎片: 30,分解碎片: 8 },
  SSR: { name: 'SSR', color: '#b794f4',合成碎片: 80,分解碎片: 20 },
  UR: { name: 'UR', color: '#ffd700',合成碎片: 200,分解碎片: 50 }
};

// 卡牌数据
const CARDS = {
  // ========== 发球卡 ==========
  'serve_001': {
    id: 'serve_001',
    name: '保守发球',
    type: CARD_TYPE.SERVE,
    rarity: 'R',
    acc: 85,
    diff: 20,
    cost: 2,
    skill: 'serve',
    description: '稳定的发球，成功率高'
  },
  'serve_002': {
    id: 'serve_002',
    name: '快速发球',
    type: CARD_TYPE.SERVE,
    rarity: 'R',
    acc: 78,
    diff: 28,
    cost: 2,
    skill: 'serve',
    description: '快速的发球，速度快'
  },
  'serve_003': {
    id: 'serve_003',
    name: '旋转发球',
    type: CARD_TYPE.SERVE,
    rarity: 'R',
    acc: 72,
    diff: 35,
    cost: 2,
    skill: 'serve',
    description: '带旋转的发球'
  },
  'serve_004': {
    id: 'serve_004',
    name: '强力发球',
    type: CARD_TYPE.SERVE,
    rarity: 'SR',
    acc: 68,
    diff: 42,
    cost: 3,
    skill: 'serve',
    description: '强有力的发球'
  },
  'serve_005': {
    id: 'serve_005',
    name: 'ACE球',
    type: CARD_TYPE.SERVE,
    rarity: 'SR',
    acc: 55,
    diff: 55,
    cost: 3,
    skill: 'serve',
    effect: 'ace_bonus',
    effectValue: 10,
    description: 'ACE球，发球得分率+10%'
  },
  'serve_006': {
    id: 'serve_006',
    name: '绝招发球',
    type: CARD_TYPE.SERVE,
    rarity: 'SSR',
    acc: 48,
    diff: 65,
    cost: 4,
    skill: 'serve',
    effect: 'ace_bonus',
    effectValue: 20,
    description: '绝招发球，发球得分率+20%'
  },
  'serve_007': {
    id: 'serve_007',
    name: '梦幻发球',
    type: CARD_TYPE.SERVE,
    rarity: 'UR',
    acc: 40,
    diff: 75,
    cost: 4,
    skill: 'serve',
    effect: 'ace_bonus',
    effectValue: 30,
    description: '梦幻发球，发球得分率+30%'
  },
  'serve_008': {
    id: 'serve_008',
    name: '零式发球',
    type: CARD_TYPE.SERVE,
    rarity: 'UR',
    acc: 35,
    diff: 85,
    cost: 5,
    skill: 'serve',
    effect: 'must_ace',
    description: '必杀技，无法回球'
  },

  // ========== 接发球卡 ==========
  'return_001': {
    id: 'return_001',
    name: '稳健接发',
    type: CARD_TYPE.RETURN,
    rarity: 'R',
    acc: 82,
    diff: 18,
    cost: 2,
    skill: 'baseline',
    description: '稳定的接发球'
  },
  'return_002': {
    id: 'return_002',
    name: '挑起接发',
    type: CARD_TYPE.RETURN,
    rarity: 'R',
    acc: 75,
    diff: 25,
    cost: 2,
    skill: 'baseline',
    description: '挑起接发，转守为攻'
  },
  'return_003': {
    id: 'return_003',
    name: '搏命接发',
    type: CARD_TYPE.RETURN,
    rarity: 'SR',
    acc: 58,
    diff: 42,
    cost: 3,
    skill: 'baseline',
    effect: 'return_bonus',
    effectValue: 10,
    description: '搏命接发，成功则下次回球+10%'
  },
  'return_004': {
    id: 'return_004',
    name: '破发接发',
    type: CARD_TYPE.RETURN,
    rarity: 'SR',
    acc: 55,
    diff: 45,
    cost: 3,
    skill: 'baseline',
    description: '破发接发'
  },
  'return_005': {
    id: 'return_005',
    name: '神之接发',
    type: CARD_TYPE.RETURN,
    rarity: 'SSR',
    acc: 48,
    diff: 55,
    cost: 4,
    skill: 'baseline',
    effect: 'return_bonus',
    effectValue: 20,
    description: '神之接发，成功则下次回球+20%'
  },
  'return_006': {
    id: 'return_006',
    name: '接发大师',
    type: CARD_TYPE.RETURN,
    rarity: 'UR',
    acc: 40,
    diff: 65,
    cost: 5,
    skill: 'baseline',
    effect: 'guarantee_return',
    description: '必定回球成功一次'
  },

  // ========== 底线卡 ==========
  'baseline_001': {
    id: 'baseline_001',
    name: '正手抽击',
    type: CARD_TYPE.BASELINE,
    rarity: 'R',
    acc: 85,
    diff: 35,
    cost: 2,
    skill: 'baseline',
    description: '标准的正手抽击'
  },
  'baseline_002': {
    id: 'baseline_002',
    name: '反手抽击',
    type: CARD_TYPE.BASELINE,
    rarity: 'R',
    acc: 83,
    diff: 33,
    cost: 2,
    skill: 'baseline',
    description: '标准的反手抽击'
  },
  'baseline_003': {
    id: 'baseline_003',
    name: '双手反拍',
    type: CARD_TYPE.BASELINE,
    rarity: 'R',
    acc: 80,
    diff: 38,
    cost: 2,
    skill: 'baseline',
    effect: 'stability',
    effectValue: 5,
    description: '稳定性+5%'
  },
  'baseline_004': {
    id: 'baseline_004',
    name: '暴力正手',
    type: CARD_TYPE.BASELINE,
    rarity: 'SR',
    acc: 72,
    diff: 50,
    cost: 3,
    skill: 'baseline',
    effect: 'attack_bonus',
    effectValue: 10,
    description: '攻击+10%'
  },
  'baseline_005': {
    id: 'baseline_005',
    name: '超级抽球',
    type: CARD_TYPE.BASELINE,
    rarity: 'SR',
    acc: 68,
    diff: 52,
    cost: 3,
    skill: 'baseline',
    effect: 'combo',
    effectValue: 1,
    description: '连击+1'
  },
  'baseline_006': {
    id: 'baseline_006',
    name: '终极正手',
    type: CARD_TYPE.BASELINE,
    rarity: 'SSR',
    acc: 60,
    diff: 60,
    cost: 4,
    skill: 'baseline',
    effect: 'attack_bonus',
    effectValue: 20,
    description: '攻击+20%'
  },
  'baseline_007': {
    id: 'baseline_007',
    name: '铜墙铁壁',
    type: CARD_TYPE.BASELINE,
    rarity: 'SSR',
    acc: 75,
    diff: 45,
    cost: 4,
    skill: 'baseline',
    effect: 'defense_bonus',
    effectValue: 15,
    description: '防守+15%'
  },
  'baseline_008': {
    id: 'baseline_008',
    name: '网球上帝',
    type: CARD_TYPE.BASELINE,
    rarity: 'UR',
    acc: 50,
    diff: 75,
    cost: 5,
    skill: 'baseline',
    effect: 'all_bonus',
    effectValue: 30,
    description: '全能力+30%'
  },

  // ========== 截击卡 ==========
  'volley_001': {
    id: 'volley_001',
    name: '简单截击',
    type: CARD_TYPE.VOLLEY,
    rarity: 'R',
    acc: 88,
    diff: 30,
    cost: 2,
    skill: 'volley',
    description: '简单的网前截击'
  },
  'volley_002': {
    id: 'volley_002',
    name: '凌空抽击',
    type: CARD_TYPE.VOLLEY,
    rarity: 'R',
    acc: 82,
    diff: 38,
    cost: 2,
    skill: 'volley',
    description: '凌空抽击'
  },
  'volley_003': {
    id: 'volley_003',
    name: '致命截击',
    type: CARD_TYPE.VOLLEY,
    rarity: 'SR',
    acc: 75,
    diff: 48,
    cost: 3,
    skill: 'volley',
    effect: 'volley_bonus',
    effectValue: 15,
    description: '网前得分+15%'
  },
  'volley_004': {
    id: 'volley_004',
    name: '网前杀手',
    type: CARD_TYPE.VOLLEY,
    rarity: 'SSR',
    acc: 65,
    diff: 58,
    cost: 4,
    skill: 'volley',
    effect: 'volley_bonus',
    effectValue: 25,
    description: '网前得分+25%'
  },
  'volley_005': {
    id: 'volley_005',
    name: '鬼影截击',
    type: CARD_TYPE.VOLLEY,
    rarity: 'UR',
    acc: 55,
    diff: 70,
    cost: 5,
    skill: 'volley',
    effect: 'must_volley',
    description: '网前必定得分一次'
  },

  // ========== 放小球卡 ==========
  'dropshot_001': {
    id: 'dropshot_001',
    name: '放小球',
    type: CARD_TYPE.DROP_SHOT,
    rarity: 'R',
    acc: 92,
    diff: 15,
    cost: 1,
    skill: 'dropShot',
    description: '放小球'
  },
  'dropshot_002': {
    id: 'dropshot_002',
    name: '精准削球',
    type: CARD_TYPE.DROP_SHOT,
    rarity: 'SR',
    acc: 88,
    diff: 22,
    cost: 2,
    skill: 'dropShot',
    effect: 'dropshot_bonus',
    effectValue: 10,
    description: '放小球成功率+10%'
  },
  'dropshot_003': {
    id: 'dropshot_003',
    name: '艺术网球',
    type: CARD_TYPE.DROP_SHOT,
    rarity: 'SSR',
    acc: 82,
    diff: 30,
    cost: 3,
    skill: 'dropShot',
    effect: 'dropshot_bonus',
    effectValue: 20,
    description: '放小球成功率+20%'
  },
  'dropshot_004': {
    id: 'dropshot_004',
    name: '梦幻小球',
    type: CARD_TYPE.DROP_SHOT,
    rarity: 'UR',
    acc: 78,
    diff: 40,
    cost: 4,
    skill: 'dropShot',
    effect: 'opponent_slow',
    effectValue: 30,
    description: '对手移动-30%'
  },

  // ========== 切削卡 ==========
  'slice_001': {
    id: 'slice_001',
    name: '切削球',
    type: CARD_TYPE.SLICE,
    rarity: 'R',
    acc: 90,
    diff: 20,
    cost: 1,
    skill: 'slice',
    description: '切削球'
  },
  'slice_002': {
    id: 'slice_002',
    name: '强烈上旋',
    type: CARD_TYPE.SLICE,
    rarity: 'SR',
    acc: 85,
    diff: 28,
    cost: 2,
    skill: 'slice',
    effect: 'stability',
    effectValue: 10,
    description: '稳定性+10%'
  },
  'slice_003': {
    id: 'slice_003',
    name: '超级切削',
    type: CARD_TYPE.SLICE,
    rarity: 'SSR',
    acc: 80,
    diff: 35,
    cost: 3,
    skill: 'slice',
    effect: 'opponent_rhythm',
    effectValue: 20,
    description: '对手节奏-20%'
  },
  'slice_004': {
    id: 'slice_004',
    name: '太极网球',
    type: CARD_TYPE.SLICE,
    rarity: 'UR',
    acc: 85,
    diff: 30,
    cost: 4,
    skill: 'slice',
    effect: 'recover_energy',
    effectValue: 5,
    description: '恢复体力5%'
  },

  // ========== 月亮球卡 ==========
  'lob_001': {
    id: 'lob_001',
    name: '高吊球',
    type: CARD_TYPE.LOB,
    rarity: 'R',
    acc: 88,
    diff: 22,
    cost: 1,
    skill: 'lob',
    description: '高吊球，诱敌上网'
  },
  'lob_002': {
    id: 'lob_002',
    name: '月亮球',
    type: CARD_TYPE.LOB,
    rarity: 'SR',
    acc: 82,
    diff: 30,
    cost: 2,
    skill: 'lob',
    effect: 'defense_bonus',
    effectValue: 15,
    description: '防守+15%'
  },
  'lob_003': {
    id: 'lob_003',
    name: '天空之城',
    type: CARD_TYPE.LOB,
    rarity: 'UR',
    acc: 75,
    diff: 45,
    cost: 4,
    skill: 'lob',
    effect: 'opponent_hook',
    effectValue: 30,
    description: '对手高球+30%'
  },

  // ========== 高压球卡 ==========
  'smash_001': {
    id: 'smash_001',
    name: '高压球',
    type: CARD_TYPE.SMASH,
    rarity: 'R',
    acc: 78,
    diff: 42,
    cost: 2,
    skill: 'smash',
    description: '高压球'
  },
  'smash_002': {
    id: 'smash_002',
    name: '扣杀',
    type: CARD_TYPE.SMASH,
    rarity: 'SR',
    acc: 72,
    diff: 50,
    cost: 3,
    skill: 'smash',
    effect: 'smash_bonus',
    description: '网前必杀'
  },
  'smash_003': {
    id: 'smash_003',
    name: '雷霆扣杀',
    type: CARD_TYPE.SMASH,
    rarity: 'UR',
    acc: 65,
    diff: 65,
    cost: 4,
    skill: 'smash',
    effect: 'opponent_volley',
    effectValue: 40,
    description: '对手网前-40%'
  },

  // ========== 教练卡 ==========
  'coach_001': {
    id: 'coach_001',
    name: '场外指导',
    type: CARD_TYPE.COACH,
    rarity: 'R',
    acc: 0,
    diff: 0,
    cost: 2,
    effect: 'next_card_acc',
    effectValue: 10,
    description: '下一张卡成功率+10%'
  },
  'coach_002': {
    id: 'coach_002',
    name: '战术调整',
    type: CARD_TYPE.COACH,
    rarity: 'R',
    acc: 0,
    diff: 0,
    cost: 2,
    effect: 'change_strategy',
    description: '改变本回合策略'
  },
  'coach_003': {
    id: 'coach_003',
    name: '体能教练',
    type: CARD_TYPE.COACH,
    rarity: 'SR',
    acc: 0,
    diff: 0,
    cost: 3,
    effect: 'recover_energy',
    effectValue: 10,
    description: '恢复体力10%'
  },
  'coach_004': {
    id: 'coach_004',
    name: '心理按摩',
    type: CARD_TYPE.COACH,
    rarity: 'SR',
    acc: 0,
    diff: 0,
    cost: 3,
    effect: 'form_up',
    effectValue: 10,
    description: '状态+10'
  },
  'coach_005': {
    id: 'coach_005',
    name: '战术大师',
    type: CARD_TYPE.COACH,
    rarity: 'SR',
    acc: 0,
    diff: 0,
    cost: 3,
    effect: 'read_opponent',
    description: '识破对手策略'
  },
  'coach_006': {
    id: 'coach_006',
    name: '鼓舞士气',
    type: CARD_TYPE.COACH,
    rarity: 'SR',
    acc: 0,
    diff: 0,
    cost: 3,
    effect: 'next_diff',
    effectValue: 10,
    description: '下次击球难度+10%'
  },
  'coach_007': {
    id: 'coach_007',
    name: '医疗师',
    type: CARD_TYPE.COACH,
    rarity: 'SSR',
    acc: 0,
    diff: 0,
    cost: 4,
    effect: 'heal_injury',
    description: '治愈轻微伤病'
  },
  'coach_008': {
    id: 'coach_008',
    name: '分析师',
    type: CARD_TYPE.COACH,
    rarity: 'SSR',
    acc: 0,
    diff: 0,
    cost: 4,
    effect: 'reveal_weakness',
    effectValue: 3,
    description: '揭示对手弱点3回合'
  },
  'coach_009': {
    id: 'coach_009',
    name: '传奇教练',
    type: CARD_TYPE.COACH,
    rarity: 'SSR',
    acc: 0,
    diff: 0,
    cost: 4,
    effect: 'all_form_up',
    effectValue: 15,
    description: '全队状态+15'
  },
  'coach_010': {
    id: 'coach_010',
    name: '冠军教父',
    type: CARD_TYPE.COACH,
    rarity: 'UR',
    acc: 0,
    diff: 0,
    cost: 5,
    effect: 'must_hit',
    description: '下次击球必定成功'
  },
  'coach_011': {
    id: 'coach_011',
    name: '心理大师',
    type: CARD_TYPE.COACH,
    rarity: 'UR',
    acc: 0,
    diff: 0,
    cost: 5,
    effect: 'opponent_miss',
    effectValue: 20,
    description: '对手失误率+20%'
  },
  'coach_012': {
    id: 'coach_012',
    name: '神级团队',
    type: CARD_TYPE.COACH,
    rarity: 'UR',
    acc: 0,
    diff: 0,
    cost: 5,
    effect: 'random_buff',
    effectValue: 3,
    description: '随机获得3个正面效果'
  },

  // ========== 道具卡 ==========
  'item_001': {
    id: 'item_001',
    name: '肾上腺素',
    type: CARD_TYPE.ITEM,
    rarity: 'R',
    acc: 0,
    diff: 0,
    cost: 1,
    effect: 'acc_bonus',
    effectValue: 15,
    description: '本次击球成功率+15%',
    consumable: true
  },
  'item_002': {
    id: 'item_002',
    name: '幸运球',
    type: CARD_TYPE.ITEM,
    rarity: 'R',
    acc: 0,
    diff: 0,
    cost: 1,
    effect: 'lucky_point',
    effectValue: 30,
    description: '30%概率直接得分',
    consumable: true
  },
  'item_003': {
    id: 'item_003',
    name: '止痛药',
    type: CARD_TYPE.ITEM,
    rarity: 'R',
    acc: 0,
    diff: 0,
    cost: 2,
    effect: 'ignore_injury',
    description: '暂时消除伤病惩罚',
    consumable: true
  },
  'item_004': {
    id: 'item_004',
    name: '能量饮料',
    type: CARD_TYPE.ITEM,
    rarity: 'SR',
    acc: 0,
    diff: 0,
    cost: 2,
    effect: 'gain_energy',
    effectValue: 3,
    description: '能量+3',
    consumable: true
  },
  'item_005': {
    id: 'item_005',
    name: '教练挑战',
    type: CARD_TYPE.ITEM,
    rarity: 'SR',
    acc: 0,
    diff: 0,
    cost: 2,
    effect: 'challenge',
    description: '申诉裁判，重打这球',
    consumable: true
  },
  'item_006': {
    id: 'item_006',
    name: '超级幸运',
    type: CARD_TYPE.ITEM,
    rarity: 'SSR',
    acc: 0,
    diff: 0,
    cost: 3,
    effect: 'lucky_point',
    effectValue: 70,
    description: '70%概率直接得分',
    consumable: true
  },
  'item_007': {
    id: 'item_007',
    name: '时间暂停',
    type: CARD_TYPE.ITEM,
    rarity: 'UR',
    acc: 0,
    diff: 0,
    cost: 4,
    effect: 'freeze_opponent',
    description: '对手无法使用卡牌1回合',
    consumable: true
  },
  'item_008': {
    id: 'item_008',
    name: '仙人指路',
    type: CARD_TYPE.ITEM,
    rarity: 'UR',
    acc: 0,
    diff: 0,
    cost: 5,
    effect: 'force_weak',
    description: '指定对手使用最弱卡牌',
    consumable: true
  },

  // ========== 绝招卡 ==========
  'ultimate_001': {
    id: 'ultimate_001',
    name: '超级逆转',
    type: CARD_TYPE.ULTIMATE,
    rarity: 'UR',
    acc: 0,
    diff: 0,
    cost: 5,
    effect: 'comeback',
    description: '落后2分以上时使用，直接追平',
    consumable: true
  },
  'ultimate_002': {
    id: 'ultimate_002',
    name: '梦幻发球',
    type: CARD_TYPE.ULTIMATE,
    rarity: 'UR',
    acc: 0,
    diff: 0,
    cost: 5,
    effect: 'dream_serve',
    description: '连续3个ACE球',
    consumable: true
  },
  'ultimate_003': {
    id: 'ultimate_003',
    name: '零式发球',
    type: CARD_TYPE.ULTIMATE,
    rarity: 'UR',
    acc: 0,
    diff: 0,
    cost: 5,
    effect: 'must_ace_continue',
    description: '必定ACE，且不被破发',
    consumable: true
  },
  'ultimate_004': {
    id: 'ultimate_004',
    name: '神之抽击',
    type: CARD_TYPE.ULTIMATE,
    rarity: 'UR',
    acc: 0,
    diff: 0,
    cost: 5,
    effect: 'god_shot',
    description: '攻击+50，直接得分',
    consumable: true
  },
  'ultimate_005': {
    id: 'ultimate_005',
    name: '铜墙铁壁',
    type: CARD_TYPE.ULTIMATE,
    rarity: 'UR',
    acc: 0,
    diff: 0,
    cost: 5,
    effect: 'iron_defense',
    description: '接下来3回合必定防守成功',
    consumable: true
  },
  'ultimate_006': {
    id: 'ultimate_006',
    name: '网球上帝',
    type: CARD_TYPE.ULTIMATE,
    rarity: 'UR',
    acc: 0,
    diff: 0,
    cost: 6,
    effect: 'god_mode',
    description: '全能力+30，持续整场',
    consumable: true
  }
};

// 获取所有卡牌
function getAllCards() {
  return Object.values(CARDS);
}

// 根据ID获取卡牌
function getCardById(id) {
  return CARDS[id] || null;
}

// 根据类型获取卡牌
function getCardsByType(type) {
  return Object.values(CARDS).filter(card => card.type === type);
}

// 根据稀有度获取卡牌
function getCardsByRarity(rarity) {
  return Object.values(CARDS).filter(card => card.rarity === rarity);
}

// 随机获取一张卡牌（根据概率）
function randomDraw() {
  const rand = Math.random();
  let rarity;
  
  if (rand < 0.60) rarity = 'R';
  else if (rand < 0.85) rarity = 'SR';
  else if (rand < 0.95) rarity = 'SSR';
  else rarity = 'UR';
  
  const cardsOfRarity = getCardsByRarity(rarity);
  return cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)];
}

// 十连抽
function drawTen() {
  const results = [];
  
  // 保证至少一张SR或以上
  const guaranteedSR = randomDraw();
  results.push(guaranteedSR);
  
  // 其余9张
  for (let i = 0; i < 9; i++) {
    results.push(randomDraw());
  }
  
  return results;
}

// 获取卡牌升级所需金币
function getUpgradeCost(card, level) {
  const rarityConfig = RARITY[card.rarity];
  return rarityConfig.名称 * 100 * level;
}

// 获取卡牌升级效果
function getUpgradeEffect(card, level) {
  return {
    acc: card.acc + level * 2,
    diff: card.diff + level * 2
  };
}

module.exports = {
  CARD_RARITY,
  CARD_TYPE,
  RARITY,
  CARDS,
  getAllCards,
  getCardById,
  getCardsByType,
  getCardsByRarity,
  randomDraw,
  drawTen,
  getUpgradeCost,
  getUpgradeEffect
};
