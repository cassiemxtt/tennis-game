/**
 * 数据模型 - Player 球员类
 * 使用新的技能系统：7种技能 + 技能点 + 策略系统 + 道具系统 + 卡牌系统
 */
const { SkillManager, SKILL_TYPES, SKILL_INFO } = require('./skill.js');
const { Coach, COACH_LEVELS } = require('./coach.js');
const { StrategyManager, STRATEGY_TYPES } = require('./strategy.js');
const { InventoryManager, ITEM_TYPES } = require('./item.js');
const { CardManager, Deck, DeckManager, StrategyDeck, StrategyDeckManager, STRATEGY_DECK_RULES, DECK_CARD_COUNT } = require('./deck.js');
const { randomDraw } = require('../data/cards.js');

class Player {
  constructor(name = '网球新星', gender = 'male') {
    this.name = name;
    this.gender = gender; // 'male' 或 'female'
    this.age = 14;
    this.careerYear = 0;
    this.energy = 100;
    this.money = 1000000000;
    this.ranking = 1000;
    this.careerEarnings = 0;
    this.titles = 0;
    this.grandSlams = 0;
    this.matchesPlayed = 0;
    this.matchesWon = 0;

    // 状态
    this.form = 80;  // 状态 0-100

    // 疲劳度
    this.fatigue = 0;

    // 生涯记录
    this.careerHighRanking = 1000;
    this.bestResult = '无';

    // 技能系统
    this.skillManager = new SkillManager();
    this.skillPoints = 0;  // 可用技能点

    // 策略系统
    this.strategyManager = new StrategyManager();
    
    // 背包系统
    this.inventory = new InventoryManager();

    // 当前赞助商 - 存储对象 {name, expiresYear, expiresMonth, expired}
    this.sponsors = [];
    
    // 游戏数据引用（用于获取当前年月计算赞助到期）
    this.gameData = null;

    // 装备系统 - 存储当前穿戴的装备ID
    this.equipment = {
      head: 'none',
      body: 'default_white',
      racket: 'default',
      shoes: 'default_white',
      accessory: 'none'
    };
    
    // 伤病系统
    this.injury = {
      type: null,        // 当前伤病类型
      weeksRemaining: 0, // 伤病剩余周数
      isInjured: false  // 是否受伤
    };
    
    // 教练团队
    this.coaches = [];
    
    // 训练点数系统
    this.trainingPoints = 5;  // 每周5点训练点数
    
    // 带练教练 - 当前选择陪同训练的教练
    this.trainingCoach = null;  // 存储教练type
    
    // 瓶颈期状态 - 记录每项技能的连续训练次数
    this.plateauCount = {
      baseline: 0,
      volley: 0,
      serve: 0,
      dropShot: 0,
      slice: 0,
      lob: 0,
      smash: 0
    };
    
    // 技能是否处于瓶颈期
    this.inPlateau = {
      baseline: false,
      volley: false,
      serve: false,
      dropShot: false,
      slice: false,
      lob: false,
      smash: false
    };
    
    // ===== 卡牌系统 =====
    this.cardManager = new CardManager();
    this.currentDeck = new Deck();
    
    // ===== 多卡组系统 =====
    this.deckManager = new DeckManager();
    
    // ===== 策略套牌系统 =====
    this.strategyDeckManager = new StrategyDeckManager();
    
    // 初始卡牌 - 每种类型给1张基础卡
    this.initStarterCards();
    
    // 初始化默认卡组
    this.initDefaultDeck();
  }
  
  // 初始化默认卡组
  initDefaultDeck() {
    // 创建一个默认卡组
    const result = this.deckManager.createDeck('卡组1');
    if (result.success && result.deck) {
      // 将初始卡牌复制到默认卡组
      for (const cardId of this.currentDeck.cards) {
        result.deck.cards.push(cardId);
      }
    }
  }
  
  // 获取卡组管理器
  getDeckManager() {
    return this.deckManager;
  }
  
