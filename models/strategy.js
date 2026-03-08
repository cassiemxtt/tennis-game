/**
 * 数据模型 - Strategy 策略系统
 * 6种比赛策略，不同策略有不同加成、精力消耗、场地适应和克制关系
 */

// 策略类型定义
const STRATEGY_TYPES = {
  SERVE_VOLLEY: 'serve_volley',      // 发球上网
  BASELINE_RALLY: 'baseline_rally',  // 底线相持
  DEFENSIVE_COUNTER: 'defensive_counter', // 防守反击
  DROP_SHOT_Lob: 'drop_shot_lob',   // 小球+穿越
  ALL_COVER: 'all_cover',            // 全场覆盖
  ALL_ATTACK: 'all_attack'           // 全场进攻
};

// 场地类型
const COURT_TYPES = {
  GRASS: 'grass',    // 草地
  HARD: 'hard',      // 硬地
  CLAY: 'clay'       // 红土
};

// 场地适应等级
const COURT_ADAPTATION = {
  S: { bonus: 0.15, name: 'S级' },
  A: { bonus: 0.05, name: 'A级' },
  B: { bonus: 0, name: 'B级' },
  C: { bonus: -0.10, name: 'C级' }
};

// 精力消耗等级
const ENERGY_COST = {
  LOW: { multiplier: 0.8, name: '低' },      // -20%
  NORMAL: { multiplier: 1.0, name: '正常' },
  HIGH: { multiplier: 1.2, name: '高' },      // +20%
  VERY_HIGH: { multiplier: 1.3, name: '极高' } // +30%
};

// 策略详细配置
const STRATEGY_CONFIG = {
  // 发球上网 - 网前型，精力消耗低
  [STRATEGY_TYPES.SERVE_VOLLEY]: {
    name: '发球上网',
    description: '主动上网抢分，适合草地',
    energyCost: ENERGY_COST.LOW,
    courtAdaptation: {
      [COURT_TYPES.GRASS]: COURT_ADAPTATION.S,
      [COURT_TYPES.HARD]: COURT_ADAPTATION.A,
      [COURT_TYPES.CLAY]: COURT_ADAPTATION.C
    },
    skillBonus: {
      serve: 0.15,      // +15%
      volley: 0.10,     // +10%
      baseline: -0.10,  // -10%
      dropShot: 0,
      slice: 0,
      lob: 0,
      smash: 0
    },
    counters: [STRATEGY_TYPES.DROP_SHOT_Lob], // 克小球+穿越
    weakAgainst: [STRATEGY_TYPES.ALL_COVER]   // 被全场覆盖克
  },
  
  // 底线相持 - 防守型，精力消耗高
  [STRATEGY_TYPES.BASELINE_RALLY]: {
    name: '底线相持',
    description: '稳健相持等待机会，适合红土',
    energyCost: ENERGY_COST.HIGH,
    courtAdaptation: {
      [COURT_TYPES.CLAY]: COURT_ADAPTATION.S,
      [COURT_TYPES.HARD]: COURT_ADAPTATION.A,
      [COURT_TYPES.GRASS]: COURT_ADAPTATION.C
    },
    skillBonus: {
      baseline: 0.20,   // +20%
      dropShot: 0.10,   // +10%
      serve: -0.05,     // -5%
      volley: 0,
      slice: 0,
      lob: 0,
      smash: 0
    },
    counters: [STRATEGY_TYPES.ALL_ATTACK], // 克全场进攻
    weakAgainst: [STRATEGY_TYPES.DROP_SHOT_Lob] // 被小球+穿越克
  },
  
  // 防守反击 - 稳定型，精力消耗极高
  [STRATEGY_TYPES.DEFENSIVE_COUNTER]: {
    name: '防守反击',
    description: '防守中寻找反击机会，稳健应对所有策略',
    energyCost: ENERGY_COST.VERY_HIGH,
    courtAdaptation: {
      [COURT_TYPES.HARD]: COURT_ADAPTATION.S,
      [COURT_TYPES.CLAY]: COURT_ADAPTATION.A,
      [COURT_TYPES.GRASS]: COURT_ADAPTATION.B
    },
    skillBonus: {
      baseline: 0.15,   // +15%
      volley: 0.15,     // +15%
      slice: 0.10,      // +10%
      serve: 0,
      dropShot: 0,
      lob: 0,
      smash: 0
    },
    counters: [], // 无明显克制，但防守稳健
    weakAgainst: [] // 无明显被克
  },
  
  // 小球+穿越 - 技巧型，精力消耗低
  [STRATEGY_TYPES.DROP_SHOT_Lob]: {
    name: '小球+穿越',
    description: '网前变线得分，适合红土',
    energyCost: ENERGY_COST.LOW,
    courtAdaptation: {
      [COURT_TYPES.CLAY]: COURT_ADAPTATION.S,
      [COURT_TYPES.GRASS]: COURT_ADAPTATION.A,
      [COURT_TYPES.HARD]: COURT_ADAPTATION.B
    },
    skillBonus: {
      dropShot: 0.20,  // +20%
      slice: 0.15,      // +15%
      lob: 0.10,        // +10%
      serve: 0,
      volley: 0,
      baseline: 0,
      smash: 0
    },
    counters: [STRATEGY_TYPES.BASELINE_RALLY], // 克底线相持
    weakAgainst: [STRATEGY_TYPES.SERVE_VOLLEY] // 被发球上网克
  },
  
  // 全场覆盖 - 消耗型，精力消耗极高
  [STRATEGY_TYPES.ALL_COVER]: {
    name: '全场覆盖',
    description: '跑动消耗对手，适合硬地',
    energyCost: ENERGY_COST.VERY_HIGH,
    courtAdaptation: {
      [COURT_TYPES.HARD]: COURT_ADAPTATION.S,
      [COURT_TYPES.GRASS]: COURT_ADAPTATION.A,
      [COURT_TYPES.CLAY]: COURT_ADAPTATION.B
    },
    skillBonus: {
      baseline: 0.10,
      volley: 0.10,
      serve: 0.10,
      dropShot: 0.10,
      slice: 0.10,
      lob: 0.10,
      smash: 0.10,
      form: -0.05      // 状态-5%
    },
    counters: [STRATEGY_TYPES.SERVE_VOLLEY], // 克发球上网
    weakAgainst: [STRATEGY_TYPES.ALL_ATTACK] // 被全场进攻克
  },
  
  // 全场进攻 - 激进型，精力消耗高
  [STRATEGY_TYPES.ALL_ATTACK]: {
    name: '全场进攻',
    description: ' aggressive进攻，适合草地',
    energyCost: ENERGY_COST.HIGH,
    courtAdaptation: {
      [COURT_TYPES.GRASS]: COURT_ADAPTATION.S,
      [COURT_TYPES.HARD]: COURT_ADAPTATION.A,
      [COURT_TYPES.CLAY]: COURT_ADAPTATION.C
    },
    skillBonus: {
      serve: 0.15,      // +15%
      smash: 0.15,     // +15%
      volley: 0.10,     // +10%
      baseline: -0.05,  // -5%
      dropShot: 0,
      slice: 0,
      lob: 0
    },
    counters: [STRATEGY_TYPES.ALL_COVER], // 克全场覆盖
    weakAgainst: [STRATEGY_TYPES.BASELINE_RALLY] // 被底线相持克
  }
};

