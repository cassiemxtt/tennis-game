/**
 * 速度训练游戏场景
 * 一个类似打地鼠的反应速度游戏
 */
const { Scene, GAME_STATE, CONFIG } = require('./scene.js');
const Training = require('../models/training.js');

class SpeedTrainingScene extends Scene {
  constructor(game) {
    super(game);

    // 游戏配置
    this.gameDuration = 30; // 游戏时长30秒
    this.bulbDuration = 1000; // 灯泡亮起持续时间（毫秒）
    this.countdownTime = 3; // 倒计时3秒
    this.maxMisses = 3; // 最多允许点错3次

    // 游戏状态
    this.score = 0;
    this.missCount = 0;
    this.timeRemaining = this.gameDuration;
    this.currentBulbIndex = -1;
    this.isPlaying = false;
    this.isCountdown = true;
    this.countdownNumber = 3;
    this.bulbTimer = null;
    this.gameTimer = null;
    this.countdownTimer = null;

    // 灯泡网格配置
    this.bulbs = [];
    this.gridRows = 4;
    this.gridCols = 4;
    this.bulbSize = 60;
    this.bulbSpacing = 20;

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
    const trainingId = 'speed'; // 速度训练

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

    // 初始化灯泡位置
    this.initBulbs();

    // 开始倒计时
    this.startCountdown();

    // 保存游戏
    this.game.saveGame();
  }

