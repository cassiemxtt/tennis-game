/**
 * 雷达图组件 - 用于展示球员能力图谱
 * 绿色复古风格
 */
const { LEVEL_COLORS } = require('../models/skill.js');

// 技能显示顺序
const SKILL_ORDER = ['baseline', 'volley', 'serve', 'dropShot', 'slice', 'lob', 'smash'];

// 技能中文名称和颜色
const SKILL_CONFIG = {
  baseline: { name: '底线', color: '#9bbc0f' },
  volley: { name: '截击', color: '#8bac0f' },
  serve: { name: '发球', color: '#306230' },
  dropShot: { name: '放小球', color: '#0f380f' },
  slice: { name: '切削', color: '#63b3ed' },
  lob: { name: '月亮球', color: '#68d391' },
  smash: { name: '高压球', color: '#f6ad55' }
};

/**
 * 绘制雷达图
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {number} x - 中心X坐标
 * @param {number} y - 中心Y坐标
 * @param {number} radius - 雷达图半径
 * @param {Object} skills - 技能数据 { skillType: score }
 * @param {Object} options - 配置选项
 */
function drawRadarChart(ctx, x, y, radius, skills, options = {}) {
  const {
    maxScore = 100,
    gridLevels = 5,
    gridColor = 'rgba(255, 255, 255, 0.1)',
    gridTextColor = '#8892b0',
    playerColor = '#9bbc0f',
    opponentColor = '#ff6b6b',
    showLabels = true,
    showValues = true,
    opponentSkills = null,
    selectedSkill = null, // 当前选中的技能
    onHoverSkill = null   //  hover的技能
  } = options;

  const numPoints = SKILL_ORDER.length;
  const angleStep = (Math.PI * 2) / numPoints;
  const startAngle = -Math.PI / 2; // 从顶部开始

  // 绘制网格
  ctx.lineWidth = 1;
  ctx.strokeStyle = gridColor;
  ctx.font = `${radius * 0.15}px sans-serif`;
  ctx.fillStyle = gridTextColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let level = 1; level <= gridLevels; level++) {
    const levelRadius = (radius / gridLevels) * level;
    ctx.beginPath();
    for (let i = 0; i <= numPoints; i++) {
      const idx = i % numPoints;
      const angle = startAngle + idx * angleStep;
      const px = x + Math.cos(angle) * levelRadius;
      const py = y + Math.sin(angle) * levelRadius;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    // 绘制刻度值
    if (showValues) {
      const value = Math.round((maxScore / gridLevels) * level);
      ctx.fillStyle = gridTextColor;
      ctx.fillText(value.toString(), x + radius + 15, y);
    }
  }

  // 绘制轴线
  ctx.beginPath();
  for (let i = 0; i < numPoints; i++) {
    const angle = startAngle + i * angleStep;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    ctx.moveTo(x, y);
    ctx.lineTo(px, py);
  }
  ctx.stroke();

  // 绘制对手数据（如果有）
  if (opponentSkills) {
    ctx.beginPath();
    ctx.fillStyle = 'rgba(252, 129, 129, 0.2)';
    ctx.strokeStyle = opponentColor;
    ctx.lineWidth = 2;

    for (let i = 0; i <= numPoints; i++) {
      const idx = i % numPoints;
      const skillType = SKILL_ORDER[idx];
      const value = opponentSkills[skillType] || 0;
      const angle = startAngle + i * angleStep;
      const valueRadius = (value / maxScore) * radius;

      const px = x + Math.cos(angle) * valueRadius;
      const py = y + Math.sin(angle) * valueRadius;

      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
  }

  // 绘制玩家数据（使用渐变效果）
  ctx.beginPath();
  ctx.fillStyle = 'rgba(100, 200, 150, 0.25)';
  ctx.strokeStyle = playerColor;
  ctx.lineWidth = 2;

  for (let i = 0; i <= numPoints; i++) {
    const idx = i % numPoints;
    const skillType = SKILL_ORDER[idx];
    const value = skills[skillType] || 0;
    const angle = startAngle + i * angleStep;
    const valueRadius = (value / maxScore) * radius;

    const px = x + Math.cos(angle) * valueRadius;
    const py = y + Math.sin(angle) * valueRadius;

    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }

  ctx.fill();
  ctx.stroke();

  // 绘制各点的圆点 - 根据等级显示不同颜色
  for (let i = 0; i < numPoints; i++) {
    const skillType = SKILL_ORDER[i];
    const value = skills[skillType] || 0;
    const angle = startAngle + i * angleStep;
    const valueRadius = (value / maxScore) * radius;

    const px = x + Math.cos(angle) * valueRadius;
    const py = y + Math.sin(angle) * valueRadius;

    // 根据等级显示不同颜色
    const level = Math.floor(value / 100);
    const dotColor = LEVEL_COLORS[Math.min(level, LEVEL_COLORS.length - 1)];
    ctx.beginPath();
    ctx.fillStyle = dotColor;
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 绘制标签 - 显示技能名称和数值
  if (showLabels) {
    for (let i = 0; i < numPoints; i++) {
      const skillType = SKILL_ORDER[i];
      const config = SKILL_CONFIG[skillType];
      const angle = startAngle + i * angleStep;
      const value = skills[skillType] || 0;
      const level = Math.floor(value / 100);
      const levelName = level < 6 ? ['新手', '普通', '熟练', '精进', '专家', '大师'][level] : '大师';
      
      // 根据等级设置颜色
      const labelColor = LEVEL_COLORS[Math.min(level, LEVEL_COLORS.length - 1)];
      
      const labelRadius = radius + 30;
      const px = x + Math.cos(angle) * labelRadius;
      const py = y + Math.sin(angle) * labelRadius;

      // 判断是否选中或hover
      const isSelected = selectedSkill === skillType;
      const isHovered = onHoverSkill === skillType;
      
      if (isSelected || isHovered) {
        // 显示等级信息
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${radius * 0.14}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(`${config.name} ${value}`, px, py - radius * 0.06);
        ctx.font = `${radius * 0.12}px sans-serif`;
        ctx.fillStyle = labelColor;
        ctx.fillText(`[${levelName}]`, px, py + radius * 0.08);
      } else {
        // 显示技能名称和数值
        ctx.fillStyle = labelColor;
        ctx.font = `bold ${radius * 0.15}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(`${config.name}`, px, py - radius * 0.05);
        ctx.font = `${radius * 0.12}px sans-serif`;
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText(`${value}`, px, py + radius * 0.08);
      }
    }
  }
}

/**
 * 绘制技能卡片（包含雷达图）
 */
function drawSkillCard(ctx, x, y, width, height, skills, options = {}) {
  const {
    playerColor = '#9bbc0f',
    showLabels = true,
    showValues = true,
    maxScore = 100,
    opponentSkills = null,
    selectedSkill = null,
    onHoverSkill = null,
    onSkillTap = null
  } = options;

  // 卡片背景
  ctx.fillStyle = 'rgba(26, 26, 46, 0.9)';
  ctx.strokeStyle = 'rgba(100, 255, 218, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.fill();
  ctx.stroke();

  // 标题
  ctx.fillStyle = '#64ffda';
  ctx.font = `bold ${width * 0.05}px sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('能力图谱', x + width * 0.04, y + height * 0.08);

  // 雷达图区域
  const chartX = x + width * 0.5;
  const chartY = y + height * 0.5;
  const chartRadius = Math.min(width * 0.35, height * 0.35);

  drawRadarChart(ctx, chartX, chartY, chartRadius, skills, {
    maxScore,
    gridLevels: 5,
    playerColor,
    showLabels,
    showValues,
    opponentSkills,
    selectedSkill,
    onHoverSkill
  });
}

module.exports = {
  drawRadarChart,
  drawSkillCard,
  SKILL_ORDER,
  SKILL_CONFIG
};
