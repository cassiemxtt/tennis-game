/**
 * 数据模型 - Training 训练系统
 * 新版：5类训练 + 训练点数 + 瓶颈期系统 + 卡牌产出
 */
const { SKILL_TYPES, SKILL_INFO } = require('./skill.js');
const { getCardById, CARD_TYPE } = require('../data/cards.js');
const { randomDraw } = require('../data/cards.js');

// 训练产出卡牌碎片的配置
const TRAINING_CARD_DROPS = {
  // 力量训练产出：发球/力量相关碎片
  strength: {
    cardTypes: [CARD_TYPE.SERVE, CARD_TYPE.SMASH],
    fragmentDropRate: 0.3,  // 30%概率获得碎片
    fragmentCount: [1, 3]   // 1-3个碎片
  },
  // 技巧训练产出：截击/小球相关碎片
  technique: {
    cardTypes: [CARD_TYPE.VOLLEY, CARD_TYPE.DROP_SHOT],
    fragmentDropRate: 0.3,
    fragmentCount: [1, 3]
  },
  // 体能训练产出：底线/耐力相关碎片
  fitness: {
    cardTypes: [CARD_TYPE.BASELINE, CARD_TYPE.LOB],
    fragmentDropRate: 0.3,
    fragmentCount: [1, 3]
  },
  // 速度训练产出：发球/截击相关碎片
  speed: {
    cardTypes: [CARD_TYPE.SERVE, CARD_TYPE.VOLLEY],
    fragmentDropRate: 0.3,
    fragmentCount: [1, 3]
  },
  // 康复不产出卡牌
  recovery: {
    cardTypes: [],
    fragmentDropRate: 0,
    fragmentCount: [0, 0]
  }
};

// 训练类型定义
const TRAINING_TYPES = {
  'strength': {
    name: '力量训练',
    description: '提升发球和底线力量',
    icon: '💪',
    cost: 100,
    energy: 20,
    fatigue: 15,
    // 正向效果: 技能->[最小值, 最大值]
    positive: { serve: [3, 5], baseline: [2, 4] },
    // 负向效果
    negative: { dropShot: [1, 2] }
  },
  'technique': {
    name: '技巧训练',
    description: '提升截击和放小球技术',
    icon: '🎯',
    cost: 100,
    energy: 18,
    fatigue: 12,
    positive: { volley: [3, 5], dropShot: [2, 4] },
    negative: { baseline: [1, 2] }
  },
  'fitness': {
    name: '体能训练',
    description: '提升底线耐力和移动能力',
    icon: '🔥',
    cost: 80,
    energy: 25,
    fatigue: 20,
    positive: { baseline: [3, 5], lob: [2, 4] },  // lob代表耐力/移动
    negative: { serve: [1, 2] }
  },
  'speed': {
    name: '速度训练',
    description: '提升反应和速度',
    icon: '⚡',
    cost: 80,
    energy: 22,
    fatigue: 18,
    positive: { serve: [2, 4], volley: [2, 4], smash: [2, 4] },  // 反应速度
    negative: { baseline: [1, 2] }
  },
  'recovery': {
    name: '康复/休息',
    description: '恢复精力，减少疲劳',
    icon: '🏥',
    cost: 50,
    energy: 0,
    fatigue: -20,
    positive: {},  // 不提升技能
    negative: {},
    isRecovery: true
  }
};

// 瓶颈期触发需要的连续训练次数
const PLATEAU_THRESHOLD = 8;

class Training {
  static TRAINING_TYPES = TRAINING_TYPES;
  static PLATEAU_THRESHOLD = PLATEAU_THRESHOLD;

