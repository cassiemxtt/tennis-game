/**
 * 菜单场景
 */
const { Scene, GAME_STATE, CONFIG } = require('./scene.js');
const Player = require('../models/player.js');

class MenuScene extends Scene {
  constructor(game) {
    super(game);
    this.title = '网球运动员职业生涯模拟器';
    this.subtitle = '从14岁新星到世界第一的传奇之路';
    this.hasSavedGame = false;

    this.initButtons();
  }

  initButtons() {
    const { width, height } = this.getCanvasSize();

    // 计算按钮尺寸（基于 Canvas 宽度）
    const btnWidth = width * 0.7;
    const btnHeight = height * 0.08;
    const spacing = height * 0.04;
    const centerX = width / 2;
    const startY = height * 0.5;

    // 检查存档
    const savedData = wx.getStorageSync('tennisGameData');
    this.hasSavedGame = !!(savedData && savedData.player);

    // 开始新游戏按钮
    this.addButton(centerX - btnWidth / 2, startY, btnWidth, btnHeight, '🎾 开始新游戏', () => {
      this.game.changeScene(GAME_STATE.CREATE_PLAYER);
    }, {
      bgColor: CONFIG.THEME.PRIMARY,
      textColor: '#0a192f'
    });

    // 继续游戏按钮
    if (this.hasSavedGame) {
      this.addButton(centerX - btnWidth / 2, startY + btnHeight + spacing, btnWidth, btnHeight, '📂 继续游戏', () => {
        const savedData = wx.getStorageSync('tennisGameData');
        if (savedData && savedData.player) {
          this.game.player = Player.fromJSON(savedData.player);
          this.game.gameData = savedData.gameData;
          this.game.saveGame();
          this.game.changeScene(GAME_STATE.HOME);
        }
      }, {
        bgColor: CONFIG.THEME.SECONDARY,
        textColor: '#0a192f'
      });
    }

    // 快速开始按钮
    this.addButton(centerX - btnWidth / 2, this.hasSavedGame ? startY + (btnHeight + spacing) * 2 : startY + btnHeight + spacing, btnWidth, btnHeight, '⚡ 快速开始', () => {
      this.game.player = new Player('网球新星');
      this.game.gameData = {
        month: 1,
        year: 2024,
        gameActive: true,
        specialEvents: []
      };
      this.game.saveGame();
      this.game.changeScene(GAME_STATE.HOME);
    }, {
      bgColor: '#667eea',
      textColor: '#ffffff'
    });
  }

  render(ctx) {
    const { width, height } = this.getCanvasSize();

    // 绘制背景 - 统一方法
    this.drawBackground(ctx);

    // 计算字体大小
    const titleFontSize = width * 0.06;
    const subtitleFontSize = width * 0.035;
    const iconFontSize = width * 0.13;
    const tipFontSize = width * 0.03;

    // 绘制标题
    ctx.fillStyle = CONFIG.THEME.PRIMARY;
    ctx.font = `bold ${titleFontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.title, width / 2, height * 0.25);

    // 绘制副标题
    ctx.fillStyle = CONFIG.THEME.TEXT_SECONDARY;
    ctx.font = `${subtitleFontSize}px sans-serif`;
    ctx.fillText(this.subtitle, width / 2, height * 0.32);

    // 绘制网球图标
    ctx.font = `${iconFontSize}px sans-serif`;
    ctx.fillText('🎾', width / 2, height * 0.12);

    // 绘制底部提示
    ctx.fillStyle = '#4a5568';
    ctx.font = `${tipFontSize}px sans-serif`;
    ctx.fillText('努力 · 坚持 · 突破', width / 2, height * 0.9);

    // 绘制按钮 - 统一方法
    this.renderButtons(ctx);
  }
}

module.exports = MenuScene;
