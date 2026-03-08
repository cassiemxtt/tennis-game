/**
 * 教练团队场景
 */
const { Scene, GAME_STATE, CONFIG } = require('./scene.js');
const { Coach, CoachPayroll, COACH_TYPES, COACH_LEVELS } = require('../models/coach.js');

class CoachScene extends Scene {
  constructor(game) {
    super(game);
    this.availableCoaches = [];
    this.view = 'my_team';
    
    // 滚动相关
    this.scrollOffset = 0;
    this.maxScroll = 0;
    
    // 触摸相关 - 用于区分滑动和点击
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchStartTime = 0;
    this.touchMoved = false;
    this.scrollThreshold = 10;

    this.initUI();
  }

  initUI() {
    const canvasWidth = this.game.canvasWidth || 375;

    this.addButton(canvasWidth * 0.03, canvasWidth * 0.03, canvasWidth * 0.12, canvasWidth * 0.12, '←', function() {
      this.game.changeScene(GAME_STATE.HOME);
    }.bind(this), {
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

    const { AVAILABLE_COACHES } = require('../models/coach.js');
    this.availableCoaches = AVAILABLE_COACHES.map(function(coach) { return new Coach(coach); });
    
    this.buttons = [];
    this.initUI();
    
    const canvasWidth = this.game.canvasWidth || 375;
    const canvasHeight = this.game.canvasHeight || 667;
    
    if (this.view === 'my_team') {
      if (player.coaches && player.coaches.length < 5) {
        this.addButton(canvasWidth * 0.3, canvasHeight * 0.88, canvasWidth * 0.4, canvasHeight * 0.07, '雇佣教练', function() {
          this.view = 'hiring';
          this.enter();
        }.bind(this), {
          bgColor: '#805ad5',
          textColor: '#ffffff',
          fontSize: canvasWidth * 0.04
        });
      }
    } else {
      this.addButton(canvasWidth * 0.3, canvasHeight * 0.88, canvasWidth * 0.4, canvasHeight * 0.07, '返回团队', function() {
        this.view = 'my_team';
        this.enter();
      }.bind(this), {
        bgColor: '#4a5568',
        textColor: '#ffffff',
        fontSize: canvasWidth * 0.04
      });
    }
    
    this.scrollOffset = 0;
    this.calculateMaxScroll();
  }
  
  getCanvasSize() {
    return {
      width: this.game.canvasWidth || 375,
      height: this.game.canvasHeight || 667
    };
  }
  
  calculateMaxScroll() {
    const { width, height } = this.getCanvasSize();
    const cardHeight = height * 0.18;
    const cardSpacing = height * 0.02;
    const startY = height * 0.18;
    const totalHeight = this.availableCoaches.length * (cardHeight + cardSpacing);
    const panelHeight = height * 0.75;
    this.maxScroll = Math.max(0, totalHeight - panelHeight + startY);
  }
  
  handleScroll(deltaY) {
    this.scrollOffset -= deltaY;
    if (this.scrollOffset < 0) this.scrollOffset = 0;
    if (this.scrollOffset > this.maxScroll) this.scrollOffset = this.maxScroll;
  }

  hireCoach(coachData) {
    const player = this.game.player;
    
    const minRanking = coachData.requirements ? coachData.requirements.minRanking : undefined;
    if (minRanking && player.ranking > minRanking) {
      this.game.showToast('排名需达到#' + minRanking + '才能雇佣');
      return;
    }
    
    if (player.coaches && player.coaches.find(function(c) { return c.type === coachData.type; })) {
      this.game.showToast('已雇佣同类型教练');
      return;
    }
    
    if (player.money < coachData.signingBonus) {
      this.game.showToast('资金不足');
      return;
    }
    
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

    const { width, height } = this.getCanvasSize();

    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, width, height);

    if (this.view === 'my_team') {
      this.renderMyTeam(ctx, player);
    } else {
      this.renderHiring(ctx, player);
    }

    for (var i = 0; i < this.buttons.length; i++) {
      this.buttons[i].render(ctx);
    }
  }

  getFontString(size, weight) {
    const w = weight || 'normal';
    return w + ' ' + size + 'px sans-serif';
  }

  // 渲染我的团队
  renderMyTeam(ctx, player) {
    const { width, height } = this.getCanvasSize();

    ctx.fillStyle = '#64ffda';
    ctx.font = this.getFontString(width * 0.05, 'bold');
    ctx.textAlign = 'center';
    ctx.fillText('教练团队', width / 2, height * 0.08);

    ctx.fillStyle = '#8892b0';
    ctx.font = this.getFontString(width * 0.035);
    ctx.fillText('排名: #' + player.ranking + ' | 资金: $' + player.money, width / 2, height * 0.13);

    const bonus = player.getCoachBonus();
    ctx.fillStyle = '#ffd700';
    ctx.font = this.getFontString(width * 0.03);
    var bonusText = '团队加成: ';
    if (bonus.trainingEffect > 0) bonusText += '训练+' + Math.round(bonus.trainingEffect * 100) + '% ';
    if (bonus.matchWinRate > 0) bonusText += '胜率+' + bonus.matchWinRate + '% ';
    if (bonus.injuryResistance > 0) bonusText += '伤病-' + Math.round(bonus.injuryResistance * 100) + '% ';
    if (bonus.energyRecovery > 0) bonusText += '恢复+' + Math.round(bonus.energyRecovery * 100) + '% ';
    if (bonus.sponsorIncome > 0) bonusText += '赞助+' + Math.round(bonus.sponsorIncome * 100) + '% ';
    ctx.fillText(bonusText, width / 2, height * 0.18);

    const startY = height * 0.25;
    const cardHeight = height * 0.14;
    const cardSpacing = height * 0.02;
    const cardWidth = width * 0.9;
    const cardX = width * 0.05;

    if (!player.coaches || player.coaches.length === 0) {
      ctx.fillStyle = '#8892b0';
      ctx.font = this.getFontString(width * 0.04);
      ctx.textAlign = 'center';
      ctx.fillText('暂无雇佣教练', width / 2, startY + cardHeight);
      ctx.fillText('点击下方按钮雇佣教练', width / 2, startY + cardHeight * 1.5);
      return;
    }

    var totalMonthly = 0;
    for (var i = 0; i < player.coaches.length; i++) {
      totalMonthly += player.coaches[i].monthlySalary || 0;
    }
    ctx.fillStyle = '#fc8181';
    ctx.font = this.getFontString(width * 0.035);
    ctx.fillText('每月支出: $' + totalMonthly, width / 2, height * 0.22);

    for (var i = 0; i < player.coaches.length; i++) {
      var coach = player.coaches[i];
      var y = startY + i * (cardHeight + cardSpacing);
      this.drawCoachCard(ctx, coach, y, cardX, cardWidth, cardHeight, true, player);
    }
  }

  // 渲染雇佣界面
  renderHiring(ctx, player) {
    const { width, height } = this.getCanvasSize();

    ctx.fillStyle = '#64ffda';
    ctx.font = this.getFontString(width * 0.05, 'bold');
    ctx.textAlign = 'center';
    ctx.fillText('雇佣教练', width / 2, height * 0.08);

    ctx.fillStyle = '#8892b0';
    ctx.font = this.getFontString(width * 0.035);
    ctx.fillText('可用资金: $' + player.money, width / 2, height * 0.13);

    // 检查已雇佣的教练ID列表
    var hiredIds = player.coaches ? player.coaches.map(function(c) { return c.id; }) : [];

    var startY = height * 0.18;
    var cardHeight = height * 0.18;
    var cardSpacing = height * 0.02;
    var cardWidth = width * 0.9;
    var cardX = width * 0.05;

    // 应用滚动偏移
    ctx.save();
    ctx.translate(0, -this.scrollOffset);

    for (var i = 0; i < this.availableCoaches.length; i++) {
      var coach = this.availableCoaches[i];
      var y = startY + i * (cardHeight + cardSpacing);
      // 检查这个具体的教练ID是否已被雇佣
      var isHired = hiredIds.indexOf(coach.id) !== -1;
      this.drawCoachCardSimple(ctx, coach, y, cardX, cardWidth, cardHeight, isHired, player);
    }

    ctx.restore();

    // 绘制滚动条
    if (this.maxScroll > 0) {
      var scrollBarHeight = Math.min(height * 0.1, height * 0.15);
      var scrollRatio = Math.min(1, Math.max(0, this.scrollOffset / this.maxScroll));
      var scrollBarY = startY + scrollRatio * (height * 0.7 - scrollBarHeight);
      
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(cardX + cardWidth + 5, scrollBarY, 3, scrollBarHeight);
    }
  }
  
  // 绘制教练卡片（雇佣界面用）
  drawCoachCardSimple(ctx, coach, y, cardX, cardWidth, cardHeight, isHired, player) {
    const { width, height } = this.getCanvasSize();
    
    var minRanking = coach.requirements ? coach.requirements.minRanking : undefined;
    var isLocked = minRanking && player.ranking > minRanking;

    // 卡片背景
    var bgColor = isHired ? 'rgba(128, 90, 213, 0.3)' : '#1a1a2e';
    var borderColor = isHired ? '#805ad5' : 'rgba(100, 255, 218, 0.15)';
    this.drawRoundRect(ctx, cardX, y, cardWidth, cardHeight, 15, bgColor, borderColor);

    // 教练名称
    ctx.fillStyle = '#ffffff';
    ctx.font = this.getFontString(width * 0.04, 'bold');
    ctx.textAlign = 'left';
    ctx.fillText(coach.name, cardX + width * 0.03, y + cardHeight * 0.22);

    // 等级
    var levelColors = { 1: '#718096', 2: '#48bb78', 3: '#4299e1', 4: '#9f7aea', 5: '#ed8936' };
    ctx.fillStyle = levelColors[coach.level] || '#718096';
    ctx.font = this.getFontString(width * 0.025, 'bold');
    var levelName = coach.getLevelName ? coach.getLevelName() : (COACH_LEVELS[coach.level] ? COACH_LEVELS[coach.level].name : '初级');
    ctx.fillText('[' + levelName + ']', cardX + width * 0.25, y + cardHeight * 0.22);

    // 教练类型
    var typeColors = { 'technique': '#4299e1', 'fitness': '#48bb78', 'mental': '#a855f7', 'serve': '#ed8936', 'volley': '#f56565', 'baseline': '#38b2ac', 'slice': '#ed64a6', 'physio': '#38b2ac', 'agent': '#ecc94b' };
    ctx.fillStyle = typeColors[coach.type] || '#8892b0';
    ctx.font = this.getFontString(width * 0.028);
    var typeName = COACH_TYPES[coach.type] ? COACH_TYPES[coach.type].name : coach.type;
    ctx.fillText(typeName, cardX + width * 0.03, y + cardHeight * 0.42);

    // 效果
    var effectDesc = coach.getEffectDescription ? coach.getEffectDescription() : coach.effectText;
    ctx.fillStyle = '#68d391';
    ctx.font = this.getFontString(width * 0.026);
    ctx.fillText(effectDesc, cardX + width * 0.03, y + cardHeight * 0.62);
    
    // 锁定提示
    if (minRanking && player.ranking > minRanking) {
      ctx.fillStyle = '#fc8181';
      ctx.font = this.getFontString(width * 0.024);
      ctx.fillText('[锁定] 需排名#' + minRanking, cardX + width * 0.45, y + cardHeight * 0.42);
    }

    if (!isHired) {
      // 价格
      ctx.fillStyle = '#ffd700';
      ctx.font = this.getFontString(width * 0.026);
      ctx.fillText('签约费: $' + coach.signingBonus + ' | 月薪: $' + coach.monthlySalary, cardX + width * 0.03, y + cardHeight * 0.80);
      
      // 雇佣按钮
      var btnX = cardX + cardWidth * 0.72;
      var btnY = y + cardHeight * 0.10;
      var btnW = cardWidth * 0.25;
      var btnH = cardHeight * 0.45;
      
      // 按钮文字
      ctx.font = this.getFontString(width * 0.035);
      ctx.textAlign = 'center';
      if (isLocked) {
        ctx.fillStyle = '#4a5568';
        ctx.fillText('锁定', btnX + btnW / 2, btnY + btnH / 2 + 5);
      } else {
        ctx.fillStyle = '#805ad5';
        ctx.fillText('雇佣', btnX + btnW / 2, btnY + btnH / 2 + 5);
      }
    } else {
      ctx.fillStyle = '#805ad5';
      ctx.font = this.getFontString(width * 0.03);
      ctx.textAlign = 'right';
      ctx.fillText('已雇佣', cardX + cardWidth * 0.95, y + cardHeight * 0.5);
    }
  }

  // 绘制教练卡片（我的团队用）
  drawCoachCard(ctx, coach, y, cardX, cardWidth, cardHeight, isMyTeam, player) {
    const { width, height } = this.getCanvasSize();

    var bgColor = '#1a1a2e';
    var borderColor = 'rgba(100, 255, 218, 0.15)';
    this.drawRoundRect(ctx, cardX, y, cardWidth, cardHeight, 15, bgColor, borderColor);

    // 教练名称
    ctx.fillStyle = '#ffffff';
    ctx.font = this.getFontString(width * 0.04, 'bold');
    ctx.textAlign = 'left';
    ctx.fillText(coach.name, cardX + width * 0.03, y + cardHeight * 0.22);

    // 等级
    var levelColors = { 1: '#718096', 2: '#48bb78', 3: '#4299e1', 4: '#9f7aea', 5: '#ed8936' };
    ctx.fillStyle = levelColors[coach.level] || '#718096';
    ctx.font = this.getFontString(width * 0.025, 'bold');
    var levelName = coach.getLevelName ? coach.getLevelName() : (COACH_LEVELS[coach.level] ? COACH_LEVELS[coach.level].name : '初级');
    ctx.fillText('[' + levelName + ']', cardX + width * 0.25, y + cardHeight * 0.22);

    // 类型
    var typeColors = { 'technique': '#4299e1', 'fitness': '#48bb78', 'mental': '#a855f7', 'serve': '#ed8936', 'volley': '#f56565', 'baseline': '#38b2ac', 'slice': '#ed64a6', 'physio': '#38b2ac', 'agent': '#ecc94b' };
    ctx.fillStyle = typeColors[coach.type] || '#8892b0';
    ctx.font = this.getFontString(width * 0.028);
    var typeName = COACH_TYPES[coach.type] ? COACH_TYPES[coach.type].name : coach.type;
    ctx.fillText(typeName, cardX + width * 0.03, y + cardHeight * 0.42);

    // 效果
    var effectDesc = coach.getEffectDescription ? coach.getEffectDescription() : coach.effectText;
    ctx.fillStyle = '#68d391';
    ctx.font = this.getFontString(width * 0.026);
    ctx.fillText(effectDesc, cardX + width * 0.03, y + cardHeight * 0.62);

    if (isMyTeam) {
      // 合同信息
      ctx.fillStyle = '#8892b0';
      ctx.font = this.getFontString(width * 0.026);
      var months = coach.contractMonths || 0;
      ctx.fillText('合同: ' + months + '月 | 月薪: $' + coach.monthlySalary, cardX + width * 0.35, y + cardHeight * 0.42);
      
      // 解雇文字
      ctx.fillStyle = '#fc8181';
      ctx.font = this.getFontString(width * 0.03);
      ctx.textAlign = 'center';
      var btnX = cardX + cardWidth * 0.75;
      var btnY = y + cardHeight * 0.15;
      var btnW = cardWidth * 0.22;
      var btnH = cardHeight * 0.35;
      ctx.fillText('解雇', btnX + btnW / 2, btnY + btnH / 2 + 5);
    }
  }

  // 触摸处理
  handleTouch(x, y, type) {
    if (type === 'touchstart') {
      this.touchStartX = x;
      this.touchStartY = y;
      this.touchStartTime = Date.now();
      this.touchMoved = false;
    } else if (type === 'touchmove') {
      var dx = x - this.touchStartX;
      var dy = y - this.touchStartY;
      var distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > this.scrollThreshold) {
        this.touchMoved = true;
        var deltaY = y - this.touchStartY;
        this.handleScroll(deltaY);
        this.touchStartY = y;
      }
    } else if (type === 'touchend') {
      var touchDuration = Date.now() - this.touchStartTime;
      if (!this.touchMoved && touchDuration < 300) {
        this.handleTap(x, y);
      }
    }
    
    // 处理按钮点击
    for (var i = 0; i < this.buttons.length; i++) {
      if (this.buttons[i].contains(x, y)) {
        if (type === 'touchstart') {
          this.buttons[i].pressed = true;
        } else if (type === 'touchend' && this.buttons[i].pressed) {
          this.buttons[i].pressed = false;
          this.buttons[i].onClick();
        }
        break;
      }
    }
  }

