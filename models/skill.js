/**
 * 数据模型 - Skill 技能系统
 * 7种网球技能，每种6个等级
 */

// 技能类型定义
const SKILL_TYPES = {
  BASELINE: 'baseline',    // 底线
  VOLLEY: 'volley',        // 截击
  SERVE: 'serve',          // 发球
  DROP_SHOT: 'dropShot',   // 放小球
  SLICE: 'slice',          // 切削
  LOB: 'lob',              // 月亮球
  SMASH: 'smash'           // 高压球
};

// 技能中文名称和图标
const SKILL_INFO = {
  [SKILL_TYPES.BASELINE]: { name: '底线', icon: '🎾', description: '底线相持能力' },
  [SKILL_TYPES.VOLLEY]: { name: '截击', icon: '🏃', description: '网前截击能力' },
  [SKILL_TYPES.SERVE]: { name: '发球', icon: '🎯', description: '发球能力' },
  [SKILL_TYPES.DROP_SHOT]: { name: '放小球', icon: '🪶', description: '放小球能力' },
  [SKILL_TYPES.SLICE]: { name: '切削', icon: '🔪', description: '切削球能力' },
  [SKILL_TYPES.LOB]: { name: '月亮球', icon: '🌙', description: '月亮球能力' },
  [SKILL_TYPES.SMASH]: { name: '高压球', icon: '⚡', description: '高压球能力' }
};

// 等级定义
const SKILL_LEVELS = [
  { name: '新手', minScore: 0, maxScore: 99 },
  { name: '普通', minScore: 100, maxScore: 199 },
  { name: '熟练', minScore: 200, maxScore: 299 },
  { name: '精进', minScore: 300, maxScore: 399 },
  { name: '专家', minScore: 400, maxScore: 499 },
  { name: '大师', minScore: 500, maxScore: 999 }
];
// 等级颜色配置
const LEVEL_COLORS = [
  '#888888', // 新手 - 灰色
  '#4ade80', // 普通 - 绿色
  '#60a5fa', // 熟练 - 蓝色
  '#c084fc', // 精进 - 紫色
  '#fbbf24', // 专家 - 黄色
  '#f97316'  // 大师 - 橙色
];
// 获取技能等级
function getSkillLevel(score) {
  for (let i = SKILL_LEVELS.length - 1; i >= 0; i--) {
    if (score >= SKILL_LEVELS[i].minScore) {
      return {
        level: i,
        name: SKILL_LEVELS[i].name,
        title: SKILL_LEVELS[i].name
      };
    }
  }
  return { level: 0, name: '新手', title: '新手' };
}

// 获取升级所需分数
function getScoreForLevel(level) {
  if (level < 0 || level >= SKILL_LEVELS.length) return 0;
  return SKILL_LEVELS[level].minScore;
}

// 计算技能点数（每100分=1点，已使用的点数）
function calculateSkillPoints(score) {
  return Math.floor(score / 100);
}

// 技能类
class Skill {
  constructor(type, baseScore = 10) {
    this.type = type;  // 技能类型
    this.baseScore = baseScore;  // 基础分数
    this.sponsorBonus = 0;  // 赞助加成
    this.equipmentBonus = 0;  // 装备加成
    this.ageBonus = 0;  // 年龄加成
    this.coachBonus = 0;  // 教练加成
    this.formBonus = 0;  // 状态加成（不显示在图谱上）
    this.injuryPenalty = 0;  // 伤病惩罚
    this.growthRate = 1.0;  // 成长性系数（来自天赋）
  }

  // 获取最终分数（用于显示和比赛计算）
  getFinalScore() {
    let score = this.baseScore + this.sponsorBonus + this.equipmentBonus + 
                this.ageBonus + this.coachBonus + this.formBonus - this.injuryPenalty;
    return Math.max(0, Math.min(999, Math.floor(score)));
  }

  // 获取显示分数（不包含状态加成，用于雷达图）
  getDisplayScore() {
    let score = this.baseScore + this.sponsorBonus + this.equipmentBonus + 
                this.ageBonus + this.coachBonus - this.injuryPenalty;
    return Math.max(0, Math.min(999, Math.floor(score)));
  }

  // 获取等级信息
  getLevel() {
    return getSkillLevel(this.getFinalScore());
  }

  // 获取显示等级（不含状态加成）
  getDisplayLevel() {
    return getSkillLevel(this.getDisplayScore());
  }

  // 升级所需分数
  getNextLevelScore() {
    const currentLevel = this.getLevel().level;
    if (currentLevel >= SKILL_LEVELS.length - 1) {
      return null; // 已满级
    }
    return SKILL_LEVELS[currentLevel + 1].minScore;
  }

  // 当前等级分数上限
  getCurrentLevelMaxScore() {
    const currentLevel = this.getLevel().level;
    return SKILL_LEVELS[currentLevel].maxScore;
  }

  // 添加分数（考虑成长性）
  addScore(amount) {
    // 实际增加 = 基础增加 × 成长性系数
    const actualAmount = Math.floor(amount * this.growthRate);
    this.baseScore = Math.max(0, this.baseScore + actualAmount);
    return actualAmount;
  }

  // 设置成长性（来自天赋）
  setGrowthRate(rate) {
    this.growthRate = Math.max(0.5, Math.min(1.5, rate));
  }

