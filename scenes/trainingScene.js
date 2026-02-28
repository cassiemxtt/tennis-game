/**
 * 训练场景
 * 使用 ctx.translate 统一处理滚动和点击坐标
 */
const { Scene, GAME_STATE, CONFIG } = require('./scene.js');
const Training = require('../models/training.js');

// 训练类型
const TRAINING_ORDER = ['1', '2', '3', '4', '5', '6', '7'];

const TRAINING_DISPLAY = {
  '1': { icon: '💪', effects: ['力量+', '发球+'], scene: 'strength_training' },
  '2': { icon: '🏃', effects: ['速度+', '接发+'], scene: 'speed_training' },
  '3': { icon: '🎯', effects: ['技术+', '正手+', '反手+'], scene: 'tech_training' },
  '4': { icon: '🔥', effects: ['耐力+'], scene: null },
  '5': { icon: '🧠', effects: ['心理+', '状态+'], scene: null },
  '6': { icon: '🏀', effects: ['网前+'], scene: null },
  '7': { icon: '⭐', effects: ['全属性+'], scene: null }
};

class TrainingScene extends Scene {
  constructor(game) {
    super(game);
    this.trainingTypes = [];
    this.scrollY = 0;
    this.maxScroll = 0;
    this.isDragging = false;
    this.lastY = 0;
    this.lastTime = 0;
    this.velocity = 0;
    this.touchStartY = 0;
    this.touchStartX = 0;
    this.hasMoved = false;
    this.initUI();
  }

  // 惯性滚动更新
  update(deltaTime) {
    if (!this.isDragging && Math.abs(this.velocity) > 0.5) {
      // 应用速度
      this.scrollY += this.velocity;
      
      // 摩擦衰减
      this.velocity *= 0.92;
      
      // 边界限制
      if (this.scrollY < 0) {
        this.scrollY = 0;
        this.velocity = 0;
      } else if (this.scrollY > this.maxScroll) {
        this.scrollY = this.maxScroll;
        this.velocity = 0;
      }
    }
  }

  initUI() {
    this.buttons = [];
    this.addBackButton(GAME_STATE.HOME);

    this.trainingTypes = [];
    for (const id of TRAINING_ORDER) {
      const training = Training.TRAINING_TYPES[id];
      const display = TRAINING_DISPLAY[id];
      if (training && display) {
        this.trainingTypes.push({
          id: String(id),
          name: training.name,
          description: training.description,
          cost: training.cost,
          energy: training.energy,
          fatigue: training.fatigue,
          effects: training.effects,
          icon: display.icon,
          effectNames: display.effects,
          targetScene: display.scene
        });
      }
    }
  }

  enter() {
    this.scrollY = 0;
    this.isDragging = false;
    this.hasMoved = false;
    this.initUI();
    this.calculateMaxScroll();
  }

  calculateMaxScroll() {
    const { height } = this.getCanvasSize();
    const cardHeight = height * 0.16;
    const cardSpacing = height * 0.01;
    const totalHeight = this.trainingTypes.length * (cardHeight + cardSpacing);
    const visibleHeight = height * 0.75;
    this.maxScroll = Math.max(0, totalHeight - visibleHeight + height * 0.1);
  }

