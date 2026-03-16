/**
 * 卡组管理场景 - 支持多卡组版本
 */
const { Scene, GAME_STATE, CONFIG } = require('./scene.js');
const { getCardById, CARD_TYPE, RARITY } = require('../data/cards.js');
const { Deck, DeckManager, DECK_RULES } = require('../models/deck.js');

class DeckScene extends Scene {
  constructor(game) {
    super(game);
    // phase: 'main' 主界面(卡组列表), 'edit' 编辑卡组, 'collection' 选择卡牌
    this.phase = 'main';
    // 当前正在编辑的卡组索引
    this.editingDeckIndex = -1;
    // 当前选中的卡牌
    this.selectedCard = null;
    
    // 滚动相关
    this.scrollOffset = 0;
    this.maxScroll = 0;
    
    // 触摸相关 - 用于区分滑动和点击
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchStartTime = 0;
    this.isScrolling = false;
    
    // 名称编辑状态
    this.isEditingName = false;
    this.newDeckName = '';
    
    this.initUI();
  }

  initUI() {
    const { width, height } = this.getCanvasSize();
    
    // 返回按钮
    this.addButton(width * 0.03, width * 0.03, width * 0.12, width * 0.12, '←', () => {
      this.handleBack();
    }, {
      bgColor: 'transparent',
      textColor: CONFIG.THEME.PRIMARY,
      borderColor: CONFIG.THEME.PRIMARY,
      fontSize: width * 0.06
    });
  }

  enter() {
    this.phase = 'main';
    this.editingDeckIndex = -1;
    this.selectedCard = null;
    this.scrollOffset = 0;
    this.isEditingName = false;
    
    this.buttons = [];
    this.initUI();
    this.setupMainButtons();
    
    // 计算最大滚动
    this.calculateMaxScroll();
  }

  // 返回按钮处理
  handleBack() {
    if (this.phase === 'edit') {
      // 从编辑页面返回主界面
      this.phase = 'main';
      this.editingDeckIndex = -1;
      this.scrollOffset = 0;
      this.buttons = [];
      this.initUI();
      this.setupMainButtons();
    } else if (this.phase === 'collection') {
      // 从选择卡牌返回编辑页面
      this.phase = 'edit';
      this.scrollOffset = 0;
      this.buttons = [];
      this.initUI();
      this.setupEditButtons();
    } else {
      this.exitDeck();
    }
  }

  // 设置主界面（卡组列表）按钮
  setupMainButtons() {
    const { width, height } = this.getCanvasSize();
    const player = this.game.player;
    const deckManager = player.getDeckManager();
    const decks = deckManager.getAllDecks();
    
    // 显示3个卡组槽位
    for (let i = 0; i < 3; i++) {
      const deck = decks[i];
      const y = height * 0.18 + i * height * 0.22;
      const deckIndex = i;
      
      if (deck) {
        // 已有卡组 - 点击进入编辑
        const cardCount = deck.cards ? deck.cards.length : 0;
        const power = deckManager.calculateDeckPower(deck);
        
        this.addButton(width * 0.05, y, width * 0.9, height * 0.18, '', () => {
          this.enterDeckEdit(deckIndex);
        }, {
          bgColor: '#1a1a2e',
          textColor: '#fff',
          fontSize: width * 0.03
        });
      } else {
        // 空卡组槽位 - 点击直接进入选卡页面（自动创建卡组）
        this.addButton(width * 0.05, y, width * 0.9, height * 0.18, '+ 创建并添加卡牌', () => {
          const result = deckManager.createDeck('卡组' + (i + 1));
          if (result.success) {
            // 创建成功后自动进入选卡页面
            this.enterDeckEdit(deckIndex);
          } else {
            this.game.showToast(result.message);
          }
        }, {
          bgColor: '#1a1a2e',
          textColor: '#64ffda',
          fontSize: width * 0.035
        });
      }
    }
    
    // 底部切换卡组区域（常驻显示）
    const switchY = height * 0.86;
    const buttonWidth = width * 0.28;
    const buttonHeight = height * 0.08;
    const buttonSpacing = width * 0.03;
    const totalWidth = buttonWidth * 3 + buttonSpacing * 2;
    const startX = (width - totalWidth) / 2;
    
    const activeIndex = deckManager.getActiveDeckIndex();
    
    // 为3个卡组槽位都创建切换按钮
    for (let i = 0; i < 3; i++) {
      const deck = decks[i];
      const x = startX + i * (buttonWidth + buttonSpacing);
      const isActive = (i === activeIndex);
      const hasDeck = !!deck;
      
      if (hasDeck) {
        // 已有卡组 - 可切换
        this.addButton(x, switchY, buttonWidth, buttonHeight, isActive ? '✓ 卡组' + (i + 1) : '卡组' + (i + 1), () => {
          deckManager.setActiveDeck(i);
          this.game.showToast('已切换到卡组' + (i + 1));
          this.setupMainButtons();
        }, {
          bgColor: isActive ? '#68d391' : '#2d3748',
          textColor: isActive ? '#1a1a2e' : '#fff',
          fontSize: width * 0.03
        });
      } else {
        // 空卡组 - 显示为禁用状态
        this.addButton(x, switchY, buttonWidth, buttonHeight, '卡组' + (i + 1), () => {
          // 点击空白卡组无操作
        }, {
          bgColor: 'rgba(45, 55, 72, 0.5)',
          textColor: 'rgba(255, 255, 255, 0.3)',
          fontSize: width * 0.03
        });
      }
    }
  }

