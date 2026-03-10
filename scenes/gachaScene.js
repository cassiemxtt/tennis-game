/**
 * 抽卡场景
 */
const { Scene, GAME_STATE } = require('./scene.js');
const { randomDraw, drawTen, getCardById, CARD_RARITY, CARD_TYPE, RARITY } = require('../data/cards.js');

class GachaScene extends Scene {
  constructor(game) {
    super(game);
    this.phase = 'main'; // main, single, ten, result
    this.drawnCards = [];
    this.currentCardIndex = 0;
    this.animationTimer = 0;
    this.cost = 1000; // 单抽价格
    this.tenCost = 10000; // 十连价格
    
    this.initUI();
  }

  initUI() {
    const canvasWidth = this.game.canvasWidth || 375;
    
    // 返回按钮
    this.addButton(canvasWidth * 0.03, canvasWidth * 0.03, canvasWidth * 0.12, canvasWidth * 0.12, '←', () => {
      this.exitGacha();
    }, {
      bgColor: 'transparent',
      textColor: '#64ffda',
      borderColor: '#64ffda',
      fontSize: canvasWidth * 0.06
    });
  }

  enter() {
    this.phase = 'main';
    this.drawnCards = [];
    this.currentCardIndex = 0;
    
    // 重新设置按钮
    this.buttons = [];
    this.initUI();
    this.setupMainButtons();
  }

  setupMainButtons() {
    const canvasWidth = this.game.canvasWidth || 375;
    const canvasHeight = this.game.canvasHeight || 667;
    
    // 单抽按钮
    this.addButton(canvasWidth * 0.15, canvasHeight * 0.45, canvasWidth * 0.3, canvasHeight * 0.08, 
      '单抽 $' + this.cost, () => {
        this.doSingleDraw();
      }, {
        bgColor: '#4299e1',
        textColor: '#fff',
        fontSize: canvasWidth * 0.04
      });
    
    // 十连抽按钮
    this.addButton(canvasWidth * 0.55, canvasHeight * 0.45, canvasWidth * 0.3, canvasHeight * 0.08, 
      '十连 $' + this.tenCost, () => {
        this.doTenDraw();
      }, {
        bgColor: '#805ad5',
        textColor: '#fff',
        fontSize: canvasWidth * 0.04
      });
    
    // 碎片合成按钮
    this.addButton(canvasWidth * 0.15, canvasHeight * 0.58, canvasWidth * 0.7, canvasHeight * 0.07, 
      '🧩 碎片合成', () => {
        this.showSynthesizePanel();
      }, {
        bgColor: '#38a169',
        textColor: '#fff',
        fontSize: canvasWidth * 0.035
      });
  }

  exitGacha() {
    this.game.changeScene(GAME_STATE.HOME);
  }

  doSingleDraw() {
    const player = this.game.player;
    
    if (player.money < this.cost) {
      this.game.showToast('资金不足！');
      return;
    }
    
    player.money -= this.cost;
    const card = randomDraw();
    
    if (card) {
      player.cardManager.addCard(card.id, 1);
      this.drawnCards = [card];
      this.phase = 'result';
      this.showResult();
    }
  }

  doTenDraw() {
    const player = this.game.player;
    
    if (player.money < this.tenCost) {
      this.game.showToast('资金不足！');
      return;
    }
    
    player.money -= this.tenCost;
    const cards = drawTen();
    
    for (const card of cards) {
      player.cardManager.addCard(card.id, 1);
    }
    
    this.drawnCards = cards;
    this.phase = 'result';
    this.showResult();
  }

  showResult() {
    this.buttons = [];
    const canvasWidth = this.game.canvasWidth || 375;
    const canvasHeight = this.game.canvasHeight || 667;
    
    // 确认按钮
    this.addButton(canvasWidth * 0.3, canvasHeight * 0.85, canvasWidth * 0.4, canvasHeight * 0.07, 
      '确认', () => {
        this.enter();
      }, {
        bgColor: '#64ffda',
        textColor: '#0a192f',
        fontSize: canvasWidth * 0.04
      });
  }

  showSynthesizePanel() {
    this.game.showToast('碎片合成功能开发中...');
  }

  handleTap(x, y) {
    // 处理返回按钮的点击
    super.handleTouch(x, y, 'touchend');
  }

  render(ctx) {
    const canvasWidth = this.game.canvasWidth || 375;
    const canvasHeight = this.game.canvasHeight || 667;
    const player = this.game.player;
    
    // 背景
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    if (this.phase === 'main') {
      this.renderMain(ctx, player, canvasWidth, canvasHeight);
    } else if (this.phase === 'result') {
      this.renderResult(ctx, player, canvasWidth, canvasHeight);
    }
    
    for (const button of this.buttons) {
      button.render(ctx);
    }
  }

  renderMain(ctx, player, canvasWidth, canvasHeight) {
    // 标题
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold ' + (canvasWidth * 0.055) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🃏 卡牌抽卡', canvasWidth / 2, canvasHeight * 0.08);
    
    // 当前金钱
    ctx.fillStyle = '#68d391';
    ctx.font = (canvasWidth * 0.035) + 'px sans-serif';
    ctx.fillText('💰 $' + player.money, canvasWidth / 2, canvasHeight * 0.14);
    
