/**
 * 装备场景 - 球员外观自定义
 * 支持赞助商解锁装备
 */
const { Scene, GAME_STATE, CONFIG } = require('./scene.js');
const Equipment = require('../models/equipment.js');
const Sponsor = require('../models/sponsor.js');

class EquipmentScene extends Scene {
  constructor(game) {
    super(game);
    this.currentSlot = Equipment.SLOT.BODY;  // 当前选中的槽位
    this.previewEquipment = {};  // 预览装备（未保存）
    this.unlockedEquipment = {}; // 可用装备列表
    this.initUI();
  }

  initUI() {
    // 返回按钮
    this.addBackButton(GAME_STATE.HOME);
  }

  enter() {
    const player = this.game.player;
    // 初始化预览装备为当前装备
    this.previewEquipment = { ...player.equipment };
    this.currentSlot = Equipment.SLOT.BODY;
    // 获取玩家可用的解锁装备
    this.unlockedEquipment = Sponsor.getUnlockedEquipment(player);
  }

  // 切换槽位
  switchSlot(slot) {
    this.currentSlot = slot;
  }

  // 选择装备
  selectItem(itemId) {
    this.previewEquipment[this.currentSlot] = itemId;
  }

  // 保存装备
  saveEquipment() {
    const player = this.game.player;
    player.equipment = { ...this.previewEquipment };
    this.game.saveGame();
    this.game.showToast('装备已保存！');
    this.game.changeScene(GAME_STATE.HOME);
  }

  // 渲染
  render(ctx) {
    const { width, height } = this.getCanvasSize();
    const player = this.game.player;

    // 背景
    this.drawBackground(ctx);

    // 标题
    this.drawTitle(ctx, '👕 装备中心');

    // 绘制角色预览
    this.drawCharacterPreview(ctx, width, height);

    // 绘制槽位选择标签
    this.drawSlotTabs(ctx, width, height);

    // 绘制装备列表
    this.drawEquipmentList(ctx, width, height);

    // 绘制保存按钮
    this.drawSaveButton(ctx, width, height);

    // 绘制按钮
    this.renderButtons(ctx);
  }

