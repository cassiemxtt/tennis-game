/**
 * 道具场景
 * 展示背包中的物品，支持使用道具和查看卡牌
 */
const { Scene, GAME_STATE, CONFIG } = require('./scene.js');
const { ITEM_TYPES, ITEM_CONFIG, ITEM_QUALITY } = require('../models/item.js');
const { STRATEGY_TYPES, STRATEGY_CONFIG, STRATEGY_FRAGMENT_CONFIG, getFragmentsNeeded, StrategyManager } = require('../models/strategy.js');

class ItemScene extends Scene {
  constructor(game) {
    super(game);
    this.selectedTab = 'items'; // 'items' | 'strategies' | 'cards' | 'decks'
    this.selectedDeck = null; // 当前编辑的套牌
    
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
  
  // 计算最大滚动距离 - 与训练场景保持一致
  calculateMaxScroll() {
    const { width, height } = this.getCanvasSize();
    const panelTop = height * 0.20;
    const panelBottom = height * 0.90;
    const panelHeight = panelBottom - panelTop;
    
    // 根据当前tab计算内容高度
    let contentHeight = 0;
    const player = this.game.player;
    
    if (this.selectedTab === 'items') {
      const items = player.inventory.getAllItems();
      const itemHeight = height * 0.12;
      const padding = height * 0.02;
      contentHeight = items.length * (itemHeight + padding);
    } else if (this.selectedTab === 'strategies') {
      let strategyManager = player.strategyManager;
      if (!strategyManager) {
        strategyManager = new StrategyManager();
      }
      const ownedStrategies = strategyManager.getOwnedStrategies();
      const itemHeight = height * 0.15;
      const padding = height * 0.02;
      contentHeight = ownedStrategies.length * (itemHeight + padding) + height * 0.35; // 加上碎片信息区域
    } else if (this.selectedTab === 'cards') {
      const ownedCards = player.cardManager ? player.cardManager.getOwnedCards() : [];
      const cardWidth = width * 0.28;
      const cardHeight = height * 0.18;
      const cardSpacing = width * 0.02;
      const cardsPerRow = 3;
      const rowCount = Math.ceil(ownedCards.length / cardsPerRow);
      contentHeight = rowCount * (cardHeight + cardSpacing) + height * 0.15;
    } else if (this.selectedTab === 'decks') {
      const ownedCards = player.cardManager ? player.cardManager.getOwnedCards() : [];
      const cardTypes = [
        { type: 'serve' }, { type: 'return' }, { type: 'baseline' },
        { type: 'volley' }, { type: 'dropShot' }, { type: 'slice' },
        { type: 'lob' }, { type: 'smash' }, { type: 'coach' },
        { type: 'strategy' }, { type: 'item' }, { type: 'ultimate' }
      ];
      const cardHeight = height * 0.12;
      const cardSpacing = width * 0.015;
      const cardsPerRow = 3;
      
      for (const typeInfo of cardTypes) {
        const typeCards = ownedCards.filter(card => card.type === typeInfo.type);
        if (typeCards.length > 0) {
          const rows = Math.ceil(typeCards.length / cardsPerRow);
          contentHeight += height * 0.04 + rows * (cardHeight + cardSpacing);
        }
      }
      contentHeight += height * 0.15;
    }
    
    this.maxScroll = Math.max(0, contentHeight - panelHeight);
    this.scrollOffset = Math.min(this.scrollOffset, this.maxScroll);
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
        this.handleTap(x, y);
      }
    }
    
