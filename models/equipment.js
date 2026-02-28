/**
 * 数据模型 - Equipment 装备系统
 * 球员自定义外观装备
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
      none: { name: '无', color: null, icon: '❌' },
      cap_red: { name: '红色棒球帽', color: '#e53e3e', icon: '🧢' },
      cap_blue: { name: '蓝色棒球帽', color: '#3182ce', icon: '🧢' },
      cap_white: { name: '白色棒球帽', color: '#e2e8f0', icon: '🧢' },
      headband_white: { name: '白色头带', color: '#ffffff', icon: '🎗️' },
      headband_red: { name: '红色头带', color: '#fc8181', icon: '🎗️' },
      cap_black: { name: '黑色棒球帽', color: '#1a202c', icon: '🧢' },
      visor: { name: '白色网球帽', color: '#f7fafc', icon: '🧢' }
    },
    
    // ===== 身体装备 =====
    body: {
      default_white: { name: '经典白', color: '#f7fafc', icon: '👕' },
      nike_blue: { name: '耐克蓝', color: '#3182ce', icon: '👕' },
      nike_red: { name: '耐克红', color: '#e53e3e', icon: '👕' },
      adidas_white: { name: '阿迪白', color: '#edf2f7', icon: '👕' },
      adidas_black: { name: '阿迪黑', color: '#2d3748', icon: '👕' },
      nike_orange: { name: '活力橙', color: '#ed8936', icon: '👕' },
      prince_yellow: { name: '王子黄', color: '#f6e05e', icon: '👕' },
      k_swiss_white: { name: 'KSwiss白', color: '#e2e8f0', icon: '👕' }
    },
    
    // ===== 球拍装备 =====
    racket: {
      default: { name: '标准球拍', color: '#718096', handleColor: '#4a5568', icon: '🎾' },
      pro_black: { name: '专业黑', color: '#1a202c', handleColor: '#2d3748', icon: '🎾' },
      pro_white: { name: '专业白', color: '#e2e8f0', handleColor: '#cbd5e0', icon: '��' },
      limited_gold: { name: '限量金', color: '#d69e2e', handleColor: '#b7791f', icon: '🎾' },
      nike_vapor: { name: 'Vapor蓝', color: '#4299e1', handleColor: '#3182ce', icon: '🎾' },
      head_graphene: { name: 'Head黑', color: '#2d3748', handleColor: '#1a202c', icon: '🎾' },
      wilson_red: { name: 'Wilson红', color: '#c53030', handleColor: '#9b2c2c', icon: '🎾' },
      babolat_blue: { name: 'Babolat蓝', color: '#3182ce', handleColor: '#2b6cb0', icon: '🎾' }
    },
    
    // ===== 鞋子装备 =====
    shoes: {
      default_white: { name: '经典白', color: '#f7fafc', icon: '👟' },
      nike_zoom: { name: 'Nike Zoom', color: '#3182ce', icon: '👟' },
      nike_air: { name: 'Nike Air', color: '#e53e3e', icon: '👟' },
      adidas_white: { name: 'Adidas白', color: '#edf2f7', icon: '👟' },
      asics_white: { name: 'Asics白', color: '#e2e8f0', icon: '👟' },
      asics_blue: { name: 'Asics蓝', color: '#4299e1', icon: '👟' },
      mizuno_white: { name: 'Mizuno白', color: '#f7fafc', icon: '👟' },
      mizuno_black: { name: 'Mizuno黑', color: '#2d3748', icon: '👟' }
    },
    
    // ===== 配饰装备 =====
    accessory: {
      none: { name: '无', color: null, icon: '❌' },
      wristband_white: { name: '白色腕带', color: '#ffffff', icon: '🎗️' },
      wristband_red: { name: '红色腕带', color: '#fc8181', icon: '🎗️' },
      wristband_blue: { name: '蓝色腕带', color: '#90cdf4', icon: '🎗️' },
      sweatband_white: { name: '白色护腕', color: '#ffffff', icon: '💪' },
      sweatband_black: { name: '黑色护腕', color: '#2d3748', icon: '💪' }
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
}

module.exports = Equipment;
