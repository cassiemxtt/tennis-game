/**
 * 数据模型 - Coach 教练系统
 * 增强版：教练等级系统
 */

// 教练等级配置
const COACH_LEVELS = {
  1: {
    name: '初级',
    effectMultiplier: 1.0,
    salaryMultiplier: 1.0,
    description: '基础训练指导'
  },
  2: {
    name: '中级',
    effectMultiplier: 1.3,
    salaryMultiplier: 1.5,
    description: '专业训练指导'
  },
  3: {
    name: '高级',
    effectMultiplier: 1.6,
    salaryMultiplier: 2.0,
    description: '精英训练指导'
  },
  4: {
    name: '专家',
    effectMultiplier: 2.0,
    salaryMultiplier: 2.8,
    description: '顶级专业指导'
  },
  5: {
    name: '传奇',
    effectMultiplier: 2.5,
    salaryMultiplier: 4.0,
    description: '传奇级别指导'
  }
};

// 教练类型配置 - 每个类型都有不同等级的效果
const COACH_TYPES = {
  technique: {
    id: 'technique',
    name: '技术教练',
    description: '提升技术属性训练效率',
    baseSigningBonus: 2000,
    baseMonthlySalary: 500,
    baseEffect: { trainingEffect: 0.15 },
    effectText: '训练效果',
    skillBonus: { baseline: 5, volley: 3 },
    // 不同等级的效果值
    levelEffects: {
      1: { trainingEffect: 0.08 },
      2: { trainingEffect: 0.12 },
      3: { trainingEffect: 0.18 },
      4: { trainingEffect: 0.25 },
      5: { trainingEffect: 0.35 }
    }
  },
  fitness: {
    id: 'fitness',
    name: '体能教练',
    description: '减少训练疲劳/加快恢复',
    baseSigningBonus: 1500,
    baseMonthlySalary: 400,
    baseEffect: { energyRecovery: 0.15 },
    effectText: '恢复效果',
    skillBonus: { baseline: 3 },
    levelEffects: {
      1: { energyRecovery: 0.08 },
      2: { energyRecovery: 0.12 },
      3: { energyRecovery: 0.18 },
      4: { energyRecovery: 0.25 },
      5: { energyRecovery: 0.35 }
    }
  },
  mental: {
    id: 'mental',
    name: '心理教练',
    description: '提升心理/心态恢复',
    baseSigningBonus: 1800,
    baseMonthlySalary: 450,
    baseEffect: { matchWinRate: 3 },
    effectText: '比赛胜率',
    skillBonus: {},
    levelEffects: {
      1: { matchWinRate: 2 },
      2: { matchWinRate: 3 },
      3: { matchWinRate: 5 },
      4: { matchWinRate: 7 },
      5: { matchWinRate: 10 }
    }
  },
  serve: {
    id: 'serve',
    name: '发球教练',
    description: '专精发球训练',
    baseSigningBonus: 2000,
    baseMonthlySalary: 500,
    baseEffect: { serveEffect: 0.15 },
    effectText: '发球效果',
    skillBonus: { serve: 10, smash: 3 },
    levelEffects: {
      1: { serveEffect: 0.08 },
      2: { serveEffect: 0.12 },
      3: { serveEffect: 0.18 },
      4: { serveEffect: 0.25 },
      5: { serveEffect: 0.35 }
    }
  },
  volley: {
    id: 'volley',
    name: '网前教练',
    description: '专精网前训练',
    baseSigningBonus: 2000,
    baseMonthlySalary: 500,
    baseEffect: { volleyEffect: 0.15 },
    effectText: '网前效果',
    skillBonus: { volley: 10, smash: 3, lob: 2 },
    levelEffects: {
      1: { volleyEffect: 0.08 },
      2: { volleyEffect: 0.12 },
      3: { volleyEffect: 0.18 },
      4: { volleyEffect: 0.25 },
      5: { volleyEffect: 0.35 }
    }
  },
  baseline: {
    id: 'baseline',
    name: '底线教练',
    description: '专精底线相持',
    baseSigningBonus: 2200,
    baseMonthlySalary: 550,
    baseEffect: { baselineEffect: 0.15 },
    effectText: '底线效果',
    skillBonus: { baseline: 10, dropShot: 3, slice: 3 },
    levelEffects: {
      1: { baselineEffect: 0.08 },
      2: { baselineEffect: 0.12 },
      3: { baselineEffect: 0.18 },
      4: { baselineEffect: 0.25 },
      5: { baselineEffect: 0.35 }
    }
  },
  slice: {
    id: 'slice',
    name: '切削教练',
    description: '专精切削球',
    baseSigningBonus: 1800,
    baseMonthlySalary: 450,
    baseEffect: { sliceEffect: 0.15 },
    effectText: '切削效果',
    skillBonus: { slice: 10, lob: 5, dropShot: 2 },
    levelEffects: {
      1: { sliceEffect: 0.08 },
      2: { sliceEffect: 0.12 },
      3: { sliceEffect: 0.18 },
      4: { sliceEffect: 0.25 },
      5: { sliceEffect: 0.35 }
    }
  },
  physio: {
    id: 'physio',
    name: '运动理疗师',
    description: '伤病恢复专家',
    baseSigningBonus: 2500,
    baseMonthlySalary: 600,
    baseEffect: { injuryResistance: 0.15 },
    effectText: '伤病防护',
    skillBonus: {},
    levelEffects: {
      1: { injuryResistance: 0.08 },
      2: { injuryResistance: 0.12 },
      3: { injuryResistance: 0.18 },
      4: { injuryResistance: 0.25 },
      5: { injuryResistance: 0.35 }
    }
  },
  agent: {
    id: 'agent',
    name: '经纪人',
    description: '处理商业事务',
    baseSigningBonus: 3000,
    baseMonthlySalary: 800,
    baseEffect: { sponsorIncome: 0.10 },
    effectText: '赞助收入',
    skillBonus: {},
    levelEffects: {
      1: { sponsorIncome: 0.05 },
      2: { sponsorIncome: 0.08 },
      3: { sponsorIncome: 0.12 },
      4: { sponsorIncome: 0.18 },
      5: { sponsorIncome: 0.25 }
    }
  }
};