  // 执行训练
  static train(player, trainingType) {
    const training = Training.TRAINING_TYPES[trainingType];
    if (!training) {
      return { success: false, message: '无效的训练类型' };
    }

    // 检查康复/休息
    if (training.isRecovery) {
      return Training.doRecovery(player, training);
    }

    // 检查训练点数
    if (!player.useTrainingPoints(1)) {
      return { success: false, message: '训练点数不足！本周已用完' };
    }

    // 检查资金
    if (player.money < training.cost) {
      player.useTrainingPoints(-1);  // 退还
      return { success: false, message: '资金不足' };
    }

    // 检查精力
    if (player.energy < training.energy) {
      player.useTrainingPoints(-1);  // 退还
      return { success: false, message: '精力不足' };
    }

    // 检查伤病
    if (player.injury && player.injury.isInjured) {
      player.useTrainingPoints(-1);
      const injuryNames = {
        'light_strain': '轻微拉伤', 'muscle_soreness': '肌肉酸痛',
        'sprain': '扭伤', 'tennis_elbow': '网球肘',
        'meniscus': '半月板损伤', 'season_end': '赛季报销'
      };
      const injuryName = injuryNames[player.injury.type] || '伤病';
      return { success: false, message: `受伤中！${injuryName}需要${player.injury.weeksRemaining}周恢复` };
    }

    // 扣减资源
    player.money -= training.cost;
    player.energy -= training.energy;
    player.addFatigue(training.fatigue);

    // 计算训练效果（传递训练类型用于匹配教练加成）
    const results = Training.calculateTrainingEffects(player, training, trainingType);
    
    // 应用训练效果
    const appliedResults = Training.applyTrainingEffects(player, training, results);

    // 检查是否进入瓶颈期
    const plateauWarnings = [];
    for (const [skillType, gain] of Object.entries(appliedResults.positive)) {
      if (gain > 0) {
        player.plateauCount[skillType]++;
        if (player.plateauCount[skillType] >= PLATEAU_THRESHOLD) {
          player.inPlateau[skillType] = true;
          plateauWarnings.push(`${SKILL_INFO[skillType]?.name || skillType}进入瓶颈期！`);
        }
      }
    }

    // 更新技能加成
    player.updateSkillBonuses();

    // 获取带练教练加成（用于显示）
    const trainingCoachBonus = Training.getTrainingCoachBonus(player, trainingType);
    const currentCoach = player.coaches && player.trainingCoach ? 
      player.coaches.find(c => c.type === player.trainingCoach) : null;
    
    // 构建详细结果消息
    let message = `${training.name}完成！\n`;
    message += `消耗: $${training.cost}, 精力-${training.energy}, 疲劳+${training.fatigue}\n`;
    
    // 显示各技能提升
    const skillNames = SKILL_INFO;
    if (appliedResults.positive && Object.keys(appliedResults.positive).length > 0) {
      message += '技能提升: ';
      const gainTexts = [];
      for (const [skill, gain] of Object.entries(appliedResults.positive)) {
        const skillName = skillNames[skill]?.name || skill;
        gainTexts.push(`${skillName}+${gain}`);
      }
      message += gainTexts.join(', ');
    }
    
    // 显示教练加成
    if (currentCoach && trainingCoachBonus && Object.keys(trainingCoachBonus).length > 0) {
      const bonusTexts = [];
      for (const [key, value] of Object.entries(trainingCoachBonus)) {
        if (key === 'trainingEffect') {
          bonusTexts.push(`训练+${Math.round(value * 100)}%`);
        } else if (key === 'serveEffect') {
          bonusTexts.push(`发球+${Math.round(value * 100)}%`);
        } else if (key === 'volleyEffect') {
          bonusTexts.push(`网前+${Math.round(value * 100)}%`);
        } else if (key === 'baselineEffect') {
          bonusTexts.push(`底线+${Math.round(value * 100)}%`);
        }
      }
      if (bonusTexts.length > 0) {
        message += `\n👨‍🏫 ${currentCoach.name}: ${bonusTexts.join(', ')}`;
      }
    }
    
    // 显示瓶颈警告
    if (plateauWarnings.length > 0) {
      message += '\n⚠️ ' + plateauWarnings.join(' ');
    }

    // 处理卡牌碎片产出
    const cardDropResult = Training.processCardDrop(player, trainingType);
    if (cardDropResult) {
      message += `\n🃏 ${cardDropResult}`;
    }

    return {
      success: true,
      message: message,
      results: appliedResults,
      cost: training.cost,
      energy: training.energy,
      plateauWarnings: plateauWarnings,
      inPlateau: player.inPlateau,
      coachBonus: trainingCoachBonus,
      cardDrop: cardDropResult
    };
  }

