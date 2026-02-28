/**
 * 教练团队场景
 */
const { Scene, GAME_STATE, CONFIG } = require('./scene.js');
const { Coach, CoachPayroll, COACH_TYPES } = require('../models/coach.js');

class CoachScene extends Scene {
  constructor(game) {
    super(game);
    this.availableCoaches = [];
    this.view = 'my_team'; // my_team, hiring

    this.initUI();
  }

  initUI() {
    const canvasWidth = this.game.canvasWidth || 375;

    // 返回按钮
    this.addButton(canvasWidth * 0.03, canvasWidth * 0.03, canvasWidth * 0.12, canvasWidth * 0.12, '←', () => {
      this.game.changeScene(GAME_STATE.HOME);
    }, {
      bgColor: 'transparent',
      textColor: '#64ffda',
      borderColor: '#64ffda',
      fontSize: canvasWidth * 0.06
    });
  }

  enter() {
    const player = this.game.player;
    if (!player) {
      this.game.changeScene(GAME_STATE.MENU);
      return;
    }

    // 获取可用教练
    this.availableCoaches = Coach.getAvailableCoaches(player.ranking);
    
    // 重新初始化按钮
    this.buttons = [];
    this.initUI();
    
    const canvasWidth = this.game.canvasWidth || 375;
    const canvasHeight = this.game.canvasHeight || 667;
    
    // 根据当前视图添加按钮
    if (this.view === 'my_team') {
      // 雇佣教练按钮
      if (player.coaches && player.coaches.length < 5) {
        this.addButton(canvasWidth * 0.3, canvasHeight * 0.88, canvasWidth * 0.4, canvasHeight * 0.07, '雇佣教练', () => {
          this.view = 'hiring';
          this.enter();
        }, {
          bgColor: '#805ad5',
          textColor: '#ffffff',
          fontSize: canvasWidth * 0.04
        });
      }
    } else {
      // 返回团队按钮
      this.addButton(canvasWidth * 0.3, canvasHeight * 0.88, canvasWidth * 0.4, canvasHeight * 0.07, '返回团队', () => {
        this.view = 'my_team';
        this.enter();
      }, {
        bgColor: '#4a5568',
        textColor: '#ffffff',
        fontSize: canvasWidth * 0.04
      });
    }
  }

  // 雇佣教练
  hireCoach(coachData) {
    const player = this.game.player;
    
    // 检查是否已雇佣
    if (player.coaches && player.coaches.find(c => c.type === coachData.type)) {
      this.game.showToast('已雇佣同类型教练');
      return;
    }
    
    // 检查资金
    if (player.money < coachData.signingBonus) {
      this.game.showToast('资金不足');
      return;
    }
    
    // 雇佣教练
    const result = player.hireCoach(coachData);
    if (result.success) {
      this.game.showToast(result.message);
      this.game.saveGame();
      this.view = 'my_team';
      this.enter();
    } else {
      this.game.showToast(result.message);
    }
  }

  // 解雇教练
  fireCoach(coachType) {
    const player = this.game.player;
    const result = player.fireCoach(coachType);
    if (result.success) {
      this.game.showToast(result.message);
      this.game.saveGame();
      this.enter();
    }
  }

  render(ctx) {
    const player = this.game.player;
    if (!player) return;

    const canvasWidth = this.game.canvasWidth || 375;
    const canvasHeight = this.game.canvasHeight || 667;

    // 背景
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    if (this.view === 'my_team') {
      this.renderMyTeam(ctx, player);
    } else {
      this.renderHiring(ctx, player);
    }

    // 绘制按钮
    for (const button of this.buttons) {
      button.render(ctx);
    }
  }

