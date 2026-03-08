/**
 * 数据模型 - Talent 天赋系统
 * 玩家创建角色时随机生成的天赋
 */
const { SKILL_TYPES, SKILL_INFO } = require('./skill.js');

// 技能类型列表
const SKILL_TYPE_LIST = Object.values(SKILL_TYPES);

// 随机生成初始能力值 (1-20)
function randomBaseScore() {
  return Math.floor(Math.random() * 20) + 1;
}

// 随机生成成长性系数 (0.8-1.2)
function randomGrowthRate() {
  // 使用正态分布，使大部分值集中在中间
  let value = 0;
  for (let i = 0; i < 3; i++) {
    value += Math.random();
  }
  value = value / 3; // 0-1
  // 映射到 0.8-1.2
  return 0.8 + value * 0.4;
}

// 生成单个天赋
function generateTalent() {
  // 随机选择3个技能作为初始能力
  const numSkills = 3;
  const selectedSkills = [];
  const availableSkills = [...SKILL_TYPE_LIST];
  
  for (let i = 0; i < numSkills; i++) {
    const idx = Math.floor(Math.random() * availableSkills.length);
    selectedSkills.push(availableSkills.splice(idx, 1)[0]);
  }
  
  // 为每个技能生成初始值和成长性
  const skills = {};
  const growthRates = {};
  
  for (const skillType of selectedSkills) {
    skills[skillType] = randomBaseScore();
    growthRates[skillType] = randomGrowthRate();
  }
  
  return {
    skills: skills,
    growthRates: growthRates
  };
}

// 生成3个天赋供选择
function generateTalents(count = 3) {
  const talents = [];
  for (let i = 0; i < count; i++) {
    talents.push(generateTalent());
  }
  return talents;
}

// 生成成长性描述
function generateGrowthDescription(talent) {
  const growthRates = talent.growthRates;
  const skills = Object.keys(growthRates);
  
  if (skills.length === 0) return '';
  
  // 找出成长性最高和最低的技能
  let maxSkill = skills[0];
  let minSkill = skills[0];
  
  for (const skill of skills) {
    if (growthRates[skill] > growthRates[maxSkill]) {
      maxSkill = skill;
    }
    if (growthRates[skill] < growthRates[minSkill]) {
      minSkill = skill;
    }
  }
  
  const skillNames = {};
  for (const type of SKILL_TYPE_LIST) {
    skillNames[type] = SKILL_INFO[type].name;
  }
  
  const maxRate = growthRates[maxSkill];
  const minRate = growthRates[minSkill];
  
  let description = '';
  
  // 描述最高成长性
  if (maxRate >= 1.15) {
    description += `在${skillNames[maxSkill]}方面似乎很有天赋`;
  } else if (maxRate >= 1.0) {
    description += `${skillNames[maxSkill]}方面成长不错`;
  } else {
    description += `${skillNames[maxSkill]}方面有一定潜力`;
  }
  
  // 连接词
  description += '，但';
  
  // 描述最低成长性
  if (minRate <= 0.85) {
    description += `在${skillNames[minSkill]}方面需要更多努力`;
  } else if (minRate <= 0.95) {
    description += `${skillNames[minSkill]}方面进步较慢`;
  } else {
    description += `${skillNames[minSkill]}方面成长一般`;
  }
  
  return description;
}

// 获取天赋的初始能力显示文本（只显示有值的技能）
function getTalentDisplayText(talent) {
  const lines = [];
  const skills = talent.skills;
  
  for (const [skillType, value] of Object.entries(skills)) {
    const info = SKILL_INFO[skillType];
    lines.push(`${info.icon} ${info.name}: ${value}`);
  }
  
  return lines.join('\n');
}

// 获取所有7个技能的显示文本（包含无天赋的技能）
function getAllSkillsDisplayText(talent) {
  const lines = [];
  const talentSkills = talent.skills;
  
  for (const [skillType, info] of Object.entries(SKILL_INFO)) {
    const value = talentSkills[skillType] || 0;
    if (value > 0) {
      lines.push(`${info.icon} ${info.name}: ${value}`);
    } else {
      lines.push(`${info.icon} ${info.name}: -`);
    }
  }
  
  return lines.join('\n');
}

// 应用天赋到玩家
function applyTalentToPlayer(player, talent) {
  const skills = talent.skills;
  const growthRates = talent.growthRates;
  
  // 设置每个技能的初始值和成长性
  for (const [skillType, value] of Object.entries(skills)) {
    const skill = player.skillManager.getSkill(skillType);
    if (skill) {
      skill.baseScore = value;
      skill.growthRate = growthRates[skillType] || 1.0;
    }
  }
  
  // 给予初始技能点（根据初始能力值）
  let totalPoints = 0;
  for (const value of Object.values(skills)) {
    totalPoints += Math.floor(value / 100);
  }
  player.skillPoints = totalPoints;
}

module.exports = {
  SKILL_TYPES,
  SKILL_INFO,
  generateTalent,
  generateTalents,
  generateGrowthDescription,
  getTalentDisplayText,
  getAllSkillsDisplayText,
  applyTalentToPlayer
};
