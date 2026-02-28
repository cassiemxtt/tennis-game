/**
 * 数据模型 - Sponsor 赞助系统
 * 支持服装赞助商和球拍赞助商
 */
class Sponsor {
  // 赞助类型
  static SPONSOR_TYPE = {
    CLOTHING: 'clothing',  // 服装赞助（球衣、球鞋、配饰）
    RACKET: 'racket'       // 球拍赞助
  };

  // 赞助等级配置
  static SPONSOR_LEVELS = {
    // ===== 服装赞助商 =====
    local_clothing: {
      name: '本地服装赞助',
      type: Sponsor.SPONSOR_TYPE.CLOTHING,
      requirements: { ranking: 999, titles: 0 },
      monthlyPayment: 100,
      signingBonus: 500,
      duration: 24,
      unlocks: {
        body: ['default_white'],
        shoes: ['default_white'],
        head: ['none'],
        accessory: ['none']
      }
    },
    national_clothing: {
      name: '国家服装赞助',
      type: Sponsor.SPONSOR_TYPE.CLOTHING,
      requirements: { ranking: 500, titles: 1 },
      monthlyPayment: 300,
      signingBonus: 1500,
      duration: 24,
      unlocks: {
        body: ['default_white', 'nike_blue', 'nike_red', 'adidas_white', 'adidas_black'],
        shoes: ['default_white', 'nike_zoom', 'nike_air', 'adidas_white', 'asics_white', 'asics_blue', 'mizuno_white'],
        head: ['none', 'cap_red', 'cap_blue', 'cap_white', 'headband_white', 'headband_red'],
        accessory: ['none', 'wristband_white', 'wristband_red', 'wristband_blue']
      }
    },
    international_clothing: {
      name: '国际服装赞助',
      type: Sponsor.SPONSOR_TYPE.CLOTHING,
      requirements: { ranking: 200, titles: 3 },
      monthlyPayment: 800,
      signingBonus: 5000,
      duration: 24,
      unlocks: {
        body: ['default_white', 'nike_blue', 'nike_red', 'adidas_white', 'adidas_black', 'nike_orange', 'prince_yellow', 'k_swiss_white'],
        shoes: ['default_white', 'nike_zoom', 'nike_air', 'adidas_white', 'asics_white', 'asics_blue', 'mizuno_white', 'mizuno_black'],
        head: ['none', 'cap_red', 'cap_blue', 'cap_white', 'headband_white', 'headband_red', 'cap_black', 'visor'],
        accessory: ['none', 'wristband_white', 'wristband_red', 'wristband_blue', 'sweatband_white', 'sweatband_black']
      }
    },
    premium_clothing: {
      name: '顶级服装赞助',
      type: Sponsor.SPONSOR_TYPE.CLOTHING,
      requirements: { ranking: 50, titles: 10, grandSlams: 1 },
      monthlyPayment: 2000,
      signingBonus: 20000,
      duration: 24,
      unlocks: {
        body: ['default_white', 'nike_blue', 'nike_red', 'adidas_white', 'adidas_black', 'nike_orange', 'prince_yellow', 'k_swiss_white'],
        shoes: ['default_white', 'nike_zoom', 'nike_air', 'adidas_white', 'asics_white', 'asics_blue', 'mizuno_white', 'mizuno_black'],
        head: ['none', 'cap_red', 'cap_blue', 'cap_white', 'headband_white', 'headband_red', 'cap_black', 'visor'],
        accessory: ['none', 'wristband_white', 'wristband_red', 'wristband_blue', 'sweatband_white', 'sweatband_black']
      }
    },
    legendary_clothing: {
      name: '传奇服装赞助',
      type: Sponsor.SPONSOR_TYPE.CLOTHING,
      requirements: { ranking: 10, titles: 20, grandSlams: 5 },
      monthlyPayment: 5000,
      signingBonus: 50000,
      duration: 24,
      unlocks: {
        body: ['default_white', 'nike_blue', 'nike_red', 'adidas_white', 'adidas_black', 'nike_orange', 'prince_yellow', 'k_swiss_white'],
        shoes: ['default_white', 'nike_zoom', 'nike_air', 'adidas_white', 'asics_white', 'asics_blue', 'mizuno_white', 'mizuno_black'],
        head: ['none', 'cap_red', 'cap_blue', 'cap_white', 'headband_white', 'headband_red', 'cap_black', 'visor'],
        accessory: ['none', 'wristband_white', 'wristband_red', 'wristband_blue', 'sweatband_white', 'sweatband_black']
      }
    },

    // ===== 球拍赞助商 =====
    local_racket: {
      name: '本地球拍赞助',
      type: Sponsor.SPONSOR_TYPE.RACKET,
      requirements: { ranking: 999, titles: 0 },
      monthlyPayment: 80,
      signingBonus: 400,
      duration: 24,
      unlocks: {
        racket: ['default']
      }
    },
    national_racket: {
      name: '国家球拍赞助',
      type: Sponsor.SPONSOR_TYPE.RACKET,
      requirements: { ranking: 500, titles: 1 },
      monthlyPayment: 250,
      signingBonus: 1200,
      duration: 24,
      unlocks: {
        racket: ['default', 'pro_black', 'pro_white']
      }
    },
    international_racket: {
      name: '国际球拍赞助',
      type: Sponsor.SPONSOR_TYPE.RACKET,
      requirements: { ranking: 200, titles: 3 },
      monthlyPayment: 600,
      signingBonus: 4000,
      duration: 24,
      unlocks: {
        racket: ['default', 'pro_black', 'pro_white', 'nike_vapor', 'head_graphene', 'wilson_red']
      }
    },
    premium_racket: {
      name: '顶级球拍赞助',
      type: Sponsor.SPONSOR_TYPE.RACKET,
      requirements: { ranking: 50, titles: 10, grandSlams: 1 },
      monthlyPayment: 1500,
      signingBonus: 15000,
      duration: 24,
      unlocks: {
        racket: ['default', 'pro_black', 'pro_white', 'nike_vapor', 'head_graphene', 'wilson_red', 'babolat_blue']
      }
    },
    legendary_racket: {
      name: '传奇球拍赞助',
      type: Sponsor.SPONSOR_TYPE.RACKET,
      requirements: { ranking: 10, titles: 20, grandSlams: 5 },
      monthlyPayment: 4000,
      signingBonus: 40000,
      duration: 24,
      unlocks: {
        racket: ['default', 'pro_black', 'pro_white', 'limited_gold', 'nike_vapor', 'head_graphene', 'wilson_red', 'babolat_blue']
      }
    }
  };

