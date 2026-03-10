/**
 * 卡组管理场景
 */
const { Scene, GAME_STATE, CONFIG } = require('./scene.js');
const { getCardById, CARD_TYPE, RARITY } = require('../data/cards.js');
const { Deck, DECK_RULES } = require('../models/deck.js');

class DeckScene extends Scene {
  constructor(game) {
    super(game);
    this.phase = 'main'; // main: 主界面, select: 选择卡牌
    this.viewMode = 'deck'; // deck: 当前卡组, collection: 收藏
    this.selectedCard = null;
    
    // 滚动相关
    this.scrollOffset = 0;
    this.maxScroll = 0;
    
    // 触摸相关 - 用于区分滑动和点击
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchStartTime = 0;
    this.isScrolling = false;
    
    this.initUI();
  }

  initUI() {
    const { width, height } = this.getCanvasSize();
    
    // 返回按钮
    this.addButton(width * 0.03, width * 0.03, width * 0.12, width * 0.12, '←', () => {
      this.exitDeck();
    }, {
      bgColor: 'transparent',
      textColor: CONFIG.THEME.PRIMARY,
      borderColor: CONFIG.THEME.PRIMARY,
      fontSize: width * 0.06
    });
  }

  enter() {
    this.phase = 'main';
    this.viewMode = 'deck';
    this.selectedCard = null;
    this.scrollOffset = 0;
    
    this.buttons = [];
    this.initUI();
    this.setupButtons();
    
    // 计算最大滚动
    this.calculateMaxScroll();
  }

  // 计算最大滚动距离
  calculateMaxScroll() {
    const { width, height } = this.getCanvasSize();
    const player = this.game.player;
    
    if (this.viewMode === 'deck') {
      const deck = player.currentDeck;
      const allCards = deck.getCards() || [];
      const cardHeight = height * 0.12;
      const cardSpacing = height * 0.01;
      const startY = height * 0.26;
      const totalHeight = allCards.length * (cardHeight + cardSpacing);
      const panelHeight = height * 0.7; // 可见区域高度
      // 需要滚动的总距离 = 内容总高度 - 可见区域 + 起始位置偏移
      this.maxScroll = Math.max(0, totalHeight - panelHeight + startY);
    } else {
      const cardManager = player.cardManager;
      const ownedCards = cardManager.getOwnedCards() || [];
      const cardHeight = height * 0.14;
      const cardSpacing = height * 0.01;
      const cardsPerRow = 2;
      const rowCount = Math.ceil(ownedCards.length / cardsPerRow);
      const totalHeight = rowCount * (cardHeight + cardSpacing);
      const panelHeight = height * 0.75;
      const startY = height * 0.22;
      this.maxScroll = Math.max(0, totalHeight - panelHeight + startY);
    }
    
    this.scrollOffset = Math.min(this.scrollOffset, this.maxScroll);
  }

  setupButtons() {
    const { width, height } = this.getCanvasSize();
    
    // 切换视图按钮
    this.addButton(width * 0.05, height * 0.11, width * 0.42, height * 0.055, 
      '📋 当前卡组', () => {
        this.viewMode = 'deck';
        this.scrollOffset = 0;
        this.calculateMaxScroll();
        this.setupButtons();
      }, {
        bgColor: this.viewMode === 'deck' ? '#4299e1' : '#2d3748',
        textColor: '#fff',
        fontSize: width * 0.03
      });
    
    this.addButton(width * 0.53, height * 0.11, width * 0.42, height * 0.055, 
      '🎴 卡牌收藏', () => {
        this.viewMode = 'collection';
        this.scrollOffset = 0;
        this.calculateMaxScroll();
        this.setupButtons();
      }, {
        bgColor: this.viewMode === 'collection' ? '#805ad5' : '#2d3748',
        textColor: '#fff',
        fontSize: width * 0.03
      });
  }

  exitDeck() {
    this.game.changeScene(GAME_STATE.HOME);
  }

  // 处理滚动
  handleScroll(deltaY) {
    this.scrollOffset -= deltaY;
    if (this.scrollOffset < 0) this.scrollOffset = 0;
    if (this.scrollOffset > this.maxScroll) this.scrollOffset = this.maxScroll;
  }