  // 渲染我的团队
  renderMyTeam(ctx, player) {
    const canvasWidth = this.game.canvasWidth || 375;
    const canvasHeight = this.game.canvasHeight || 667;

    // 标题
    ctx.fillStyle = '#64ffda';
    ctx.font = `bold ${canvasWidth * 0.05}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('👨‍🏫 教练团队', canvasWidth / 2, canvasHeight * 0.08);

    // 玩家信息
    ctx.fillStyle = '#8892b0';
    ctx.font = `${canvasWidth * 0.035}px sans-serif`;
    ctx.fillText(`排名: #${player.ranking} | 资金: $${player.money}`, canvasWidth / 2, canvasHeight * 0.13);

    // 教练加成总览
    const bonus = player.getCoachBonus();
    ctx.fillStyle = '#ffd700';
    ctx.font = `${canvasWidth * 0.03}px sans-serif`;
    let bonusText = '团队加成: ';
    if (bonus.trainingEffect > 0) bonusText += `训练+${Math.round(bonus.trainingEffect * 100)}% `;
    if (bonus.matchWinRate > 0) bonusText += `胜率+${bonus.matchWinRate}% `;
    if (bonus.injuryResistance > 0) bonusText += `伤病-${Math.round(bonus.injuryResistance * 100)}% `;
    if (bonus.energyRecovery > 0) bonusText += `恢复+${Math.round(bonus.energyRecovery * 100)}% `;
    if (bonus.sponsorIncome > 0) bonusText += `赞助+${Math.round(bonus.sponsorIncome * 100)}% `;
    ctx.fillText(bonusText, canvasWidth / 2, canvasHeight * 0.18);

    // 当前教练列表
    const startY = canvasHeight * 0.25;
    const cardHeight = canvasHeight * 0.14;
    const cardSpacing = canvasHeight * 0.02;

    if (!player.coaches || player.coaches.length === 0) {
      ctx.fillStyle = '#8892b0';
      ctx.font = `${canvasWidth * 0.04}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('暂无雇佣教练', canvasWidth / 2, startY + cardHeight);
      ctx.fillText('点击下方按钮雇佣教练', canvasWidth / 2, startY + cardHeight * 1.5);
      return;
    }

    // 计算每月总支出
    let totalMonthly = 0;
    for (const coach of player.coaches) {
      totalMonthly += coach.monthlySalary || 0;
    }
    ctx.fillStyle = '#fc8181';
    ctx.font = `${canvasWidth * 0.035}px sans-serif`;
    ctx.fillText(`每月支出: $${totalMonthly}`, canvasWidth / 2, canvasHeight * 0.22);

    for (let i = 0; i < player.coaches.length; i++) {
      const coach = player.coaches[i];
      const y = startY + i * (cardHeight + cardSpacing);
      this.drawCoachCard(ctx, coach, y, true);
    }
  }

  // 渲染雇佣界面
  renderHiring(ctx, player) {
    const canvasWidth = this.game.canvasWidth || 375;
    const canvasHeight = this.game.canvasHeight || 667;

    // 标题
    ctx.fillStyle = '#64ffda';
    ctx.font = `bold ${canvasWidth * 0.05}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('👨‍🏫 雇佣教练', canvasWidth / 2, canvasHeight * 0.08);

    // 提示
    ctx.fillStyle = '#8892b0';
    ctx.font = `${canvasWidth * 0.035}px sans-serif`;
    ctx.fillText(`可用资金: $${player.money}`, canvasWidth / 2, canvasHeight * 0.13);

    // 已有的教练类型
    const hiredTypes = player.coaches ? player.coaches.map(c => c.type) : [];

    // 教练列表
    const startY = canvasHeight * 0.18;
    const cardHeight = canvasHeight * 0.18;
    const cardSpacing = canvasHeight * 0.02;

    for (let i = 0; i < this.availableCoaches.length; i++) {
      const coach = this.availableCoaches[i];
      const y = startY + i * (cardHeight + cardSpacing);
      
      // 检查是否已雇佣
      const isHired = hiredTypes.includes(coach.type);
      this.drawCoachCard(ctx, coach, y, false, isHired);
    }
  }

  // 绘制教练卡片
  drawCoachCard(ctx, coach, y, isMyTeam, isHired = false) {
    const canvasWidth = this.game.canvasWidth || 375;
    const canvasHeight = this.game.canvasHeight || 667;

    const cardX = canvasWidth * 0.05;
    const cardWidth = canvasWidth * 0.9;
    const cardHeight = canvasHeight * 0.14;

    // 卡片背景
    const bgColor = isHired ? 'rgba(128, 90, 213, 0.3)' : '#1a1a2e';
    const borderColor = isHired ? '#805ad5' : 'rgba(100, 255, 218, 0.15)';
    this.drawRoundRect(ctx, cardX, y, cardWidth, cardHeight, 15, bgColor, borderColor);

    // 教练名称
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${canvasWidth * 0.04}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(coach.name, cardX + canvasWidth * 0.03, y + cardHeight * 0.25);

    // 教练类型
    const typeColors = {
      'technique': '#4299e1',
      'fitness': '#48bb78',
      'mental': '#a855f7',
      'serve': '#ed8936',
      'volley': '#f56565',
      'physio': '#38b2ac',
      'agent': '#ecc94b'
    };
    ctx.fillStyle = typeColors[coach.type] || '#8892b0';
    ctx.font = `${canvasWidth * 0.03}px sans-serif`;
    ctx.fillText(COACH_TYPES[coach.type]?.name || coach.type, cardX + canvasWidth * 0.03, y + cardHeight * 0.45);

    // 效果
    ctx.fillStyle = '#68d391';
    ctx.font = `${canvasWidth * 0.028}px sans-serif`;
    ctx.fillText(coach.effectText, cardX + canvasWidth * 0.03, y + cardHeight * 0.65);

    if (isMyTeam) {
      // 合同信息
      ctx.fillStyle = '#8892b0';
      ctx.font = `${canvasWidth * 0.028}px sans-serif`;
      const months = coach.contractMonths || 0;
      ctx.fillText(`合同: ${months}月 | 月薪: $${coach.monthlySalary}`, cardX + canvasWidth * 0.35, y + cardHeight * 0.45);
      
      // 解雇按钮区域
      const btnX = cardX + cardWidth * 0.75;
      const btnY = y + cardHeight * 0.15;
      const btnW = cardWidth * 0.22;
      const btnH = cardHeight * 0.35;
      
      // 绘制解雇按钮
      this.drawRoundRect(ctx, btnX, btnY, btnW, btnH, 10, '#fc8181', '#fc8181');
      ctx.fillStyle = '#ffffff';
      ctx.font = `${canvasWidth * 0.03}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('解雇', btnX + btnW / 2, btnY + btnH / 2 + 5);
      
      // 添加点击区域
      const btnIndex = this.buttons.length;
      const btn = this.addButton(btnX, btnY, btnW, btnH, '', () => {
        this.fireCoach(coach.type);
      }, { bgColor: 'transparent', textColor: 'transparent' });
    } else if (!isHired) {
      // 雇佣信息
      ctx.fillStyle = '#ffd700';
      ctx.font = `${canvasWidth * 0.028}px sans-serif`;
      ctx.fillText(`签约费: $${coach.signingBonus} | 月薪: $${coach.monthlySalary}`, cardX + canvasWidth * 0.35, y + cardHeight * 0.45);
      
      // 雇佣按钮
      const btnX = cardX + cardWidth * 0.72;
      const btnY = y + cardHeight * 0.15;
      const btnW = cardWidth * 0.25;
      const btnH = cardHeight * 0.4;
      
      // 绘制雇佣按钮
      this.drawRoundRect(ctx, btnX, btnY, btnW, btnH, 10, '#805ad5', '#805ad5');
      ctx.fillStyle = '#ffffff';
      ctx.font = `${canvasWidth * 0.035}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('雇佣', btnX + btnW / 2, btnY + btnH / 2 + 5);
      
      // 添加点击区域
      const btn = this.addButton(btnX, btnY, btnW, btnH, '', () => {
        this.hireCoach(coach);
      }, { bgColor: 'transparent', textColor: 'transparent' });
    } else {
      // 已雇佣提示
      ctx.fillStyle = '#805ad5';
      ctx.font = canvasWidth * 0.035 + 'px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('已雇佣', cardX + cardWidth * 0.95, y + cardHeight * 0.5);
    }
  }

  handleTouch(x, y, type) {
    if (type === 'touchstart') {
      for (const button of this.buttons) {
        if (button.contains(x, y)) {
          button.pressed = true;
          break;
        }
      }
    } else if (type === 'touchend') {
      for (const button of this.buttons) {
        if (button.contains(x, y) && button.pressed) {
          button.pressed = false;
          button.onClick();
          break;
        }
        button.pressed = false;
      }
    }
  }
}

module.exports = CoachScene;