  // 处理点击
  handleTap(x, y) {
    var player = this.game.player;
    if (!player) return;

    // 检查已雇佣的教练ID列表
    var hiredIds = player.coaches ? player.coaches.map(function(c) { return c.id; }) : [];
    
    if (this.view === 'my_team') {
      // 我的团队界面 - 点击解雇
      var startY = this.getCanvasSize().height * 0.25;
      var cardHeight = this.getCanvasSize().height * 0.14;
      var cardSpacing = this.getCanvasSize().height * 0.02;
      var cardWidth = this.getCanvasSize().width * 0.9;
      var cardX = this.getCanvasSize().width * 0.05;

      if (player.coaches) {
        for (var i = 0; i < player.coaches.length; i++) {
          var coach = player.coaches[i];
          var cardY = startY + i * (cardHeight + cardSpacing);
          
          // 解雇按钮区域
          var btnX = cardX + cardWidth * 0.75;
          var btnY = cardY + cardHeight * 0.15;
          var btnW = cardWidth * 0.22;
          var btnH = cardHeight * 0.35;
          
          if (x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH) {
            this.fireCoach(coach.type);
            return;
          }
        }
      }
    } else {
      // 雇佣界面 - 点击雇佣
      var _a = this.getCanvasSize(), width = _a.width, height = _a.height;
      var startY = height * 0.18;
      var cardHeight = height * 0.18;
      var cardSpacing = height * 0.02;
      var cardWidth = width * 0.9;
      var cardX = width * 0.05;

      // 调整y坐标考虑滚动
      var adjustedY = y + this.scrollOffset;

      // 检查点击范围
      if (x < cardX || x > cardX + cardWidth) return;

      for (var i = 0; i < this.availableCoaches.length; i++) {
        var coach = this.availableCoaches[i];
        var cardY = startY + i * (cardHeight + cardSpacing);
        
        if (adjustedY >= cardY && adjustedY <= cardY + cardHeight) {
          // 检查这个具体的教练ID是否已被雇佣
          var isHired = hiredIds.indexOf(coach.id) !== -1;
          var minRanking = coach.requirements ? coach.requirements.minRanking : undefined;
          var isLocked = minRanking && player.ranking > minRanking;
          
          // 点击了雇佣按钮区域
          var btnX = cardX + cardWidth * 0.72;
          var btnY = cardY + cardHeight * 0.10;
          var btnW = cardWidth * 0.25;
          var btnH = cardHeight * 0.45;
          
          if (x >= btnX && x <= btnX + btnW && adjustedY >= btnY && adjustedY <= btnY + btnH) {
            if (!isHired && !isLocked) {
              this.hireCoach(coach);
            }
            return;
          }
          break;
        }
      }
    }
  }
}

module.exports = CoachScene;
