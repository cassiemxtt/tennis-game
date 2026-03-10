/**
 * 卡组系统
 * 管理玩家的卡组 - 策略套牌版本
 */
const { CARD_TYPE, RARITY, CARDS, getCardById } = require('../data/cards.js');
const { STRATEGY_TYPES } = require('./strategy.js');

// 套牌体力上限
const DECK_ENERGY_LIMIT = 20;

// 套牌卡牌数量
const DECK_CARD_COUNT = 8;

// 策略套牌规则 - 每个策略偏好的卡牌类型
const STRATEGY_DECK_RULES = {
  [STRATEGY_TYPES.SERVE_VOLLEY]: {
    name: '发球上网',
    preferredTypes: [CARD_TYPE.SERVE, CARD_TYPE.VOLLEY, CARD_TYPE.SMASH],
    bonusSkill: 'serve',
    bonusPercent: 0.15
  },
  [STRATEGY_TYPES.BASELINE_RALLY]: {
    name: '底线相持',
    preferredTypes: [CARD_TYPE.BASELINE, CARD_TYPE.RETURN, CARD_TYPE.DROP_SHOT],
    bonusSkill: 'baseline',
    bonusPercent: 0.20
  },
  [STRATEGY_TYPES.DEFENSIVE_COUNTER]: {
    name: '防守反击',
    preferredTypes: [CARD_TYPE.BASELINE, CARD_TYPE.SLICE, CARD_TYPE.VOLLEY, CARD_TYPE.RETURN],
    bonusSkill: 'baseline',
    bonusPercent: 0.15
  },
  [STRATEGY_TYPES.DROP_SHOT_Lob]: {
    name: '小球+穿越',
    preferredTypes: [CARD_TYPE.DROP_SHOT, CARD_TYPE.SLICE, CARD_TYPE.LOB],
    bonusSkill: 'dropShot',
    bonusPercent: 0.20
  },
  [STRATEGY_TYPES.ALL_COVER]: {
    name: '全场覆盖',
    preferredTypes: [CARD_TYPE.SERVE, CARD_TYPE.RETURN, CARD_TYPE.BASELINE, CARD_TYPE.VOLLEY, CARD_TYPE.DROP_SHOT, CARD_TYPE.SLICE, CARD_TYPE.LOB, CARD_TYPE.SMASH],
    bonusSkill: null,
    bonusPercent: 0
  },
  [STRATEGY_TYPES.ALL_ATTACK]: {
    name: '全场进攻',
    preferredTypes: [CARD_TYPE.SERVE, CARD_TYPE.SMASH, CARD_TYPE.VOLLEY, CARD_TYPE.BASELINE],
    bonusSkill: 'serve',
    bonusPercent: 0.15
  }
};

// 卡组规则（旧版本兼容）
const DECK_RULES = {
  // 必带卡牌类型及数量限制
  REQUIRED: {
    [CARD_TYPE.SERVE]: { min: 1, max: 3 },
    [CARD_TYPE.RETURN]: { min: 1, max: 3 },
    [CARD_TYPE.BASELINE]: { min: 1, max: 3 }
  },
  // 可选卡牌类型及数量限制
  OPTIONAL: {
    [CARD_TYPE.VOLLEY]: { min: 0, max: 3 },
    [CARD_TYPE.DROP_SHOT]: { min: 0, max: 3 },
    [CARD_TYPE.SLICE]: { min: 0, max: 3 },
    [CARD_TYPE.LOB]: { min: 0, max: 3 },
    [CARD_TYPE.SMASH]: { min: 0, max: 3 }
  },
  // 其他卡牌数量限制
  OTHER: {
    [CARD_TYPE.COACH]: { max: 2 },
    [CARD_TYPE.ITEM]: { max: 3 },
    [CARD_TYPE.ULTIMATE]: { max: 1 }
  }
};

/**
 * 策略套牌类
 * 每个套牌绑定一个策略类型
 */
class StrategyDeck {
  constructor(strategyType = STRATEGY_TYPES.BASELINE_RALLY) {
    this.strategyType = strategyType; // 绑定的策略类型
    this.cards = []; // 卡牌ID列表
    this.name = STRATEGY_DECK_RULES[strategyType]?.name || '默认套牌';
  }

  // 获取策略配置
  getStrategyConfig() {
    return STRATEGY_DECK_RULES[this.strategyType];
  }

  // 获取总体力消耗
  getTotalEnergyCost() {
    return this.cards.reduce((total, cardId) => {
      const card = getCardById(cardId);
      return total + (card ? card.cost : 0);
    }, 0);
  }