  // 更新状态加成
  updateFormBonus(form) {
    // 状态80以上有加成，60以下有惩罚
    if (form >= 80) {
      this.formBonus = Math.floor((form - 80) * 0.5);
    } else if (form < 60) {
      this.formBonus = Math.floor((form - 60) * 0.5);
    } else {
      this.formBonus = 0;
    }
  }

  // 设置伤病惩罚
  setInjuryPenalty(penalty) {
    this.injuryPenalty = Math.max(0, penalty);
  }

  // 序列化
  toJSON() {
    return {
      type: this.type,
      baseScore: this.baseScore,
      sponsorBonus: this.sponsorBonus,
      equipmentBonus: this.equipmentBonus,
      ageBonus: this.ageBonus,
      coachBonus: this.coachBonus,
      formBonus: this.formBonus,
      injuryPenalty: this.injuryPenalty,
      growthRate: this.growthRate
    };
  }

  // 反序列化
  static fromJSON(data) {
    const skill = new Skill(data.type, data.baseScore);
    skill.sponsorBonus = data.sponsorBonus || 0;
    skill.equipmentBonus = data.equipmentBonus || 0;
    skill.ageBonus = data.ageBonus || 0;
    skill.coachBonus = data.coachBonus || 0;
    skill.formBonus = data.formBonus || 0;
    skill.injuryPenalty = data.injuryPenalty || 0;
    skill.growthRate = data.growthRate || 1.0;
    return skill;
  }
}

// 技能管理器
class SkillManager {
  constructor() {
    this.skills = {};
    this.skillPoints = 0;  // 可用技能点
    
    // 初始化7种技能
    for (const type of Object.values(SKILL_TYPES)) {
      this.skills[type] = new Skill(type, 10);
    }
  }

  // 获取指定类型技能
  getSkill(type) {
    return this.skills[type];
  }

  // 获取所有技能
  getAllSkills() {
    return Object.values(this.skills);
  }

  // 获取技能点
  getSkillPoints() {
    return this.skillPoints;
  }

  // 使用技能点升级
  upgradeSkill(type) {
    const skill = this.skills[type];
    if (!skill) return { success: false, message: '无效技能类型' };
    
    if (this.skillPoints <= 0) return { success: false, message: '没有可用技能点' };
    
    const nextLevel = skill.getLevel().level + 1;
    if (nextLevel >= SKILL_LEVELS.length) return { success: false, message: '已满级' };
    
    const targetScore = getScoreForLevel(nextLevel);
    const neededScore = targetScore - skill.baseScore;
    
    // 消耗1技能点，直接提升到下一等级
    this.skillPoints--;
    skill.baseScore = targetScore;
    
    return { 
      success: true, 
      message: `${SKILL_INFO[type].name}升级到${SKILL_LEVELS[nextLevel].name}！` 
    };
  }

  // 计算总可用技能点（已获得 - 已使用）
  calculateTotalSkillPoints() {
    let usedPoints = 0;
    for (const skill of Object.values(this.skills)) {
      // 计算从10分到当前等级使用的点数
      const level = skill.getLevel().level;
      usedPoints += level; // 每升一级用1点
    }
    return this.skillPoints + usedPoints;
  }

  // 更新所有加成
  updateBonuses(config) {
    // 更新赞助加成
    if (config.sponsorBonus) {
      for (const [type, bonus] of Object.entries(config.sponsorBonus)) {
        if (this.skills[type]) {
          this.skills[type].sponsorBonus = bonus;
        }
      }
    }

    // 更新装备加成
    if (config.equipmentBonus) {
      for (const [type, bonus] of Object.entries(config.equipmentBonus)) {
        if (this.skills[type]) {
          this.skills[type].equipmentBonus = bonus;
        }
      }
    }

    // 更新教练加成
    if (config.coachBonus) {
      for (const [type, bonus] of Object.entries(config.coachBonus)) {
        if (this.skills[type]) {
          this.skills[type].coachBonus = bonus;
        }
      }
    }

    // 更新年龄加成
    if (config.ageBonus !== undefined) {
      for (const skill of Object.values(this.skills)) {
        skill.ageBonus = config.ageBonus;
      }
    }

    // 更新状态加成
    if (config.form !== undefined) {
      for (const skill of Object.values(this.skills)) {
        skill.updateFormBonus(config.form);
      }
    }

    // 更新伤病惩罚
    if (config.injuryPenalty !== undefined) {
      for (const skill of Object.values(this.skills)) {
        skill.setInjuryPenalty(config.injuryPenalty);
      }
    }
  }

  // 计算综合能力
  calculateOverall() {
    let total = 0;
    for (const skill of Object.values(this.skills)) {
      total += skill.getFinalScore();
    }
    return Math.floor(total / 7);
  }

  // 序列化
  toJSON() {
    return {
      skills: Object.fromEntries(
        Object.entries(this.skills).map(([k, v]) => [k, v.toJSON()])
      ),
      skillPoints: this.skillPoints
    };
  }

  // 反序列化
  static fromJSON(data) {
    const manager = new SkillManager();
    if (data.skills) {
      for (const [type, skillData] of Object.entries(data.skills)) {
        manager.skills[type] = Skill.fromJSON(skillData);
      }
    }
    manager.skillPoints = data.skillPoints || 0;
    return manager;
  }
}

module.exports = {
  SKILL_TYPES,
  SKILL_INFO,
  SKILL_LEVELS,
  Skill,
  SkillManager,
  getSkillLevel,
  getScoreForLevel,
  calculateSkillPoints,
  LEVEL_COLORS
};