  // 绘制角色预览
  drawCharacterPreview(ctx, width, height) {
    const player = this.game.player;
    const previewX = width * 0.5;
    const previewY = height * 0.22;
    const scale = width * 0.0012;

    // 获取当前装备颜色
    const equip = this.previewEquipment;
    const headInfo = Equipment.getItemInfo(Equipment.SLOT.HEAD, equip.head);
    const bodyInfo = Equipment.getItemInfo(Equipment.SLOT.BODY, equip.body);
    const racketInfo = Equipment.getItemInfo(Equipment.SLOT.RACKET, equip.racket);
    const shoesInfo = Equipment.getItemInfo(Equipment.SLOT.SHOES, equip.shoes);
    const accessoryInfo = Equipment.getItemInfo(Equipment.SLOT.ACCESSORY, equip.accessory);

    // 身体
    ctx.fillStyle = '#f5d0b0';  // 肤色
    // 头
    ctx.beginPath();
    ctx.arc(previewX, previewY - 60 * scale, 25 * scale, 0, Math.PI * 2);
    ctx.fill();
    // 身体
    ctx.fillRect(previewX - 20 * scale, previewY - 30 * scale, 40 * scale, 50 * scale);
    // 左手
    ctx.fillRect(previewX - 40 * scale, previewY - 20 * scale, 18 * scale, 40 * scale);
    // 右手（拿球拍）
    ctx.fillRect(previewX + 22 * scale, previewY - 20 * scale, 18 * scale, 40 * scale);

    // 头部装备
    if (headInfo && headInfo.color) {
      ctx.fillStyle = headInfo.color;
      ctx.beginPath();
      ctx.arc(previewX, previewY - 70 * scale, 28 * scale, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(previewX - 28 * scale, previewY - 70 * scale, 56 * scale, 15 * scale);
    }

    // 身体装备
    if (bodyInfo && bodyInfo.color) {
      ctx.fillStyle = bodyInfo.color;
      ctx.fillRect(previewX - 22 * scale, previewY - 30 * scale, 44 * scale, 52 * scale);
      // 袖子
      ctx.fillRect(previewX - 42 * scale, previewY - 28 * scale, 22 * scale, 15 * scale);
      ctx.fillRect(previewX + 20 * scale, previewY - 28 * scale, 22 * scale, 15 * scale);
    }

    // 鞋子
    if (shoesInfo && shoesInfo.color) {
      ctx.fillStyle = shoesInfo.color;
      ctx.fillRect(previewX - 22 * scale, previewY + 25 * scale, 18 * scale, 12 * scale);
      ctx.fillRect(previewX + 4 * scale, previewY + 25 * scale, 18 * scale, 12 * scale);
    }

    // 球拍
    if (racketInfo) {
      const racketX = previewX + 45 * scale;
      const racketY = previewY - 10 * scale;
      
      // 拍框
      ctx.strokeStyle = racketInfo.color || '#718096';
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      ctx.ellipse(racketX, racketY, 12 * scale, 20 * scale, 0, 0, Math.PI * 2);
      ctx.stroke();
      
      // 拍柄
      ctx.fillStyle = racketInfo.handleColor || '#4a5568';
      ctx.fillRect(racketX - 3 * scale, racketY + 15 * scale, 6 * scale, 25 * scale);
      
      // 拍线
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1 * scale;
      for (let i = -8; i <= 8; i += 2) {
        ctx.beginPath();
        ctx.moveTo(racketX + i * scale, racketY - 15 * scale);
        ctx.lineTo(racketX + i * scale, racketY + 15 * scale);
        ctx.stroke();
      }
    }

    // 配饰（腕带）
    if (accessoryInfo && accessoryInfo.color) {
      ctx.fillStyle = accessoryInfo.color;
      // 左手腕带
      ctx.fillRect(previewX - 40 * scale, previewY + 5 * scale, 18 * scale, 6 * scale);
    }

    // 名字
    ctx.fillStyle = CONFIG.THEME.TEXT_MAIN;
    ctx.font = `${width * 0.035}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(player.name, previewX, previewY + 60 * scale);
  }

  // 绘制槽位选择标签
  drawSlotTabs(ctx, width, height) {
    const slots = [
      { slot: Equipment.SLOT.BODY, name: '球衣', icon: '👕' },
      { slot: Equipment.SLOT.HEAD, name: '帽子', icon: '🧢' },
      { slot: Equipment.SLOT.RACKET, name: '球拍', icon: '🎾' },
      { slot: Equipment.SLOT.SHOES, name: '鞋子', icon: '👟' },
      { slot: Equipment.SLOT.ACCESSORY, name: '配饰', icon: '🎗️' }
    ];

    const tabWidth = width * 0.18;
    const tabHeight = height * 0.05;
    const startX = width * 0.04;
    const startY = height * 0.42;
    const spacing = width * 0.01;

    ctx.font = `${width * 0.028}px sans-serif`;
    ctx.textAlign = 'center';

    for (let i = 0; i < slots.length; i++) {
      const tab = slots[i];
      const x = startX + i * (tabWidth + spacing);
      const isSelected = this.currentSlot === tab.slot;

      // 背景
      ctx.fillStyle = isSelected ? CONFIG.THEME.PRIMARY : CONFIG.THEME.CARD_BG;
      this.drawRoundRect(ctx, x, startY, tabWidth, tabHeight, 8);
      ctx.fill();

      // 文字
      ctx.fillStyle = isSelected ? '#0a192f' : CONFIG.THEME.TEXT_MAIN;
      ctx.fillText(tab.name, x + tabWidth / 2, startY + tabHeight / 2 + 5);
    }
  }

  // 检查装备是否已解锁
  isItemUnlocked(itemId) {
    const unlockedItems = this.unlockedEquipment[this.currentSlot] || [];
    return unlockedItems.includes(itemId);
  }

  // 绘制装备列表
  drawEquipmentList(ctx, width, height) {
    const items = Equipment.getItemsForSlot(this.currentSlot);
    const itemList = Object.entries(items);

    const gridStartX = width * 0.04;
    const gridStartY = height * 0.49;
    const itemWidth = width * 0.28;
    const itemHeight = height * 0.10;
    const spacingX = width * 0.04;
    const spacingY = height * 0.02;

    // 列数和行数
    const cols = 3;
    const rows = Math.ceil(itemList.length / cols);

    ctx.font = `${width * 0.028}px sans-serif`;
    ctx.textAlign = 'center';

    // 存储按钮区域用于点击检测
    this.equipmentButtons = [];

    // 检查是否有赞助商
    const hasSponsorship = this.game.player.sponsors && 
      this.game.player.sponsors.some(s => !s.expired);

    for (let i = 0; i < itemList.length; i++) {
      const [itemId, itemInfo] = itemList[i];
      const col = i % cols;
      const row = Math.floor(i / cols);

      const x = gridStartX + col * (itemWidth + spacingX);
      const y = gridStartY + row * (itemHeight + spacingY);

      const isSelected = this.previewEquipment[this.currentSlot] === itemId;
      const isUnlocked = this.isItemUnlocked(itemId);

      // 背景
      if (!isUnlocked) {
        // 未解锁：灰色背景
        ctx.fillStyle = 'rgba(50, 50, 50, 0.5)';
      } else if (isSelected) {
        ctx.fillStyle = 'rgba(100, 255, 218, 0.3)';
      } else {
        ctx.fillStyle = CONFIG.THEME.CARD_BG;
      }
      this.drawRoundRect(ctx, x, y, itemWidth, itemHeight, 10);
      ctx.fill();

      // 边框
      if (isSelected) {
        ctx.strokeStyle = CONFIG.THEME.PRIMARY;
        ctx.lineWidth = 2;
        this.drawRoundRect(ctx, x, y, itemWidth, itemHeight, 10);
        ctx.stroke();
      }

      // 颜色预览（未解锁时变暗）
      if (itemInfo.color) {
        if (!isUnlocked) {
          ctx.fillStyle = this.darkenColor(itemInfo.color, 0.5);
        } else {
          ctx.fillStyle = itemInfo.color;
        }
        ctx.fillRect(x + 10, y + itemHeight * 0.3, itemHeight * 0.4, itemHeight * 0.4);
      }

      // 名称
      if (!isUnlocked) {
        ctx.fillStyle = '#666666';
      } else {
        ctx.fillStyle = CONFIG.THEME.TEXT_MAIN;
      }
      ctx.textAlign = 'left';
      ctx.fillText(itemInfo.name, x + itemHeight * 0.6, y + itemHeight * 0.55);

      // 未解锁显示锁定图标和提示
      if (!isUnlocked && hasSponsorship) {
        ctx.fillStyle = CONFIG.THEME.RED;
        ctx.font = `${width * 0.022}px sans-serif`;
        ctx.textAlign = 'right';
        ctx.fillText('🔒', x + itemWidth - 10, y + itemHeight * 0.55);
        ctx.font = `${width * 0.018}px sans-serif`;
        ctx.fillText('需赞助', x + itemWidth - 25, y + itemHeight * 0.75);
      }

      // 保存按钮区域
      this.equipmentButtons.push({
        x: x,
        y: y,
        width: itemWidth,
        height: itemHeight,
        itemId: itemId,
        unlocked: isUnlocked
      });
    }

    // 显示提示信息
    if (!hasSponsorship) {
      ctx.fillStyle = CONFIG.THEME.ORANGE;
      ctx.font = `${width * 0.028}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('⚠️ 暂无赞助商装备，请先签约赞助商', width * 0.5, gridStartY - 15);
    }
  }