  // 检查是否超过体力限制
  canAddCard(cardId) {
    const card = getCardById(cardId);
    if (!card) {
      return { canAdd: false, message: '卡牌不存在' };
    }

    // 检查卡牌数量
    if (this.cards.length >= DECK_CARD_COUNT) {
      return { canAdd: false, message: `套牌已达最大${DECK_CARD_COUNT}张` };
    }

    // 检查体力限制
    const newCost = this.getTotalEnergyCost() + card.cost;
    if (newCost > DECK_ENERGY_LIMIT) {
      return { canAdd: false, message: `体力不足，当前${this.getTotalEnergyCost()}/${DECK_ENERGY_LIMIT}` };
    }

    return { canAdd: true, card };
  }

  // 添加卡牌
  addCard(cardId) {
    const result = this.canAddCard(cardId);
    if (!result.canAdd) {
      return { success: false, message: result.message };
    }

    this.cards.push(cardId);
    return { success: true, message: `添加${result.card.name}成功` };
  }

  // 移除卡牌
  removeCard(cardId) {
    const index = this.cards.indexOf(cardId);
    if (index > -1) {
      this.cards.splice(index, 1);
      return { success: true, message: '移除成功' };
    }
    return { success: false, message: '卡牌不在套牌中' };
  }

  // 检查套牌是否完整
  isComplete() {
    return {
      complete: this.cards.length === DECK_CARD_COUNT,
      cardCount: this.cards.length,
      requiredCount: DECK_CARD_COUNT,
      energyCost: this.getTotalEnergyCost(),
      energyLimit: DECK_ENERGY_LIMIT
    };
  }

  // 获取套牌中的所有卡牌
  getCards() {
    return this.cards.map(id => getCardById(id)).filter(card => card !== null);
  }

  // 获取套牌详情
  getDeckInfo() {
    const info = {
      strategyType: this.strategyType,
      strategyName: this.getStrategyConfig()?.name || '未知',
      totalCards: this.cards.length,
      maxCards: DECK_CARD_COUNT,
      totalEnergy: this.getTotalEnergyCost(),
      maxEnergy: DECK_ENERGY_LIMIT,
      byType: {},
      byRarity: { R: 0, SR: 0, SSR: 0, UR: 0 }
    };

    for (const cardId of this.cards) {
      const card = getCardById(cardId);
      if (card) {
        if (!info.byType[card.type]) {
          info.byType[card.type] = 0;
        }
        info.byType[card.type]++;
        info.byRarity[card.rarity]++;
      }
    }

    return info;
  }

  // 检查套牌是否可以开始战斗
  canStartBattle() {
    if (this.cards.length < DECK_CARD_COUNT) {
      return { canBattle: false, message: `套牌需要${DECK_CARD_COUNT}张卡，当前${this.cards.length}张` };
    }
    return { canBattle: true };
  }

  // 序列化
  toJSON() {
    return {
      strategyType: this.strategyType,
      cards: this.cards,
      name: this.name
    };
  }

  // 反序列化
  static fromJSON(data) {
    const deck = new StrategyDeck(data.strategyType || STRATEGY_TYPES.BASELINE_RALLY);
    if (data.cards) {
      deck.cards = data.cards;
    }
    if (data.name) {
      deck.name = data.name;
    }
    return deck;
  }
}

// 兼容旧版Deck类
class Deck {
  constructor() {
    this.cards = []; // 卡组中的卡牌ID列表
    this.name = '默认卡组';
  }

  // 添加卡牌到卡组
  addCard(cardId) {
    const card = getCardById(cardId);
    if (!card) {
      return { success: false, message: '卡牌不存在' };
    }

    // 检查是否是消耗性卡牌（道具/绝招）- 这些卡只能带1张
    if (card.consumable) {
      const count = this.cards.filter(id => id === cardId).length;
      if (count >= 1) {
        return { success: false, message: '消耗性卡牌每种只能带1张' };
      }
    }

    // 验证卡组规则
    const validation = this.validateCard(card);
    if (!validation.valid) {
      return { success: false, message: validation.message };
    }

    this.cards.push(cardId);
    return { success: true, message: `添加${card.name}成功` };
  }

  // 从卡组移除卡牌
  removeCard(cardId) {
    const index = this.cards.indexOf(cardId);
    if (index > -1) {
      this.cards.splice(index, 1);
      return { success: true, message: '移除成功' };
    }
    return { success: false, message: '卡牌不在卡组中' };
  }