  // 基础装备（无赞助商时可用）
  static BASE_EQUIPMENT = {
    body: ['default_white'],
    racket: ['default'],
    shoes: ['default_white'],
    head: ['none'],
    accessory: ['none']
  };

  // 检查可申请的赞助商（排除已过期和已拥有的）
  static checkAvailableSponsors(player) {
    const available = [];

    for (const [level, info] of Object.entries(Sponsor.SPONSOR_LEVELS)) {
      // 检查是否已拥有（包括未过期的）
      const hasActive = player.sponsors.some(s => s.name === info.name && !s.expired);
      if (hasActive) {
        continue;
      }

      const req = info.requirements;
      const meetsRequirements = (
        player.ranking <= req.ranking &&
        player.titles >= req.titles &&
        player.grandSlams >= (req.grandSlams || 0)
      );

      if (meetsRequirements) {
        available.push({
          level: level,
          name: info.name,
          monthlyPayment: info.monthlyPayment,
          signingBonus: info.signingBonus,
          duration: info.duration
        });
      }
    }

    return available;
  }

  // 签约赞助商
  static signSponsor(player, sponsorLevel) {
    if (!Sponsor.SPONSOR_LEVELS[sponsorLevel]) {
      return { success: false, message: '无效的赞助级别' };
    }

    const sponsor = Sponsor.SPONSOR_LEVELS[sponsorLevel];

    // 检查是否已拥有未过期的该赞助
    const hasActive = player.sponsors.some(s => s.name === sponsor.name && !s.expired);
    if (hasActive) {
      return { success: false, message: '已拥有该赞助（未过期）' };
    }

    const req = sponsor.requirements;
    if (!(
      player.ranking <= req.ranking &&
      player.titles >= req.titles &&
      player.grandSlams >= (req.grandSlams || 0)
    )) {
      return { success: false, message: '不满足赞助条件' };
    }

    // 计算到期时间
    const currentYear = player.gameData ? player.gameData.year : 2024;
    const currentMonth = player.gameData ? player.gameData.month : 1;
    let expireYear = currentYear;
    let expireMonth = currentMonth + sponsor.duration;
    while (expireMonth > 12) {
      expireMonth -= 12;
      expireYear += 1;
    }

    // 添加赞助商（移除已过期的同名赞助）
    player.sponsors = player.sponsors.filter(s => s.name !== sponsor.name);
    player.sponsors.push({
      name: sponsor.name,
      expiresYear: expireYear,
      expiresMonth: expireMonth,
      expired: false
    });

    player.money += sponsor.signingBonus;

    return {
      success: true,
      message: `成功签署${sponsor.name}合同！`,
      signingBonus: sponsor.signingBonus,
      monthlyPayment: sponsor.monthlyPayment,
      expiresYear: expireYear,
      expiresMonth: expireMonth
    };
  }