    // 玩家碎片
    ctx.fillStyle = '#8892b0';
    ctx.font = (canvasWidth * 0.03) + 'px sans-serif';
    const cardManager = player.cardManager;
    ctx.fillText(`碎片: R×${cardManager.getFragmentCount('R')} | SR×${cardManager.getFragmentCount('SR')} | SSR×${cardManager.getFragmentCount('SSR')} | UR×${cardManager.getFragmentCount('UR')}`, 
      canvasWidth / 2, canvasHeight * 0.19);
    
    // 卡池说明
    ctx.fillStyle = '#64ffda';
    ctx.font = (canvasWidth * 0.035) + 'px sans-serif';
    ctx.fillText('卡池概率:', canvasWidth / 2, canvasHeight * 0.26);
    
    ctx.fillStyle = '#8892b0';
    ctx.font = (canvasWidth * 0.028) + 'px sans-serif';
    ctx.fillText('R(普通): 60% | SR(稀有): 25% | SSR(史诗): 10% | UR(传奇): 5%', 
      canvasWidth / 2, canvasHeight * 0.30);
    
    // 抽卡说明
    ctx.fillStyle = '#ccd6f6';
    ctx.font = (canvasWidth * 0.032) + 'px sans-serif';
    ctx.fillText('训练可获得碎片，碎片可合成卡牌', canvasWidth / 2, canvasHeight * 0.36);
  }

  renderResult(ctx, player, canvasWidth, canvasHeight) {
    // 标题
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold ' + (canvasWidth * 0.05) + 'px sans-serif';
    ctx.textAlign = 'center';
    
    const isTenDraw = this.drawnCards.length > 1;
    ctx.fillText(isTenDraw ? '🎉 十连抽结果' : '✨ 单抽结果', canvasWidth / 2, canvasHeight * 0.08);
    
    // 显示抽到的卡牌
    const startY = canvasHeight * 0.15;
    const cardWidth = canvasWidth * 0.28;
    const cardHeight = canvasHeight * 0.22;
    const spacing = canvasWidth * 0.02;
    
    // 计算每行显示数量
    const cardsPerRow = isTenDraw ? 5 : 3;
    
    for (let i = 0; i < this.drawnCards.length; i++) {
      const card = this.drawnCards[i];
      const col = i % cardsPerRow;
      const row = Math.floor(i / cardsPerRow);
      
      const x = (canvasWidth - (cardsPerRow * cardWidth + (cardsPerRow - 1) * spacing)) / 2 + col * (cardWidth + spacing);
      const y = startY + row * (cardHeight + spacing);
      
      // 卡片背景
      const rarity = RARITY[card.rarity];
      ctx.fillStyle = '#1a1a2e';
      ctx.strokeStyle = rarity.color;
      ctx.lineWidth = 3;
      this.drawRoundRect(ctx, x, y, cardWidth, cardHeight, 10);
      ctx.fill();
      ctx.stroke();
      
      // 稀有度标识
      ctx.fillStyle = rarity.color;
      ctx.font = 'bold ' + (canvasWidth * 0.025) + 'px sans-serif';
      ctx.fillText(card.rarity, x + cardWidth / 2, y + canvasHeight * 0.025);
      
      // 卡牌名称
      ctx.fillStyle = '#fff';
      ctx.font = 'bold ' + (canvasWidth * 0.032) + 'px sans-serif';
      ctx.fillText(card.name, x + cardWidth / 2, y + cardHeight * 0.35);
      
      // 卡牌类型
      const typeNames = {
        'serve': '发球', 'return': '接发', 'baseline': '底线',
        'volley': '截击', 'dropShot': '小球', 'slice': '切削',
        'lob': '月亮球', 'smash': '高压', 'coach': '教练',
        'item': '道具', 'ultimate': '绝招'
      };
      ctx.fillStyle = '#8892b0';
      ctx.font = (canvasWidth * 0.024) + 'px sans-serif';
      ctx.fillText(typeNames[card.type] || card.type, x + cardWidth / 2, y + cardHeight * 0.52);
      
      // 成功率/难度
      if (card.acc > 0) {
        ctx.fillStyle = '#68d391';
        ctx.fillText(`成功:${card.acc}%`, x + cardWidth / 2, y + cardHeight * 0.68);
        ctx.fillStyle = '#f56565';
        ctx.fillText(`难度:${card.diff}`, x + cardWidth / 2, y + cardHeight * 0.80);
      }
      
      // 描述
      ctx.fillStyle = '#aaa';
      ctx.font = (canvasWidth * 0.02) + 'px sans-serif';
      const desc = card.description || '';
      if (desc.length > 15) {
        ctx.fillText(desc.substring(0, 15), x + cardWidth / 2, y + cardHeight * 0.93);
      } else {
        ctx.fillText(desc, x + cardWidth / 2, y + cardHeight * 0.93);
      }
    }
    
    // 统计信息
    const srCount = this.drawnCards.filter(c => c.rarity === 'SR').length;
    const ssrCount = this.drawnCards.filter(c => c.rarity === 'SSR').length;
    const urCount = this.drawnCards.filter(c => c.rarity === 'UR').length;
    
    let bonusText = '';
    if (urCount > 0) bonusText += '🎉 ';
    if (ssrCount > 0) bonusText += '⭐ ';
    if (srCount > 0) bonusText += '✨ ';
    
    if (bonusText) {
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold ' + (canvasWidth * 0.04) + 'px sans-serif';
      ctx.fillText(bonusText, canvasWidth / 2, canvasHeight * 0.78);
    }
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
  }
}

module.exports = GachaScene;