// 可用教练列表
const AVAILABLE_COACHES = [
  {
    id: 'coach_001',
    name: '约翰·麦克',
    type: 'technique',
    skill: 80,
    level: 3,
    special: 'former_pro',
    requirements: { minRanking: 1000 }
  },
  {
    id: 'coach_002',
    name: '玛丽亚· Santos',
    type: 'fitness',
    skill: 75,
    level: 2,
    special: 'injury_expert',
    requirements: { minRanking: 1000 }
  },
  {
    id: 'coach_003',
    name: '大卫·李',
    type: 'mental',
    skill: 85,
    level: 4,
    special: 'big_match',
    requirements: { minRanking: 200 }
  },
  {
    id: 'coach_004',
    name: '皮埃尔·杜邦',
    type: 'serve',
    skill: 78,
    level: 3,
    special: 'ace_king',
    requirements: { minRanking: 1000 }
  },
  {
    id: 'coach_005',
    name: '汤姆·克鲁斯',
    type: 'volley',
    skill: 72,
    level: 2,
    special: 'net_play',
    requirements: { minRanking: 500 }
  },
  {
    id: 'coach_006',
    name: '丽莎·陈',
    type: 'physio',
    skill: 90,
    level: 5,
    special: 'olympic_staff',
    requirements: { minRanking: 100 }
  },
  {
    id: 'coach_007',
    name: '迈克尔·乔丹',
    type: 'agent',
    skill: 88,
    level: 4,
    special: 'super_agent',
    requirements: { minRanking: 150 }
  },
  {
    id: 'coach_008',
    name: '安东尼奥·罗西',
    type: 'technique',
    skill: 70,
    level: 2,
    special: 'young_talent',
    requirements: { minRanking: 800 }
  },
  {
    id: 'coach_009',
    name: '莎拉·威廉姆斯',
    type: 'fitness',
    skill: 68,
    level: 1,
    special: 'none',
    requirements: { minRanking: 1000 }
  },
  {
    id: 'coach_010',
    name: '罗杰·费德勒',
    type: 'serve',
    skill: 95,
    level: 5,
    special: 'legend',
    requirements: { minRanking: 50 }
  },
  {
    id: 'coach_011',
    name: '拉斐尔·纳达尔',
    type: 'baseline',
    skill: 92,
    level: 5,
    special: 'clay_king',
    requirements: { minRanking: 50 }
  },
  {
    id: 'coach_012',
    name: '诺瓦克·德约科维奇',
    type: 'slice',
    skill: 90,
    level: 5,
    special: 'return_king',
    requirements: { minRanking: 30 }
  }
];

// 教练类
class Coach {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.type;
    this.skill = data.skill;
    this.level = data.level;
    this.special = data.special;
    this.requirements = data.requirements;
    
    const config = COACH_TYPES[this.type];
    const levelConfig = COACH_LEVELS[this.level] || COACH_LEVELS[1];
    
    // 根据等级计算签约费和月薪
    this.baseSigningBonus = config.baseSigningBonus;
    this.baseMonthlySalary = config.baseMonthlySalary;
    this.signingBonus = Math.floor(config.baseSigningBonus * levelConfig.salaryMultiplier);
    this.monthlySalary = Math.floor(config.baseMonthlySalary * levelConfig.salaryMultiplier);
    
