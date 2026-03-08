/**
 * 数据模型 - Item 道具系统
 * 物品类道具：碎片、恢复药品、状态提升药品
 */

// 物品类型
const ITEM_TYPES = {
  // 碎片类
  COACH_FRAGMENT: 'coach_fragment',      // 教练碎片
  EQUIPMENT_FRAGMENT: 'equipment_fragment', // 装备碎片
  STRATEGY_FRAGMENT: 'strategy_fragment', // 策略碎片
  SPONSOR_FRAGMENT: 'sponsor_fragment',  // 赞助商碎片
  
  // 恢复类
  ENERGY_PILL: 'energy_pill',            // 精力恢复药品
  INJURY_PILL: 'injury_pill',            // 伤病恢复药品
  FORM_PILL: 'form_pill'                 // 状态提升药品
};

// 物品品质
const ITEM_QUALITY = {
  COMMON: { name: '普通', color: '#888888' },
  UNCOMMON: { name: '稀有', color: '#4ade80' },
  RARE: { name: '珍贵', color: '#60a5fa' },
  EPIC: { name: '史诗', color: '#c084fc' },
  LEGENDARY: { name: '传说', color: '#fbbf24' }
};

// 物品配置
const ITEM_CONFIG = {
  // 碎片类
  [ITEM_TYPES.COACH_FRAGMENT]: {
    name: '教练碎片',
    description: '用于合成教练',
    quality: ITEM_QUALITY.COMMON,
    stackable: true,
    maxStack: 99,
    icon: '🧑‍🏫'
  },
  [ITEM_TYPES.EQUIPMENT_FRAGMENT]: {
    name: '装备碎片',
    description: '用于合成装备',
    quality: ITEM_QUALITY.UNCOMMON,
    stackable: true,
    maxStack: 99,
    icon: '🎾'
  },
  [ITEM_TYPES.STRATEGY_FRAGMENT]: {
    name: '策略碎片',
    description: '用于合成策略',
    quality: ITEM_QUALITY.RARE,
    stackable: true,
    maxStack: 99,
    icon: '📋'
  },
  [ITEM_TYPES.SPONSOR_FRAGMENT]: {
    name: '赞助商碎片',
    description: '用于合成赞助商',
    quality: ITEM_QUALITY.UNCOMMON,
    stackable: true,
    maxStack: 99,
    icon: '💰'
  },
  
  // 恢复类
  [ITEM_TYPES.ENERGY_PILL]: {
    name: '精力恢复药',
    description: '立即恢复30点精力',
    quality: ITEM_QUALITY.COMMON,
    stackable: true,
    maxStack: 10,
    icon: '⚡',
    effect: {
      type: 'energy',
      value: 30
    }
  },
  [ITEM_TYPES.INJURY_PILL]: {
    name: '伤病恢复药',
    description: '立即恢复1周伤病',
    quality: ITEM_QUALITY.RARE,
    stackable: true,
    maxStack: 5,
    icon: '💊',
    effect: {
      type: 'injury',
      value: 1
    }
  },
  [ITEM_TYPES.FORM_PILL]: {
    name: '状态提升药',
    description: '提升15点状态',
    quality: ITEM_QUALITY.UNCOMMON,
    stackable: true,
    maxStack: 10,
    icon: '🧪',
    effect: {
      type: 'form',
      value: 15
    }
  },
  
  // 默认物品（未知类型）
  'default': {
    name: '未知物品',
    description: '',
    quality: ITEM_QUALITY.COMMON,
    stackable: true,
    maxStack: 99,
    icon: '📦'
  }
};

// 默认物品配置（用于处理未知类型）
const DEFAULT_ITEM_CONFIG = {
  name: '未知物品',
  description: '',
  quality: ITEM_QUALITY.COMMON,
  stackable: true,
  maxStack: 99,
  icon: '📦'
};

// 物品类
class Item {
  constructor(type, count = 1) {
    this.type = type;
    // 获取配置，使用默认值处理未知类型
    this.config = ITEM_CONFIG[type] || DEFAULT_ITEM_CONFIG;
    this.count = Math.min(count, this.getMaxStack());
  }

  getName() {
    return this.config.name;
  }

  getDescription() {
    return this.config.description;
  }

  getQuality() {
    return this.config.quality;
  }

  getIcon() {
    return this.config.icon || '📦';
  }

  isStackable() {
    return this.config.stackable || false;
  }

  getMaxStack() {
    return this.config.maxStack || 1;
  }

  getEffect() {
    return this.config.effect || null;
  }

  // 使用物品
  use(player) {
    const effect = this.getEffect();
    if (!effect) {
      return { success: false, message: '该物品无法使用' };
    }

    switch (effect.type) {
      case 'energy':
        // 恢复精力
        const newEnergy = Math.min(100, player.energy + effect.value);
        player.energy = newEnergy;
        this.count--;
        return { success: true, message: `恢复${effect.value}点精力！` };

      case 'injury':
        // 恢复伤病
        if (!player.injury || !player.injury.isInjured) {
          return { success: false, message: '没有伤病可恢复' };
        }
        player.injury.weeksRemaining = Math.max(0, player.injury.weeksRemaining - effect.value);
        if (player.injury.weeksRemaining <= 0) {
          player.injury = { type: null, weeksRemaining: 0, isInjured: false };
          this.count--;
          return { success: true, message: '伤病已痊愈！' };
        }
        this.count--;
        return { success: true, message: `伤病恢复${effect.value}周！` };

      case 'form':
        // 提升状态
        const newForm = Math.min(100, player.form + effect.value);
        player.form = newForm;
        this.updateSkillBonuses();
        this.count--;
        return { success: true, message: `状态提升${effect.value}点！` };

      default:
        return { success: false, message: '未知效果' };
    }
  }