  initBulbs() {
    const { width, height } = this.getCanvasSize();

    // 计算网格总尺寸
    const gridWidth = this.gridCols * this.bulbSize + (this.gridCols - 1) * this.bulbSpacing;
    const gridHeight = this.gridRows * this.bulbSize + (this.gridRows - 1) * this.bulbSpacing;

    // 计算起始位置（居中）
    const startX = (width - gridWidth) / 2;
    const startY = height * 0.25;

    // 创建灯泡数组
    this.bulbs = [];
    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridCols; col++) {
        const index = row * this.gridCols + col;
        this.bulbs.push({
          x: startX + col * (this.bulbSize + this.bulbSpacing),
          y: startY + row * (this.bulbSize + this.bulbSpacing),
          width: this.bulbSize,
          height: this.bulbSize,
          isLit: false,
          index: index,
          clickArea: {
            x: startX + col * (this.bulbSize + this.bulbSpacing),
            y: startY + row * (this.bulbSize + this.bulbSpacing),
            width: this.bulbSize,
            height: this.bulbSize
          }
        });
      }
    }
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
    this.missCount = 0;
    this.timeRemaining = this.gameDuration;

    // 启动游戏计时器
    this.gameTimer = setInterval(() => {
      this.timeRemaining--;
      if (this.timeRemaining <= 0) {
        this.endGame();
      }
    }, 1000);

    // 亮起第一个灯泡
    this.lightRandomBulb();
  }

  lightRandomBulb() {
    // 熄灭当前灯泡
    if (this.currentBulbIndex >= 0 && this.bulbs[this.currentBulbIndex]) {
      this.bulbs[this.currentBulbIndex].isLit = false;
    }

    // 随机选择一个新灯泡（避免重复）
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * this.bulbs.length);
    } while (newIndex === this.currentBulbIndex && this.bulbs.length > 1);

    this.currentBulbIndex = newIndex;
    this.bulbs[newIndex].isLit = true;

    // 设置灯泡熄灭定时器
    if (this.bulbTimer) {
      clearTimeout(this.bulbTimer);
    }

    this.bulbTimer = setTimeout(() => {
      if (this.isPlaying) {
        // 灯泡超时未点击，熄灭并亮起下一个
        this.bulbs[this.currentBulbIndex].isLit = false;
        this.lightRandomBulb();
      }
    }, this.bulbDuration);
  }

  handleBulbClick(index) {
    if (!this.isPlaying || this.isCountdown) return;

    const bulb = this.bulbs[index];

    if (bulb.isLit) {
      // 点击成功
      this.score++;

      // 清除当前定时器
      if (this.bulbTimer) {
        clearTimeout(this.bulbTimer);
        this.bulbTimer = null;
      }

      // 立即亮起下一个灯泡
      this.lightRandomBulb();
    } else {
      // 点击暗的灯泡，算作点错
      this.missCount++;

      // 显示点错提示
      this.game.showToast(`点错了！剩余次数: ${this.maxMisses - this.missCount}`);

      // 检查是否达到最大点错次数
      if (this.missCount >= this.maxMisses) {
        this.game.showToast('机会用尽！游戏结束');
        // 延迟一点结束，让玩家看到提示
        setTimeout(() => {
          this.endGame();
        }, 500);
      }
    }
  }

  endGame() {
    this.isPlaying = false;

    // 清除所有定时器
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
      this.gameTimer = null;
    }

    if (this.bulbTimer) {
      clearTimeout(this.bulbTimer);
      this.bulbTimer = null;
    }

    // 熄灭所有灯泡
    for (const bulb of this.bulbs) {
      bulb.isLit = false;
    }

    // 计算训练效果系数
    const coefficient = this.calculateCoefficient();

    // 应用训练效果
    const results = Training.applySpeedTrainingResult(this.game.player, this.currentTraining, this.score, coefficient);

    // 显示结果
    this.showResult(results);
  }

  // 退出场景时清理定时器
  exit() {
    // 标记游戏已取消，不再显示结果
    this.isPlaying = false;
    this.isCountdown = false;

    // 清除所有定时器
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
      this.gameTimer = null;
    }

    if (this.bulbTimer) {
      clearTimeout(this.bulbTimer);
      this.bulbTimer = null;
    }

    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }

    // 熄灭所有灯泡
    for (const bulb of this.bulbs) {
      bulb.isLit = false;
    }
  }

  calculateCoefficient() {
    // 基础系数1.0，每得1分增加0.05
    // 满分大约30分（每秒1个），系数约为2.5
    return 1 + (this.score * 0.05);
  }

  showResult(results) {
    // 判断结束原因
    const endReason = this.missCount >= this.maxMisses ? '（点错次数用尽）' : '（时间到）';

    let message = `🎯 速度训练完成！${endReason}\n\n`;
    message += `得分: ${this.score}\n`;
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
    this.game.recordAction('training', '速度训练', `得分${this.score} 系数x${this.calculateCoefficient().toFixed(2)}`);

    // 显示结果弹窗
    this.game.showModal('🏆 训练完成', message, false, '确定', '').then(() => {
      this.game.saveGame();
      this.game.changeScene(GAME_STATE.TRAINING);
    });
  }

  handleTouch(x, y, type) {
    if (type === 'touchend') {
      // 处理灯泡点击
      for (let i = 0; i < this.bulbs.length; i++) {
        const bulb = this.bulbs[i];
        if (this.isPointInRect(x, y, bulb.clickArea)) {
          this.handleBulbClick(i);
          break;
        }
      }

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
    this.drawTitle(ctx, '⚡ 速度训练');

    // 显示资源状态
    const player = this.game.player;
    ctx.fillStyle = CONFIG.THEME.TEXT_SECONDARY;
    ctx.font = `${width * 0.035}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`💰 $${player.money}  ⚡ ${player.energy}/100  😊 ${player.form}/100`, width / 2, height * 0.14);

    // 显示游戏信息
    ctx.fillStyle = CONFIG.THEME.TEXT_MAIN;
    ctx.font = `bold ${width * 0.04}px sans-serif`;
    ctx.fillText(`得分: ${this.score}`, width * 0.3, height * 0.18);

    // 倒计时显示
    ctx.fillStyle = this.timeRemaining <= 10 ? CONFIG.THEME.RED : CONFIG.THEME.PRIMARY;
    ctx.fillText(`⏱️ ${this.timeRemaining}s`, width * 0.7, height * 0.18);

    // 剩余机会显示
    const remainingMisses = this.maxMisses - this.missCount;
    ctx.fillStyle = remainingMisses <= 1 ? CONFIG.THEME.RED : CONFIG.THEME.ORANGE;
    ctx.font = `bold ${width * 0.035}px sans-serif`;
    ctx.fillText(`❤️ ${remainingMisses}/${this.maxMisses}`, width / 2, height * 0.18);

    // 绘制灯泡
    this.renderBulbs(ctx);

    // 绘制倒计时蒙版
    if (this.isCountdown) {
      this.renderCountdownOverlay(ctx);
    }

    // 绘制返回按钮
    this.renderButtons(ctx);
  }

  renderBulbs(ctx) {
    for (const bulb of this.bulbs) {
      this.renderTennisBulb(ctx, bulb.x, bulb.y, bulb.width, bulb.height, bulb.isLit);
    }
  }

  renderTennisBulb(ctx, x, y, size, height, isLit) {
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const radius = size / 2;

    if (isLit) {
      // 发光效果
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 1.5);
      gradient.addColorStop(0, '#ccff00');
      gradient.addColorStop(0.5, '#99ff00');
      gradient.addColorStop(1, 'rgba(153, 255, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // 灯泡主体 - 亮色
      ctx.fillStyle = '#ccff00';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // 亮光效果
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 灯泡主体 - 暗色
      ctx.fillStyle = '#2d3748';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // 边框
      ctx.strokeStyle = '#4a5568';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 绘制网球纹理（两条弧线）
    ctx.strokeStyle = isLit ? '#669900' : '#1a202c';
    ctx.lineWidth = 2;

    // 弧线1
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.7, -Math.PI * 0.8, Math.PI * 0.3);
    ctx.stroke();

    // 弧线2
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.7, Math.PI * 0.2, Math.PI * 1.3);
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

module.exports = SpeedTrainingScene;
