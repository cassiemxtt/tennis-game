/**
 * 数据模型 - Equipment 装备系统
 * 球员自定义外观装备
 * 添加技能系数加成
 */
class Equipment {
  // 装备槽位类型
  static SLOT = {
    HEAD: 'head',      // 头部（帽子、头带）
    BODY: 'body',       // 上身（球衣）
    RACKET: 'racket',  // 球拍
    SHOES: 'shoes',    // 鞋子
    ACCESSORY: 'accessory'  // 配饰（腕带、护腕）
  };

  // 装备物品定义
  static ITEMS = {
    // ===== 头部装备 =====
    head: {
      none: { name: '无', color: null, icon: '❌', multiplier: 1.0 },
      cap_red: { name: '红色棒球帽', color: '#e53e3e', icon: '🧢', multiplier: 1.01 },
      cap_blue: { name: '蓝色棒球帽', color: '#3182ce', icon: '🧢', multiplier: 1.01 },
      cap_white: { name: '白色棒球帽', color: '#e2e8f0', icon: '🧢', multiplier: 1.01 },
      headband_white: { name: '白色头带', color: '#ffffff', icon: '🎗️', multiplier: 1.01 },
      headband_red: { name: '红色头带', color: '#fc8181', icon: '🎗️', multiplier: 1.01 },
      cap_black: { name: '黑色棒球帽', color: '#1a202c', icon: '🧢', multiplier: 1.02 },
      visor: { name: '白色网球帽', color: '#f7fafc', icon: '🧢', multiplier: 1.02 }
    },
    
    // ===== 身体装备 =====
    body: {
      default_white: { name: '经典白', color: '#f7fafc', icon: '👕', multiplier: 1.0 },
      nike_blue: { name: '耐克蓝', color: '#3182ce', icon: '👕', multiplier: 1.02 },
      nike_red: { name: '耐克红', color: '#e53e3e', icon: '👕', multiplier: 1.02 },
      adidas_white: { name: '阿迪白', color: '#edf2f7', icon: '👕', multiplier: 1.02 },
      adidas_black: { name: '阿迪黑', color: '#2d3748', icon: '👕', multiplier: 1.02 },
      nike_orange: { name: '活力橙', color: '#ed8936', icon: '👕', multiplier: 1.03 },
      prince_yellow: { name: '王子黄', color: '#f6e05e', icon: '👕', multiplier: 1.03 },
      k_swiss_white: { name: 'KSwiss白', color: '#e2e8f0', icon: '👕', multiplier: 1.03 }
    },
    
    // ===== 球拍装备 =====
    racket: {
      default: { name: '标准球拍', color: '#718096', handleColor: '#4a5568', icon: '🎾', multiplier: 1.0 },
      pro_black: { name: '专业黑', color: '#1a202c', handleColor: '#2d3748', icon: '🎾', multiplier: 1.03, skillBonus: { serve: 3 } },
      pro_white: { name: '专业白', color: '#e2e8f0', handleColor: '#cbd5e0', icon: '🎾', multiplier: 1.03, skillBonus: { serve: 3 } },
      limited_gold: { name: '限量金', color: '#d69e2e', handleColor: '#b7791f', icon: '🎾', multiplier: 1.08, skillBonus: { serve: 8, baseline: 5 } },
      nike_vapor: { name: 'Vapor蓝', color: '#4299e1', handleColor: '#3182ce', icon: '🎾', multiplier: 1.04, skillBonus: { serve: 5 } },
      head_graphene: { name: 'Head黑', color: '#2d3748', handleColor: '#1a202c', icon: '🎾', multiplier: 1.05, skillBonus: { serve: 6, volley: 3 } },
      wilson_red: { name: 'Wilson红', color: '#c53030', handleColor: '#9b2c2c', icon: '🎾', multiplier: 1.05, skillBonus: { baseline: 5, serve: 4 } },
      babolat_blue: { name: 'Babolat蓝', color: '#3182ce', handleColor: '#2b6cb0', icon: '🎾', multiplier: 1.06, skillBonus: { serve: 7, baseline: 5, smash: 3 } }
    },
    
    // ===== 鞋子装备 =====
    shoes: {
      default_white: { name: '经典白', color: '#f7fafc', icon: '👟', multiplier: 1.0 },
      nike_zoom: { name: 'Nike Zoom', color: '#3182ce', icon: '👟', multiplier: 1.02 },
      nike_air: { name: 'Nike Air', color: '#e53e3e', icon: '👟', multiplier: 1.02 },
      adidas_white: { name: 'Adidas白', color: '#edf2f7', icon: '👟', multiplier: 1.02 },
      asics_white: { name: 'Asics白', color: '#e2e8f0', icon: '👟', multiplier: 1.02 },
      asics_blue: { name: 'Asics蓝', color: '#4299e1', icon: '👟', multiplier: 1.03 },
      mizuno_white: { name: 'Mizuno白', color: '#f7fafc', icon: '👟', multiplier: 1.02 },
      mizuno_black: { name: 'Mizuno黑', color: '#2d3748', icon: '👟', multiplier: 1.03 }
    },
    
    // ===== 配饰装备 =====
    accessory: {
      none: { name: '无', color: null, icon: '❌', multiplier: 1.0 },
      wristband_white: { name: '白色腕带', color: '#ffffff', icon: '🎗️', multiplier: 1.01 },
      wristband_red: { name: '红色腕带', color: '#fc8181', icon: '🎗️', multiplier: 1.01 },
      wristband_blue: { name: '蓝色腕带', color: '#90cdf4', icon: '🎗️', multiplier: 1.01 },
      sweatband_white: { name: '白色护腕', color: '#ffffff', icon: '💪', multiplier: 1.02 },
      sweatband_black: { name: '黑色护腕', color: '#2d3748', icon: '💪', multiplier: 1.02 }
    }
  };

