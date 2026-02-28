/**
 * 赞助场景
 * 支持服装赞助商和球拍赞助商
 */
const { Scene, GAME_STATE, CONFIG } = require('./scene.js');
const Sponsor = require('../models/sponsor.js');

class SponsorScene extends Scene {
  constructor(game) {
    super(game);
    this.availableSponsors = [];
    this.initUI();
  }

  initUI() {
    // 返回按钮 - 统一位置
    this.addBackButton(GAME_STATE.HOME);
  }

  enter() {
    this.availableSponsors = Sponsor.checkAvailableSponsors(this.game.player);
  }

  // 获取赞助类型图标
  getSponsorTypeIcon(type) {
    if (type === Sponsor.SPONSOR_TYPE.CLOTHING) {
      return '👕'; // 服装
    } else if (type === Sponsor.SPONSOR_TYPE.RACKET) {
      return '🎾'; // 球拍
    }
    return '📦';
  }

  // 获取赞助类型名称
  getSponsorTypeName(type) {
    if (type === Sponsor.SPONSOR_TYPE.CLOTHING) {
      return '服装';
    } else if (type === Sponsor.SPONSOR_TYPE.RACKET) {
      return '球拍';
    }
    return '综合';
  }

  // 处理赞助商卡片的点击
  handleSponsorTap(x, y) {
    const { width, height } = this.getCanvasSize();
    
    if (this.availableSponsors.length === 0) return;
    
    const sponsorsStartY = height * 0.32 + Object.keys(Sponsor.SPONSOR_LEVELS).length * height * 0.045 + height * 0.02 + height * 0.05;
    const cardStartY = sponsorsStartY;
    const cardSpacing = height * 0.02;
    const cardHeight = height * 0.14;
    
    for (let i = 0; i < this.availableSponsors.length; i++) {
      const cardY = cardStartY + i * (cardHeight + cardSpacing);
      const cardX = width * 0.05;
      const cardWidth = width * 0.9;
      const btnX = cardX + cardWidth * 0.72;
      const btnY = cardY + cardHeight * 0.2;
      const btnWidth = cardWidth * 0.25;
      const btnHeight = cardHeight * 0.6;
      
      // 检查是否点击了申请按钮
      if (x >= btnX && x <= btnX + btnWidth && y >= btnY && y <= btnY + btnHeight) {
        this.applySponsor(this.availableSponsors[i]);
        return true;
      }
    }
    return false;
  }

  // 申请赞助
  applySponsor(sponsor) {
    const player = this.game.player;
    const level = sponsor.level;
    
    const result = Sponsor.signSponsor(player, level);
    
    if (result.success) {
      // 获取赞助类型
      const sponsorConfig = Sponsor.SPONSOR_LEVELS[level];
      const typeIcon = this.getSponsorTypeIcon(sponsorConfig.type);
      const typeName = this.getSponsorTypeName(sponsorConfig.type);
      const expireText = `${result.expiresYear}年${result.expiresMonth}月到期`;
      
      // 获取解锁的装备提示
      let unlockText = '';
      if (sponsorConfig.unlocks) {
        const unlocks = [];
        for (const [slot, items] of Object.entries(sponsorConfig.unlocks)) {
          if (slot === 'body') unlocks.push(`球衣x${items.length}种`);
          else if (slot === 'shoes') unlocks.push(`球鞋x${items.length}种`);
          else if (slot === 'head') unlocks.push(`帽子x${items.length}种`);
          else if (slot === 'accessory') unlocks.push(`配饰x${items.length}种`);
          else if (slot === 'racket') unlocks.push(`球拍x${items.length}种`);
        }
        if (unlocks.length > 0) {
          unlockText = `\n解锁装备: ${unlocks.join(', ')}`;
        }
      }
      
      this.game.showModal('🎉 签约成功！', 
        `恭喜！你已成功签约${sponsor.name}！\n\n类型: ${typeIcon} ${typeName}赞助\n签约奖金: $${result.signingBonus}\n每月赞助费: $${result.monthlyPayment}/月\n有效期至: ${expireText}\n${unlockText}\n\n资金已添加到你的账户！`);
      
      // 记录操作
      this.game.recordAction('sponsor', `签约${sponsor.name}`, `奖金$${result.signingBonus}`);
      
      // 重新计算可用赞助
      this.availableSponsors = Sponsor.checkAvailableSponsors(player);
      this.game.saveGame();
    } else {
      this.game.showToast(result.message);
    }
  }