  // 进入卡组编辑
  enterDeckEdit(deckIndex) {
    this.phase = 'edit';
    this.editingDeckIndex = deckIndex;
    this.scrollOffset = 0;
    this.buttons = [];
    this.initUI();
    this.setupEditButtons();
    this.calculateMaxScroll();
  }

  // 设置编辑页面按钮
  setupEditButtons() {
    const { width, height } = this.getCanvasSize();
    const player = this.game.player;
    const deckManager = player.getDeckManager();
    const deck = deckManager.getDeck(this.editingDeckIndex);
    
    if (!deck) return;
    
    // 编辑名称按钮
    this.addButton(width * 0.05, height * 0.11, width * 0.28, height * 0.05, '✏️ 改名', () => {
      this.isEditingName = true;
      this.newDeckName = deck.name || '卡组' + (this.editingDeckIndex + 1);
      this.setupEditButtons();
    }, {
      bgColor: '#4a5568',
      textColor: '#fff',
      fontSize: width * 0.025
    });
    
    // 查看收藏按钮
    this.addButton(width * 0.38, height * 0.11, width * 0.28, height * 0.05, '🎴 选卡', () => {
      this.phase = 'collection';
      this.scrollOffset = 0;
      this.buttons = [];
      this.initUI();
      this.setupCollectionButtons();
      this.calculateMaxScroll();
    }, {
      bgColor: '#805ad5',
      textColor: '#fff',
      fontSize: width * 0.025
    });
    
    // 删除卡组按钮（如果不是最后一个）
    if (deckManager.getDeckCount() > 1) {
      this.addButton(width * 0.71, height * 0.11, width * 0.24, height * 0.05, '🗑️ 删除', () => {
        const result = deckManager.deleteDeck(this.editingDeckIndex);
        if (result.success) {
          this.game.showToast('卡组已删除');
          this.phase = 'main';
          this.editingDeckIndex = -1;
          this.buttons = [];
          this.initUI();
          this.setupMainButtons();
        }
      }, {
        bgColor: '#e53e3e',
        textColor: '#fff',
        fontSize: width * 0.025
      });
    }
  }

  // 设置选择卡牌页面按钮
  setupCollectionButtons() {
    const { width, height } = this.getCanvasSize();
    // 这里只添加返回按钮，其他通过点击卡牌添加
  }