  // 获取所有装备槽位
  static getAllSlots() {
    return Object.values(Equipment.SLOT);
  }

  // 获取指定槽位的所有装备
  static getItemsForSlot(slot) {
    return Equipment.ITEMS[slot] || {};
  }

  // 根据ID获取装备信息
  static getItemInfo(slot, itemId) {
    const slotItems = Equipment.ITEMS[slot];
    if (!slotItems) return null;
    return slotItems[itemId] || slotItems.none || null;
  }

  // 获取默认装备配置
  static getDefaultEquipment() {
    return {
      head: 'none',
      body: 'default_white',
      racket: 'default',
      shoes: 'default_white',
      accessory: 'none'
    };
  }

  // 验证装备是否有效
  static validateEquipment(equipment) {
    const defaultEquip = Equipment.getDefaultEquipment();
    const validated = { ...defaultEquip };

    for (const slot of Object.keys(defaultEquip)) {
      if (equipment[slot] && Equipment.ITEMS[slot][equipment[slot]]) {
        validated[slot] = equipment[slot];
      }
    }

    return validated;
  }

  // 获取所有可用装备（根据赞助商解锁状态）
  static getAvailableItems(slot, unlockedItems) {
    const allItems = Equipment.ITEMS[slot] || {};
    const available = [];
    const locked = [];

    for (const [itemId, itemInfo] of Object.entries(allItems)) {
      const isUnlocked = unlockedItems && unlockedItems[slot] && unlockedItems[slot].includes(itemId);
      if (isUnlocked) {
        available.push({ id: itemId, ...itemInfo });
      } else {
        locked.push({ id: itemId, ...itemInfo });
      }
    }

    return { available, locked };
  }

  // 检查装备是否为基础装备（始终可用）
  static isBaseEquipment(slot, itemId) {
    // 基础装备列表（无赞助商时可用）
    const baseEquipment = {
      body: ['default_white'],
      racket: ['default'],
      shoes: ['default_white'],
      head: ['none'],
      accessory: ['none']
    };
    const baseItems = baseEquipment[slot] || [];
    return baseItems.includes(itemId);
  }

  // 计算装备加成系数
  static calculateEquipmentMultiplier(player) {
    const equip = player.equipment || {};
    let totalMultiplier = 1.0;

    for (const itemId of Object.values(equip)) {
      // 遍历所有槽位查找对应的装备
      for (const slot of Object.keys(Equipment.ITEMS)) {
        const item = Equipment.ITEMS[slot][itemId];
        if (item && item.multiplier) {
          totalMultiplier *= item.multiplier;
        }
      }
    }

    return totalMultiplier;
  }

  // 获取装备技能加成总计
  static getEquipmentSkillBonus(player) {
    const equip = player.equipment || {};
    const totalBonus = {};

    for (const itemId of Object.values(equip)) {
      // 遍历所有槽位查找对应的装备
      for (const [slot, items] of Object.entries(Equipment.ITEMS)) {
        const item = items[itemId];
        if (item && item.skillBonus) {
          for (const [skill, bonus] of Object.entries(item.skillBonus)) {
            totalBonus[skill] = (totalBonus[skill] || 0) + bonus;
          }
        }
      }
    }

    return totalBonus;
  }
}

module.exports = Equipment;