// 碎片配置
const STRATEGY_FRAGMENT_CONFIG = {
  [STRATEGY_TYPES.SERVE_VOLLEY]: { fragmentsNeeded: 10, source: 'training' },
  [STRATEGY_TYPES.BASELINE_RALLY]: { fragmentsNeeded: 10, source: 'training' },
  [STRATEGY_TYPES.DEFENSIVE_COUNTER]: { fragmentsNeeded: 15, source: 'match' },
  [STRATEGY_TYPES.DROP_SHOT_Lob]: { fragmentsNeeded: 15, source: 'match' },
  [STRATEGY_TYPES.ALL_COVER]: { fragmentsNeeded: 20, source: 'ranking' },
  [STRATEGY_TYPES.ALL_ATTACK]: { fragmentsNeeded: 20, source: 'match' }
};

// 获取策略配置
function getStrategyConfig(type) {
  return STRATEGY_CONFIG[type] || null;
}

// 获取碎片数量
function getFragmentsNeeded(type) {
  const config = STRATEGY_FRAGMENT_CONFIG[type];
  return config ? config.fragmentsNeeded : 10;
}

// 获取场地适应加成
function getCourtAdaptationBonus(strategyType, courtType) {
  const config = STRATEGY_CONFIG[strategyType];
  if (!config || !config.courtAdaptation || !config.courtAdaptation[courtType]) {
    return 0;
  }
  return config.courtAdaptation[courtType].bonus;
}

// 获取精力消耗系数
function getEnergyCostMultiplier(strategyType) {
  const config = STRATEGY_CONFIG[strategyType];
  if (!config || !config.energyCost) {
    return 1.0;
  }
  return config.energyCost.multiplier;
}

// 获取技能加成
function getSkillBonus(strategyType) {
  const config = STRATEGY_CONFIG[strategyType];
  return config ? config.skillBonus : {};
}

// 检查策略克制关系
// 返回: 1 = 我克敌, -1 = 敌克我, 0 = 无克制
function checkStrategyCounter(myStrategy, enemyStrategy) {
  const myConfig = STRATEGY_CONFIG[myStrategy];
  const enemyConfig = STRATEGY_CONFIG[enemyStrategy];
  
  if (!myConfig || !enemyConfig) return 0;
  
  // 检查我是否克制对手
  if (myConfig.counters && myConfig.counters.includes(enemyStrategy)) {
    return 1;
  }
  
  // 检查对手是否克制我
  if (enemyConfig.counters && enemyConfig.counters.includes(myStrategy)) {
    return -1;
  }
  
  // 防守反击克制所有（但被所有克制）
  if (myStrategy === STRATEGY_TYPES.DEFENSIVE_COUNTER) {
    return 0; // 防守反击不主动克制，但减少被克制惩罚
  }
  
  return 0;
}