  // 处理训练产出卡牌碎片
  static processCardDrop(player, trainingType) {
    const dropConfig = TRAINING_CARD_DROPS[trainingType];
    if (!dropConfig || dropConfig.fragmentDropRate <= 0) {
      return null;
    }

    // 随机判断是否掉落碎片
    if (Math.random() > dropConfig.fragmentDropRate) {
      return null;
    }

    // 随机掉落数量
    const [minCount, maxCount] = dropConfig.fragmentCount;
    const fragmentCount = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;

    // 随机决定稀有度（基于概率）
    const rand = Math.random();
    let rarity;
    if (rand < 0.60) rarity = 'R';
    else if (rand < 0.85) rarity = 'SR';
    else if (rand < 0.95) rarity = 'SSR';
    else rarity = 'UR';

    // 添加碎片
    player.cardManager.addFragment(rarity, fragmentCount);

    const rarityNames = { R: '普通', SR: '稀有', SSR: '史诗', UR: '传奇' };
    return `获得${fragmentCount}个${rarityNames[rarity]}碎片`;
  }

  // 获取带练教练加成（根据训练类型和应用的能力匹配）
  static getTrainingCoachBonus(player, trainingType) {
    if (!player.trainingCoach) return {};
    
    const coach = player.coaches.find(c => c.type === player.trainingCoach);
    if (!coach) return {};
    
    const { Coach } = require('./coach.js');
    const coachObj = new Coach(coach);
    const coachEffect = coachObj.getEffectValue();
    
    // 训练类型到教练类型的映射
    const trainingToCoachType = {
      'strength': 'serve',  // 力量训练匹配发球教练
      'technique': 'volley',  // 技巧训练匹配网前教练
      'fitness': 'fitness',  // 体能训练匹配体能教练
      'speed': 'serve',  // 速度训练匹配发球教练（反应）
      'recovery': 'fitness'  // 恢复匹配体能教练
    };
    
    // 检查教练类型是否与训练类型匹配
    const matchedCoachType = trainingToCoachType[trainingType];
    if (matchedCoachType && coach.type !== matchedCoachType) {
      // 教练类型不匹配，没有加成
      return {};
    }
    
    return coachEffect;
  }

  // 计算训练效果（考虑各种因素）
  static calculateTrainingEffects(player, training, trainingType) {
    const results = { positive: {}, negative: {} };
    
    // 获取各种加成
    const ageBonus = player.getAgeTrainingBonus();
    const formBonus = player.getFormTrainingBonus();
    const coachBonus = player.getCoachBonus();
    const trainingCoachBonus = Training.getTrainingCoachBonus(player, trainingType);
    const injuryPenalty = player.injury && player.injury.isInjured ? 0.5 : 1.0;
    
    // 处理正向效果
    for (const [skillType, [minGain, maxGain]] of Object.entries(training.positive)) {
      let baseGain = Math.floor(Math.random() * (maxGain - minGain + 1)) + minGain;
      
      // 获取技能成长性
      const skill = player.skillManager.getSkill(skillType);
      let growthRate = skill ? skill.growthRate : 1.0;
      
      // 检查是否在瓶颈期
      if (player.inPlateau[skillType]) {
        // 检查是否可以突破瓶颈
        if (!player.canBreakPlateau(skillType)) {
          baseGain = 0;  // 瓶颈期，无效果
        } else {
          // 有突破能力，减少瓶颈惩罚
          baseGain = Math.floor(baseGain * 0.2);
        }
      }
      
      // 应用所有加成
      let finalGain = baseGain;
      finalGain = Math.floor(finalGain * ageBonus);
      finalGain = Math.floor(finalGain * formBonus);
      finalGain = Math.floor(finalGain * growthRate);  // 成长系数
      finalGain = Math.floor(finalGain * (1 + coachBonus.trainingEffect));
      // 应用带练教练加成
      if (trainingCoachBonus.trainingEffect) {
        finalGain = Math.floor(finalGain * (1 + trainingCoachBonus.trainingEffect));
      }
      finalGain = Math.floor(finalGain * injuryPenalty);
      
      results.positive[skillType] = Math.max(0, finalGain);
    }
    
    // 处理负向效果
    for (const [skillType, [minLoss, maxLoss]] of Object.entries(training.negative)) {
      let baseLoss = Math.floor(Math.random() * (maxLoss - minLoss + 1)) + minLoss;
      
      // 负向效果不受正面加成影响，但受年龄影响（年龄大更容易受伤导致下降）
      let finalLoss = baseLoss;
      if (player.age > 25) {
        finalLoss = Math.floor(finalLoss * (1 + (player.age - 25) * 0.05));
      }
      
      results.negative[skillType] = Math.min(0, -finalLoss);
    }
    
    return results;
  }

