/**
 * 生涯统计场景
 */
const { Scene, GAME_STATE, CONFIG } = require('./scene.js');

class StatsScene extends Scene {
  constructor(game) {
    super(game);
    this.initUI();
  }

  initUI() {
    const { width, height } = this.getCanvasSize();
    
    // 返回按钮 - 统一位置
    this.addBackButton(GAME_STATE.HOME);
    
    // 退役按钮 - 放在页面最下方
    const btnWidth = width * 0.6;
    const btnHeight = height * 0.055;
    const btnX = (width - btnWidth) / 2;
    const btnY = height * 0.92;
    
    this.addButton(btnX, btnY, btnWidth, btnHeight, '🏁 退役', () => {
      // 调用 homeScene 的 retire 方法
      this.game.scenes.home.retire();
    }, {
      bgColor: '#e53e3e',
      textColor: '#ffffff',
      fontSize: width * 0.035
    });
  }

  render(ctx) {
    const player = this.game.player;
    if (!player) return;

    const { width, height } = this.getCanvasSize();

    // 背景 - 统一方法
    this.drawBackground(ctx);

    // 标题 - 统一方法
    this.drawTitle(ctx, '📈 生涯数据');

    // 玩家信息
    ctx.fillStyle = CONFIG.THEME.TEXT_MAIN;
    ctx.font = `bold ${width * 0.045}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(player.name, width / 2, height * 0.15);
    ctx.font = `${width * 0.035}px sans-serif`;
    ctx.fillStyle = CONFIG.THEME.TEXT_SECONDARY;
    ctx.fillText(`${player.age}岁 | 职业生涯第${player.careerYear}年`, width / 2, height * 0.19);

    // 排名信息
    this.drawCard(ctx, width * 0.05, height * 0.23, width * 0.9, height * 0.1, '🏆 排名信息');
    ctx.fillStyle = player.ranking <= 999 ? CONFIG.THEME.GOLD : CONFIG.THEME.TEXT_SECONDARY;
    ctx.font = `bold ${width * 0.05}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`当前排名: ${player.ranking <= 999 ? player.ranking : '暂无'}`, width / 2, height * 0.29);
    ctx.font = `${width * 0.035}px sans-serif`;
    ctx.fillStyle = CONFIG.THEME.TEXT_SECONDARY;
    ctx.fillText(`生涯最高: ${player.careerHighRanking <= 999 ? player.careerHighRanking : '-'}  最佳成绩: ${player.bestResult}`, width / 2, height * 0.33);

    // 核心属性
    this.drawCard(ctx, width * 0.05, height * 0.38, width * 0.9, height * 0.28, '💪 核心属性');

    const attrs = [
      { name: '力量', value: player.strength, icon: '💪' },
      { name: '速度', value: player.speed, icon: '🏃' },
      { name: '技术', value: player.technique, icon: '🎯' },
      { name: '耐力', value: player.endurance, icon: '🔥' },
      { name: '心理', value: player.mentality, icon: '🧠' },
      { name: '状态', value: player.form, icon: '😊' }
    ];

    ctx.textAlign = 'left';
    const cardX = width * 0.05;
    const cardWidth = width * 0.9;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 2; j++) {
        const attr = attrs[i * 2 + j];
        const x = cardX + j * (cardWidth / 2);
        const y = height * 0.48 + i * (height * 0.06);

        ctx.font = `${width * 0.032}px sans-serif`;
        ctx.fillStyle = CONFIG.THEME.TEXT_SECONDARY;
        ctx.fillText(`${attr.icon} ${attr.name}: ${attr.value}`, x, y);

        this.drawProgressBar(ctx, x + cardWidth * 0.15, y - height * 0.015, cardWidth * 0.3, height * 0.015, attr.value, CONFIG.THEME.PRIMARY);
      }
    }

    // 综合能力
    ctx.fillStyle = CONFIG.THEME.TEXT_MAIN;
    ctx.font = `bold ${width * 0.038}px sans-serif`;
    ctx.fillText('综合能力', cardX, height * 0.7);
    ctx.fillStyle = CONFIG.THEME.PRIMARY;
    ctx.font = `bold ${width * 0.042}px sans-serif`;
    ctx.fillText(`${player.calculateOverall()}/100`, cardX + width * 0.25, height * 0.7);
    this.drawProgressBar(ctx, cardX, height * 0.72, cardWidth, height * 0.02, player.calculateOverall(), CONFIG.THEME.PRIMARY);

    // 比赛记录
    this.drawCard(ctx, cardX, height * 0.76, cardWidth, height * 0.1, '🎾 比赛记录');
    const winRate = player.getWinRate();

    ctx.textAlign = 'center';
    ctx.fillStyle = CONFIG.THEME.TEXT_MAIN;
    ctx.font = `bold ${width * 0.038}px sans-serif`;
    ctx.fillText(`${player.matchesPlayed} 场  ${player.matchesWon}胜 ${player.matchesPlayed - player.matchesWon}负  胜率 ${winRate}%`, width / 2, height * 0.83);

    // 荣誉成就
    this.drawCard(ctx, cardX, height * 0.88, cardWidth, height * 0.06, '🌟 荣誉成就');

    ctx.textAlign = 'center';
    ctx.fillStyle = CONFIG.THEME.GOLD;
    ctx.font = `bold ${width * 0.038}px sans-serif`;
    ctx.fillText(`🏆 ${player.titles}冠军  🌟 ${player.grandSlams}大满贯  💰 $${player.careerEarnings}`, width / 2, height * 0.93);

    // 绘制按钮 - 统一方法
    this.renderButtons(ctx);
  }
}

module.exports = StatsScene;
