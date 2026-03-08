/**
 * 道具场景
 * 展示背包中的物品，支持使用道具
 */
const { Scene, GAME_STATE, CONFIG } = require('./scene.js');
const { ITEM_TYPES, ITEM_CONFIG, ITEM_QUALITY } = require('../models/item.js');
const { STRATEGY_TYPES, STRATEGY_CONFIG, STRATEGY_FRAGMENT_CONFIG, getFragmentsNeeded, StrategyManager } = require('../models/strategy.js');

class ItemScene extends Scene {
  constructor(game) {
    super(game);
    this.selectedTab = 'items'; // 'items' | 'strategies'
    this.initUI();
  }

  initUI() {
    const { width, height } = this.getCanvasSize();

    // 返回按钮
    this.addBackButton(GAME_STATE.HOME, {
      icon: '←',
      textColor: CONFIG.THEME.PRIMARY
    });

    // 标签页：物品 | 策略
    const tabWidth = width * 0.4;
    const tabY = height * 0.12;
    
    // 保存当前选中状态用于按钮创建
    const currentTab = this.selectedTab;
    
    this.addButton(width * 0.05, tabY, tabWidth, height * 0.055, '🎒 物品', () => {
      this.selectedTab = 'items';
      this.initUI(); // 重新初始化UI以更新选中状态
    }, {
      bgColor: currentTab === 'items' ? CONFIG.THEME.PRIMARY : '#2d3748',
      textColor: currentTab === 'items' ? '#0a192f' : '#ffffff',
      fontSize: width * 0.035
    });

    this.addButton(width * 0.55, tabY, tabWidth, height * 0.055, '📋 策略', () => {
      this.selectedTab = 'strategies';
      this.initUI(); // 重新初始化UI以更新选中状态
    }, {
      bgColor: currentTab === 'strategies' ? CONFIG.THEME.PRIMARY : '#2d3748',
      textColor: currentTab === 'strategies' ? '#0a192f' : '#ffffff',
      fontSize: width * 0.035
    });
  }

  enter() {
    // 刷新UI状态
    this.initUI();
  }

  render(ctx) {
    const { width, height } = this.getCanvasSize();

    // 背景
    this.drawBackground(ctx);

    // 标题
    this.drawTitle(ctx, '🎒 背包');

    // 根据标签页渲染不同内容
    if (this.selectedTab === 'items') {
      this.renderItems(ctx);
    } else {
      this.renderStrategies(ctx);
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