  render(ctx) {
    const player = this.game.player;
    if (!player) return;

    const { width, height } = this.getCanvasSize();

    // 背景 - 统一方法
    this.drawBackground(ctx);

    // 标题 - 统一方法
    this.drawTitle(ctx, '📢 赞助中心');

    // 当前赞助商
    ctx.fillStyle = CONFIG.THEME.TEXT_MAIN;
    ctx.font = `${width * 0.038}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('当前赞助商', width / 2, height * 0.15);

    if (player.sponsors.length > 0) {
      for (let i = 0; i < player.sponsors.length; i++) {
        const sponsor = player.sponsors[i];
        if (sponsor.expired) {
          ctx.fillText(`❌ ${sponsor.name} (已到期)`, width / 2, height * 0.2 + i * (height * 0.045));
        } else {
          const expireText = `${sponsor.expiresYear}年${sponsor.expiresMonth}月到期`;
          ctx.fillText(`✅ ${sponsor.name} (${expireText})`, width / 2, height * 0.2 + i * (height * 0.045));
        }
      }
    } else {
      ctx.fillStyle = CONFIG.THEME.TEXT_SECONDARY;
      ctx.fillText('📭 暂无赞助商', width / 2, height * 0.2);
    }

    // 解锁条件说明 - 分别显示服装和球拍赞助
    ctx.fillStyle = CONFIG.THEME.TEXT_SECONDARY;
    ctx.font = `${width * 0.032}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('🏆 赞助解锁条件', width / 2, height * 0.28);

    // 显示各等级赞助的解锁条件（按类型分组）
    const levels = Object.entries(Sponsor.SPONSOR_LEVELS);
    const levelStartY = height * 0.32;
    const levelLineHeight = height * 0.04;

    // 先显示服装赞助
    const clothingLevels = levels.filter(([key]) => key.includes('_clothing'));
    ctx.fillStyle = CONFIG.THEME.PRIMARY;
    ctx.font = `${width * 0.03}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('👕 服装赞助', width * 0.05, levelStartY);

    for (let i = 0; i < clothingLevels.length; i++) {
      const [level, info] = clothingLevels[i];
      const req = info.requirements;
      const hasActive = player.sponsors.some(s => s.name === info.name && !s.expired);
      const y = levelStartY + height * 0.04 + i * levelLineHeight;

      ctx.fillStyle = hasActive ? CONFIG.THEME.GREEN : CONFIG.THEME.TEXT_SECONDARY;
      ctx.font = `${width * 0.026}px sans-serif`;

      let reqText = `排名≤${req.ranking} 冠军≥${req.titles}`;
      if (req.grandSlams) reqText += ` 大满贯≥${req.grandSlams}`;

      const statusIcon = hasActive ? '✅' : '🔒';
      ctx.fillText(`${statusIcon} ${info.name}: ${reqText}`, width * 0.08, y);
    }

    // 再显示球拍赞助
    const racketLevels = levels.filter(([key]) => key.includes('_racket'));
    const racketStartY = levelStartY + height * 0.04 + clothingLevels.length * levelLineHeight + height * 0.02;
    ctx.fillStyle = CONFIG.THEME.ORANGE;
    ctx.font = `${width * 0.03}px sans-serif`;
    ctx.fillText('🎾 球拍赞助', width * 0.05, racketStartY);

    for (let i = 0; i < racketLevels.length; i++) {
      const [level, info] = racketLevels[i];
      const req = info.requirements;
      const hasActive = player.sponsors.some(s => s.name === info.name && !s.expired);
      const y = racketStartY + height * 0.04 + i * levelLineHeight;

      ctx.fillStyle = hasActive ? CONFIG.THEME.GREEN : CONFIG.THEME.TEXT_SECONDARY;
      ctx.font = `${width * 0.026}px sans-serif`;

      let reqText = `排名≤${req.ranking} 冠军≥${req.titles}`;
      if (req.grandSlams) reqText += ` 大满贯≥${req.grandSlams}`;

      const statusIcon = hasActive ? '✅' : '🔒';
      ctx.fillText(`${statusIcon} ${info.name}: ${reqText}`, width * 0.08, y);
    }

    // 可申请赞助
    const sponsorsStartY = height * 0.32 + levels.length * levelLineHeight + height * 0.02;
    ctx.fillStyle = CONFIG.THEME.TEXT_MAIN;
    ctx.font = `bold ${width * 0.038}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('✨ 可申请的赞助', width / 2, sponsorsStartY);

    if (this.availableSponsors.length > 0) {
      const cardStartY = sponsorsStartY + height * 0.05;
      const cardSpacing = height * 0.02;
      for (let i = 0; i < this.availableSponsors.length; i++) {
        this.drawSponsorCard(ctx, this.availableSponsors[i], cardStartY + i * (height * 0.18 + cardSpacing));
      }
    } else {
      ctx.fillStyle = CONFIG.THEME.TEXT_SECONDARY;
      ctx.font = `${width * 0.035}px sans-serif`;
      ctx.fillText('🔒 暂无新的赞助机会', width / 2, sponsorsStartY + height * 0.1);
      ctx.fillText('提升排名和赢得比赛来解锁！', width / 2, sponsorsStartY + height * 0.15);
    }

    // 绘制按钮 - 统一方法
    this.renderButtons(ctx);
  }