  // 获取当前选中的卡组（兼容旧代码）
  getDeck() {
    // 优先使用 deckManager，如果为空则使用 currentDeck
    const activeDeck = this.deckManager.getActiveDeck();
    return activeDeck || this.currentDeck;
  }
  
  // 获取所有卡组
  getAllDecks() {
    return this.deckManager.getAllDecks();
  }
  
  // 获取卡组卡牌列表（用于战斗）
  getBattleCards() {
    const deck = this.getDeck();
    return deck ? deck.cards : [];
  }
  
  // 获取策略套牌管理器
  getStrategyDeckManager() {
    return this.strategyDeckManager;
  }
  
  // 获取指定策略的套牌
  getStrategyDeck(strategyType) {
    return this.strategyDeckManager.getOrCreateDeck(strategyType);
  }
  
  // 获取所有策略套牌
  getAllStrategyDecks() {
    return this.strategyDeckManager.getAllDecks();
  }
  
  // 检查是否有完整套牌可以使用
  hasCompleteDeck() {
    return this.strategyDeckManager.getCompletedDeckCount() > 0;
  }
  
  // 获取可用套牌数量
  getCompletedDeckCount() {
    return this.strategyDeckManager.getCompletedDeckCount();
  }
  
  // 初始化玩家卡牌（每种类型给1张基础卡）
  initStarterCards() {
    // 发球卡
    this.cardManager.addCard('serve_001', 1);
    this.currentDeck.addCard('serve_001');
    
    // 接发球卡
    this.cardManager.addCard('return_001', 1);
    this.currentDeck.addCard('return_001');
    
    // 底线卡
    this.cardManager.addCard('baseline_001', 2);
    this.currentDeck.addCard('baseline_001');
    this.currentDeck.addCard('baseline_002');
    
    // 截击卡
    this.cardManager.addCard('volley_001', 1);
    this.currentDeck.addCard('volley_001');
    
    // 放小球
    this.cardManager.addCard('dropshot_001', 1);
    this.currentDeck.addCard('dropshot_001');
    
    // 切削卡
    this.cardManager.addCard('slice_001', 1);
    this.currentDeck.addCard('slice_001');
    
    // 初始碎片
    this.cardManager.addFragment('R', 10);
    this.cardManager.addFragment('SR', 5);
  }
  
  // 抽卡（单抽）
  drawCard() {
    const card = randomDraw();
    if (card) {
      this.cardManager.addCard(card.id, 1);
      return card;
    }
    return null;
  }
  
  // 十连抽
  drawTenCards() {
    const { drawTen } = require('../data/cards.js');
    const cards = drawTen();
    for (const card of cards) {
      this.cardManager.addCard(card.id, 1);
    }
    return cards;
  }
  
  // 获取卡牌管理器
  getCardManager() {
    return this.cardManager;
  }
  
  // 检查是否有伤病影响
  getInjuryEffect() {
    if (!this.injury.isInjured || !this.injury.type) {
      return null;
    }
    
    const baseEffect = {
      baseline: 0,
      volley: 0,
      serve: 0,
      dropShot: 0,
      slice: 0,
      lob: 0,
      smash: 0
    };
    
    const injuryEffects = {
      'light_strain': { baseline: -10 },
      'muscle_soreness': { baseline: -10 },
      'sprain': { volley: -15 },
      'tennis_elbow': { serve: -20, smash: -15 },
      'meniscus': { baseline: -15, volley: -15, serve: -10 },
      'season_end': { baseline: -20, volley: -20, serve: -20, dropShot: -20, slice: -20, lob: -20, smash: -20 }
    };
    
    const effect = injuryEffects[this.injury.type] || {};
    return { ...baseEffect, ...effect };
  }
  
  // 计算综合实力（考虑伤病影响）
  calculateOverall() {
    // 使用技能管理器的综合计算
    return this.skillManager.calculateOverall();
  }
  
  // 获取技能管理器
  getSkills() {
    return this.skillManager;
  }
  
  // 获取所有技能（快捷方法）
  getAllSkills() {
    return this.skillManager.getAllSkills();
  }
  
  // 获取指定技能
  getSkill(type) {
    return this.skillManager.getSkill(type);
  }
  
