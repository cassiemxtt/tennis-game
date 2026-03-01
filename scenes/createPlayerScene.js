/**
 * 创建角色场景
 */
const { Scene, GAME_STATE, CONFIG } = require('./scene.js');
const Player = require('../models/player.js');

class CreatePlayerScene extends Scene {
  constructor(game) {
    super(game);
    this.playerName = '';
    this.selectedGender = 'male'; // 默认男性
    this.initUI();
  }

  initUI() {
    const { width, height } = this.getCanvasSize();
    const centerX = width / 2;

    // 返回按钮 - 统一位置
    this.addBackButton(GAME_STATE.MENU);

    // 标题 - 改为直接绘制（不使用按钮）
    // 注意：标题在 render() 中绘制

    // 输入框区域
    this.addButton(centerX - width * 0.35, height * 0.28, width * 0.7, height * 0.1, '点击输入名字', () => {
      this.showKeyboard();
    }, {
      bgColor: 'rgba(255, 255, 255, 0.05)',
      textColor: '#8892b0',
      borderColor: 'rgba(100, 255, 218, 0.2)',
      fontSize: width * 0.04
    });

    // 男性按钮
    this.addButton(centerX - width * 0.25, height * 0.52, width * 0.22, height * 0.1, '👨 男', () => {
      this.selectedGender = 'male';
      this.setupGenderButtons();
    }, {
      bgColor: 'rgba(255, 255, 255, 0.05)',
      textColor: '#64ffda',
      borderColor: '#64ffda',
      fontSize: width * 0.04
    });

    // 女性按钮
    this.addButton(centerX + width * 0.03, height * 0.52, width * 0.22, height * 0.1, '👩 女', () => {
      this.selectedGender = 'female';
      this.setupGenderButtons();
    }, {
      bgColor: 'rgba(255, 255, 255, 0.05)',
      textColor: '#8892b0',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      fontSize: width * 0.04
    });

    // 提示信息
    this.addButton(centerX - width * 0.4, height * 0.66, width * 0.8, height * 0.18, '💡 游戏提示\n\n你将从14岁开始职业生涯，\n通过训练提升各项属性，\n参加比赛赢得奖金和排名，\n最终目标是成为世界第一！', () => {}, {
      bgColor: 'rgba(100, 255, 218, 0.1)',
      textColor: '#8892b0',
      borderColor: CONFIG.THEME.PRIMARY,
      fontSize: width * 0.035
    });

    // 确认按钮
    this.addButton(centerX - width * 0.25, height * 0.88, width * 0.5, height * 0.1, '确认创建', () => {
      this.confirmCreate();
    }, {
      bgColor: CONFIG.THEME.PRIMARY,
      textColor: '#0a192f'
    });
  }

  // 设置性别按钮样式
  setupGenderButtons() {
    // 重新设置按钮（跳过前3个按钮：返回、输入框、性别标签）
    const maleBtn = this.buttons[2];
    const femaleBtn = this.buttons[3];

    if (this.selectedGender === 'male') {
      maleBtn.style.bgColor = 'rgba(100, 255, 218, 0.2)';
      maleBtn.style.textColor = '#64ffda';
      maleBtn.style.borderColor = '#64ffda';
      femaleBtn.style.bgColor = 'rgba(255, 255, 255, 0.05)';
      femaleBtn.style.textColor = '#8892b0';
      femaleBtn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
    } else {
      maleBtn.style.bgColor = 'rgba(255, 255, 255, 0.05)';
      maleBtn.style.textColor = '#8892b0';
      maleBtn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      femaleBtn.style.bgColor = 'rgba(255, 182, 193, 0.2)';
      femaleBtn.style.textColor = '#ffb6c1';
      femaleBtn.style.borderColor = '#ffb6c1';
    }
  }

  showKeyboard() {
    // 使用微信小游戏的输入框功能
    wx.showModal({
      title: '输入球员姓名',
      editable: true,
      placeholderText: '请输入姓名',
      success: (res) => {
        if (res.confirm && res.content) {
          const name = res.content.trim();
          if (name) {
            this.playerName = name;
            // 更新输入框按钮的文字
            this.buttons[1].text = name;
            this.buttons[1].textColor = CONFIG.THEME.TEXT_MAIN;
          }
        }
      }
    });
  }

  confirmCreate() {
    const name = this.playerName.trim() || '网球新星';
    this.game.player = new Player(name, this.selectedGender);
    this.game.gameData = {
      month: 1,
      week: 1,
      year: 2024,
      gameActive: true,
      specialEvents: [],
      actionHistory: {},
      ongoingTournament: null,
      weeklyActions: {
        trainingRestCount: 0,
        matchCount: 0
      }
    };
    this.game.saveGame();
    this.game.changeScene(GAME_STATE.HOME);
  }

  render(ctx) {
    const { width, height } = this.getCanvasSize();
    const centerX = width / 2;

    // 背景 - 统一方法
    this.drawBackground(ctx);

    // 标题 - 统一方法
    this.drawTitle(ctx, '创建你的球员');

    this.drawCard(ctx, centerX - width * 0.35, height * 0.42, width * 0.3, height * 0.08, '选择性别:');

    // 绘制UI元素 - 统一方法
    this.renderButtons(ctx);

    // 如果有键盘输入，显示输入的名字
    if (this.playerName) {
      ctx.fillStyle = CONFIG.THEME.TEXT_MAIN;
      ctx.font = `${width * 0.04}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(this.playerName, width / 2, height * 0.42);
    }
  }
}

module.exports = CreatePlayerScene;
