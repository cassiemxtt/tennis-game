/**
 * 生涯统计场景
 */
const { Scene, GAME_STATE, CONFIG } = require('./scene.js');
const { drawSkillCard, SKILL_ORDER, SKILL_CONFIG } = require('../shared/radarChart.js');

class StatsScene extends Scene {
  constructor(game) {
    super(game);
    this.selectedSkill = null;
    this.initUI();
  }

  // 处理触摸事件
  handleTouch(x, y, type) {
    // 先调用父类的触摸处理（处理按钮点击）
    super.handleTouch(x, y, type);
    
    if (type === 'touchstart') {
      this.handleSkillTap(x, y);
    } else if (type === 'touchend') {
      setTimeout(() => { this.selectedSkill = null; }, 1500);
    }
  }

  // 处理技能点击
  handleSkillTap(x, y) {
    const { width, height } = this.getCanvasSize();
    const cardY = height * 0.27;
    const cardHeight = height * 0.35;
    const cardX = width * 0.05;
    const chartX = cardX + width * 0.9 * 0.5;
    const chartY = cardY + cardHeight * 0.5;
    const chartRadius = Math.min(width * 0.9 * 0.35, cardHeight * 0.35);
    
    const dx = x - chartX;
    const dy = y - chartY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist <= chartRadius + 60) {
      let angle = Math.atan2(dy, dx);
      const startAngle = -Math.PI / 2;
      const numPoints = 7;
      const angleStep = (Math.PI * 2) / numPoints;
      
      let diff = angle - startAngle;
      if (diff < 0) diff += Math.PI * 2;
      let idx = Math.round(diff / angleStep) % numPoints;
      
      this.selectedSkill = SKILL_ORDER[idx];
    } else {
      this.selectedSkill = null;
    }
  }

  initUI() {
    const { width, height } = this.getCanvasSize();
    
    // 返回按钮 - 统一位置
    this.addBackButton(GAME_STATE.HOME);
    
    // 退役按钮 - 放在页面最下方
    const btnWidth = width * 0.6;
    const btnHeight = height * 0.055;
    const btnX = (width - btnWidth) / 2;
    const btnY = height * 0.92;
    
    this.addButton(btnX, btnY, btnWidth, btnHeight, '🏁 退役', () => {
      this.game.scenes.home.retire();
    }, {
      bgColor: '#e53e3e',
      textColor: '#ffffff',
      fontSize: width * 0.035
    });
  }

  render(ctx) {
    const player = this.game.player;
    if (!player) return;

    const { width, height } = this.getCanvasSize();

    // 背景 - 统一方法
    this.drawBackground(ctx);

    // 标题 - 统一方法
    this.drawTitle(ctx, '📈 生涯数据');

    // 玩家信息
    ctx.fillStyle = CONFIG.THEME.TEXT_MAIN;
    ctx.font = `bold ${width * 0.045}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(player.name, width / 2, height * 0.08);
    ctx.font = `${width * 0.035}px sans-serif`;
    ctx.fillStyle = CONFIG.THEME.TEXT_SECONDARY;
    ctx.fillText(`${player.age}岁 | 职业生涯第${player.careerYear}年`, width / 2, height * 0.12);

    // 排名信息
    this.drawCard(ctx, width * 0.05, height * 0.16, width * 0.9, height * 0.08, '🏆 排名信息');
    ctx.fillStyle = player.ranking <= 999 ? CONFIG.THEME.GOLD : CONFIG.THEME.TEXT_SECONDARY;
    ctx.font = `bold ${width * 0.04}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`当前排名: ${player.ranking <= 999 ? player.ranking : '暂无'}`, width / 2, height * 0.21);

    // 能力图谱（雷达图）
    this.drawSkillRadar(ctx, player, width, height);

    // 技能点信息
    this.drawSkillPointsInfo(ctx, player, width, height);

    // 绘制按钮 - 统一方法
    this.renderButtons(ctx);
  }

  // 绘制技能雷达图
  drawSkillRadar(ctx, player, width, height) {
    const cardY = height * 0.27;
    const cardHeight = height * 0.35;
    
    // 获取玩家技能数据
    const skills = {};
    for (const skillType of SKILL_ORDER) {
      const skill = player.skillManager.getSkill(skillType);
      if (skill) {
        skills[skillType] = skill.baseScore;
      } else {
        skills[skillType] = 0;
      }
    }

    // 绘制能力卡片
    drawSkillCard(ctx, width * 0.05, cardY, width * 0.9, cardHeight, skills, {
      playerColor: '#9bbc0f',
      showLabels: true,
      showValues: true,
      maxScore: 100,
      selectedSkill: this.selectedSkill
    });
  }

  // 绘制技能点信息
  drawSkillPointsInfo(ctx, player, width, height) {
    const startY = height * 0.66;
    
    // 综合能力
    ctx.fillStyle = CONFIG.THEME.TEXT_MAIN;
    ctx.font = `bold ${width * 0.038}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('综合能力', width * 0.05, startY);
    
    ctx.fillStyle = CONFIG.THEME.PRIMARY;
    ctx.font = `bold ${width * 0.042}px sans-serif`;
    ctx.fillText(`${player.calculateOverall()}/100`, width * 0.3, startY);
    
    // 技能点
    ctx.fillStyle = CONFIG.THEME.TEXT_MAIN;
    ctx.font = `${width * 0.035}px sans-serif`;
    ctx.fillText(`可用技能点: ${player.skillPoints}`, width * 0.55, startY);

    // 比赛记录
    const cardY = height * 0.72;
    this.drawCard(ctx, width * 0.05, cardY, width * 0.9, height * 0.1, '🎾 比赛记录');
    
    const winRate = player.getWinRate();
    ctx.textAlign = 'center';
    ctx.fillStyle = CONFIG.THEME.TEXT_MAIN;
    ctx.font = `bold ${width * 0.038}px sans-serif`;
    ctx.fillText(`${player.matchesPlayed} 场  ${player.matchesWon}胜 ${player.matchesPlayed - player.matchesWon}负  胜率 ${winRate}%`, width / 2, cardY + height * 0.07);

    // 荣誉成就
    const honorY = height * 0.86;
    this.drawCard(ctx, width * 0.05, honorY, width * 0.9, height * 0.05, '🌟 荣誉成就');
    ctx.textAlign = 'center';
    ctx.fillStyle = CONFIG.THEME.GOLD;
    ctx.font = `bold ${width * 0.035}px sans-serif`;
    ctx.fillText(`🏆 ${player.titles}冠军  🌟 ${player.grandSlams}大满贯  💰 $${player.careerEarnings}`, width / 2, honorY + height * 0.04);
  }
}

module.exports = StatsScene;