  // 计算最大滚动距离
  calculateMaxScroll() {
    const { width, height } = this.getCanvasSize();
    const player = this.game.player;
    
    if (this.phase === 'edit' || this.phase === 'main') {
      this.maxScroll = 0; // 这两个页面不需要滚动
    } else if (this.phase === 'collection') {
      const cardManager = player.cardManager;
      const ownedCards = cardManager.getOwnedCards() || [];
      const cardHeight = height * 0.14;
      const cardSpacing = height * 0.01;
      const cardsPerRow = 2;
      const rowCount = Math.ceil(ownedCards.length / cardsPerRow);
      const totalHeight = rowCount * (cardHeight + cardSpacing);
      const panelHeight = height * 0.75;
      const startY = height * 0.18;
      this.maxScroll = Math.max(0, totalHeight - panelHeight + startY);
      this.scrollOffset = Math.min(this.scrollOffset, this.maxScroll);
    }
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

  // 触摸处理
  handleTouch(x, y, type) {
    if (type === 'touchstart') {
      this.touchStartX = x;
      this.touchStartY = y;
      this.touchStartTime = Date.now();
      this.isScrolling = false;
    } else if (type === 'touchmove') {
      const dx = x - this.touchStartX;
      const dy = y - this.touchStartY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 10) {
        this.isScrolling = true;
        if (this.phase === 'collection') {
          const deltaY = y - this.touchStartY;
          this.handleScroll(deltaY);
          this.touchStartY = y;
        }
      }
    } else if (type === 'touchend') {
      const touchDuration = Date.now() - this.touchStartTime;
      if (!this.isScrolling && touchDuration < 300) {
        this.handleTap(x, y);
      }
    }
    
    super.handleTouch(x, y, type);
  }

  // 处理点击
  handleTap(x, y) {
    const { width, height } = this.getCanvasSize();
    const player = this.game.player;
    
    if (this.phase === 'edit' && this.isEditingName) {
      // 名称编辑框点击处理
      // 这里可以添加输入框交互逻辑
    } else if (this.phase === 'collection') {
      // 选择卡牌页面 - 检查是否点击了某张卡
      const cardManager = player.cardManager;
      const ownedCards = cardManager.getOwnedCards() || [];
      const cardWidth = width * 0.42;
      const cardHeight = height * 0.14;
      const startX = width * 0.05;
      const startY = height * 0.18;
      const spacing = height * 0.01;
      const cardsPerRow = 2;
      
      for (let i = 0; i < ownedCards.length; i++) {
        const card = ownedCards[i];
        const col = i % cardsPerRow;
        const row = Math.floor(i / cardsPerRow);
        
        const cardX = startX + col * (cardWidth + width * 0.04);
        const cardY = startY + row * (cardHeight + spacing) - this.scrollOffset;
        
        if (x >= cardX && x <= cardX + cardWidth && y >= cardY && y <= cardY + cardHeight) {
          this.addCardToDeck(card.id);
          return;
        }
      }
    }
  }

  // 添加卡牌到当前编辑的卡组
  addCardToDeck(cardId) {
    const player = this.game.player;
    const deckManager = player.getDeckManager();
    const deck = deckManager.getDeck(this.editingDeckIndex);
    
    if (!deck) return;
    
    // 检查卡牌是否已在卡组中
    const isInDeck = deck.cards && deck.cards.includes(cardId);
    if (isInDeck) {
      // 移除卡牌
      const index = deck.cards.indexOf(cardId);
      if (index > -1) {
        deck.cards.splice(index, 1);
        this.game.showToast('已从卡组移除');
      }
    } else {
      // 添加卡牌
      const result = deck.addCard(cardId);
      if (result.success) {
        this.game.showToast('已添加卡牌');
      } else {
        this.game.showToast(result.message);
      }
    }
    
    // 刷新页面显示
    this.buttons = [];
    this.initUI();
    this.setupCollectionButtons();
  }