  // 应用训练效果到玩家属性
  static applyTrainingEffects(player, training, results) {
    const applied = { positive: {}, negative: {} };
    
    // 应用正向效果
    for (const [skillType, gain] of Object.entries(results.positive)) {
      const skill = player.skillManager.getSkill(skillType);
      if (skill) {
        const actualGain = skill.addScore(gain);
        applied.positive[skillType] = actualGain;
      }
    }
    
    // 应用负向效果
    for (const [skillType, loss] of Object.entries(results.negative)) {
      const skill = player.skillManager.getSkill(skillType);
      if (skill) {
        const actualLoss = skill.addScore(loss);  // loss是负数
        applied.negative[skillType] = actualLoss;
      }
    }
    
    return applied;
  }

  // 执行康复/休息
  static doRecovery(player, training) {
    // 康复也消耗训练点数
    if (!player.useTrainingPoints(1)) {
      return { success: false, message: '训练点数不足！本周已用完' };
    }

    // 检查资金
    if (player.money < training.cost) {
      player.useTrainingPoints(-1);
      return { success: false, message: '资金不足' };
    }

    player.money -= training.cost;

    // 获取带练教练的恢复加成（传递recovery类型）
    const trainingCoachBonus = Training.getTrainingCoachBonus(player, 'recovery');
    const recoveryBonus = trainingCoachBonus.energyRecovery || 0;

    // 恢复效果（带练教练加成）
    const baseEnergyRecovery = 30;
    const energyRecovery = Math.floor(baseEnergyRecovery * (1 + recoveryBonus));
    const fatigueRecovery = 20;
    player.energy = Math.min(100, player.energy + energyRecovery);
    player.fatigue = Math.max(0, player.fatigue - fatigueRecovery);
    
    // 恢复伤病
    let injuryRecovered = false;
    if (player.injury && player.injury.isInjured) {
      injuryRecovered = player.recoverInjury();
    }
    
    // 状态恢复
    if (Math.random() > 0.3) {
      player.form = Math.min(100, player.form + player.randomInt(5, 15));
    }

    let message = `${training.name}完成！`;
    // 显示带练教练加成效果
    const currentCoach = player.coaches.find(c => c.type === player.trainingCoach);
    if (currentCoach && recoveryBonus > 0) {
      message += `\n👨‍🏫 ${currentCoach.name}指导: 恢复+${Math.round(recoveryBonus * 100)}%`;
    }
    message += `\n精力+${energyRecovery}，疲劳-${fatigueRecovery}`;
    if (injuryRecovered) {
      message += `\n伤病已痊愈！`;
    }

    return {
      success: true,
      message: message,
      energyRecovery: energyRecovery,
      fatigueRecovery: fatigueRecovery,
      injuryRecovered: injuryRecovered
    };
  }

  // 突破瓶颈
  static breakPlateau(player, skillType) {
    if (player.inPlateau[skillType]) {
      if (player.breakPlateau(skillType)) {
        return { success: true, message: `成功突破${SKILL_INFO[skillType]?.name || skillType}瓶颈！` };
      } else {
        return { success: false, message: '无法突破！需要签约更好的赞助商或雇佣能突破瓶颈的教练' };
      }
    }
    return { success: false, message: '该技能未处于瓶颈期' };
  }

  // 获取技能名称
  static getAttrName(attr) {
    const nameMap = SKILL_INFO;
    return nameMap[attr]?.name || attr;
  }

  // 获取所有可用训练类型
  static getAvailableTrainingTypes() {
    return Object.entries(TRAINING_TYPES).map(([id, info]) => ({
      id: id,
      ...info
    }));
  }

  // 计算训练效率（用于显示）
  static calculateTrainingEfficiency(player, skillType) {
    const skill = player.skillManager.getSkill(skillType);
    if (!skill) return 1.0;
    
    let efficiency = 1.0;
    efficiency *= player.getAgeTrainingBonus();
    efficiency *= player.getFormTrainingBonus();
    efficiency *= (1 + player.getCoachBonus().trainingEffect);
    efficiency *= skill.growthRate;
    
    if (player.inPlateau[skillType]) {
      efficiency *= 0;  // 瓶颈期效率为0
    }
    
    return efficiency;
  }