  // 渲染
  render(ctx) {
    const player = this.game.player;
    if (!player) return;

    const { width, height } = this.getCanvasSize();
    const cardHeight = height * 0.16;
    const cardSpacing = height * 0.01;
    const startY = height * 0.18;
    const cardWidth = width * 0.9;
    const cardX = width * 0.05;

    // 背景
    this.drawBackground(ctx);

    // 标题
    this.drawTitle(ctx, '🏋️ 训练中心');

    // 资源状态 - 14号字体
    ctx.fillStyle = CONFIG.THEME.TEXT_SECONDARY;
    ctx.font = `${width * 0.037}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`💰 $${player.money}  ⚡ ${player.energy}/100  😊 ${player.form}/100`, width / 2, height * 0.14);

    // 设置裁剪区域，防止列表遮挡标题和状态栏
    ctx.save();
    ctx.beginPath();
    // 裁剪区域从标题下方开始到底部
    ctx.rect(0, height * 0.15, width, height * 0.85);
    ctx.clip();

    // 使用 ctx.translate 统一处理滚动
    ctx.translate(0, -this.scrollY);

    // 渲染训练卡片（使用世界坐标，不需要手动减scrollY）
    for (let i = 0; i < this.trainingTypes.length; i++) {
      const y = startY + i * (cardHeight + cardSpacing);
      // 只渲染可见区域内的卡片
      if (y + cardHeight > 0 && y < height) {
        this.drawTrainingCard(ctx, this.trainingTypes[i], cardX, y, cardWidth, cardHeight);
      }
    }

    ctx.restore();

    // 渲染返回按钮（固定在屏幕）
    this.renderButtons(ctx);
  }

  // 绘制卡片 - 14号字体
  drawTrainingCard(ctx, training, x, y, width, height) {
    const player = this.game.player;
    const isInjured = player.injury && player.injury.isInjured;
    const canTrain = !isInjured && player.money >= training.cost && player.energy >= training.energy;

    // 如果受伤，显示红色边框
    const borderColor = isInjured ? 'rgba(252, 129, 129, 0.5)' : (canTrain ? 'rgba(100, 255, 218, 0.2)' : 'rgba(100, 100, 100, 0.2)');
    this.drawRoundRect(ctx, x, y, width, height, 15,
      canTrain ? CONFIG.THEME.CARD_BG : '#2d3748',
      borderColor);

    ctx.font = `${width * 0.08}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(training.icon, x + width * 0.1, y + height * 0.35);

    ctx.fillStyle = CONFIG.THEME.TEXT_MAIN;
    ctx.font = `bold ${width * 0.037}px sans-serif`;  // 14号
    ctx.textAlign = 'left';
    ctx.fillText(training.name, x + width * 0.18, y + height * 0.28);

    ctx.fillStyle = CONFIG.THEME.TEXT_SECONDARY;
    ctx.font = `${width * 0.037}px sans-serif`;  // 14号
    ctx.fillText(training.description, x + width * 0.18, y + height * 0.5);

    ctx.font = `${width * 0.037}px sans-serif`;  // 14号
    ctx.fillStyle = training.cost <= player.money ? CONFIG.THEME.GREEN : CONFIG.THEME.RED;
    ctx.fillText(`💰 $${training.cost}`, x + width * 0.18, y + height * 0.75);

    ctx.fillStyle = player.energy >= training.energy ? CONFIG.THEME.PRIMARY : CONFIG.THEME.RED;
    ctx.fillText(`⚡ -${training.energy}`, x + width * 0.38, y + height * 0.75);

    ctx.fillStyle = CONFIG.THEME.ORANGE;
    ctx.font = `${width * 0.037}px sans-serif`;  // 14号
    ctx.fillText(`😴 +${training.fatigue}`, x + width * 0.55, y + height * 0.75);

    for (let i = 0; i < Math.min(training.effectNames.length, 3); i++) {
      ctx.fillStyle = 'rgba(100, 255, 218, 0.2)';
      this.drawRoundRect(ctx, x + width * 0.7 + i * (width * 0.1), y + height * 0.65, width * 0.08, height * 0.2, 8);

      ctx.fillStyle = CONFIG.THEME.PRIMARY;
      ctx.font = `${width * 0.037}px sans-serif`;  // 14号
      ctx.textAlign = 'center';
      ctx.fillText(training.effectNames[i].substring(0, 2), x + width * 0.74 + i * (width * 0.1), y + height * 0.78);
    }
  }