    this.description = config.description;
    this.effectText = config.effectText;
    this.skillBonus = config.skillBonus || {};  // 技能加成
    this.levelEffects = config.levelEffects || {};
  }

  // 获取等级名称
  getLevelName() {
    const levelConfig = COACH_LEVELS[this.level];
    return levelConfig ? levelConfig.name : '初级';
  }

  // 获取等级效果描述
  getEffectDescription() {
    const effect = this.levelEffects[this.level];
    if (!effect) return this.effectText;
    
    const effectKey = Object.keys(effect)[0];
    const effectValue = effect[effectKey];
    
    // 根据效果类型格式化显示
    if (effectKey === 'matchWinRate') {
      return `${this.effectText}+${effectValue}%`;
    } else if (effectKey.includes('Income')) {
      return `${this.effectText}+${Math.round(effectValue * 100)}%`;
    } else {
      return `${this.effectText}+${Math.round(effectValue * 100)}%`;
    }
  }

  // 获取解锁状态
  static isUnlockable(coach, playerRanking) {
    if (!coach.requirements) return true;
    if (coach.requirements.minRanking && playerRanking > coach.requirements.minRanking) {
      return false;
    }
    return true;
  }

  // 获取可用教练列表
  static getAvailableCoaches(playerRanking) {
    return AVAILABLE_COACHES.filter(coach => Coach.isUnlockable(coach, playerRanking))
      .map(coach => new Coach(coach));
  }

  // 获取教练效果数值（基于教练等级）
  getEffectValue() {
    const effect = this.levelEffects[this.level];
    if (!effect) return {};
    
    const levelConfig = COACH_LEVELS[this.level] || COACH_LEVELS[1];
    const result = {};
    
    for (const [key, value] of Object.entries(effect)) {
      // 技能加成受教练技能值影响
      const skillMultiplier = 1 + (this.skill - 70) / 100;
      result[key] = value * skillMultiplier * levelConfig.effectMultiplier;
    }
    return result;
  }

  // 获取技能加成（基于教练等级和技能）
  getSkillBonus() {
    const baseBonus = this.skillBonus;
    const levelConfig = COACH_LEVELS[this.level] || COACH_LEVELS[1];
    const multiplier = levelConfig.effectMultiplier + (this.skill - 70) / 100;
    
    const result = {};
    for (const [key, value] of Object.entries(baseBonus)) {
      result[key] = Math.floor(value * multiplier);
    }
    return result;
  }
}

// 薪资支付（现在按周计算，每4周调用一次）
class CoachPayroll {
  static payMonthly(player) {
    let totalSalary = 0;
    const results = [];

    // 倒序遍历，避免删除元素问题
    for (let i = player.coaches.length - 1; i >= 0; i--) {
      const coach = player.coaches[i];
      const salary = coach.monthlySalary;
      totalSalary += salary;

      // 合同周数减少（按月计算，转换为周）
      coach.contractWeeks = (coach.contractWeeks || coach.contractMonths * 4) - 4;

      if (coach.contractWeeks <= 0) {
        results.push({
          coach: coach,
          coachName: coach.name,
          action: 'expired',
          message: `${coach.name}合同到期，是否续约？`
        });
        // 不自动移除教练，等待玩家决定
      }
    }

    if (totalSalary > 0) {
      player.money -= totalSalary;
      results.push({
        action: 'paid',
        amount: totalSalary,
        message: `支付教练团队月薪 $${totalSalary}`
      });
    }

    return results;
  }

  // 获取即将到期的教练（2周内）
  static getExpiringCoaches(player) {
    const expiring = [];
    for (const coach of player.coaches) {
      const weeks = coach.contractWeeks || coach.contractMonths * 4;
      if (weeks <= 2) {
        expiring.push(coach);
      }
    }
    return expiring;
  }

  // 续签合同
  static renewContract(player, coachType, weeks = 48) {
    const coach = player.coaches.find(c => c.type === coachType);
    if (!coach) {
      return { success: false, message: '未找到该教练' };
    }

    const weeksPerMonth = 4;
    const months = Math.ceil(weeks / weeksPerMonth);
    const renewalCost = coach.monthlySalary * months;
    
    if (player.money < renewalCost) {
      return { success: false, message: '资金不足' };
    }

    player.money -= renewalCost;
    coach.contractWeeks = weeks;

    return { 
      success: true, 
      message: `与${coach.name}续签${months}个月`,
      cost: renewalCost
    };
  }

  // 解雇教练
  static fireCoach(player, coachType) {
    const index = player.coaches.findIndex(c => c.type === coachType);
    if (index < 0) {
      return { success: false, message: '未找到该教练' };
    }
    
    player.coaches.splice(index, 1);
    return { success: true, message: '教练已解雇' };
  }
}

// 获取所有教练的技能加成总计
function getTotalCoachSkillBonus(player) {
  const totalBonus = {};
  for (const coach of player.coaches) {
    const coachObj = new Coach(coach);
    const bonus = coachObj.getSkillBonus();
    for (const [skill, value] of Object.entries(bonus)) {
      totalBonus[skill] = (totalBonus[skill] || 0) + value;
    }
  }
  return totalBonus;
}

module.exports = {
  COACH_TYPES,
  COACH_LEVELS,
  AVAILABLE_COACHES,
  Coach,
  CoachPayroll,
  getTotalCoachSkillBonus
};
