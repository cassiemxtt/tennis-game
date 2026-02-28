/**
 * 技术训练游戏场景
 * 一个需要控制位置和击球时机的技术游戏
 */
const { Scene, GAME_STATE, CONFIG } = require('./scene.js');
const Training = require('../models/training.js');

class TechTrainingScene extends Scene {
  constructor(game) {
    super(game);

    // 游戏配置
    this.totalRounds = 5; // 总共5次击球
    this.countdownTime = 3; // 倒计时3秒

    // 游戏状态
    this.currentRound = 0;
    this.score = 0;
    this.isPlaying = false;
    this.isCountdown = true;
    this.countdownNumber = 3;
    this.countdownTimer = null;

    // 游戏阶段
    this.phase = 'waiting'; // waiting, horizontal, vertical, finished
    this.isTouching = false;

    // 滑动指针位置 (0-100)
    this.horizontalPosition = 0;
    this.verticalPosition = 0;

    // 指针移动速度
    this.pointerSpeed = 2; // 每帧移动2%

    // 指针移动方向
    this.horizontalDirection = 1; // 1为正向，-1为反向
    this.verticalDirection = 1; // 1为正向，-1为反向

    // 动画帧
    this.animationFrame = null;

    // 当前训练数据
    this.currentTraining = null;

    // 小人位置
    this.playerX = 0;

    this.initUI();
  }

  initUI() {
    // 返回按钮
    this.addBackButton(GAME_STATE.TRAINING);
  }

  enter() {
    const player = this.game.player;
    const trainingId = '3'; // 技术训练

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

    // 初始化游戏状态
    this.initGame();

    // 开始倒计时
    this.startCountdown();

    // 保存游戏
    this.game.saveGame();
  }