    // 处理按钮点击
    super.handleTouch(x, y, type);
  }

  // 处理点击 - 与训练场景保持一致
  handleTap(x, y) {
    // 如果是套牌Tab，处理卡牌点击
    if (this.selectedTab === 'decks') {
      this.handleDeckTap(x, y);
    }
  }

  // 处理套牌Tab的卡牌点击
  handleDeckTap(x, y) {
    const player = this.game.player;
    const { width, height } = this.getCanvasSize();
    
    const cardManager = player.cardManager;
    const currentDeck = player.currentDeck;
    const ownedCards = cardManager ? cardManager.getOwnedCards() : [];
    const deckCards = currentDeck ? currentDeck.cards : [];
    
    if (ownedCards.length === 0) return;
    
    // 与渲染时使用相同的cardTypes定义
    const cardTypes = [
      { type: 'serve', name: '发球卡' },
      { type: 'return', name: '接发卡' },
      { type: 'baseline', name: '底线卡' },
      { type: 'volley', name: '截击卡' },
      { type: 'dropShot', name: '小球卡' },
      { type: 'slice', name: '切削卡' },
      { type: 'lob', name: '高球卡' },
      { type: 'smash', name: '扣杀卡' },
      { type: 'coach', name: '教练卡' },
      { type: 'strategy', name: '策略卡' },
      { type: 'item', name: '道具卡' },
      { type: 'ultimate', name: '绝招卡' }
    ];
    
    const startY = height * 0.20 + height * 0.1;
    const cardWidth = width * 0.26;
    const cardHeight = height * 0.12;
    const cardSpacing = width * 0.015;
    const cardsPerRow = 3;
    
    // 调整y坐标以考虑滚动偏移
    const adjustedY = y + this.scrollOffset;
    
    let currentY = startY;
    
    // 遍历每种类型的卡牌
    for (const typeInfo of cardTypes) {
      const typeCards = ownedCards.filter(card => card.type === typeInfo.type);
      
      if (typeCards.length === 0) continue;
      
      currentY += height * 0.04; // 类型标题高度
      
      let col = 0;
      let currentX = width * 0.03;
      
      for (const card of typeCards) {
        // 检查点击是否在卡牌范围内
        if (adjustedY >= currentY && adjustedY <= currentY + cardHeight &&
            x >= currentX && x <= currentX + cardWidth) {
          this.toggleDeckCard(card);
          return;
        }
        
        col++;
        if (col >= cardsPerRow) {
          col = 0;
          currentX = width * 0.03;
          currentY += cardHeight + cardSpacing;
        } else {
          currentX += cardWidth + cardSpacing;
        }
      }
      
      currentY += cardHeight + height * 0.02;
    }
  }

  initUI() {
    const { width, height } = this.getCanvasSize();

    // 返回按钮
    this.addBackButton(GAME_STATE.HOME, {
      icon: '←',
      textColor: CONFIG.THEME.PRIMARY
    });

    // 标签页：物品 | 策略 | 卡牌 | 套牌
    const tabWidth = width * 0.22;
    const tabY = height * 0.12;
    
    // 保存当前选中状态用于按钮创建
    const currentTab = this.selectedTab;
    
    this.addButton(width * 0.02, tabY, tabWidth, height * 0.055, '🎒 物品', () => {
      this.selectedTab = 'items';
      this.initUI();
    }, {
      bgColor: currentTab === 'items' ? CONFIG.THEME.PRIMARY : '#2d3748',
      textColor: currentTab === 'items' ? '#0a192f' : '#ffffff',
      fontSize: width * 0.03
    });

    this.addButton(width * 0.265, tabY, tabWidth, height * 0.055, '📋 策略', () => {
      this.selectedTab = 'strategies';
      this.initUI();
    }, {
      bgColor: currentTab === 'strategies' ? CONFIG.THEME.PRIMARY : '#2d3748',
      textColor: currentTab === 'strategies' ? '#0a192f' : '#ffffff',
      fontSize: width * 0.03
    });

    this.addButton(width * 0.51, tabY, tabWidth, height * 0.055, '🃏 卡牌', () => {
      this.selectedTab = 'cards';
      this.initUI();
    }, {
      bgColor: currentTab === 'cards' ? CONFIG.THEME.PRIMARY : '#2d3748',
      textColor: currentTab === 'cards' ? '#0a192f' : '#ffffff',
      fontSize: width * 0.03
    });

    this.addButton(width * 0.755, tabY, tabWidth, height * 0.055, '📦 套牌', () => {
      this.selectedTab = 'decks';
      this.initUI();
    }, {
      bgColor: currentTab === 'decks' ? CONFIG.THEME.PRIMARY : '#2d3748',
      textColor: currentTab === 'decks' ? '#0a192f' : '#ffffff',
      fontSize: width * 0.03
    });
  }

  enter() {
    // 重置滚动状态
    this.scrollOffset = 0;
    this.isScrolling = false;
    
    // 刷新UI状态
    this.initUI();
    // maxScroll 由各个渲染方法计算
  }

  render(ctx) {
    const { width, height } = this.getCanvasSize();

    // 背景
    this.drawBackground(ctx);

    // 标题
    this.drawTitle(ctx, '🎒 背包');

    // 计算最大滚动距离
    this.calculateMaxScroll();

    // 根据标签页渲染不同内容
    if (this.selectedTab === 'items') {
      this.renderItems(ctx);
    } else if (this.selectedTab === 'strategies') {
      this.renderStrategies(ctx);
    } else if (this.selectedTab === 'cards') {
      this.renderCards(ctx);
    } else if (this.selectedTab === 'decks') {
      this.renderDecks(ctx);
    }

    // 渲染按钮
    this.renderButtons(ctx);
  }

  // 渲染物品列表
  renderItems(ctx) {
    const player = this.game.player;
    const { width, height } = this.getCanvasSize();
    const items = player.inventory.getAllItems();
    
    const startY = height * 0.20;
    const itemHeight = height * 0.12;
    const padding = height * 0.02;

    if (items.length === 0) {
      ctx.fillStyle = CONFIG.THEME.TEXT_SECONDARY;
      ctx.font = `${width * 0.04}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('背包空空如也', width / 2, height * 0.4);
      ctx.fillText('训练和比赛可获得道具', width / 2, height * 0.45);
      return;
    }

    // 绘制物品列表
    let y = startY;
    for (const item of items) {
      // 物品卡片背景
      this.drawRoundRect(ctx, width * 0.03, y, width * 0.94, itemHeight, 15, CONFIG.THEME.CARD_BG, 'rgba(100, 255, 218, 0.2)');

      // 物品图标
      ctx.fillStyle = '#ffffff';
      ctx.font = `${width * 0.08}px sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(item.getIcon(), width * 0.06, y + itemHeight * 0.6);

      // 物品名称
      const qualityColor = item.getQuality().color || '#ffffff';
      ctx.fillStyle = qualityColor;
      ctx.font = `bold ${width * 0.04}px sans-serif`;
      ctx.fillText(item.getName(), width * 0.15, y + itemHeight * 0.35);

      // 物品数量
      ctx.fillStyle = '#ffffff';
      ctx.font = `${width * 0.035}px sans-serif`;
      ctx.fillText(`x${item.count}`, width * 0.15, y + itemHeight * 0.65);

      // 物品描述
      ctx.fillStyle = CONFIG.THEME.TEXT_SECONDARY;
      ctx.font = `${width * 0.028}px sans-serif`;
      ctx.fillText(item.getDescription(), width * 0.35, y + itemHeight * 0.65);

      // 使用按钮（仅药品类）
      if (item.getEffect()) {
        const btnWidth = width * 0.2;
        const btnHeight = height * 0.045;
        const btnX = width * 0.75;
        const btnY = y + (itemHeight - btnHeight) / 2;

        // 绘制使用按钮
        this.drawRoundRect(ctx, btnX, btnY, btnWidth, btnHeight, 10, CONFIG.THEME.GREEN, null);
        ctx.fillStyle = '#ffffff';
        ctx.font = `${width * 0.03}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('使用', btnX + btnWidth / 2, btnY + btnHeight / 2 + 2);

        // 绑定点击事件（使用闭包保存item引用）
        const itemRef = item;
        this.addButton(btnX, btnY, btnWidth, btnHeight, '', () => {
          this.useItem(itemRef);
        }, {
          bgColor: 'transparent',
          textColor: 'transparent'
        });
      }

      y += itemHeight + padding;
    }
  }

  // 渲染策略列表
  renderStrategies(ctx) {
    const player = this.game.player;
    let strategyManager = player.strategyManager;
    
    // 确保 strategyManager 存在
    if (!strategyManager) {
      strategyManager = new StrategyManager();
      player.strategyManager = strategyManager;
    }
    
    const { width, height } = this.getCanvasSize();
    
    const startY = height * 0.20;
    const itemHeight = height * 0.15;
    const padding = height * 0.02;

    // 渲染已拥有策略
    const ownedStrategies = strategyManager.getOwnedStrategies();
    
    if (ownedStrategies.length === 0) {
      ctx.fillStyle = CONFIG.THEME.TEXT_SECONDARY;
      ctx.font = `${width * 0.04}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('暂无策略', width / 2, height * 0.4);
      ctx.fillText('收集碎片合成策略', width / 2, height * 0.45);
    } else {
      // 当前使用中的策略
      const currentStrategy = strategyManager.getCurrentStrategy();
      
      let y = startY;
      
      // 章节标题：已拥有策略
      ctx.fillStyle = CONFIG.THEME.PRIMARY;
      ctx.font = `bold ${width * 0.04}px sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText('已拥有策略', width * 0.05, y);
      y += height * 0.05;

      for (const strategyType of ownedStrategies) {
        const config = STRATEGY_CONFIG[strategyType];
        if (!config) continue;

        // 策略卡片
        const isSelected = currentStrategy === strategyType;
        const borderColor = isSelected ? CONFIG.THEME.GREEN : 'rgba(100, 255, 218, 0.3)';
        const bgColor = isSelected ? 'rgba(100, 255, 218, 0.15)' : CONFIG.THEME.CARD_BG;
        
        this.drawRoundRect(ctx, width * 0.03, y, width * 0.94, itemHeight, 15, bgColor, borderColor);

        // 策略名称
        ctx.fillStyle = isSelected ? CONFIG.THEME.GREEN : '#ffffff';
        ctx.font = `bold ${width * 0.04}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(config.name, width * 0.06, y + itemHeight * 0.25);

        // 精力消耗
        ctx.fillStyle = CONFIG.THEME.TEXT_SECONDARY;
        ctx.font = `${width * 0.03}px sans-serif`;
        ctx.fillText(`精力消耗: ${config.energyCost.name}`, width * 0.06, y + itemHeight * 0.5);

        // 策略描述
        ctx.fillText(config.description, width * 0.06, y + itemHeight * 0.75);

        // 选择按钮
        if (!isSelected) {
          const btnWidth = width * 0.22;
          const btnHeight = height * 0.04;
          const btnX = width * 0.70;
          const btnY = y + (itemHeight - btnHeight) / 2;

          this.drawRoundRect(ctx, btnX, btnY, btnWidth, btnHeight, 8, CONFIG.THEME.PRIMARY, null);
          ctx.fillStyle = '#0a192f';
          ctx.font = `${width * 0.028}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText('选择', btnX + btnWidth / 2, btnY + btnHeight / 2 + 2);

          const stratType = strategyType;
          this.addButton(btnX, btnY, btnWidth, btnHeight, '', () => {
            strategyManager.selectStrategy(stratType);
            this.game.showToast(`已选择${config.name}`);
            this.initUI();
          }, {
            bgColor: 'transparent',
            textColor: 'transparent'
          });
        } else {
          // 当前使用中标识
          ctx.fillStyle = CONFIG.THEME.GREEN;
          ctx.font = `${width * 0.03}px sans-serif`;
          ctx.textAlign = 'right';
          ctx.fillText('✓ 使用中', width * 0.92, y + itemHeight / 2);
        }

        y += itemHeight + padding;
      }
    }

    // 渲染碎片信息
    this.renderFragmentInfo(ctx, strategyManager, width, height);
  }

  // 渲染碎片信息
  renderFragmentInfo(ctx, strategyManager, width, height) {
    const player = this.game.player;
    let manager = strategyManager;
    
    if (!manager) {
      manager = new StrategyManager();
    }
    
    let y = height * 0.75;
    ctx.fillStyle = CONFIG.THEME.PRIMARY;
    ctx.font = `bold ${width * 0.04}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('策略碎片', width * 0.05, y);
    y += height * 0.05;

    // 策略碎片数量（通用）
    const fragmentCount = player.inventory.getItemCount(ITEM_TYPES.STRATEGY_FRAGMENT);
    ctx.fillStyle = '#ffffff';
    ctx.font = `${width * 0.035}px sans-serif`;
    ctx.fillText(`📋 策略碎片: ${fragmentCount}`, width * 0.06, y + height * 0.04);

    // 显示各策略碎片需求
    y += height * 0.08;
    ctx.fillStyle = CONFIG.THEME.TEXT_SECONDARY;
    ctx.font = `${width * 0.028}px sans-serif`;
    
    for (const [type, config] of Object.entries(STRATEGY_CONFIG)) {
      const owned = manager.getFragmentCount(type);
      const fragmentConfig = STRATEGY_FRAGMENT_CONFIG[type];
      const needed = fragmentConfig ? fragmentConfig.fragmentsNeeded : 10;
      const isOwned = manager.hasStrategy(type);
      
      const status = isOwned ? '✓ 已拥有' : `${owned}/${needed}`;
      ctx.fillText(`${config.name}: ${status}`, width * 0.06, y);
      y += height * 0.04;
    }
  }

  // 渲染卡牌列表
  renderCards(ctx) {
    const player = this.game.player;
    const { width, height } = this.getCanvasSize();
    
    // 获取玩家拥有的卡牌
    const ownedCards = player.cardManager ? player.cardManager.getOwnedCards() : [];
    const startY = height * 0.20;
    
    if (ownedCards.length === 0) {
      ctx.fillStyle = CONFIG.THEME.TEXT_SECONDARY;
      ctx.font = `${width * 0.04}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('暂无卡牌', width / 2, height * 0.4);
      ctx.fillText('抽卡可获得卡牌', width / 2, height * 0.45);
      return;
    }
    
    // 计算卡牌总数量
    const totalCardCount = ownedCards.reduce((sum, card) => sum + (card.count || 1), 0);
    
    // 卡牌信息
    const cardWidth = width * 0.28;
    const cardHeight = height * 0.18;
    const cardSpacing = width * 0.02;
    const cardsPerRow = 3;
    
    // 标题 - 显示种类数
    ctx.fillStyle = CONFIG.THEME.PRIMARY;
    ctx.font = `bold ${width * 0.04}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(`我的卡牌 (${ownedCards.length}种)`, width * 0.05, startY - height * 0.02);
    
    // 使用滚动偏移渲染卡牌网格
    ctx.save();
    ctx.translate(0, -this.scrollOffset);
    
    let y = startY;
    let x = width * 0.03;
    let col = 0;
    
    for (const card of ownedCards) {
      // 卡牌背景
      const rarityColor = this.getRarityColor(card.rarity);
      this.drawRoundRect(ctx, x, y, cardWidth, cardHeight, 10, CONFIG.THEME.CARD_BG, rarityColor);
      
      // 卡牌数量
      if (card.count > 1) {
        ctx.fillStyle = '#ffd700';
        ctx.font = `bold ${width * 0.04}px sans-serif`;
        ctx.textAlign = 'right';
        ctx.fillText('×' + card.count, x + cardWidth - 5, y + cardHeight * 0.15);
      }
      
      // 卡牌名称
      ctx.fillStyle = rarityColor;
      ctx.font = `bold ${width * 0.03}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(card.name, x + cardWidth / 2, y + cardHeight * 0.2);
      
      // 卡牌类型图标
      ctx.fillStyle = '#ffffff';
      ctx.font = `${width * 0.06}px sans-serif`;
      const typeIcon = card.type === 'serve' ? '🎾' : (card.type === 'volley' ? '🏃' : '🎯');
      ctx.fillText(typeIcon, x + cardWidth / 2, y + cardHeight * 0.45);
      
      // 卡牌类型名称
      const typeName = card.type === 'serve' ? '发球' : (card.type === 'volley' ? '网前' : '战术');
      ctx.fillStyle = CONFIG.THEME.TEXT_SECONDARY;
      ctx.font = `${width * 0.024}px sans-serif`;
      ctx.fillText(typeName, x + cardWidth / 2, y + cardHeight * 0.6);
      
      // 效果值
      ctx.fillStyle = '#68d391';
      ctx.font = `bold ${width * 0.035}px sans-serif`;
      ctx.fillText('+' + card.effect, x + cardWidth / 2, y + cardHeight * 0.8);
      
      // 稀有度标识
      ctx.fillStyle = rarityColor;
      ctx.font = `${width * 0.02}px sans-serif`;
      ctx.fillText(card.rarity, x + cardWidth / 2, y + cardHeight * 0.95);
      
      // 更新位置
      col++;
      if (col >= cardsPerRow) {
        col = 0;
        x = width * 0.03;
        y += cardHeight + cardSpacing;
      } else {
        x += cardWidth + cardSpacing;
      }
    }
    
    // 套牌信息
    const currentDeck = player.currentDeck || [];
    const deckCards = Array.isArray(currentDeck) ? currentDeck : (currentDeck.cards || []);
    
    ctx.fillStyle = CONFIG.THEME.PRIMARY;
    ctx.font = `bold ${width * 0.04}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(`当前套牌 (${deckCards.length}张)`, width * 0.05, y + cardHeight * 0.5);
    
    if (deckCards.length > 0) {
      ctx.fillStyle = CONFIG.THEME.TEXT_SECONDARY;
      ctx.font = `${width * 0.028}px sans-serif`;
      ctx.fillText('已在套牌中使用', width * 0.05, y + cardHeight * 0.75);
    } else {
      ctx.fillStyle = CONFIG.THEME.TEXT_SECONDARY;
      ctx.font = `${width * 0.028}px sans-serif`;
      ctx.fillText('点击卡牌管理配置套牌', width * 0.05, y + cardHeight * 0.75);
    }
    
    ctx.restore();
    
    // 绘制滚动条
    if (this.maxScroll > 0) {
      const scrollBarHeight = Math.min(height * 0.1, height * 0.15);
      const scrollRatio = this.scrollOffset / this.maxScroll;
      const scrollBarY = startY + scrollRatio * (height * 0.65 - scrollBarHeight);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(width * 0.95, scrollBarY, 3, scrollBarHeight);
    }
  }

  // 渲染套牌列表
  renderDecks(ctx) {
    const player = this.game.player;
    const { width, height } = this.getCanvasSize();
    
    // 获取玩家的卡牌管理器
    const cardManager = player.cardManager;
    const currentDeck = player.currentDeck;
    
    const startY = height * 0.20;
    
    // 标题
    ctx.fillStyle = CONFIG.THEME.PRIMARY;
    ctx.font = `bold ${width * 0.04}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('📦 套牌管理', width * 0.05, startY - height * 0.02);
    
    // 当前套牌信息
    const deckCards = currentDeck ? currentDeck.cards : [];
    ctx.fillStyle = '#ffffff';
    ctx.font = `${width * 0.035}px sans-serif`;
    ctx.fillText(`当前套牌: ${deckCards.length}张`, width * 0.05, startY + height * 0.04);
    
    // 获取玩家拥有的卡牌
    const ownedCards = cardManager ? cardManager.getOwnedCards() : [];
    
    // 如果没有卡牌
    if (ownedCards.length === 0) {
      ctx.fillStyle = CONFIG.THEME.TEXT_SECONDARY;
      ctx.font = `${width * 0.035}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('暂无卡牌，请先抽卡', width / 2, height * 0.4);
      return;
    }
    
    // 按类型分类显示玩家拥有的卡牌（与data/cards.js中的CARD_TYPE保持一致）
    const cardTypes = [
      { type: 'serve', name: '🎾 发球卡', color: '#4299e1' },
      { type: 'return', name: '🎯 接发卡', color: '#9f7aea' },
      { type: 'baseline', name: '🏃 底线卡', color: '#68d391' },
      { type: 'volley', name: '🖾 截击卡', color: '#ed8936' },
      { type: 'dropShot', name: '✨ 小球卡', color: '#f56565' },
      { type: 'slice', name: '↙️ 切削卡', color: '#667eea' },
      { type: 'lob', name: '⬆️ 高球卡', color: '#38b2ac' },
      { type: 'smash', name: '💥 扣杀卡', color: '#e53e3e' },
      { type: 'coach', name: '👨‍🏫 教练卡', color: '#d69e2e' },
      { type: 'strategy', name: '📋 策略卡', color: '#319795' },
      { type: 'item', name: '🎁 道具卡', color: '#dd6b20' },
      { type: 'ultimate', name: '🌟 绝招卡', color: '#ff00ff' }
    ];
    
    let y = startY + height * 0.1;
    const cardWidth = width * 0.26;
    const cardHeight = height * 0.12;
    const cardSpacing = width * 0.015;
    const cardsPerRow = 3;
    
    // 使用滚动偏移渲染
  
    ctx.save();
    ctx.translate(0, -this.scrollOffset);
    
    y = startY + height * 0.1;
  

    // 遍历每种类型的卡牌
    for (const typeInfo of cardTypes) {
      // 筛选该类型的卡牌
      const typeCards = ownedCards.filter(card => card.type === typeInfo.type);
      
      if (typeCards.length === 0) continue;
      
      // 类型标题
      ctx.fillStyle = typeInfo.color;
      ctx.font = `bold ${width * 0.032}px sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(`${typeInfo.name} (${typeCards.length})`, width * 0.03, y);
      
      y += height * 0.04;
      
      // 显示该类型的所有卡牌
      let x = width * 0.03;
      let col = 0;
      
      for (const card of typeCards) {
        // 检查这张卡是否在套牌中
        const inDeck = deckCards.includes(card.id);
        
        // 卡牌背景 - 如果在套牌中显示不同颜色
        const borderColor = inDeck ? CONFIG.THEME.GREEN : typeInfo.color;
        const bgColor = inDeck ? 'rgba(100, 255, 218, 0.2)' : CONFIG.THEME.CARD_BG;
        
        this.drawRoundRect(ctx, x, y, cardWidth, cardHeight, 8, bgColor, borderColor, inDeck ? 3 : 1);
        
        // 卡牌名称
        ctx.fillStyle = inDeck ? CONFIG.THEME.GREEN : '#ffffff';
        ctx.font = `bold ${width * 0.024}px sans-serif`;
        ctx.textAlign = 'center';
        const displayName = card.name.length > 5 ? card.name.substring(0, 4) + '..' : card.name;
        ctx.fillText(displayName, x + cardWidth / 2, y + cardHeight * 0.3);
        
        // 稀有度
        ctx.fillStyle = this.getRarityColor(card.rarity);
        ctx.font = `${width * 0.02}px sans-serif`;
        ctx.fillText(card.rarity, x + cardWidth / 2, y + cardHeight * 0.5);
        
        // 在套牌中显示标识
        if (inDeck) {
          ctx.fillStyle = CONFIG.THEME.GREEN;
          ctx.font = `${width * 0.022}px sans-serif`;
          ctx.fillText('✓ 已装备', x + cardWidth / 2, y + cardHeight * 0.8);
        } else {
          // 添加到套牌按钮
          ctx.fillStyle = typeInfo.color;
          ctx.font = `${width * 0.022}px sans-serif`;
          ctx.fillText('+ 添加', x + cardWidth / 2, y + cardHeight * 0.8);
        }
        
        col++;
        if (col >= cardsPerRow) {
          col = 0;
          x = width * 0.03;
          y += cardHeight + cardSpacing;
        } else {
          x += cardWidth + cardSpacing;
        }
      }
      
      y += cardHeight + height * 0.02;
    }
    
    ctx.restore();
    
    // 底部提示 (不随滚动)
    ctx.fillStyle = CONFIG.THEME.TEXT_SECONDARY;
    ctx.font = `${width * 0.028}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('点击卡牌可添加/移除套牌', width / 2, height * 0.92);
    
    // 套牌规则提示
    ctx.fillStyle = '#f56565';
    ctx.font = `${width * 0.024}px sans-serif`;
    ctx.fillText('套牌至少需要3张，最多9张', width / 2, height * 0.96);
    
    // 绘制滚动条
    if (this.maxScroll > 0) {
      const scrollBarHeight = Math.min(height * 0.1, height * 0.15);
      const scrollRatio = this.scrollOffset / this.maxScroll;
      const scrollBarY = startY + scrollRatio * (height * 0.65 - scrollBarHeight);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(width * 0.95, scrollBarY, 3, scrollBarHeight);
    }
  }

  // 切换卡牌在套牌中的状态
  toggleDeckCard(card) {
    const player = this.game.player;
    const currentDeck = player.currentDeck;
    
    if (!currentDeck) {
      this.game.showToast('套牌未初始化');
      return;
    }
    
    const cardId = card.id;
    const deckCards = currentDeck.cards;
    
    // 检查是否已在套牌中
    const index = deckCards.indexOf(cardId);
    
    if (index > -1) {
      // 已存在，移除
      currentDeck.removeCard(cardId);
      this.game.showToast(`已移除${card.name}`);
    } else {
      // 不存在，检查是否可以添加
      if (deckCards.length >= 9) {
        this.game.showToast('套牌已达上限(9张)');
        return;
      }
      
      // 验证卡组规则
      const result = currentDeck.addCard(cardId);
      if (result.success) {
        this.game.showToast(`已添加${card.name}`);
      } else {
        this.game.showToast(result.message);
      }
    }
    
    // 保存游戏
    this.game.saveGame();
  }

  // 获取稀有度颜色
  getRarityColor(rarity) {
    switch(rarity) {
      case 'R': return '#4299e1';
      case 'SR': return '#805ad5';
      case 'SSR': return '#ffd700';
      case 'UR': return '#f56565';
      default: return '#718096';
    }
  }

  // 使用物品
  useItem(item) {
    const result = this.game.player.inventory.useItem(item.type, this.game.player);
    
    if (result.success) {
      this.game.showToast(result.message);
      // 如果是精力或状态药品，刷新显示
      const effect = item.getEffect();
      if (effect && (effect.type === 'energy' || effect.type === 'form')) {
        // 刷新页面
        this.initUI();
      }
    } else {
      this.game.showToast(result.message);
    }
  }
}

module.exports = ItemScene;