  // 获得伤病
  getInjured(injuryType, duration) {
    this.injury = {
      type: injuryType,
      weeksRemaining: duration,
      isInjured: true
    };
    // 更新伤病惩罚
    this.updateSkillBonuses();
  }
  
  // 伤病恢复一周
  recoverInjury() {
    if (this.injury.isInjured && this.injury.weeksRemaining > 0) {
      this.injury.weeksRemaining--;
      if (this.injury.weeksRemaining <= 0) {
        this.injury = {
          type: null,
          weeksRemaining: 0,
          isInjured: false
        };
        this.updateSkillBonuses();
        return true; // 伤病痊愈
      }
    }
    return false;
  }
  
  // 更新技能加成（赞助、装备、教练、状态、伤病）
  updateSkillBonuses() {
    // 计算赞助加成系数
    let sponsorMultiplier = 1.0;
    for (const sponsor of this.sponsors) {
      if (!sponsor.expired) {
        sponsorMultiplier = Math.max(sponsorMultiplier, sponsor.multiplier || 1.0);
      }
    }
    
    // 计算装备加成系数
    let equipmentMultiplier = 1.0;
    // 装备加成稍后从装备系统获取
    
    // 计算教练加成（使用Coach类）
    let coachBonus = {};
    for (const coachData of this.coaches) {
      const coach = new Coach(coachData);
      const skillBonus = coach.getSkillBonus();
      for (const [skill, bonus] of Object.entries(skillBonus)) {
        coachBonus[skill] = (coachBonus[skill] || 0) + bonus;
      }
    }
    
    // 计算年龄加成
    let ageBonus = 0;
    if (this.age >= 18 && this.age <= 25) {
      ageBonus = 5; // 黄金年龄
    } else if (this.age > 30) {
      ageBonus = -5; // 年龄增长
    }
    
    // 计算伤病惩罚 - 只有受伤时才传递伤病惩罚
    let injuryPenalty = null;
    if (this.injury.isInjured) {
      const effect = this.getInjuryEffect();
      if (effect) {
        injuryPenalty = effect;
      }
    }
    
    // 构建更新参数
    const updateParams = {
      sponsorBonus: {
        baseline: Math.floor(10 * (sponsorMultiplier - 1)),
        volley: Math.floor(10 * (sponsorMultiplier - 1)),
        serve: Math.floor(10 * (sponsorMultiplier - 1)),
        dropShot: Math.floor(10 * (sponsorMultiplier - 1)),
        slice: Math.floor(10 * (sponsorMultiplier - 1)),
        lob: Math.floor(10 * (sponsorMultiplier - 1)),
        smash: Math.floor(10 * (sponsorMultiplier - 1))
      },
      equipmentBonus: {
        baseline: 0, volley: 0, serve: 0, dropShot: 0, slice: 0, lob: 0, smash: 0
      },
      coachBonus: coachBonus,
      ageBonus: ageBonus,
      form: this.form
    };
    
    // 只有受伤时才添加伤病惩罚
    if (injuryPenalty) {
      updateParams.injuryPenalty = injuryPenalty;
    }
    
    // 更新所有技能加成
    this.skillManager.updateBonuses(updateParams);
  }
  
  // 雇佣教练
  hireCoach(coach) {
    // 检查是否已雇佣同类型教练
    const existingIndex = this.coaches.findIndex(c => c.type === coach.type);
    if (existingIndex >= 0) {
      return { success: false, message: '已雇佣同类型教练' };
    }
    
    // 检查资金
    if (this.money < coach.signingBonus) {
      return { success: false, message: '资金不足' };
    }
    
    this.money -= coach.signingBonus;
    this.coaches.push({
      ...coach,
      contractMonths: coach.contractMonths || 12
    });
    
    // 更新技能加成
    this.updateSkillBonuses();
    
    return { success: true, message: `已雇佣${coach.name}` };
  }
  