  // 触摸处理 - 与训练场景保持一致
  handleTouch(x, y, type) {
    if (type === 'touchstart') {
      // 记录触摸起始位置和时间
      this.touchStartX = x;
      this.touchStartY = y;
      this.touchStartTime = Date.now();
      this.isScrolling = false;
    } else if (type === 'touchmove') {
      // 计算移动距离
      const dx = x - this.touchStartX;
      const dy = y - this.touchStartY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 如果移动超过阈值，认为是滑动
      if (distance > 10) {
        this.isScrolling = true;
        // 触发了滑动，处理滚动
        const deltaY = y - this.touchStartY;
        this.handleScroll(deltaY);
        this.touchStartY = y; // 更新起始位置以实现连续滚动
      }
    } else if (type === 'touchend') {
      // 检查是否是点击（没有滑动且触摸时间短）
      const touchDuration = Date.now() - this.touchStartTime;
      if (!this.isScrolling && touchDuration < 300) {
        // 处理点击
        this.handleTap(x, y);
      }
    }
    
    // 处理按钮点击
    super.handleTouch(x, y, type);
  }

  // 处理点击
  handleTap(x, y) {
    const { width, height } = this.getCanvasSize();
    
    // 在这里处理卡牌点击等逻辑
  }

  render(ctx) {
    const { width, height } = this.getCanvasSize();
    const player = this.game.player;
    
    // 背景
    ctx.fillStyle = CONFIG.THEME.BACKGROUND;
    ctx.fillRect(0, 0, width, height);
    
    // 标题
    ctx.fillStyle = CONFIG.THEME.GOLD;
    ctx.font = 'bold ' + (width * 0.05) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎴 卡组管理', width / 2, height * 0.055);
    
    // 渲染按钮
    for (const button of this.buttons) {
      button.render(ctx);
    }
    
    // 根据视图模式渲染
    if (this.viewMode === 'deck') {
      this.renderDeckView(ctx, player, width, height);
    } else {
      this.renderCollectionView(ctx, player, width, height);
    }
  }

  renderDeckView(ctx, player, width, height) {
    const deck = player.currentDeck;
    const deckInfo = deck.getDeckInfo();
    
    // 卡组信息
    ctx.fillStyle = CONFIG.THEME.TEXT_SECONDARY;
    ctx.font = (width * 0.03) + 'px sans-serif';
    ctx.fillText(`卡组数量: ${deckInfo.totalCards}/15`, width * 0.05, height * 0.18);
    
    // 显示卡组规则
    ctx.fillStyle = CONFIG.THEME.PRIMARY;
    ctx.font = (width * 0.025) + 'px sans-serif';
    ctx.fillText('必带: 发球×1-3 接发×1-3 底线×1-3', width * 0.05, height * 0.22);
    
    // 获取所有卡牌
    const allCards = deck.getCards() || [];
    
    // 卡牌列表
    const cardWidth = width * 0.9;
    const cardHeight = height * 0.12;
    const startY = height * 0.26;
    const spacing = height * 0.01;
    
    // 渲染卡牌
    ctx.save();
    ctx.translate(0, -this.scrollOffset);
    
    for (let i = 0; i < allCards.length; i++) {
      const card = allCards[i];
      const y = startY + i * (cardHeight + spacing);
      
      if (y + cardHeight > height * 0.2 && y < height * 0.95) {
        this.renderCardItem(ctx, card, width * 0.05, y, cardWidth, cardHeight, true);
      }
    }
    
    ctx.restore();
    
    // 滚动指示器
    if (this.maxScroll > 0) {
      const scrollBarHeight = Math.min(height * 0.1, height * 0.15);
      const scrollRatio = this.scrollOffset / this.maxScroll;
      const scrollBarY = startY + scrollRatio * (height * 0.6 - scrollBarHeight);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(width * 0.95, scrollBarY, 3, scrollBarHeight);
    }
  }