  // 应用力量训练小游戏结果
  static applyStrengthTrainingResult(player, training, score, coefficient) {
    // 扣减资源
    player.money -= training.cost;
    player.energy -= training.energy;
    player.addFatigue(training.fatigue);

    // 计算基础效果（基于分数和系数）
    const baseEffects = training.positive;
    const results = { positive: {}, negative: {} };
    
    // 获取各种加成（传递strength类型）
    const ageBonus = player.getAgeTrainingBonus();
    const formBonus = player.getFormTrainingBonus();
    const coachBonus = player.getCoachBonus();
    const trainingCoachBonus = Training.getTrainingCoachBonus(player, 'strength');
    const injuryPenalty = player.injury && player.injury.isInjured ? 0.5 : 1.0;

    // 应用正向效果
    for (const [skillType, [minGain, maxGain]] of Object.entries(baseEffects)) {
      let baseGain = Math.floor(Math.random() * (maxGain - minGain + 1)) + minGain;
      baseGain = Math.floor(baseGain * coefficient); // 应用小游戏系数
      
      // 检查瓶颈期
      if (player.inPlateau[skillType]) {
        if (!player.canBreakPlateau(skillType)) {
          baseGain = 0;
        } else {
          baseGain = Math.floor(baseGain * 0.2);
        }
      }
      
      // 应用加成
      let finalGain = baseGain;
      finalGain = Math.floor(finalGain * ageBonus);
      finalGain = Math.floor(finalGain * formBonus);
      finalGain = Math.floor(finalGain * (1 + coachBonus.trainingEffect));
      // 应用带练教练加成
      if (trainingCoachBonus.trainingEffect) {
        finalGain = Math.floor(finalGain * (1 + trainingCoachBonus.trainingEffect));
      }
      finalGain = Math.floor(finalGain * injuryPenalty);
      
      // 应用到技能
      const skill = player.skillManager.getSkill(skillType);
      if (skill) {
        results.positive[skillType] = skill.addScore(finalGain);
        
        // 检查瓶颈
        player.plateauCount[skillType]++;
        if (player.plateauCount[skillType] >= PLATEAU_THRESHOLD) {
          player.inPlateau[skillType] = true;
        }
      }
    }

    // 应用负向效果
    for (const [skillType, [minLoss, maxLoss]] of Object.entries(training.negative)) {
      let baseLoss = Math.floor(Math.random() * (maxLoss - minLoss + 1)) + minLoss;
      baseLoss = Math.floor(baseLoss * coefficient);
      
      if (player.age > 25) {
        baseLoss = Math.floor(baseLoss * (1 + (player.age - 25) * 0.05));
      }
      
      const skill = player.skillManager.getSkill(skillType);
      if (skill) {
        results.negative[skillType] = skill.addScore(-baseLoss);
      }
    }

    // 更新技能加成
    player.updateSkillBonuses();

    return {
      effects: results.positive,
      cost: training.cost,
      energy: training.energy
    };
  }

  // 应用速度训练小游戏结果
  static applySpeedTrainingResult(player, training, score, coefficient) {
    // 扣减资源
    player.money -= training.cost;
    player.energy -= training.energy;
    player.addFatigue(training.fatigue);

    // 计算基础效果
    const baseEffects = training.positive;
    const results = { positive: {}, negative: {} };
    
    // 获取各种加成（传递speed类型）
    const ageBonus = player.getAgeTrainingBonus();
    const formBonus = player.getFormTrainingBonus();
    const coachBonus = player.getCoachBonus();
    const trainingCoachBonus = Training.getTrainingCoachBonus(player, 'speed');
    const injuryPenalty = player.injury && player.injury.isInjured ? 0.5 : 1.0;

    // 应用正向效果
    for (const [skillType, [minGain, maxGain]] of Object.entries(baseEffects)) {
      let baseGain = Math.floor(Math.random() * (maxGain - minGain + 1)) + minGain;
      baseGain = Math.floor(baseGain * coefficient);
      
      // 检查瓶颈期
      if (player.inPlateau[skillType]) {
        if (!player.canBreakPlateau(skillType)) {
          baseGain = 0;
        } else {
          baseGain = Math.floor(baseGain * 0.2);
        }
      }
      
      // 应用加成
      let finalGain = baseGain;
      finalGain = Math.floor(finalGain * ageBonus);
      finalGain = Math.floor(finalGain * formBonus);
      finalGain = Math.floor(finalGain * (1 + coachBonus.trainingEffect));
      // 应用带练教练加成
      if (trainingCoachBonus.trainingEffect) {
        finalGain = Math.floor(finalGain * (1 + trainingCoachBonus.trainingEffect));
      }
      finalGain = Math.floor(finalGain * injuryPenalty);
      
      // 应用到技能
      const skill = player.skillManager.getSkill(skillType);
      if (skill) {
        results.positive[skillType] = skill.addScore(finalGain);
        
        // 检查瓶颈
        player.plateauCount[skillType]++;
        if (player.plateauCount[skillType] >= PLATEAU_THRESHOLD) {
          player.inPlateau[skillType] = true;
        }
      }
    }

    // 应用负向效果
    for (const [skillType, [minLoss, maxLoss]] of Object.entries(training.negative)) {
      let baseLoss = Math.floor(Math.random() * (maxLoss - minLoss + 1)) + minLoss;
      baseLoss = Math.floor(baseLoss * coefficient);
      
      if (player.age > 25) {
        baseLoss = Math.floor(baseLoss * (1 + (player.age - 25) * 0.05));
      }
      
      const skill = player.skillManager.getSkill(skillType);
      if (skill) {
        results.negative[skillType] = skill.addScore(-baseLoss);
      }
    }

    // 更新技能加成
    player.updateSkillBonuses();

    return {
      effects: results.positive,
      cost: training.cost,
      energy: training.energy
    };
  }