  // 解雇教练
  fireCoach(coachType) {
    const index = this.coaches.findIndex(c => c.type === coachType);
    if (index < 0) {
      return { success: false, message: '未找到该教练' };
    }
    
    this.coaches.splice(index, 1);
    
    // 更新技能加成
    this.updateSkillBonuses();
    
    return { success: true, message: '教练已解雇' };
  }
  
  // 获取教练加成（使用等级系统）
  getCoachBonus() {
    const bonus = {
      trainingEffect: 0,
      injuryResistance: 0,
      matchWinRate: 0,
      energyRecovery: 0,
      sponsorIncome: 0,
      plateauBreak: 0,  // 突破瓶颈的能力
      serveEffect: 0,
      volleyEffect: 0,
      baselineEffect: 0,
      sliceEffect: 0
    };
    
    for (const coachData of this.coaches) {
      // 使用Coach类计算加成
      const coach = new Coach(coachData);
      const effect = coach.getEffectValue();
      
      for (const [key, value] of Object.entries(effect)) {
        if (bonus.hasOwnProperty(key)) {
          bonus[key] += value;
        }
      }
    }
    
    return bonus;
  }
  
  // 获取赞助商突破加成
  getSponsorBreakBonus() {
    let breakBonus = 0;
    for (const sponsor of this.sponsors) {
      if (!sponsor.expired && sponsor.level) {
        breakBonus += sponsor.level * 0.1;  // 等级越高突破加成越高
      }
    }
    return breakBonus;
  }
  
  // 检查是否可以突破瓶颈
  canBreakPlateau(skillType) {
    const coachBonus = this.getCoachBonus();
    const sponsorBonus = this.getSponsorBreakBonus();
    return (coachBonus.plateauBreak + sponsorBonus) > 0;
  }
  
  // 突破瓶颈
  breakPlateau(skillType) {
    if (this.canBreakPlateau(skillType)) {
      this.plateauCount[skillType] = 0;
      this.inPlateau[skillType] = false;
      return true;
    }
    return false;
  }
  
  // 获取年龄训练加成
  getAgeTrainingBonus() {
    if (this.age < 18) return 1.5;
    if (this.age <= 25) return 1.0;
    if (this.age <= 30) return 0.7;
    return 0.3;
  }
  
  // 获取状态训练加成
  getFormTrainingBonus() {
    if (this.form >= 80) return 1.15;
    if (this.form >= 50) return 1.0;
    return 0.7;
  }
  
  // 重置训练点数（每周调用）
  resetTrainingPoints() {
    this.trainingPoints = 5;
  }
  
  // 使用训练点数
  useTrainingPoints(count = 1) {
    if (this.trainingPoints >= count) {
      this.trainingPoints -= count;
      return true;
    }
    return false;
  }

  getFormAdjustment() {
    if (this.form >= 80) return 1.2;
    if (this.form >= 60) return 1.0;
    if (this.form >= 40) return 0.8;
    if (this.form >= 20) return 0.6;
    return 0.4;
  }

  ageUp() {
    this.age += 1;
    this.careerYear += 1;

    // 年龄变化时更新加成
    this.updateSkillBonuses();
  }

  addFatigue(amount) {
    this.fatigue = Math.min(100, this.fatigue + amount);
    if (this.fatigue > 70) {
      this.form = Math.max(10, this.form - 5);
    }
  }

  rest() {
    const recovery = this.randomInt(15, 25);
    this.fatigue = Math.max(0, this.fatigue - recovery);
    // 恢复精力30点
    this.energy = Math.min(100, this.energy + 30);
    if (Math.random() > 0.5) {
      this.form = Math.min(100, this.form + this.randomInt(5, 15));
    }
    // 更新状态加成
    this.updateSkillBonuses();
    return recovery;
  }

  updateRanking(pointsEarned) {
    if (this.ranking === 1000) {
      if (pointsEarned > 0) {
        this.ranking = 500 - Math.floor(pointsEarned / 10);
      }
    } else {
      const rankImprovement = Math.floor(pointsEarned / 100);
      this.ranking = Math.max(1, this.ranking - rankImprovement);
    }
    if (this.ranking < this.careerHighRanking) {
      this.careerHighRanking = this.ranking;
    }
  }

