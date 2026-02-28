/**
 * 数据模型 - Coach 教练系统
 */

// 教练类型配置
const COACH_TYPES = {
  technique: {
    id: 'technique',
    name: '技术教练',
    description: '提升技术属性训练效率',
    signingBonus: 2000,
    monthlySalary: 500,
    effect: { trainingEffect: 0.15 },
    effectText: '训练效果+15%'
  },
  fitness: {
    id: 'fitness',
    name: '体能教练',
    description: '减少训练疲劳/加快恢复',
    signingBonus: 1500,
    monthlySalary: 400,
    effect: { energyRecovery: 0.15 },
    effectText: '疲劳-15%'
  },
  mental: {
    id: 'mental',
    name: '心理教练',
    description: '提升心理/心态恢复',
    signingBonus: 1800,
    monthlySalary: 450,
    effect: { matchWinRate: 5 },
    effectText: '比赛心态+5'
  },
  serve: {
    id: 'serve',
    name: '发球教练',
    description: '专精发球训练',
    signingBonus: 2000,
    monthlySalary: 500,
    effect: { serveEffect: 0.20 },
    effectText: '发球技能+20%'
  },
  volley: {
    id: 'volley',
    name: '网前教练',
    description: '专精网前训练',
    signingBonus: 2000,
    monthlySalary: 500,
    effect: { volleyEffect: 0.20 },
    effectText: '网前技能+20%'
  },
  physio: {
    id: 'physio',
    name: '运动理疗师',
    description: '伤病恢复专家',
    signingBonus: 2500,
    monthlySalary: 600,
    effect: { injuryResistance: 0.20 },
    effectText: '伤病风险-20%'
  },
  agent: {
    id: 'agent',
    name: '经纪人',
    description: '处理商业事务',
    signingBonus: 3000,
    monthlySalary: 800,
    effect: { sponsorIncome: 0.15 },
    effectText: '赞助收入+15%'
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
    requirements: { minRanking: 500 }
  },
  {
    id: 'coach_002',
    name: '玛丽亚· Santos',
    type: 'fitness',
    skill: 75,
    level: 2,
    special: 'injury_expert',
    requirements: { minRanking: 300 }
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
    requirements: { minRanking: 400 }
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
    this.signingBonus = config.signingBonus;
    this.monthlySalary = config.monthlySalary;
    this.description = config.description;
    this.effect = config.effect;
    this.effectText = config.effectText;
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

  // 获取教练效果数值（基于教练等级和技能）
  getEffectValue() {
    const baseEffect = this.effect;
    const multiplier = 1 + (this.level - 1) * 0.2 + (this.skill - 50) / 100;
    
    const result = {};
    for (const [key, value] of Object.entries(baseEffect)) {
      result[key] = value * multiplier;
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

module.exports = {
  COACH_TYPES,
  AVAILABLE_COACHES,
  Coach,
  CoachPayroll
};