  // 验证是否可以添加这张卡
  validateCard(card) {
    const type = card.type;
    const count = this.cards.filter(id => id === card.id).length;

    // 检查必带卡牌
    if (DECK_RULES.REQUIRED[type]) {
      const rule = DECK_RULES.REQUIRED[type];
      const typeCount = this.getCardCountByType(type);
      
      if (typeCount >= rule.max) {
        return { valid: false, message: `${card.name}类型已达上限${rule.max}张` };
      }
    }
    
    // 检查可选卡牌
    if (DECK_RULES.OPTIONAL[type]) {
      const rule = DECK_RULES.OPTIONAL[type];
      const typeCount = this.getCardCountByType(type);
      
      if (typeCount >= rule.max) {
        return { valid: false, message: `${card.name}类型已达上限${rule.max}张` };
      }
    }
    
    // 检查其他卡牌
    if (DECK_RULES.OTHER[type]) {
      const rule = DECK_RULES.OTHER[type];
      
      if (count >= rule.max) {
        return { valid: false, message: `${card.name}已达上限${rule.max}张` };
      }
    }

    return { valid: true };
  }

  // 获取卡组是否完整（满足必带要求）
  isComplete() {
    // 检查必带卡牌
    for (const [type, rule] of Object.entries(DECK_RULES.REQUIRED)) {
      const count = this.getCardCountByType(type);
      if (count < rule.min) {
        return { complete: false, message: `${type}类型至少需要${rule.min}张，当前${count}张` };
      }
    }
    return { complete: true };
  }

  // 获取指定类型的卡牌数量
  getCardCountByType(type) {
    return this.cards.filter(cardId => {
      const card = getCardById(cardId);
      return card && card.type === type;
    }).length;
  }

  // 获取卡组详情
  getDeckInfo() {
    const info = {
      totalCards: this.cards.length,
      byType: {},
      byRarity: { R: 0, SR: 0, SSR: 0, UR: 0 }
    };

    for (const cardId of this.cards) {
      const card = getCardById(cardId);
      if (card) {
        // 按类型统计
        if (!info.byType[card.type]) {
          info.byType[card.type] = 0;
        }
        info.byType[card.type]++;
        
        // 按稀有度统计
        info.byRarity[card.rarity]++;
      }
    }

    return info;
  }

  // 获取卡组中的所有卡牌对象
  getCards() {
    return this.cards.map(id => getCardById(id)).filter(card => card !== null);
  }

  // 检查卡组是否可以开始战斗
  canStartBattle() {
    const complete = this.isComplete();
    if (!complete.complete) {
      return { canBattle: false, message: complete.message };
    }
    
    if (this.cards.length < 3) {
      return { canBattle: false, message: '卡组至少需要3张卡牌' };
    }

    return { canBattle: true };
  }

  // 序列化
  toJSON() {
    return {
      cards: this.cards,
      name: this.name
    };
  }

  // 反序列化
  static fromJSON(data) {
    const deck = new Deck();
    if (data.cards) {
      deck.cards = data.cards;
    }
    if (data.name) {
      deck.name = data.name;
    }
    return deck;
  }
}

// 玩家卡牌管理器
class CardManager {
  constructor() {
    this.allCards = {}; // 玩家拥有的所有卡牌 {cardId: count}
    this.fragments = {}; // 玩家拥有的碎片 {rarity: count}
    this.decks = []; // 玩家的卡组列表
  }

  // 添加卡牌
  addCard(cardId, count = 1) {
    if (!this.allCards[cardId]) {
      this.allCards[cardId] = 0;
    }
    this.allCards[cardId] += count;
  }

  // 移除卡牌
  removeCard(cardId, count = 1) {
    if (this.allCards[cardId] && this.allCards[cardId] >= count) {
      this.allCards[cardId] -= count;
      if (this.allCards[cardId] === 0) {
        delete this.allCards[cardId];
      }
      return true;
    }
    return false;
  }

  // 获取卡牌数量
  getCardCount(cardId) {
    return this.allCards[cardId] || 0;
  }

  // 获取玩家拥有的所有卡牌
  getOwnedCards() {
    const cards = [];
    for (const [cardId, count] of Object.entries(this.allCards)) {
      const card = getCardById(cardId);
      if (card) {
        cards.push({ ...card, count });
      }
    }
    return cards;
  }

