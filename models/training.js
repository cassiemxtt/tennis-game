/**
 * 数据模型 - Training 训练系统
 */
class Training {
  static TRAINING_TYPES = {
    '1': {
      name: '力量训练',
      description: '提升力量和发球能力',
      cost: 50,
      energy: 15,
      fatigue: 15,
      effects: { strength: [1, 3], serve: [1, 2] }
    },
    '2': {
      name: '速度训练',
      description: '提升速度和移动能力',
      cost: 40,
      energy: 10,
      fatigue: 10,
      effects: { speed: [1, 3], returnGame: [1, 2] }
    },
    '3': {
      name: '技术训练',
      description: '提升技术和正反手',
      cost: 60,
      energy: 10,
      fatigue: 10,
      effects: { technique: [1, 2], forehand: [1, 3], backhand: [1, 3] }
    },
    '4': {
      name: '耐力训练',
      description: '提升耐力和持久力',
      cost: 30,
      energy: 15,
      fatigue: 20,
      effects: { endurance: [2, 4] }
    },
    '5': {
      name: '心理训练',
      description: '提升心理素质和比赛状态',
      cost: 40,
      energy: 10,
      fatigue: 5,
      effects: { mentality: [1, 3], form: [5, 15] }
    },
    '6': {
      name: '网前训练',
      description: '提升网前技术和截击能力',
      cost: 50,
      energy: 10,
      fatigue: 10,
      effects: { volley: [2, 4] }
    },
    '7': {
      name: '综合训练',
      description: '全面提升各项能力',
      cost: 80,
      energy: 15,
      fatigue: 25,
      effects: {
        strength: [0, 1],
        speed: [0, 1],
        technique: [0, 1],
        endurance: [0, 1],
        mentality: [0, 1]
      }
    }
  };

  static train(player, trainingType) {
    if (!Training.TRAINING_TYPES[trainingType]) {
      return { success: false, message: '无效的训练类型' };
    }

    const training = Training.TRAINING_TYPES[trainingType];

    if (player.money < training.cost) {
      return { success: false, message: '资金不足' };
    }

    if (player.energy < training.energy) {
      return { success: false, message: '精力不足' };
    }

    player.money -= training.cost;
    player.energy -= training.energy;
    player.addFatigue(training.fatigue);

    const results = {};
    for (const [attr, [minGain, maxGain]] of Object.entries(training.effects)) {
      const gain = Math.floor(Math.random() * (maxGain - minGain + 1)) + minGain;
      let adjustedGain = gain;

      if (player.age < 18) {
        adjustedGain = Math.floor(gain * 1.2);
      } else if (player.age > 30) {
        adjustedGain = Math.max(1, Math.floor(gain * 0.8));
      }

      if (attr === 'form') {
        player.form = Math.min(100, player.form + adjustedGain);
        results[attr] = adjustedGain;
      } else {
        if (player[attr] < 100) {
          const newValue = Math.min(100, player[attr] + adjustedGain);
          results[attr] = newValue - player[attr];
          player[attr] = newValue;
        }
      }
    }

    return {
      success: true,
      message: `${training.name}完成！`,
      results: results,
      cost: training.cost,
      energy: training.energy
    };
  }

  static getAttrName(attr) {
    const nameMap = {
      strength: '力量',
      speed: '速度',
      technique: '技术',
      endurance: '耐力',
      mentality: '心理',
      form: '状态',
      serve: '发球',
      forehand: '正手',
      backhand: '反手',
      volley: '网前',
      returnGame: '接发'
    };
    return nameMap[attr] || attr;
  }

  // 应用速度训练结果
  static applySpeedTrainingResult(player, training, score, coefficient) {
    // 基础消耗
    const cost = training.cost;
    const energy = training.energy;

    // 应用系数后的效果
    const effects = {};
    for (const [attr, [minGain, maxGain]] of Object.entries(training.effects)) {
      const baseGain = Math.floor(Math.random() * (maxGain - minGain + 1)) + minGain;
      // 应用系数
      const adjustedGain = Math.floor(baseGain * coefficient);

      if (attr === 'form') {
        player.form = Math.min(100, player.form + adjustedGain);
        effects[attr] = adjustedGain;
      } else {
        if (player[attr] < 100) {
          const newValue = Math.min(100, player[attr] + adjustedGain);
          effects[attr] = newValue - player[attr];
          player[attr] = newValue;
        }
      }
    }

    // 添加疲劳
    player.addFatigue(training.fatigue);

    return {
      success: true,
      effects: effects,
      cost: cost,
      energy: energy,
      coefficient: coefficient
    };
  }

  // 应用力量训练结果
  static applyStrengthTrainingResult(player, training, score, coefficient) {
    // 基础消耗
    const cost = training.cost;
    const energy = training.energy;

    // 应用系数后的效果
    const effects = {};
    for (const [attr, [minGain, maxGain]] of Object.entries(training.effects)) {
      const baseGain = Math.floor(Math.random() * (maxGain - minGain + 1)) + minGain;
      // 应用系数
      const adjustedGain = Math.floor(baseGain * coefficient);

      if (attr === 'form') {
        player.form = Math.min(100, player.form + adjustedGain);
        effects[attr] = adjustedGain;
      } else {
        if (player[attr] < 100) {
          const newValue = Math.min(100, player[attr] + adjustedGain);
          effects[attr] = newValue - player[attr];
          player[attr] = newValue;
        }
      }
    }

    // 添加疲劳
    player.addFatigue(training.fatigue);

    return {
      success: true,
      effects: effects,
      cost: cost,
      energy: energy,
      coefficient: coefficient
    };
  }

  // 应用技术训练结果
  static applyTechTrainingResult(player, training, score, coefficient) {
    // 基础消耗
    const cost = training.cost;
    const energy = training.energy;

    // 应用系数后的效果
    const effects = {};
    for (const [attr, [minGain, maxGain]] of Object.entries(training.effects)) {
      const baseGain = Math.floor(Math.random() * (maxGain - minGain + 1)) + minGain;
      // 应用系数
      const adjustedGain = Math.floor(baseGain * coefficient);

      if (attr === 'form') {
        player.form = Math.min(100, player.form + adjustedGain);
        effects[attr] = adjustedGain;
      } else {
        if (player[attr] < 100) {
          const newValue = Math.min(100, player[attr] + adjustedGain);
          effects[attr] = newValue - player[attr];
          player[attr] = newValue;
        }
      }
    }

    // 添加疲劳
    player.addFatigue(training.fatigue);

    return {
      success: true,
      effects: effects,
      cost: cost,
      energy: energy,
      coefficient: coefficient
    };
  }
}

module.exports = Training;
