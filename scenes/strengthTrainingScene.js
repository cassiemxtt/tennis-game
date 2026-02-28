/**
 * 力量训练游戏场景
 * 一个点击哑铃的反应力量游戏
 */
const { Scene, GAME_STATE, CONFIG } = require('./scene.js');
const Training = require('../models/training.js');

class StrengthTrainingScene extends Scene {
  constructor(game) {
    super(game);

    // 游戏配置
    this.gameDuration = 10; // 游戏时长10秒
    this.countdownTime = 3; // 倒计时3秒

    // 游戏状态
    this.score = 0;
    this.timeRemaining = this.gameDuration;
    this.isPlaying = false;
    this.isCountdown = true;
    this.countdownNumber = 3;
    this.gameTimer = null;
    this.countdownTimer = null;

    // 哑铃区域配置
    this.dumbbellArea = {
      x: 0,
      y: 0,
      width: 150,
      height: 150
    };

    // 动画效果
    this.isPressed = false;
    this.pressScale = 1.0;

    // 当前训练数据
    this.currentTraining = null;

    this.initUI();
  }

  initUI() {
    // 返回按钮
    this.addBackButton(GAME_STATE.TRAINING);
  }

  enter() {
    const player = this.game.player;
    const trainingId = '1'; // 力量训练

    // 检查资源
    const training = Training.TRAINING_TYPES[trainingId];
    this.currentTraining = training;

    if (player.money < training.cost || player.energy < training.energy) {
      this.game.showToast('精力或资金不足');
      this.game.changeScene(GAME_STATE.TRAINING);
      return;
    }

    // 扣除资源
    player.money -= training.cost;
    player.energy -= training.energy;

    // 初始化哑铃位置
    this.initDumbbell();

    // 开始倒计时
    this.startCountdown();

    // 保存游戏
    this.game.saveGame();
  }

  initDumbbell() {
    const { width, height } = this.getCanvasSize();

    // 哑铃区域在页面中间
    this.dumbbellArea = {
      x: width / 2 - 75,
      y: height * 0.35,
      width: 150,
      height: 150
    };
  }