  initGame() {
    this.currentRound = 0;
    this.score = 0;
    this.phase = 'waiting';
    this.isTouching = false;
    this.horizontalPosition = 0;
    this.verticalPosition = 50;
    this.playerX = 50;
    this.horizontalDirection = 1;
    this.verticalDirection = 1;
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
        this.startRound();
      }
    }, 1000);
  }

  startRound() {
    if (this.currentRound >= this.totalRounds) {
      this.endGame();
      return;
    }

    this.phase = 'waiting';
    this.isTouching = false;
    this.horizontalPosition = 0;
    this.verticalPosition = 50;
    this.horizontalDirection = 1;
    this.verticalDirection = 1;
    this.isPlaying = true;

    this.game.showToast(`第 ${this.currentRound + 1} / ${this.totalRounds} 次`);
  }

  handleTouchStart(x, y) {
    if (!this.isPlaying || this.isCountdown) return;

    this.isTouching = true;

    if (this.phase === 'waiting') {
      // 开始横向滑动
      this.phase = 'horizontal';
    } else if (this.phase === 'horizontal') {
      // 横向停止，转换为竖向
      this.phase = 'vertical';
    }
  }

  handleTouchEnd(x, y) {
    if (!this.isPlaying || this.isCountdown) return;

    this.isTouching = false;

    if (this.phase === 'horizontal') {
      // 横向停止，确定位置
      this.playerX = this.horizontalPosition;
    } else if (this.phase === 'vertical') {
      // 竖向停止，计算得分
      this.calculateScore();

      // 进入下一轮
      this.currentRound++;
      if (this.currentRound >= this.totalRounds) {
        this.endGame();
      } else {
        setTimeout(() => {
          this.startRound();
        }, 500);
      }
    }
  }

  calculateScore() {
    // 计算横向得分 (位置是否合适)
    // 中心50为最优，两边为最差
    const horizontalDist = Math.abs(this.horizontalPosition - 50);
    let horizontalScore;
    if (horizontalDist <= 10) {
      horizontalScore = 100; // 绿色区域
    } else if (horizontalDist <= 25) {
      horizontalScore = 60; // 黄色区域
    } else {
      horizontalScore = 20; // 红色区域
    }

    // 计算竖向得分 (击球时机是否合适)
    // 中心50为最优，两边为最差
    const verticalDist = Math.abs(this.verticalPosition - 50);
    let verticalScore;
    if (verticalDist <= 10) {
      verticalScore = 100; // 绿色区域
    } else if (verticalDist <= 25) {
      verticalScore = 60; // 黄色区域
    } else {
      verticalScore = 20; // 红色区域
    }

    // 总分
    const roundScore = Math.floor((horizontalScore + verticalScore) / 2);
    this.score += roundScore;

    // 显示得分提示
    let quality = '一般';
    if (roundScore >= 90) quality = '完美！';
    else if (roundScore >= 70) quality = '不错！';
    else if (roundScore >= 50) quality = '一般';

    this.game.showToast(`${quality} +${roundScore}`);
  }

  update(deltaTime) {
    if (!this.isPlaying || this.isCountdown) return;

    if (this.isTouching) {
      if (this.phase === 'horizontal') {
        // 横向指针反复移动
        this.horizontalPosition += this.pointerSpeed * this.horizontalDirection;
        if (this.horizontalPosition >= 100) {
          this.horizontalPosition = 100;
          this.horizontalDirection = -1; // 反向
        } else if (this.horizontalPosition <= 0) {
          this.horizontalPosition = 0;
          this.horizontalDirection = 1; // 正向
        }
      } else if (this.phase === 'vertical') {
        // 竖向指针反复移动
        this.verticalPosition += this.pointerSpeed * this.verticalDirection;
        if (this.verticalPosition >= 100) {
          this.verticalPosition = 100;
          this.verticalDirection = -1; // 反向
        } else if (this.verticalPosition <= 0) {
          this.verticalPosition = 0;
          this.verticalDirection = 1; // 正向
        }
      }
    }
  }

  endGame() {
    this.isPlaying = false;

    // 计算训练效果系数
    const coefficient = this.calculateCoefficient();

    // 应用训练效果
    const results = Training.applyTechTrainingResult(this.game.player, this.currentTraining, this.score, coefficient);

    // 显示结果
    this.showResult(results);
  }

  calculateCoefficient() {
    // 基础系数1.0，每得1分增加0.02
    // 满分500分（5次*100分），系数约为11
    return 1 + (this.score * 0.02);
  }

  showResult(results) {
    let message = `🎯 技术训练完成！\n\n`;
    message += `得分: ${this.score} / 500\n`;
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
    this.game.recordAction('training', '技术训练', `得分${this.score} 系数x${this.calculateCoefficient().toFixed(2)}`);

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

    // 清除倒计时定时器
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  handleTouch(x, y, type) {
    if (type === 'touchstart') {
      this.handleTouchStart(x, y);

      // 处理按钮按下状态
      for (const button of this.buttons) {
        if (button.contains(x, y)) {
          button.pressed = true;
          break;
        }
      }
    } else if (type === 'touchend') {
      this.handleTouchEnd(x, y);

      // 处理按钮
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

  render(ctx) {
    const { width, height } = this.getCanvasSize();

    // 背景
    this.drawBackground(ctx);

    // 标题
    this.drawTitle(ctx, '🎯 技术训练');

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
    ctx.fillText(`回合: ${this.currentRound + 1}/${this.totalRounds}`, width * 0.7, height * 0.18);

    // 绘制网球场地
    this.renderTennisCourt(ctx);

    // 绘制小人
    this.renderPlayer(ctx);

    // 绘制横向滑动块（下方）
    this.renderHorizontalSlider(ctx);

    // 绘制竖向滑动块（右侧）
    this.renderVerticalSlider(ctx);

    // 绘制操作提示
    this.renderHint(ctx);

    // 绘制倒计时蒙版
    if (this.isCountdown) {
      this.renderCountdownOverlay(ctx);
    }

    // 绘制返回按钮
    this.renderButtons(ctx);
  }

  renderTennisCourt(ctx) {
    const { width, height } = this.getCanvasSize();

    // 网球场地 - 俯视图（缩小尺寸，避免遮挡文字）
    const courtX = width * 0.18;
    const courtY = height * 0.18;
    const courtWidth = width * 0.45;
    const courtHeight = height * 0.45;

    // 场地背景 - 紫色（像真实网球场）
    const courtGradient = ctx.createLinearGradient(courtX, courtY, courtX, courtY + courtHeight);
    courtGradient.addColorStop(0, '#E8D5E0');
    courtGradient.addColorStop(0.5, '#D4B8D4');
    courtGradient.addColorStop(1, '#C9A8C7');
    ctx.fillStyle = courtGradient;
    ctx.fillRect(courtX, courtY, courtWidth, courtHeight);

    // 线条颜色 - 白色
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;

    // 双打边线（最外侧的边）
    ctx.lineWidth = 3;
    ctx.strokeRect(courtX + 5, courtY + 5, courtWidth - 10, courtHeight - 10);

    // 单打边线（内侧的边）- 双打边线向内缩约15%
    const singlesOffset = courtWidth * 0.12;
    ctx.lineWidth = 2;
    ctx.strokeRect(courtX + singlesOffset, courtY + 5, courtWidth - singlesOffset * 2, courtHeight - 10);

    // 底线（上下两端的短边）
    ctx.lineWidth = 3;
    // 上底线
    ctx.beginPath();
    ctx.moveTo(courtX + 5, courtY + 5);
    ctx.lineTo(courtX + courtWidth - 5, courtY + 5);
    ctx.stroke();
    // 下底线
    ctx.beginPath();
    ctx.moveTo(courtX + 5, courtY + courtHeight - 5);
    ctx.lineTo(courtX + courtWidth - 5, courtY + courtHeight - 5);
    ctx.stroke();

    // 球网（场地正中间的深色横线）
    const netY = courtY + courtHeight / 2;
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#555555'; // 深色横线表示球网
    ctx.beginPath();
    ctx.moveTo(courtX + singlesOffset, netY);
    ctx.lineTo(courtX + courtWidth - singlesOffset, netY);
    ctx.stroke();

    // 发球线（上下各一条，距离球网约1/4场地高度）
    const serviceLineOffset = courtHeight * 0.18;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    // 上发球线
    ctx.beginPath();
    ctx.moveTo(courtX + singlesOffset, netY - serviceLineOffset);
    ctx.lineTo(courtX + courtWidth - singlesOffset, netY - serviceLineOffset);
    ctx.stroke();
    // 下发球线
    ctx.beginPath();
    ctx.moveTo(courtX + singlesOffset, netY + serviceLineOffset);
    ctx.lineTo(courtX + courtWidth - singlesOffset, netY + serviceLineOffset);
    ctx.stroke();

    // 发球中线（连接两条发球线的竖线）
    ctx.beginPath();
    ctx.moveTo(courtX + courtWidth / 2, netY - serviceLineOffset);
    ctx.lineTo(courtX + courtWidth / 2, netY + serviceLineOffset);
    ctx.stroke();

    // 中心标志（底线正中的小竖线）
    const centerMarkLength = 10;
    ctx.lineWidth = 2;
    // 上底线中心标志
    ctx.beginPath();
    ctx.moveTo(courtX + courtWidth / 2, courtY + 5);
    ctx.lineTo(courtX + courtWidth / 2, courtY + 5 + centerMarkLength);
    ctx.stroke();
    // 下底线中心标志
    ctx.beginPath();
    ctx.moveTo(courtX + courtWidth / 2, courtY + courtHeight - 5);
    ctx.lineTo(courtX + courtWidth / 2, courtY + courtHeight - 5 - centerMarkLength);
    ctx.stroke();

    // 发球区标记（四个小矩形区域）
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);

    // 上半部发球区
    ctx.strokeRect(courtX + courtWidth / 2, netY - serviceLineOffset, (courtWidth - singlesOffset * 2) / 2, serviceLineOffset);
    ctx.strokeRect(courtX + singlesOffset, netY - serviceLineOffset, (courtWidth - singlesOffset * 2) / 2, serviceLineOffset);

    // 下半部发球区
    ctx.strokeRect(courtX + courtWidth / 2, netY, (courtWidth - singlesOffset * 2) / 2, serviceLineOffset);
    ctx.strokeRect(courtX + singlesOffset, netY, (courtWidth - singlesOffset * 2) / 2, serviceLineOffset);

    ctx.setLineDash([]);
  }

  renderPlayer(ctx) {
    const { width, height } = this.getCanvasSize();

    // 根据 playerX 计算小人在场地中的位置（俯视图）
    const courtX = width * 0.18;
    const courtWidth = width * 0.45;
    const singlesOffset = courtWidth * 0.12;
    // 小人宽度范围在单打边线内
    const playerPixelX = courtX + singlesOffset + (this.playerX / 100) * (courtWidth - singlesOffset * 2);

    // 小人放在下底线位置（俯视图）
    const courtY = height * 0.18;
    const courtHeight = height * 0.45;
    const playerY = courtY + courtHeight - 25;

    // 绘制小人（俯视图简化版）
    // 头部（圆形）
    ctx.fillStyle = '#fcd34d';
    ctx.beginPath();
    ctx.arc(playerPixelX, playerY, 10, 0, Math.PI * 2);
    ctx.fill();

    // 身体（椭圆）
    ctx.fillStyle = '#3B82F6'; // 蓝色球衣
    ctx.beginPath();
    ctx.ellipse(playerPixelX, playerY + 12, 8, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // 球拍（从身体延伸出来）
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(playerPixelX + 6, playerY + 8);
    ctx.lineTo(playerPixelX + 18, playerY + 20);
    ctx.stroke();

    // 球拍框
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(playerPixelX + 20, playerY + 22, 8, 0, Math.PI * 2);
    ctx.stroke();

    // 绘制击球方向指示
    if (this.phase === 'vertical') {
      ctx.strokeStyle = '#FF6B6B';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(playerPixelX, playerY - 5);
      ctx.lineTo(playerPixelX, playerY - 25);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  renderHorizontalSlider(ctx) {
    const { width, height } = this.getCanvasSize();

    // 滑动块位置（调整以适应缩小的场地）
    const sliderY = height * 0.72;
    const sliderHeight = 30;
    const sliderWidth = width * 0.7;
    const sliderX = width * 0.15;

    // 绘制滑动块背景（渐变）
    const gradient = ctx.createLinearGradient(sliderX, 0, sliderX + sliderWidth, 0);
    gradient.addColorStop(0, '#e53e3e'); // 红色左边
    gradient.addColorStop(0.4, '#f6ad55'); // 黄色
    gradient.addColorStop(0.5, '#68d391'); // 绿色中间
    gradient.addColorStop(0.6, '#f6ad55'); // 黄色
    gradient.addColorStop(1, '#e53e3e'); // 红色右边

    ctx.fillStyle = gradient;
    ctx.fillRect(sliderX, sliderY, sliderWidth, sliderHeight);

    // 边框
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(sliderX, sliderY, sliderWidth, sliderHeight);

    // 绘制指针
    const pointerX = sliderX + (this.horizontalPosition / 100) * sliderWidth;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(pointerX, sliderY - 5);
    ctx.lineTo(pointerX - 8, sliderY - 15);
    ctx.lineTo(pointerX + 8, sliderY - 15);
    ctx.closePath();
    ctx.fill();

    // 标签
    ctx.fillStyle = CONFIG.THEME.TEXT_SECONDARY;
    ctx.font = `${width * 0.03}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('位置', width / 2, sliderY + sliderHeight + 20);
  }

  renderVerticalSlider(ctx) {
    const { width, height } = this.getCanvasSize();

    // 滑动块位置（右侧，调整以适应缩小的场地）
    const sliderX = width * 0.82;
    const sliderWidth = 30;
    const sliderHeight = height * 0.30;
    const sliderY = height * 0.25;

    // 绘制滑动块背景（渐变，从上到下）
    const gradient = ctx.createLinearGradient(0, sliderY, 0, sliderY + sliderHeight);
    gradient.addColorStop(0, '#e53e3e'); // 红色上
    gradient.addColorStop(0.3, '#f6ad55'); // 黄色
    gradient.addColorStop(0.5, '#68d391'); // 绿色中间
    gradient.addColorStop(0.7, '#f6ad55'); // 黄色
    gradient.addColorStop(1, '#e53e3e'); // 红色下

    ctx.fillStyle = gradient;
    ctx.fillRect(sliderX, sliderY, sliderWidth, sliderHeight);

    // 边框
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(sliderX, sliderY, sliderWidth, sliderHeight);

    // 绘制指针
    const pointerY = sliderY + (this.verticalPosition / 100) * sliderHeight;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(sliderX - 5, pointerY);
    ctx.lineTo(sliderX - 15, pointerY - 8);
    ctx.lineTo(sliderX - 15, pointerY + 8);
    ctx.closePath();
    ctx.fill();

    // 标签
    ctx.fillStyle = CONFIG.THEME.TEXT_SECONDARY;
    ctx.font = `${width * 0.03}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('时机', sliderX + sliderWidth / 2, sliderY + sliderHeight + 20);
  }

  renderHint(ctx) {
    const { width, height } = this.getCanvasSize();

    let hint = '';
    if (this.phase === 'waiting') {
      hint = '按住屏幕移动位置';
    } else if (this.phase === 'horizontal') {
      hint = '调整位置中...';
    } else if (this.phase === 'vertical') {
      hint = '按住屏幕调整击球时机';
    }

    if (hint) {
      ctx.fillStyle = CONFIG.THEME.PRIMARY;
      ctx.font = `bold ${width * 0.04}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(hint, width / 2, height * 0.72);
    }
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

    // 游戏说明
    ctx.font = `${width * 0.03}px sans-serif`;
    ctx.fillText('按住调整位置，松开确定', width / 2, height / 2 + height * 0.25);
    ctx.fillText('再次按住调整击球时机', width / 2, height / 2 + height * 0.32);
  }
}

module.exports = TechTrainingScene;