  updateSkillBonuses() {
    if (player && player.skillManager) {
      player.skillManager.updateBonuses({ form: player.form });
    }
  }

  // 序列化
  toJSON() {
    return {
      type: this.type,
      count: this.count
    };
  }

  // 反序列化
  static fromJSON(data) {
    return new Item(data.type, data.count);
  }
}

// 玩家背包管理器
class InventoryManager {
  constructor() {
    this.items = {};  // { itemType: Item }
  }

  // 添加物品
  addItem(type, count = 1) {
    if (!this.items[type]) {
      this.items[type] = new Item(type, 0);
    }
    
    const item = this.items[type];
    const total = item.count + count;
    
    if (item.isStackable() && total > item.getMaxStack()) {
      item.count = item.getMaxStack();
      return { success: false, remaining: total - item.getMaxStack(), message: '背包已满' };
    }
    
    item.count = total;
    return { success: true, message: `获得${count}个${item.getName()}` };
  }

  // 移除物品
  removeItem(type, count = 1) {
    if (!this.items[type] || this.items[type].count < count) {
      return { success: false, message: '物品不足' };
    }
    
    this.items[type].count -= count;
    if (this.items[type].count <= 0) {
      delete this.items[type];
    }
    
    return { success: true, message: '物品已使用' };
  }

  // 获取物品数量
  getItemCount(type) {
    return this.items[type] ? this.items[type].count : 0;
  }

  // 获取物品
  getItem(type) {
    return this.items[type] || null;
  }

  // 获取所有物品
  getAllItems() {
    return Object.values(this.items).filter(item => item.count > 0);
  }

  // 使用物品
  useItem(type, player) {
    const item = this.items[type];
    if (!item) {
      return { success: false, message: '物品不存在' };
    }
    
    return item.use(player);
  }

  // 检查是否有物品
  hasItem(type, count = 1) {
    return this.getItemCount(type) >= count;
  }

  // 序列化
  toJSON() {
    const data = {};
    for (const [type, item] of Object.entries(this.items)) {
      if (item.count > 0) {
        data[type] = item.toJSON();
      }
    }
    return data;
  }

  // 反序列化
  static fromJSON(data) {
    const manager = new InventoryManager();
    if (data) {
      for (const [type, itemData] of Object.entries(data)) {
        if (itemData.count > 0) {
          manager.items[type] = Item.fromJSON(itemData);
        }
      }
    }
    return manager;
  }
}

// 碎片掉落配置
const FRAGMENT_DROP_CONFIG = {
  // 训练掉落
  training: {
    [ITEM_TYPES.COACH_FRAGMENT]: { min: 1, max: 3, chance: 0.3 },
    [ITEM_TYPES.STRATEGY_FRAGMENT]: { min: 1, max: 2, chance: 0.2 },
    [ITEM_TYPES.EQUIPMENT_FRAGMENT]: { min: 1, max: 2, chance: 0.15 }
  },
  // 比赛掉落
  match: {
    [ITEM_TYPES.STRATEGY_FRAGMENT]: { min: 1, max: 3, chance: 0.4 },
    [ITEM_TYPES.SPONSOR_FRAGMENT]: { min: 1, max: 2, chance: 0.3 },
    [ITEM_TYPES.COACH_FRAGMENT]: { min: 1, max: 2, chance: 0.2 }
  },
  // 比赛胜利额外掉落
  matchWin: {
    [ITEM_TYPES.STRATEGY_FRAGMENT]: { min: 2, max: 5, chance: 0.5 },
    [ITEM_TYPES.FORM_PILL]: { min: 1, max: 1, chance: 0.3 }
  }
};

// 随机掉落碎片
function dropFragments(source, isWin = false) {
  const drops = [];
  const config = source === 'training' ? FRAGMENT_DROP_CONFIG.training : 
                 source === 'match' ? FRAGMENT_DROP_CONFIG.match : {};
  
  // 处理基础掉落
  for (const [itemType, dropConfig] of Object.entries(config)) {
    if (Math.random() < dropConfig.chance) {
      const count = Math.floor(Math.random() * (dropConfig.max - dropConfig.min + 1)) + dropConfig.min;
      drops.push({ type: itemType, count: count });
    }
  }
  
  // 处理胜利额外掉落
  if (isWin && source === 'match') {
    for (const [itemType, dropConfig] of Object.entries(FRAGMENT_DROP_CONFIG.matchWin)) {
      if (Math.random() < dropConfig.chance) {
        const count = Math.floor(Math.random() * (dropConfig.max - dropConfig.min + 1)) + dropConfig.min;
        // 检查是否已存在
        const existing = drops.find(d => d.type === itemType);
        if (existing) {
          existing.count += count;
        } else {
          drops.push({ type: itemType, count: count });
        }
      }
    }
  }
  
  return drops;
}

module.exports = {
  ITEM_TYPES,
  ITEM_QUALITY,
  ITEM_CONFIG,
  Item,
  InventoryManager,
  FRAGMENT_DROP_CONFIG,
  dropFragments
};
