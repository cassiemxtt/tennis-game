/**
 * 休息场景
 */
const { Scene, GAME_STATE, CONFIG } = require('./scene.js');
const { RandomEvents } = require('../models/events.js');

class RestScene extends Scene {
  constructor(game) {
    super(game);
    this.recovery = 0;
    this.restEvent = null;
    this.initUI();
  }

  initUI() {
    const { width, height } = this.getCanvasSize();

    // 返回按钮 - 统一位置，不移动
    this.addBackButton(GAME_STATE.HOME);

    // 休息按钮 - 单独添加，稍后在render中调整位置
    this.restButton = this.addButton(width * 0.1, height * 0.8, width * 0.8, height * 0.12, '😴 休息恢复', () => {
      this.takeRest();
    }, {
      bgColor: CONFIG.THEME.ORANGE,
      textColor: '#0a192f',
      fontSize: width * 0.05
    });
  }

  takeRest() {
    const player = this.game.player;
    this.recovery = player.rest();
    
    // 增加休息次数计数
    this.game.addTrainingRestAction();

    // 随机事件
    if (Math.random() < 0.3) {
      this.restEvent = RandomEvents.getRestEvent();
      this.restEvent.effect(player);
    }

    this.game.saveGame();

    // 显示结果
    let message = `疲劳恢复: -${this.recovery}\n当前疲劳: ${player.fatigue}/100\n当前状态: ${player.form}/100`;
    if (this.restEvent) {
      message += `\n\n✨ ${this.restEvent.description}`;
    }

    this.game.showModal('😴 休息完成', message, false).then(() => {
      this.restEvent = null;

      // 记录操作
      let resultText = `恢复-${this.recovery}`;
      if (this.restEvent && this.restEvent.effect) {
        resultText += ' 随机事件';
      }
      this.game.recordAction('rest', '休息恢复', resultText);

      this.game.changeScene(GAME_STATE.HOME);
    });
  }

  render(ctx) {
    const player = this.game.player;
    if (!player) return;

    const { width, height } = this.getCanvasSize();

    // 背景 - 统一方法
    this.drawBackground(ctx);

    // 调整所有位置往下移动
    const offsetY = 50;

    // 标题 - 与训练页面上下对齐
    this.drawTitle(ctx, '😴 休息恢复');

    // 说明
    ctx.fillStyle = CONFIG.THEME.TEXT_SECONDARY;
    ctx.font = `${width * 0.035}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('适当的休息可以帮助你恢复疲劳，提升状态', width / 2, height * 0.15 + offsetY);
    ctx.fillText('休息期间可能会有意外收获！', width / 2, height * 0.175 + offsetY);

    // 当前状态卡片
    const cardX = width * 0.05;
    const cardWidth = width * 0.9;
    const cardHeight = height * 0.28;
    this.drawCard(ctx, cardX, height * 0.22 + offsetY, cardWidth, cardHeight, '当前状态');

    // 状态值
    const states = [
      { name: '😊 状态', value: player.form, max: 100, color: this.getFormColor(player.form) },
      { name: '😴 疲劳', value: player.fatigue, max: 100, color: player.fatigue < 50 ? CONFIG.THEME.GREEN : player.fatigue < 80 ? CONFIG.THEME.ORANGE : CONFIG.THEME.RED },
      { name: '⚡ 精力', value: player.energy, max: 100, color: player.energy > 50 ? CONFIG.THEME.GREEN : player.energy > 20 ? CONFIG.THEME.ORANGE : CONFIG.THEME.RED }
    ];

    ctx.textAlign = 'left';
    for (let i = 0; i < states.length; i++) {
      const state = states[i];
      const y = height * 0.35 + i * (height * 0.05) + offsetY;

      ctx.fillStyle = CONFIG.THEME.TEXT_SECONDARY;
      ctx.font = `${width * 0.04}px sans-serif`;
      ctx.fillText(state.name, cardX + width * 0.05, y);

      ctx.fillStyle = state.color;
      ctx.font = `bold ${width * 0.045}px sans-serif`;
      //ctx.textAlign = 'right';
      ctx.fillText(`${state.value}/${state.max}`, cardX + cardWidth - width * 0.2, y);

      this.drawProgressBar(ctx, cardX + width * 0.05, y + height * 0.02, cardWidth * 0.9, height * 0.015, state.value, state.color);
    }

    // 绘制休息按钮 - 只移动休息按钮，不移动返回按钮
    if (this.restButton) {
      this.restButton.y = height * 0.68 + offsetY;
    }
    this.renderButtons(ctx);
  }

  getFormColor(form) {
    if (form >= 80) return CONFIG.THEME.GREEN;
    if (form >= 60) return CONFIG.THEME.PRIMARY;
    if (form >= 40) return CONFIG.THEME.ORANGE;
    if (form >= 20) return CONFIG.THEME.RED;
    return '#e53e3e';
  }
}

module.exports = RestScene;