  render(ctx) {
    const { width, height } = this.getCanvasSize();
    const player = this.game.player;
    
    // 背景
    ctx.fillStyle = CONFIG.THEME.BACKGROUND;
    ctx.fillRect(0, 0, width, height);
    
    // 渲染按钮
    for (const button of this.buttons) {
      button.render(ctx);
    }
    
    // 根据阶段渲染不同内容
    if (this.phase === 'main') {
      this.renderMainView(ctx, player, width, height);
    } else if (this.phase === 'edit') {
      this.renderEditView(ctx, player, width, height);
    } else if (this.phase === 'collection') {
      this.renderCollectionView(ctx, player, width, height);
    }
  }

  // 渲染主界面（卡组列表）
  renderMainView(ctx, player, width, height) {
    const deckManager = player.getDeckManager();
    const decks = deckManager.getAllDecks();
    
    // 标题
    ctx.fillStyle = CONFIG.THEME.GOLD;
    ctx.font = 'bold ' + (width * 0.05) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎴 卡组管理', width / 2, height * 0.07);
    
    // 副标题
    ctx.fillStyle = CONFIG.THEME.TEXT_SECONDARY;
    ctx.font = (width * 0.025) + 'px sans-serif';
    ctx.fillText('点击卡组进入编辑，最多可创建3个卡组', width / 2, height * 0.11);
    
    // 渲染3个卡组槽位
    const activeIndex = deckManager.getActiveDeckIndex();
    for (let i = 0; i < 3; i++) {
      const deck = decks[i];
      const y = height * 0.18 + i * height * 0.22;
      const cardHeight = height * 0.18;
      
      if (deck) {
        // 已有卡组
        const cardCount = deck.cards ? deck.cards.length : 0;
        const power = deckManager.calculateDeckPower(deck);
        const isActive = (i === activeIndex);
        
        // 卡片背景
        ctx.fillStyle = '#1a1a2e';
        ctx.strokeStyle = isActive ? '#68d391' : '#64ffda';
        ctx.lineWidth = isActive ? 4 : 2;
        this.drawRoundRect(ctx, width * 0.05, y, width * 0.9, cardHeight, 10);
        ctx.fill();
        ctx.stroke();
        
        // 当前选中标记
        if (isActive) {
          ctx.fillStyle = '#68d391';
          ctx.font = 'bold ' + (width * 0.035) + 'px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText('✓ 当前使用', width * 0.93, y + cardHeight * 0.2);
        }
        
        // 卡组名称
        ctx.fillStyle = isActive ? '#68d391' : '#fff';
        ctx.font = 'bold ' + (width * 0.045) + 'px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(deck.name || '卡组' + (i + 1), width * 0.08, y + cardHeight * 0.35);
        
        // 卡牌数量
        ctx.fillStyle = '#8892b0';
        ctx.font = (width * 0.03) + 'px sans-serif';
        ctx.fillText(`卡牌: ${cardCount}/15`, width * 0.08, y + cardHeight * 0.55);
        
        // 综合战力
        ctx.fillStyle = power >= 60 ? '#68d391' : (power >= 40 ? '#ffd700' : '#f56565');
        ctx.fillText(`战力: ${power}`, width * 0.08, y + cardHeight * 0.8);
        
        // 提示文字
        ctx.fillStyle = '#64ffda';
        ctx.font = (width * 0.025) + 'px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('点击编辑 →', width * 0.92, y + cardHeight * 0.5);
      } else {
        // 空卡组槽位
        ctx.fillStyle = '#1a1a2e';
        ctx.strokeStyle = 'rgba(100, 255, 218, 0.3)';
        ctx.lineWidth = 1;
        this.drawRoundRect(ctx, width * 0.05, y, width * 0.9, cardHeight, 10);
        ctx.fill();
        ctx.stroke();
        
        // 加号和提示
        ctx.fillStyle = '#64ffda';
        ctx.font = 'bold ' + (width * 0.06) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('+ 点击创建并添加卡牌', width / 2, y + cardHeight * 0.45);
        
        ctx.fillStyle = '#8892b0';
        ctx.font = (width * 0.025) + 'px sans-serif';
        ctx.fillText('从收藏中选择卡牌加入卡组', width / 2, y + cardHeight * 0.75);
      }
    }
  }