  // 触摸处理
  handleTouch(x, y, type) {
    const { width, height } = this.getCanvasSize();
    const now = Date.now();

    if (type === 'touchstart') {
      this.isDragging = true;
      this.velocity = 0;
      this.lastY = y;
      this.lastTime = now;
      this.touchStartY = y;
      this.touchStartX = x;
      this.hasMoved = false;
    } else if (type === 'touchmove') {
      if (!this.isDragging) return;

      const deltaY = y - this.lastY;
      const dt = now - this.lastTime;

      // 记录是否移动
      if (Math.abs(y - this.touchStartY) > 10 || Math.abs(x - this.touchStartX) > 10) {
        this.hasMoved = true;
      }

      // 计算速度（用于惯性）
      if (dt > 0) {
        this.velocity = deltaY;
      }

      // 更新滚动
      this.scrollY -= deltaY;

      // 边界限制
      if (this.scrollY < 0) this.scrollY = 0;
      if (this.scrollY > this.maxScroll) this.scrollY = this.maxScroll;

      this.lastY = y;
      this.lastTime = now;
    } else if (type === 'touchend') {
      this.isDragging = false;
      
      // 保留速度用于惯性（反转方向，因为scrollY -= deltaY）
      this.velocity = -this.velocity;

      // 如果没有移动，视为点击
      if (!this.hasMoved) {
        this.handleTap(x, y);
      }
    }

    // 处理返回按钮
    super.handleTouch(x, y, type);
  }

  // 处理滑动（从game.js调用）
  handleScroll(deltaY) {
    // 更新滚动
    this.scrollY -= deltaY;
    
    // 边界限制
    if (this.scrollY < 0) this.scrollY = 0;
    if (this.scrollY > this.maxScroll) this.scrollY = this.maxScroll;
  }

  // 处理点击（使用世界坐标）
  handleTap(x, y) {
    const { width, height } = this.getCanvasSize();
    const cardHeight = height * 0.16;
    const cardSpacing = height * 0.01;
    const startY = height * 0.18;
    const cardWidth = width * 0.9;
    const cardX = width * 0.05;

    // 转换为世界坐标（加上scrollY，因为渲染时用了 -scrollY）
    const worldY = y + this.scrollY;

    // 检查X范围
    if (x < cardX || x > cardX + cardWidth) return;

    // 检查Y范围
    const relativeY = worldY - startY;
    if (relativeY < 0) return;

    const index = Math.floor(relativeY / (cardHeight + cardSpacing));

    if (index >= 0 && index < this.trainingTypes.length) {
      const cardY = startY + index * (cardHeight + cardSpacing);
      const cardEndY = cardY + cardHeight;

      if (worldY >= cardY && worldY <= cardEndY) {
        const training = this.trainingTypes[index];
        this.doTraining(training);
      }
    }
  }

  doTraining(training) {
    const player = this.game.player;

    // 检查是否有伤病
    if (player.injury && player.injury.isInjured) {
      const injuryNames = {
        'light_strain': '轻微拉伤',
        'muscle_soreness': '肌肉酸痛',
        'sprain': '扭伤',
        'tennis_elbow': '网球肘',
        'meniscus': '半月板损伤',
        'season_end': '赛季报销'
      };
      const injuryName = injuryNames[player.injury.type] || '伤病';
      this.game.showToast(`受伤中！${injuryName}需要${player.injury.weeksRemaining}周恢复`);
      return;
    }

    if (player.money < training.cost) {
      this.game.showToast('资金不足');
      return;
    }
    if (player.energy < training.energy) {
      this.game.showToast('精力不足');
      return;
    }

    if (training.targetScene) {
      this.game.changeScene(training.targetScene);
      return;
    }

    const result = Training.train(player, training.id);

    if (result.success) {
      // 增加训练次数计数
      this.game.addTrainingRestAction();
      
      let message = `${training.name}完成！`;
      let effectText = '';
      for (const [attr, value] of Object.entries(result.results)) {
        message += `\n${Training.getAttrName(attr)} +${value}`;
        effectText += `${Training.getAttrName(attr)}+${value} `;
      }
      message += `\n消耗: $${result.cost} 精力-${result.energy}`;

      this.game.recordAction('training', training.name, effectText.trim() || '完成');
      this.game.showModal('🎉 训练完成', message, false);
    } else {
      this.game.showToast(result.message);
    }

    this.game.saveGame();
  }
}

module.exports = TrainingScene;