// 计算策略综合加成
function calculateStrategyBonus(strategyType, courtType, skillType) {
  let bonus = 0;
  
  // 1. 技能加成
  const skillBonus = getSkillBonus(strategyType);
  if (skillBonus && skillBonus[skillType] !== undefined) {
    bonus += skillBonus[skillType];
  }
  
  // 2. 场地适应加成
  const courtBonus = getCourtAdaptationBonus(strategyType, courtType);
  bonus += courtBonus;
  
  return bonus;
}

// 策略类
class Strategy {
  constructor(type) {
    this.type = type;
    this.config = STRATEGY_CONFIG[type] || STRATEGY_CONFIG[STRATEGY_TYPES.BASELINE_RALLY];
  }

  getName() {
    return this.config.name;
  }

  getDescription() {
    return this.config.description;
  }

  getEnergyCost() {
    return this.config.energyCost.name;
  }

  getEnergyMultiplier() {
    return this.config.energyCost.multiplier;
  }

  getCourtAdaptation(courtType) {
    return this.config.courtAdaptation[courtType] || COURT_ADAPTATION.B;
  }

  getSkillBonus() {
    return this.config.skillBonus;
  }

  getCounters() {
    return this.config.counters || [];
  }

  getWeakAgainst() {
    return this.config.weakAgainst || [];
  }

  // 序列化
  toJSON() {
    return {
      type: this.type
    };
  }

  // 反序列化
  static fromJSON(data) {
    return new Strategy(data.type);
  }
}

// 玩家策略管理器
class StrategyManager {
  constructor() {
    this.ownedStrategies = [];  // 已拥有的策略列表
    this.currentStrategy = null; // 当前选择的策略
    this.fragments = {};        // 各策略碎片数量
  }

  // 初始化碎片
  initFragments() {
    for (const type of Object.values(STRATEGY_TYPES)) {
      this.fragments[type] = 0;
    }
  }

  // 添加碎片
  addFragment(strategyType, count = 1) {
    if (!this.fragments[strategyType]) {
      this.fragments[strategyType] = 0;
    }
    this.fragments[strategyType] += count;
  }

  // 获取碎片数量
  getFragmentCount(strategyType) {
    return this.fragments[strategyType] || 0;
  }

  // 检查是否可以合成策略
  canCraft(strategyType) {
    const needed = getFragmentsNeeded(strategyType);
    const owned = this.getFragmentCount(strategyType);
    return owned >= needed;
  }

  // 合成策略
  craftStrategy(strategyType) {
    if (this.ownedStrategies.includes(strategyType)) {
      return { success: false, message: '已拥有该策略' };
    }
    
    if (!this.canCraft(strategyType)) {
      return { success: false, message: '碎片不足' };
    }
    
    this.fragments[strategyType] -= getFragmentsNeeded(strategyType);
    this.ownedStrategies.push(strategyType);
    
    return { 
      success: true, 
      message: `合成成功！获得${STRATEGY_CONFIG[strategyType].name}` 
    };
  }

  // 选择当前策略
  selectStrategy(strategyType) {
    if (!this.ownedStrategies.includes(strategyType)) {
      return { success: false, message: '未拥有该策略' };
    }
    this.currentStrategy = strategyType;
    return { success: true, message: '策略已选择' };
  }

  // 获取当前策略
  getCurrentStrategy() {
    return this.currentStrategy;
  }

  // 获取已拥有策略列表
  getOwnedStrategies() {
    return this.ownedStrategies;
  }

  // 检查是否拥有策略
  hasStrategy(strategyType) {
    return this.ownedStrategies.includes(strategyType);
  }

  // 序列化
  toJSON() {
    return {
      ownedStrategies: this.ownedStrategies,
      currentStrategy: this.currentStrategy,
      fragments: this.fragments
    };
  }

  // 反序列化
  static fromJSON(data) {
    const manager = new StrategyManager();
    if (data) {
      manager.ownedStrategies = data.ownedStrategies || [];
      manager.currentStrategy = data.currentStrategy || null;
      manager.fragments = data.fragments || {};
      // 确保所有策略都有碎片记录
      manager.initFragments();
    }
    return manager;
  }
}

module.exports = {
  STRATEGY_TYPES,
  STRATEGY_CONFIG,
  STRATEGY_FRAGMENT_CONFIG,
  COURT_TYPES,
  COURT_ADAPTATION,
  ENERGY_COST,
  Strategy,
  StrategyManager,
  getStrategyConfig,
  getFragmentsNeeded,
  getCourtAdaptationBonus,
  getEnergyCostMultiplier,
  getSkillBonus,
  checkStrategyCounter,
  calculateStrategyBonus
};