  drawSponsorCard(ctx, sponsor, y) {
    const { width, height } = this.getCanvasSize();
    const req = Sponsor.SPONSOR_LEVELS[sponsor.level].requirements;

    const cardX = width * 0.05;
    const cardWidth = width * 0.9;
    const cardHeight = height * 0.14;

    // 卡片背景 - 统一方法
    this.drawRoundRect(ctx, cardX, y, cardWidth, cardHeight, 15, CONFIG.THEME.CARD_BG, 'rgba(100, 255, 218, 0.15)');

    // 赞助名称
    ctx.fillStyle = CONFIG.THEME.TEXT_MAIN;
    ctx.font = `bold ${width * 0.04}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(sponsor.name, cardX + cardWidth * 0.03, y + cardHeight * 0.3);

    // 要求
    ctx.fillStyle = CONFIG.THEME.TEXT_SECONDARY;
    ctx.font = `${width * 0.03}px sans-serif`;
    ctx.fillText(`要求: 排名${req.ranking}内, ${req.titles}冠`, cardX + cardWidth * 0.03, y + cardHeight * 0.55);

    // 签约奖金
    ctx.fillStyle = CONFIG.THEME.GOLD;
    ctx.font = `bold ${width * 0.035}px sans-serif`;
    ctx.fillText(`💰 签约奖金: $${sponsor.signingBonus}`, cardX + cardWidth * 0.03, y + cardHeight * 0.85);

    // 月费
    ctx.fillStyle = CONFIG.THEME.GREEN;
    ctx.fillText(`📅 月费: $${sponsor.monthlyPayment}/月`, cardX + cardWidth * 0.45, y + cardHeight * 0.85);

    // 申请按钮
    ctx.fillStyle = CONFIG.THEME.PRIMARY;
    this.drawRoundRect(ctx, cardX + cardWidth * 0.72, y + cardHeight * 0.2, cardWidth * 0.25, cardHeight * 0.6, 10);
    ctx.fill();

    ctx.fillStyle = '#0a192f';
    ctx.font = `bold ${width * 0.035}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('申请', cardX + cardWidth * 0.845, y + cardHeight * 0.55);
  }

  // 处理触摸事件
  handleTouch(x, y, type) {
    // 处理赞助商卡片点击
    if (type === 'touchend') {
      this.handleSponsorTap(x, y);
    }
    
    // 处理返回按钮
    super.handleTouch(x, y, type);
  }
}

module.exports = SponsorScene;