  // 渲染编辑界面
  renderEditView(ctx, player, width, height) {
    const deckManager = player.getDeckManager();
    const deck = deckManager.getDeck(this.editingDeckIndex);
    
    if (!deck) return;
    
    // 标题
    ctx.fillStyle = CONFIG.THEME.GOLD;
    ctx.font = 'bold ' + (width * 0.05) + 'px sans-serif';
    ctx.textAlign = 'center';
    
    if (this.isEditingName) {
      // 名称编辑模式
      ctx.fillText('✏️ 修改名称', width / 2, height * 0.055);
      
      // 显示当前名称输入框
      ctx.fillStyle = '#1a1a2e';
      ctx.strokeStyle = '#64ffda';
      ctx.lineWidth = 2;
      this.drawRoundRect(ctx, width * 0.1, height * 0.15, width * 0.8, height * 0.08, 8);
      ctx.fill();
      ctx.stroke();
      
      ctx.fillStyle = '#fff';
      ctx.font = (width * 0.04) + 'px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(this.newDeckName, width * 0.15, height * 0.2);
      
      // 确认和取消按钮
      ctx.fillStyle = '#64ffda';
      ctx.font = (width * 0.035) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('点击"改名"按钮确认修改', width / 2, height * 0.35);
    } else {
      // 普通编辑模式
      ctx.fillText('📝 ' + (deck.name || '卡组' + (this.editingDeckIndex + 1)), width / 2, height * 0.055);
    }
    
    // 卡组信息
    if (!this.isEditingName) {
      const cardCount = deck.cards ? deck.cards.length : 0;
      const power = deckManager.calculateDeckPower(deck);
      
      ctx.fillStyle = CONFIG.THEME.TEXT_SECONDARY;
      ctx.font = (width * 0.028) + 'px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`卡牌数量: ${cardCount}/15`, width * 0.05, height * 0.175);
      ctx.fillText(`综合战力: ${power}`, width * 0.45, height * 0.175);
      
      // 规则提示
      ctx.fillStyle = CONFIG.THEME.PRIMARY;
      ctx.font = (width * 0.022) + 'px sans-serif';
      ctx.fillText('必带: 发球×1-3 接发×1-3 底线×1-3', width * 0.05, height * 0.21);
      
      // 卡牌列表
      const allCards = deck.getCards ? deck.getCards() : [];
      const cardWidth = width * 0.9;
      const cardHeight = height * 0.12;
      const startY = height * 0.24;
      const spacing = height * 0.01;
      
      for (let i = 0; i < allCards.length; i++) {
        const card = allCards[i];
        const y = startY + i * (cardHeight + spacing);
        
        if (y + cardHeight > height * 0.18 && y < height * 0.95) {
          this.renderCardItem(ctx, card, width * 0.05, y, cardWidth, cardHeight, true);
        }
      }
    }
  }