  startCountdown() {
    this.isCountdown = true;
    this.isPlaying = false;
    this.countdownNumber = 3;

    this.countdownTimer = setInterval(() => {
      this.countdownNumber--;
      if (this.countdownNumber <= 0) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
        this.isCountdown = false;
        this.startGame();
      }
    }, 1000);
  }

  startGame() {
    this.isPlaying = true;
    this.score = 0;
    this.timeRemaining = this.gameDuration;

    // 启动游戏计时器
    this.gameTimer = setInterval(() => {
      this.timeRemaining--;
      if (this.timeRemaining <= 0) {
        this.endGame();
      }
    }, 1000);
  }

  handleDumbbellClick(x, y) {
    if (!this.isPlaying || this.isCountdown) return;

    // 检查是否点击了哑铃区域
    if (this.isPointInRect(x, y, this.dumbbellArea)) {
      // 点击成功
      this.score++;

      // 设置按压动画
      this.isPressed = true;
      this.pressScale = 0.9;

      // 动画复位
      setTimeout(() => {
        this.isPressed = false;
        this.pressScale = 1.0;
      }, 100);
    }
    // 点击其他区域不做任何处理
  }

  endGame() {
    this.isPlaying = false;

    // 清除所有定时器
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
      this.gameTimer = null;
    }

    // 计算训练效果系数
    const coefficient = this.calculateCoefficient();

    // 应用训练效果
    const results = Training.applyStrengthTrainingResult(this.game.player, this.currentTraining, this.score, coefficient);

    // 显示结果
    this.showResult(results);
  }

  calculateCoefficient() {
    // 基础系数1.0，每得1分增加0.05
    // 10秒内大约可以点击20-30次
    return 1 + (this.score * 0.05);
  }

  showResult(results) {
    let message = `💪 力量训练完成！\n\n`;
    message += `点击次数: ${this.score}\n`;
    message += `效果系数: x${this.calculateCoefficient().toFixed(2)}\n\n`;

    if (results && results.effects) {
      message += `训练效果:\n`;
      for (const [attr, value] of Object.entries(results.effects)) {
        if (value > 0) {
          message += `${Training.getAttrName(attr)} +${value}\n`;
        }
      }
    }

    message += `\n消耗: $${results.cost} 精力-${results.energy}`;

    // 记录操作
    this.game.recordAction('training', '力量训练', `点击${this.clickCount}次 系数x${this.calculateCoefficient().toFixed(2)}`);

    // 显示结果弹窗
    this.game.showModal('🏆 训练完成', message, false, '确定', '').then(() => {
      this.game.saveGame();
      this.game.changeScene(GAME_STATE.TRAINING);
    });
  }

  // 退出场景时清理定时器
  exit() {
    // 标记游戏已取消
    this.isPlaying = false;
    this.isCountdown = false;

    // 清除所有定时器
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
      this.gameTimer = null;
    }

    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  handleTouch(x, y, type) {
    if (type === 'touchend') {
      // 处理哑铃点击
      this.handleDumbbellClick(x, y);

      // 处理按钮
      for (const button of this.buttons) {
        if (button.contains(x, y) && button.pressed) {
          button.pressed = false;
          button.onClick();
          break;
        }
        button.pressed = false;
      }
    } else if (type === 'touchstart') {
      // 按钮按下状态
      for (const button of this.buttons) {
        if (button.contains(x, y)) {
          button.pressed = true;
          break;
        }
      }
    }
  }

  isPointInRect(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.width &&
           y >= rect.y && y <= rect.y + rect.height;
  }

  update(deltaTime) {
    // 游戏逻辑更新（如果需要）
  }

  render(ctx) {
    const { width, height } = this.getCanvasSize();

    // 背景
    this.drawBackground(ctx);

    // 标题
    this.drawTitle(ctx, '💪 力量训练');

    // 显示资源状态
    const player = this.game.player;
    ctx.fillStyle = CONFIG.THEME.TEXT_SECONDARY;
    ctx.font = `${width * 0.035}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`💰 $${player.money}  ⚡ ${player.energy}/100  😊 ${player.form}/100`, width / 2, height * 0.14);

    // 显示游戏信息
    ctx.fillStyle = CONFIG.THEME.TEXT_MAIN;
    ctx.font = `bold ${width * 0.04}px sans-serif`;
    ctx.fillText(`点击: ${this.score}`, width * 0.5, height * 0.18);

    // 倒计时显示
    ctx.fillStyle = this.timeRemaining <= 3 ? CONFIG.THEME.RED : CONFIG.THEME.PRIMARY;
    ctx.fillText(`⏱️ ${this.timeRemaining}s`, width * 0.8, height * 0.18);

    // 绘制哑铃
    this.renderDumbbell(ctx);

    // 绘制倒计时蒙版
    if (this.isCountdown) {
      this.renderCountdownOverlay(ctx);
    }

    // 绘制返回按钮
    this.renderButtons(ctx);
  }

  renderDumbbell(ctx) {
    const { width, height } = this.getCanvasSize();
    const area = this.dumbbellArea;

    // 计算缩放
    const scale = this.pressScale;
    const centerX = area.x + area.width / 2;
    const centerY = area.y + area.height / 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);
    ctx.translate(-centerX, -centerY);

    // 哑铃发光效果
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, area.width * 0.8);
    gradient.addColorStop(0, 'rgba(255, 100, 100, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 100, 100, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, area.width * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // 哑铃杠铃部分（横向）
    const barWidth = area.width * 0.6;
    const barHeight = area.height * 0.15;
    const barX = area.x + (area.width - barWidth) / 2;
    const barY = area.y + area.height / 2 - barHeight / 2;

    // 杠铃颜色
    ctx.fillStyle = '#8B4513'; // 棕色杠铃
    this.drawRoundRect(ctx, barX, barY, barWidth, barHeight, 5);

    // 哑铃左边重量块
    const weightWidth = area.width * 0.25;
    const weightHeight = area.height * 0.5;
    const leftWeightX = area.x;
    const leftWeightY = area.y + (area.height - weightHeight) / 2;

    // 左边重量块 - 红色
    ctx.fillStyle = '#e53e3e';
    this.drawRoundRect(ctx, leftWeightX, leftWeightY, weightWidth, weightHeight, 10);
    ctx.strokeStyle = '#c53030';
    ctx.lineWidth = 3;
    this.drawRoundRectStroke(ctx, leftWeightX, leftWeightY, weightWidth, weightHeight, 10);

    // 哑铃右边重量块
    const rightWeightX = area.x + area.width - weightWidth;
    const rightWeightY = area.y + (area.height - weightHeight) / 2;

    // 右边重量块 - 红色
    ctx.fillStyle = '#e53e3e';
    this.drawRoundRect(ctx, rightWeightX, rightWeightY, weightWidth, weightHeight, 10);
    ctx.strokeStyle = '#c53030';
    ctx.lineWidth = 3;
    this.drawRoundRectStroke(ctx, rightWeightX, rightWeightY, weightWidth, weightHeight, 10);

    // 重量块上的纹理（横线）
    ctx.strokeStyle = '#c53030';
    ctx.lineWidth = 2;
    for (let i = 1; i < 3; i++) {
      const lineY = leftWeightY + (weightHeight / 3) * i;
      ctx.beginPath();
      ctx.moveTo(leftWeightX + 10, lineY);
      ctx.lineTo(leftWeightX + weightWidth - 10, lineY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(rightWeightX + 10, lineY);
      ctx.lineTo(rightWeightX + weightWidth - 10, lineY);
      ctx.stroke();
    }

    // 点击提示文字
    ctx.fillStyle = CONFIG.THEME.TEXT_MAIN;
    ctx.font = `bold ${width * 0.035}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('快速点击!', centerX, area.y + area.height + 30);

    ctx.restore();
  }

  drawRoundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }

  drawRoundRectStroke(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.stroke();
  }

  renderCountdownOverlay(ctx) {
    const { width, height } = this.getCanvasSize();

    // 半透明黑色蒙版
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, width, height);

    // 倒计时数字
    ctx.fillStyle = CONFIG.THEME.PRIMARY;
    ctx.font = `bold ${width * 0.3}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.countdownNumber.toString(), width / 2, height / 2);

    // 提示文字
    ctx.fillStyle = CONFIG.THEME.TEXT_SECONDARY;
    ctx.font = `${width * 0.04}px sans-serif`;
    ctx.fillText('准备好了吗？', width / 2, height / 2 + height * 0.15);
  }
}

module.exports = StrengthTrainingScene;