  // 应用技术训练小游戏结果
  static applyTechTrainingResult(player, training, score, coefficient) {
    // 扣减资源
    player.money -= training.cost;
    player.energy -= training.energy;
    player.addFatigue(training.fatigue);

    // 计算基础效果
    const baseEffects = training.positive;
    const results = { positive: {}, negative: {} };
    
    // 获取各种加成（传递technique类型）
    const ageBonus = player.getAgeTrainingBonus();
    const formBonus = player.getFormTrainingBonus();
    const coachBonus = player.getCoachBonus();
    const trainingCoachBonus = Training.getTrainingCoachBonus(player, 'technique');
    const injuryPenalty = player.injury && player.injury.isInjured ? 0.5 : 1.0;

    // 应用正向效果
    for (const [skillType, [minGain, maxGain]] of Object.entries(baseEffects)) {
      let baseGain = Math.floor(Math.random() * (maxGain - minGain + 1)) + minGain;
      baseGain = Math.floor(baseGain * coefficient);
      
      // 检查瓶颈期
      if (player.inPlateau[skillType]) {
        if (!player.canBreakPlateau(skillType)) {
          baseGain = 0;
        } else {
          baseGain = Math.floor(baseGain * 0.2);
        }
      }
      
      // 应用加成
      let finalGain = baseGain;
      finalGain = Math.floor(finalGain * ageBonus);
      finalGain = Math.floor(finalGain * formBonus);
      finalGain = Math.floor(finalGain * (1 + coachBonus.trainingEffect));
      // 应用带练教练加成
      if (trainingCoachBonus.trainingEffect) {
        finalGain = Math.floor(finalGain * (1 + trainingCoachBonus.trainingEffect));
      }
      finalGain = Math.floor(finalGain * injuryPenalty);
      
      // 应用到技能
      const skill = player.skillManager.getSkill(skillType);
      if (skill) {
        results.positive[skillType] = skill.addScore(finalGain);
        
        // 检查瓶颈
        player.plateauCount[skillType]++;
        if (player.plateauCount[skillType] >= PLATEAU_THRESHOLD) {
          player.inPlateau[skillType] = true;
        }
      }
    }

    // 应用负向效果
    for (const [skillType, [minLoss, maxLoss]] of Object.entries(training.negative)) {
      let baseLoss = Math.floor(Math.random() * (maxLoss - minLoss + 1)) + minLoss;
      baseLoss = Math.floor(baseLoss * coefficient);
      
      if (player.age > 25) {
        baseLoss = Math.floor(baseLoss * (1 + (player.age - 25) * 0.05));
      }
      
      const skill = player.skillManager.getSkill(skillType);
      if (skill) {
        results.negative[skillType] = skill.addScore(-baseLoss);
      }
    }

    // 更新技能加成
    player.updateSkillBonuses();

    return {
      effects: results.positive,
      cost: training.cost,
      energy: training.energy
    };
  }
}

module.exports = Training;