  // 收集每月赞助费（返回过期的赞助列表）
  static collectMonthlyPayments(player) {
    let total = 0;
    const expiredSponsors = [];
    const currentYear = player.gameData ? player.gameData.year : 2024;
    const currentMonth = player.gameData ? player.gameData.month : 1;

    for (const sponsorObj of player.sponsors) {
      // 查找赞助信息
      let sponsorInfo = null;
      for (const info of Object.values(Sponsor.SPONSOR_LEVELS)) {
        if (info.name === sponsorObj.name) {
          sponsorInfo = info;
          break;
        }
      }

      if (!sponsorInfo) continue;

      // 检查是否过期
      const isExpired = (
        currentYear > sponsorObj.expiresYear ||
        (currentYear === sponsorObj.expiresYear && currentMonth >= sponsorObj.expiresMonth)
      );

      if (isExpired) {
        sponsorObj.expired = true;
        expiredSponsors.push(sponsorObj.name);
      } else if (!sponsorObj.expired) {
        total += sponsorInfo.monthlyPayment;
      }
    }

    player.money += total;

    return {
      total: total,
      expiredSponsors: expiredSponsors
    };
  }

  // 检查并返回过期的赞助（不发放费用，只返回列表）
  static checkExpiredSponsors(player) {
    const expiredSponsors = [];
    const currentYear = player.gameData ? player.gameData.year : 2024;
    const currentMonth = player.gameData ? player.gameData.month : 1;

    for (const sponsorObj of player.sponsors) {
      if (sponsorObj.expired) continue;

      // 检查是否过期
      const isExpired = (
        currentYear > sponsorObj.expiresYear ||
        (currentYear === sponsorObj.expiresYear && currentMonth >= sponsorObj.expiresMonth)
      );

      if (isExpired) {
        sponsorObj.expired = true;
        expiredSponsors.push({
          name: sponsorObj.name,
          expiresYear: sponsorObj.expiresYear,
          expiresMonth: sponsorObj.expiresMonth
        });
      }
    }

    return expiredSponsors;
  }

  // 获取玩家当前可用的解锁装备（根据有效赞助商）
  static getUnlockedEquipment(player) {
    // 基础装备
    const unlocked = {
      body: [...Sponsor.BASE_EQUIPMENT.body],
      racket: [...Sponsor.BASE_EQUIPMENT.racket],
      shoes: [...Sponsor.BASE_EQUIPMENT.shoes],
      head: [...Sponsor.BASE_EQUIPMENT.head],
      accessory: [...Sponsor.BASE_EQUIPMENT.accessory]
    };

    // 遍历所有有效赞助商，添加解锁装备
    for (const sponsorObj of player.sponsors) {
      if (sponsorObj.expired) continue;

      // 查找赞助商配置
      let sponsorConfig = null;
      for (const config of Object.values(Sponsor.SPONSOR_LEVELS)) {
        if (config.name === sponsorObj.name) {
          sponsorConfig = config;
          break;
        }
      }

      if (sponsorConfig && sponsorConfig.unlocks) {
        // 添加解锁的装备（去重）
        for (const [slot, items] of Object.entries(sponsorConfig.unlocks)) {
          if (unlocked[slot]) {
            for (const item of items) {
              if (!unlocked[slot].includes(item)) {
                unlocked[slot].push(item);
              }
            }
          }
        }
      }
    }

    return unlocked;
  }

  // 检查指定装备是否可用
  static isEquipmentUnlocked(player, slot, itemId) {
    const unlocked = Sponsor.getUnlockedEquipment(player);
    return unlocked[slot] && unlocked[slot].includes(itemId);
  }

  // 处理赞助过期，回收装备
  static handleSponsorExpiration(player) {
    const expiredSponsors = Sponsor.checkExpiredSponsors(player);
    
    if (expiredSponsors.length === 0) {
      return { expired: [], recovered: false };
    }

    // 获取当前有效赞助的装备
    const unlocked = Sponsor.getUnlockedEquipment(player);

    // 检查当前装备是否还在解锁列表中
    const defaultEquipment = Sponsor.BASE_EQUIPMENT;
    const currentEquip = player.equipment || {};
    const recovered = [];

    for (const slot of Object.keys(defaultEquipment)) {
      const currentItem = currentEquip[slot];
      const defaultItem = defaultEquipment[slot][0]; // 默认装备

      // 如果当前装备不在解锁列表中，回收为默认装备
      if (currentItem && currentItem !== defaultItem) {
        if (!unlocked[slot] || !unlocked[slot].includes(currentItem)) {
          // 保存被回收的装备信息
          recovered.push({
            slot: slot,
            item: currentItem,
            recoveredTo: defaultItem
          });
          // 回收装备
          player.equipment[slot] = defaultItem;
        }
      }
    }

    return {
      expired: expiredSponsors,
      recovered: recovered
    };
  }
}

module.exports = Sponsor;