  // 渲染选择卡牌界面
  renderCollectionView(ctx, player, width, height) {
    const cardManager = player.cardManager;
    const ownedCards = cardManager.getOwnedCards() || [];
    const deckManager = player.getDeckManager();
    const currentDeck = deckManager.getDeck(this.editingDeckIndex);
    const deckCardIds = currentDeck ? currentDeck.cards : [];
    
    // 标题
    ctx.fillStyle = CONFIG.THEME.GOLD;
    ctx.font = 'bold ' + (width * 0.05) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎴 选择卡牌', width / 2, height * 0.055);
    
    // 碎片显示
    ctx.fillStyle = CONFIG.THEME.TEXT_SECONDARY;
    ctx.font = (width * 0.028) + 'px sans-serif';
    ctx.fillText(`碎片: R×${cardManager.getFragmentCount('R')} SR×${cardManager.getFragmentCount('SR')} SSR×${cardManager.getFragmentCount('SSR')} UR×${cardManager.getFragmentCount('UR')}`, 
      width * 0.05, height * 0.1);
    
    // 提示
    ctx.fillStyle = CONFIG.THEME.PRIMARY;
    ctx.font = (width * 0.024) + 'px sans-serif';
    ctx.fillText('点击卡牌添加/移除（绿色边框表示已在卡组中）', width / 2, height * 0.14);
    
    // 卡牌列表
    const cardWidth = width * 0.42;
    const cardHeight = height * 0.14;
    const startY = height * 0.18;
    const spacing = height * 0.01;
    const cardsPerRow = 2;
    
    // 按稀有度排序
    ownedCards.sort((a, b) => {
      const rarityOrder = { 'UR': 0, 'SSR': 1, 'SR': 2, 'R': 3 };
      return (rarityOrder[a.rarity] || 4) - (rarityOrder[b.rarity] || 4);
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
      
      // 检查是否在当前卡组中
      const isInDeck = deckCardIds && deckCardIds.includes(card.id);
      
      if (y + cardHeight > height * 0.1 && y < height) {
        this.renderCardItem(ctx, card, x, y, cardWidth, cardHeight, false, card.count, isInDeck);
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

  renderCardItem(ctx, card, x, y, width, height, showRemove, count = 1, isInDeck = false) {
    const rarity = RARITY[card.rarity];
    
    // 选中状态背景效果
    if (isInDeck) {
      // 选中时背景带绿色光晕
      ctx.fillStyle = 'rgba(104, 211, 145, 0.2)';
      ctx.strokeStyle = '#68d391';
      ctx.lineWidth = 4;
    } else {
      // 未选中时正常背景
      ctx.fillStyle = '#1a1a2e';
      ctx.strokeStyle = rarity.color;
      ctx.lineWidth = 2;
    }
    
    this.drawRoundRect(ctx, x, y, width, height, 8);
    ctx.fill();
    ctx.stroke();
    
    // 选中状态左上角添加明显的对勾标记
    if (isInDeck) {
      // 对勾背景
      ctx.fillStyle = '#68d391';
      ctx.beginPath();
      ctx.arc(x + width * 0.1, y + height * 0.1, width * 0.08, 0, Math.PI * 2);
      ctx.fill();
      
      // 对勾符号
      ctx.fillStyle = '#1a1a2e';
      ctx.font = 'bold ' + (width * 0.1) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✓', x + width * 0.1, y + height * 0.14);
    }
    
    // 稀有度标识（选中时改为白色，避免和绿色冲突）
    ctx.fillStyle = isInDeck ? '#fff' : rarity.color;
    ctx.font = 'bold ' + (width * 0.06) + 'px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(card.rarity, x + width * 0.02, y + height * 0.15);
    
    // 卡牌名称（选中时加粗）
    ctx.fillStyle = isInDeck ? '#68d391' : '#fff';
    ctx.font = 'bold ' + (width * 0.1) + 'px sans-serif';
    ctx.fillText(card.name || '未知', x + width * 0.02, y + height * 0.4);
    
    // 卡牌类型
    const typeNames = {
      'serve': '发球', 'return': '接发', 'baseline': '底线',
      'volley': '截击', 'dropShot': '小球', 'slice': '切削',
      'lob': '月亮球', 'smash': '高压'
    };
    ctx.fillStyle = isInDeck ? '#68d391' : '#8892b0';
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
    
    // 移除按钮（仅在编辑视图中显示）
    if (showRemove) {
      ctx.fillStyle = '#e53e3e';
      ctx.fillRect(x + width - width * 0.15, y + height * 0.35, width * 0.13, height * 0.3);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold ' + (width * 0.08) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('移除', x + width - width * 0.075, y + height * 0.55);
    }
    
    // 在卡组中提示（选中时更明显的显示）
    if (isInDeck) {
      ctx.fillStyle = '#68d391';
      ctx.font = 'bold ' + (width * 0.09) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✓ 已装备', x + width / 2, y + height * 0.92);
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