  // 颜色变暗辅助函数
  darkenColor(hex, factor) {
    // 解析十六进制颜色
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    // 变暗
    const newR = Math.floor(r * factor);
    const newG = Math.floor(g * factor);
    const newB = Math.floor(b * factor);

    // 转换回十六进制
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  // 绘制保存按钮
  drawSaveButton(ctx, width, height) {
    const btnX = width * 0.5 - width * 0.35 / 2;
    const btnY = height * 0.88;
    const btnWidth = width * 0.35;
    const btnHeight = height * 0.07;

    // 背景
    ctx.fillStyle = CONFIG.THEME.PRIMARY;
    this.drawRoundRect(ctx, btnX, btnY, btnWidth, btnHeight, 12);
    ctx.fill();

    // 文字
    ctx.fillStyle = '#0a192f';
    ctx.font = `bold ${width * 0.038}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('💾 保存装备', btnX + btnWidth / 2, btnY + btnHeight / 2 + 8);

    // 保存按钮区域
    this.saveButton = { x: btnX, y: btnY, width: btnWidth, height: btnHeight };
  }

  // 处理装备点击
  handleEquipmentTap(x, y) {
    if (!this.equipmentButtons) return false;

    for (const btn of this.equipmentButtons) {
      if (x >= btn.x && x <= btn.x + btn.width &&
          y >= btn.y && y <= btn.y + btn.height) {
        // 检查是否已解锁
        if (!btn.unlocked) {
          this.game.showToast('该装备需要更高级赞助商才能解锁！');
          return true;
        }
        this.selectItem(btn.itemId);
        return true;
      }
    }
    return false;
  }

  // 处理保存按钮点击
  handleSaveTap(x, y) {
    if (!this.saveButton) return false;

    if (x >= this.saveButton.x && x <= this.saveButton.x + this.saveButton.width &&
        y >= this.saveButton.y && y <= this.saveButton.y + this.saveButton.height) {
      this.saveEquipment();
      return true;
    }
    return false;
  }

  // 处理槽位点击
  handleSlotTap(x, y, width, height) {
    const slots = [
      { slot: Equipment.SLOT.BODY, name: '球衣' },
      { slot: Equipment.SLOT.HEAD, name: '帽子' },
      { slot: Equipment.SLOT.RACKET, name: '球拍' },
      { slot: Equipment.SLOT.SHOES, name: '鞋子' },
      { slot: Equipment.SLOT.ACCESSORY, name: '配饰' }
    ];

    const tabWidth = width * 0.18;
    const tabHeight = height * 0.05;
    const startX = width * 0.04;
    const startY = height * 0.42;
    const spacing = width * 0.01;

    for (let i = 0; i < slots.length; i++) {
      const tabX = startX + i * (tabWidth + spacing);
      if (x >= tabX && x <= tabX + tabWidth &&
          y >= startY && y <= startY + tabHeight) {
        this.switchSlot(slots[i].slot);
        return true;
      }
    }
    return false;
  }

  // 处理触摸事件
  handleTouch(x, y, type) {
    if (type === 'touchend') {
      const { width, height } = this.getCanvasSize();

      // 检查装备点击
      if (this.handleEquipmentTap(x, y)) {
        return;
      }

      // 检查保存按钮
      if (this.handleSaveTap(x, y)) {
        return;
      }

      // 检查槽位点击
      if (this.handleSlotTap(x, y, width, height)) {
        return;
      }
    }

    // 处理返回按钮
    super.handleTouch(x, y, type);
  }
}

module.exports = EquipmentScene;
