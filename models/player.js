/**
 * 数据模型 - Player 球员类
 */
class Player {
  constructor(name = '网球新星', gender = 'male') {
    this.name = name;
    this.gender = gender; // 'male' 或 'female'
    this.age = 14;
    this.careerYear = 0;
    this.energy = 100;
    this.money = 1000;
    this.ranking = 1000;
    this.careerEarnings = 0;
    this.titles = 0;
    this.grandSlams = 0;
    this.matchesPlayed = 0;
    this.matchesWon = 0;

    // 核心属性 (1-100)
    this.strength = 30;
    this.speed = 40;
    this.technique = 35;
    this.endurance = 35;
    this.mentality = 30;
    this.form = 80;

    // 技能专长
    this.serve = 30;
    this.forehand = 35;
    this.backhand = 30;
    this.volley = 25;
    this.returnGame = 30;

    // 疲劳度
    this.fatigue = 0;

    // 生涯记录
    this.careerHighRanking = 1000;
    this.bestResult = '无';

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
  }
  
  // 检查是否有伤病影响
  getInjuryEffect() {
    if (!this.injury.isInjured || !this.injury.type) {
      return null;
    }
    
    const baseEffect = {
      strength: 0,
      speed: 0,
      technique: 0,
      endurance: 0,
      mentality: 0
    };
    
    const injuryEffects = {
      'light_strain': { speed: -10 },
      'muscle_soreness': { strength: -10 },
      'sprain': { speed: -15 },
      'tennis_elbow': { technique: -20 },
      'meniscus': { strength: -15, speed: -15, technique: -10 },
      'season_end': { strength: -20, speed: -20, technique: -20, endurance: -20, mentality: -20 }
    };
    
    const effect = injuryEffects[this.injury.type] || {};
    return { ...baseEffect, ...effect };
  }
  
  // 计算综合实力（考虑伤病影响）
  calculateOverall() {
    const baseStats = Math.floor((this.strength + this.speed + this.technique + this.endurance + this.mentality) / 5);
    const skills = Math.floor((this.serve + this.forehand + this.backhand + this.volley + this.returnGame) / 5);
    let overall = Math.floor((baseStats * 6 + skills * 4) / 10);
    overall -= Math.floor(this.fatigue / 10);
    
    // 伤病减益
    if (this.injury.isInjured) {
      const effect = this.getInjuryEffect();
      if (effect) {
        const penalty = Math.abs(effect.strength || 0) + Math.abs(effect.speed || 0) + 
                       Math.abs(effect.technique || 0) + Math.abs(effect.endurance || 0) + 
                       Math.abs(effect.mentality || 0);
        overall -= Math.floor(penalty / 2);
      }
    }
    
    return Math.max(1, Math.min(100, overall));
  }
  
  // 获得伤病
  getInjured(injuryType, duration) {
    this.injury = {
      type: injuryType,
      weeksRemaining: duration,
      isInjured: true
    };
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
        return true; // 伤病痊愈
      }
    }
    return false;
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
    
    return { success: true, message: `已雇佣${coach.name}` };
  }
  
  // 解雇教练
  fireCoach(coachType) {
    const index = this.coaches.findIndex(c => c.type === coachType);
    if (index < 0) {
      return { success: false, message: '未找到该教练' };
    }
    
    this.coaches.splice(index, 1);
    return { success: true, message: '教练已解雇' };
  }
  
  // 获取教练加成
  getCoachBonus() {
    const bonus = {
      trainingEffect: 0,
      injuryResistance: 0,
      matchWinRate: 0,
      energyRecovery: 0,
      sponsorIncome: 0
    };
    
    for (const coach of this.coaches) {
      if (coach.type === 'technique') bonus.trainingEffect += 0.15;
      else if (coach.type === 'fitness') bonus.energyRecovery += 0.15;
      else if (coach.type === 'mental') bonus.matchWinRate += 5;
      else if (coach.type === 'physio') bonus.injuryResistance += 0.2;
      else if (coach.type === 'agent') bonus.sponsorIncome += 0.15;
    }
    
    return bonus;
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

    if (this.age < 22) {
      const growth = this.randomInt(1, 3);
      for (let i = 0; i < growth; i++) {
        const attr = this.randomChoice(['strength', 'speed', 'endurance']);
        if (this[attr] < 90) this[attr]++;
      }
    } else if (this.age > 30) {
      if (Math.random() < 0.3) {
        const attr = this.randomChoice(['speed', 'endurance']);
        if (this[attr] > 20) this[attr]--;
      }
    }
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
      strength: this.strength,
      speed: this.speed,
      technique: this.technique,
      endurance: this.endurance,
      mentality: this.mentality,
      form: this.form,
      serve: this.serve,
      forehand: this.forehand,
      backhand: this.backhand,
      volley: this.volley,
      returnGame: this.returnGame,
      fatigue: this.fatigue,
      careerHighRanking: this.careerHighRanking,
      bestResult: this.bestResult,
      sponsors: this.sponsors,
      equipment: this.equipment,
      injury: this.injury,
      coaches: this.coaches
    };
  }

  static fromJSON(data) {
    const player = new Player(data.name || '网球新星', data.gender || 'male');
    Object.assign(player, data);
    // 确保 gender 字段有值
    if (!player.gender) {
      player.gender = 'male';
    }
    return player;
  }
}

module.exports = Player;