  // 添加碎片
  addFragment(rarity, count) {
    if (!this.fragments[rarity]) {
      this.fragments[rarity] = 0;
    }
    this.fragments[rarity] += count;
  }

  // 移除碎片
  removeFragment(rarity, count) {
    if (this.fragments[rarity] && this.fragments[rarity] >= count) {
      this.fragments[rarity] -= count;
      return true;
    }
    return false;
  }

  // 获取碎片数量
  getFragmentCount(rarity) {
    return this.fragments[rarity] || 0;
  }

  // 合成卡牌
  synthesizeCard(cardId) {
    const card = getCardById(cardId);
    if (!card) {
      return { success: false, message: '卡牌不存在' };
    }

    const rarityConfig = RARITY[card.rarity];
    const needFragments = rarityConfig.合成碎片;

    if (this.getFragmentCount(card.rarity) < needFragments) {
      return { success: false, message: `需要${needFragments}个${card.rarity}碎片` };
    }

    // 扣除碎片
    this.removeFragment(card.rarity, needFragments);
    
    // 添加卡牌
    this.addCard(cardId);

    return { success: true, message: `合成${card.name}成功！` };
  }

  // 分解卡牌
  decomposeCard(cardId) {
    const card = getCardById(cardId);
    if (!card) {
      return { success: false, message: '卡牌不存在' };
    }

    // 检查是否有多余的卡牌
    if (this.getCardCount(cardId) <= 1) {
      return { success: false, message: '无法分解唯一的卡牌' };
    }

    // 移除卡牌
    this.removeCard(cardId);
    
    // 添加碎片
    const rarityConfig = RARITY[card.rarity];
    this.addFragment(card.rarity, rarityConfig.分解碎片);

    return { success: true, message: `分解获得${rarityConfig.分解碎片}个${card.rarity}碎片` };
  }

  // 创建新卡组
  createDeck(name = '新卡组') {
    const deck = new Deck();
    deck.name = name;
    this.decks.push(deck);
    return deck;
  }

  // 获取卡组
  getDeck(index) {
    return this.decks[index];
  }

  // 序列化
  toJSON() {
    return {
      allCards: this.allCards,
      fragments: this.fragments,
      decks: this.decks.map(d => d.toJSON())
    };
  }

  // 反序列化
  static fromJSON(data) {
    const manager = new CardManager();
    if (data.allCards) {
      manager.allCards = data.allCards;
    }
    if (data.fragments) {
      manager.fragments = data.fragments;
    }
    if (data.decks) {
      manager.decks = data.decks.map(d => Deck.fromJSON(d));
    }
    return manager;
  }
}

/**
 * 策略套牌管理器
 * 管理玩家的所有策略套牌
 */
class StrategyDeckManager {
  constructor() {
    this.decks = {}; // {strategyType: StrategyDeck}
  }

  // 获取或创建策略套牌
  getOrCreateDeck(strategyType) {
    if (!this.decks[strategyType]) {
      this.decks[strategyType] = new StrategyDeck(strategyType);
    }
    return this.decks[strategyType];
  }

  // 获取策略套牌
  getDeck(strategyType) {
    return this.decks[strategyType] || null;
  }

  // 获取所有套牌
  getAllDecks() {
    return Object.values(this.decks);
  }

  // 检查是否所有策略套牌都已完成
  areAllDecksComplete() {
    const strategyTypes = Object.values(STRATEGY_TYPES);
    return strategyTypes.every(type => {
      const deck = this.decks[type];
      return deck && deck.cards.length === DECK_CARD_COUNT;
    });
  }

  // 获取已完成套牌数量
  getCompletedDeckCount() {
    return Object.values(this.decks).filter(deck => 
      deck.cards.length === DECK_CARD_COUNT
    ).length;
  }

  // 序列化
  toJSON() {
    const decksData = {};
    for (const [type, deck] of Object.entries(this.decks)) {
      decksData[type] = deck.toJSON();
    }
    return { decks: decksData };
  }

  // 反序列化
  static fromJSON(data) {
    const manager = new StrategyDeckManager();
    if (data && data.decks) {
      for (const [type, deckData] of Object.entries(data.decks)) {
        manager.decks[type] = StrategyDeck.fromJSON(deckData);
      }
    }
    return manager;
  }
}

module.exports = {
  Deck,
  CardManager,
  StrategyDeck,
  StrategyDeckManager,
  DECK_RULES,
  STRATEGY_DECK_RULES,
  DECK_ENERGY_LIMIT,
  DECK_CARD_COUNT
};