  renderCollectionView(ctx, player, width, height) {
    const cardManager = player.cardManager;
    const ownedCards = cardManager.getOwnedCards() || [];
    
    // 碎片显示
    ctx.fillStyle = CONFIG.THEME.TEXT_SECONDARY;
    ctx.font = (width * 0.03) + 'px sans-serif';
    ctx.fillText(`碎片: R×${cardManager.getFragmentCount('R')} SR×${cardManager.getFragmentCount('SR')} SSR×${cardManager.getFragmentCount('SSR')} UR×${cardManager.getFragmentCount('UR')}`, 
      width * 0.05, height * 0.18);
    
    // 卡牌列表
    const cardWidth = width * 0.42;
    const cardHeight = height * 0.14;
    const startY = height * 0.22;
    const spacing = height * 0.01;
    const cardsPerRow = 2;
    
    // 按稀有度排序
    ownedCards.sort((a, b) => {
      const rarityOrder = { 'UR': 0, 'SSR': 1, 'SR': 2, 'R': 3 };
      return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    });
    
    // 渲染卡牌
    ctx.save();
    ctx.translate(0, -this.scrollOffset);
    
    for (let i = 0; i < ownedCards.length; i++) {
      const card = ownedCards[i];
      const col = i % cardsPerRow;
      const row = Math.floor(i / cardsPerRow);
      
      const x = width * 0.05 + col * (cardWidth + width * 0.04);
      const y = startY + row * (cardHeight + spacing);
      
      if (y + cardHeight > height * 0.15 && y < height * 0.95) {
        this.renderCardItem(ctx, card, x, y, cardWidth, cardHeight, false, card.count);
      }
    }
    
    ctx.restore();
    
    // 滚动指示器
    if (this.maxScroll > 0) {
      const scrollBarHeight = Math.min(height * 0.1, height * 0.15);
      const scrollRatio = this.scrollOffset / this.maxScroll;
      const scrollBarY = startY + scrollRatio * (height * 0.65 - scrollBarHeight);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(width * 0.95, scrollBarY, 3, scrollBarHeight);
    }
  }

  renderCardItem(ctx, card, x, y, width, height, showRemove, count = 1) {
    const rarity = RARITY[card.rarity];
    
    // 卡片背景
    ctx.fillStyle = '#1a1a2e';
    ctx.strokeStyle = rarity.color;
    ctx.lineWidth = 2;
    this.drawRoundRect(ctx, x, y, width, height, 8);
    ctx.fill();
    ctx.stroke();
    
    // 稀有度标识
    ctx.fillStyle = rarity.color;
    ctx.font = 'bold ' + (width * 0.06) + 'px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(card.rarity, x + width * 0.02, y + height * 0.15);
    
    // 卡牌名称
    ctx.fillStyle = '#fff';
    ctx.font = 'bold ' + (width * 0.1) + 'px sans-serif';
    ctx.fillText(card.name, x + width * 0.02, y + height * 0.4);
    
    // 卡牌类型
    const typeNames = {
      'serve': '发球', 'return': '接发', 'baseline': '底线',
      'volley': '截击', 'dropShot': '小球', 'slice': '切削',
      'lob': '月亮球', 'smash': '高压'
    };
    ctx.fillStyle = '#8892b0';
    ctx.font = (width * 0.07) + 'px sans-serif';
    ctx.fillText(typeNames[card.type] || card.type, x + width * 0.02, y + height * 0.62);
    
    // 数量
    if (count > 1) {
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold ' + (width * 0.08) + 'px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('×' + count, x + width * 0.95, y + height * 0.2);
    }
    
    // 成功率和难度
    if (card.acc > 0) {
      ctx.fillStyle = '#68d391';
      ctx.font = (width * 0.07) + 'px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`成功:${card.acc}%`, x + width * 0.95, y + height * 0.75);
      ctx.fillStyle = '#f56565';
      ctx.fillText(`难度:${card.diff}`, x + width * 0.95, y + height * 0.92);
    }
    
    // 移除按钮（仅在卡组视图中显示）
    if (showRemove) {
      ctx.fillStyle = '#e53e3e';
      ctx.fillRect(x + width - width * 0.15, y + height * 0.35, width * 0.13, height * 0.3);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold ' + (width * 0.08) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('移除', x + width - width * 0.075, y + height * 0.55);
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

module.exports = DeckScene;