  getWinRate() {
    if (this.matchesPlayed === 0) return 0;
    return (this.matchesWon / this.matchesPlayed * 100).toFixed(1);
  }

  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  toJSON() {
    return {
      name: this.name,
      gender: this.gender,
      age: this.age,
      careerYear: this.careerYear,
      energy: this.energy,
      money: this.money,
      ranking: this.ranking,
      careerEarnings: this.careerEarnings,
      titles: this.titles,
      grandSlams: this.grandSlams,
      matchesPlayed: this.matchesPlayed,
      matchesWon: this.matchesWon,
      form: this.form,
      fatigue: this.fatigue,
      careerHighRanking: this.careerHighRanking,
      bestResult: this.bestResult,
      skillManager: this.skillManager.toJSON(),
      skillPoints: this.skillPoints,
      strategyManager: this.strategyManager.toJSON(),
      inventory: this.inventory.toJSON(),
      sponsors: this.sponsors,
      equipment: this.equipment,
      injury: this.injury,
      coaches: this.coaches,
      trainingPoints: this.trainingPoints,
      trainingCoach: this.trainingCoach,
      plateauCount: this.plateauCount,
      inPlateau: this.inPlateau,
      // 卡牌系统
      cardManager: this.cardManager ? this.cardManager.toJSON() : null,
      currentDeck: this.currentDeck ? this.currentDeck.toJSON() : null,
      // 多卡组系统
      deckManager: this.deckManager ? this.deckManager.toJSON() : null,
      // 策略套牌系统
      strategyDeckManager: this.strategyDeckManager ? this.strategyDeckManager.toJSON() : null
    };
  }

  static fromJSON(data) {
    const player = new Player(data.name || '网球新星', data.gender || 'male');
    Object.assign(player, data);
    
    // 恢复技能系统
    if (data.skillManager) {
      player.skillManager = SkillManager.fromJSON(data.skillManager);
    }
    player.skillPoints = data.skillPoints || 0;
    
    // 恢复策略系统
    if (data.strategyManager) {
      player.strategyManager = StrategyManager.fromJSON(data.strategyManager);
    }
    
    // 恢复背包系统
    if (data.inventory) {
      player.inventory = InventoryManager.fromJSON(data.inventory);
    }
    
    // 确保 gender 字段有值
    if (!player.gender) {
      player.gender = 'male';
    }
    
    // 恢复训练点数系统
    player.trainingPoints = data.trainingPoints || 5;
    player.trainingCoach = data.trainingCoach || null;
    player.plateauCount = data.plateauCount || {
      baseline: 0, volley: 0, serve: 0, dropShot: 0, slice: 0, lob: 0, smash: 0
    };
    player.inPlateau = data.inPlateau || {
      baseline: false, volley: false, serve: false, dropShot: false, slice: false, lob: false, smash: false
    };
    
    // 恢复卡牌系统
    if (data.cardManager) {
      player.cardManager = CardManager.fromJSON(data.cardManager);
    }
    if (data.currentDeck) {
      player.currentDeck = Deck.fromJSON(data.currentDeck);
    }
    
    // 恢复策略套牌系统
    if (data.strategyDeckManager) {
      player.strategyDeckManager = StrategyDeckManager.fromJSON(data.strategyDeckManager);
    }
    
    // 恢复多卡组系统
    if (data.deckManager) {
      player.deckManager = DeckManager.fromJSON(data.deckManager);
    }
    
    // 如果deckManager为空（旧存档），确保创建一个
    if (!player.deckManager || player.deckManager.getDeckCount() === 0) {
      // 确保deckManager存在
      if (!player.deckManager) {
        player.deckManager = new DeckManager();
      }
      
      // 如果currentDeck有卡牌，迁移到deckManager
      if (player.currentDeck && player.currentDeck.cards && player.currentDeck.cards.length > 0) {
        player.initDefaultDeck();
      } else {
        // 创建空卡组
        player.deckManager.createDeck('卡组1');
      }
    }
    
    // 更新技能加成
    player.updateSkillBonuses();
    
    return player;
  }
}

module.exports = Player;
