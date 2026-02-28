/**
 * 随机事件场景
 */
const { Scene, GAME_STATE, CONFIG } = require('./scene.js');

class EventScene extends Scene {
  constructor(game) {
    super(game);
    this.initUI();
  }

  initUI() {
    const { width, height } = this.getCanvasSize();

    // 继续按钮
    this.addButton(width * 0.1, height * 0.85, width * 0.8, height * 0.1, '✨ 继续', () => {
      this.game.changeScene(GAME_STATE.HOME);
    }, {
      bgColor: CONFIG.THEME.PRIMARY,
      textColor: '#0a192f',
      fontSize: width * 0.045
    });
  }

  render(ctx) {
    const event = this.game.gameData.currentEvent;
    if (!event) {
      this.game.changeScene(GAME_STATE.HOME);
      return;
    }

    const { width, height } = this.getCanvasSize();

    // 背景 - 统一方法
    this.drawBackground(ctx);

    // 标题 - 统一方法
    this.drawTitle(ctx, '✨ 特殊事件', { color: CONFIG.THEME.GOLD, y: height * 0.15 });

    // 事件名称
    ctx.fillStyle = CONFIG.THEME.TEXT_MAIN;
    ctx.font = `bold ${width * 0.05}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(event.name, width / 2, height * 0.23);

    // 分割线
    ctx.strokeStyle = 'rgba(100, 255, 218, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width * 0.1, height * 0.28);
    ctx.lineTo(width * 0.9, height * 0.28);
    ctx.stroke();

    // 事件描述
    ctx.fillStyle = CONFIG.THEME.TEXT_SECONDARY;
    ctx.font = `${width * 0.04}px sans-serif`;
    ctx.textAlign = 'center';

    // 换行显示描述
    const words = event.description.split('');
    let line = '';
    let y = height * 0.4;
    const maxWidth = width * 0.8;
    for (const word of words) {
      const testLine = line + word;
      if (ctx.measureText(testLine).width > maxWidth) {
        ctx.fillText(line, width / 2, y);
        line = word;
        y += height * 0.05;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, width / 2, y);

    // 额外奖励提示
    if (event.extraInfo && event.extraInfo.money) {
      ctx.fillStyle = CONFIG.THEME.GOLD;
      ctx.font = `bold ${width * 0.045}px sans-serif`;
      ctx.fillText(`💰 获得赞助: +$${event.extraInfo.money}`, width / 2, y + height * 0.1);
    }

    // 绘制按钮 - 统一方法
    this.renderButtons(ctx);
  }
}

module.exports = EventScene;
