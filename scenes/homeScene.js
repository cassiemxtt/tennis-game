/**
 * 首页场景
 * 按照UX设计图优化：顶部状态栏 + 中部操作记录面板 + 底部控制区
 * 像素复古风格
 */
const { Scene, GAME_STATE, CONFIG } = require('./scene.js');
const { RandomEvents } = require('../models/events.js');
const Sponsor = require('../models/sponsor.js');
const Equipment = require('../models/equipment.js');
const { CoachPayroll } = require('../models/coach.js');
const { getSkillLevel, LEVEL_COLORS } = require('../models/skill.js');

// 像素风格颜色配置
const PIXEL_THEME = {
  PRIMARY: '#9bbc0f',      // 经典GameBoy绿色
  SECONDARY: '#8bac0f',    // 深绿色
  DARK: '#0f380f',        // 最深的绿色（文字）
  LIGHT: '#306230',        // 中等绿色
  CARD_BG: '#1a1a2e',     // 深色卡片背景
  BUTTON_TRAIN: '#d04040', // 红色训练按钮
  BUTTON_MATCH: '#4050d0', // 蓝色比赛按钮
  BUTTON_SPONSOR: '#e0b030', // 金色赞助按钮
  BUTTON_REST: '#50a050',  // 绿色休息按钮
  BUTTON_NEXT: '#64ffda',  // 青色确认按钮
  TEXT_LIGHT: '#9bbc0f',  // 浅色文字
  TEXT_DARK: '#0f380f'    // 深色文字
};

// 操作类型配置
const ACTION_CONFIG = {
  'training': { icon: '🏋️', name: '训练', color: '#fc8181' },
  'match': { icon: '🎾', name: '比赛', color: '#63b3ed' },
  'rest': { icon: '😴', name: '休息', color: '#68d391' },
  'sponsor': { icon: '💰', name: '赞助', color: '#f6e05e' }
};

class HomeScene extends Scene {
  constructor(game) {
    super(game);
    this.formColor = CONFIG.THEME.PRIMARY;
    this.rankingColor = CONFIG.THEME.PRIMARY;

    // 滚动相关
    this.scrollOffset = 0;
    this.maxScroll = 0;
    this.isScrolling = false;
    this.currentViewMonth = null; // 当前查看的月份

    this.initUI();
  }

  initUI() {
    const { width, height } = this.getCanvasSize();

    // 调整按钮大小和字体
    const btnWidth = width * 0.28;
    const btnHeight = height * 0.055;
    const spacing = height * 0.012;
    // 调整按钮起始位置
    const startY = height * 0.68;

    // 第一行：训练 | 比赛
    this.addButton(width * 0.04, startY, btnWidth, btnHeight, '🏋️ 训练', () => {
      if (!this.game.canDoTrainingOrRest()) {
        this.game.showToast('训练点数不足！');
        return;
      }
      this.game.changeScene(GAME_STATE.TRAINING);
    }, {
      bgColor: PIXEL_THEME.BUTTON_TRAIN,
      textColor: '#ffffff',
      fontSize: width * 0.035
    });

    this.addButton(width * 0.38, startY, btnWidth, btnHeight, '🎾 比赛', () => {
      if (!this.game.canPlayMatch()) {
        this.game.showToast('本周比赛次数已用完！');
        return;
      }
      this.game.changeScene(GAME_STATE.MATCH);
    }, {
      bgColor: PIXEL_THEME.BUTTON_MATCH,
      textColor: '#ffffff',
      fontSize: width * 0.035
    });

    // 第二行：赞助 | 生涯 | 道具
    this.addButton(width * 0.04, startY + btnHeight + spacing, btnWidth, btnHeight, '💰 赞助', () => {
      this.game.changeScene(GAME_STATE.SPONSOR);
    }, {
      bgColor: PIXEL_THEME.BUTTON_SPONSOR,
      textColor: '#ffffff',
      fontSize: width * 0.035
    });

    this.addButton(width * 0.38, startY + btnHeight + spacing, btnWidth, btnHeight, '🏆 生涯', () => {
      this.game.changeScene(GAME_STATE.STATS);
    }, {
      bgColor: '#d69e2e',
      textColor: '#ffffff',
      fontSize: width * 0.035
    });

    this.addButton(width * 0.72, startY + btnHeight + spacing, btnWidth, btnHeight, '🎒 道具', () => {
      this.game.changeScene(GAME_STATE.ITEM);
    }, {
      bgColor: '#805ad5',
      textColor: '#ffffff',
      fontSize: width * 0.035
    });

    // 第三行：团队 | （空）| （空）
    this.addButton(width * 0.04, startY + (btnHeight + spacing) * 2, btnWidth, btnHeight, '👨‍🏫 团队', () => {
      this.game.changeScene(GAME_STATE.COACH);
    }, {
      bgColor: '#805ad5',
      textColor: '#ffffff',
      fontSize: width * 0.035
    });

    // 抽卡按钮
    this.addButton(width * 0.38, startY + (btnHeight + spacing) * 2, btnWidth, btnHeight, '🃏 抽卡', () => {
      this.game.changeScene(GAME_STATE.GACHA);
    }, {
      bgColor: '#e53e3e',
      textColor: '#ffffff',
      fontSize: width * 0.035
    });

    // 第四行：下一周（居中，宽按钮）
    const nextBtnWidth = width * 0.6;
    this.addButton((width - nextBtnWidth) / 2, startY + (btnHeight + spacing) * 3, nextBtnWidth, btnHeight, '📅 进入下一周', () => {
      this.nextWeek();
    }, {
      bgColor: PIXEL_THEME.BUTTON_NEXT,
      textColor: PIXEL_THEME.TEXT_DARK,
      fontSize: width * 0.035
    });
  }

  enter() {
    const player = this.game.player;
    if (!player) {
      this.game.changeScene(GAME_STATE.MENU);
      return;
    }

    // 每周恢复精力（每周恢复15点，比原来的每月30点少）
    player.energy = Math.min(100, player.energy + 15);

    // 检查是否退役
    if (player.age >= 40) {
      this.retire();
      return;
    }

    // 更新颜色
    this.formColor = this.getFormColor(player.form);
    this.rankingColor = this.getRankingColor(player.ranking);

    // 检查是否有新的操作记录
    const gameData = this.game.gameData;
    const actionHistory = this.game.gameData.actionHistory || {};
    const currentKey = `${gameData.year}-${gameData.month}-${gameData.week}`;
    const hasNewActions = actionHistory[currentKey] && actionHistory[currentKey].length > 0;
    
    // 如果点击了下周，或者有新的操作记录，或者之前没有滚动过，则滚动到底部
    if (this.shouldScrollToBottom || hasNewActions || this.scrollOffset === 0) {
      this.calculateMaxScroll();
      this.scrollOffset = this.maxScroll;
    }
    // 清除滚动标志
    this.shouldScrollToBottom = false;
    // 否则保持当前位置

    // 保存数据（确保 gameData 变化后被保存）
    this.game.saveGame();
  }

  // 计算最大滚动距离（不再使用，实际滚动值在drawActionLogPanel中计算）
  calculateMaxScroll() {
    this.maxScroll = 0;
  }

  // 处理滚动
  handleScroll(deltaY) {
    this.scrollOffset -= deltaY;

    // 限制滚动范围
    if (this.scrollOffset < 0) this.scrollOffset = 0;
    if (this.scrollOffset > this.maxScroll) this.scrollOffset = this.maxScroll;

    console.log('Home scroll:', this.scrollOffset, 'max:', this.maxScroll);
  }

  nextWeek() {
    const player = this.game.player;
    const gameData = this.game.gameData;

    // 检查是否有报名但未完成的比赛，如果有则自动退赛
    const ongoingTournament = gameData.ongoingTournament;
    if (ongoingTournament && ongoingTournament.matchName) {
      // 清除正在进行比赛
      gameData.ongoingTournament = null;
      this.game.showToast(`⚠️ 未完成比赛，已自动退赛`);
    }

    // 重置每周操作次数
    this.game.resetWeeklyActions();
    
    // 标记：点击了下周，需要滚动到底部显示最新记录
    this.shouldScrollToBottom = true;
    
    // 先递增周
    gameData.week++;
    
    // 每月赞助费改为每4周发放一次
    const isMonthlyPayment = gameData.week % 4 === 1;
    
    // 伤病恢复
    const injuryRecovered = player.recoverInjury();
    if (injuryRecovered) {
      this.game.showToast('伤病已痊愈！');
    }
    
    // 教练周薪支付（每4周发一次，模拟月薪）
    if (player.coaches && player.coaches.length > 0 && isMonthlyPayment) {
      const payrollResult = CoachPayroll.payMonthly(player);
      
      // 检查是否有到期的教练
      const expiredCoaches = payrollResult.filter(r => r.action === 'expired');
      if (expiredCoaches.length > 0) {
        let message = '教练合同到期：\n';
        for (const coach of expiredCoaches) {
          message += `- ${coach.coachName}\n`;
        }
        message += '\n请前往团队页面处理';
        
        const totalPaid = payrollResult.find(r => r.action === 'paid');
        if (totalPaid) {
          this.game.showToast(`支付教练团队月薪 $${totalPaid.amount}`);
        }
        this.game.showModal('⚠️ 教练合同到期', message).then(() => {
          this.game.saveGame();
          this.game.changeScene(GAME_STATE.HOME);
        });
        return;
      }
      
      if (payrollResult.length > 0) {
        const totalPaid = payrollResult.find(r => r.action === 'paid');
        if (totalPaid) {
          this.game.showToast(`支付教练团队月薪 $${totalPaid.amount}`);
        }
      }
    }
    
    // 检查并处理过期赞助（每4周检查一次）
    const expiredSponsors = Sponsor.checkExpiredSponsors(player);
    
    // 处理赞助过期，回收装备
    let recoveredEquipment = [];
    if (expiredSponsors.length > 0) {
      const expirationResult = Sponsor.handleSponsorExpiration(player);
      if (expirationResult.recovered && expirationResult.recovered.length > 0) {
        recoveredEquipment = expirationResult.recovered;
      }
    }
    
    // 发放每月赞助费（每4周）
    let sponsorPayment = 0;
    if (isMonthlyPayment) {
      const sponsorResult = Sponsor.collectMonthlyPayments(player);
      sponsorPayment = sponsorResult.total;
    }
    
    // 处理跨月
    const isNewMonth = gameData.week > 4;
    if (isNewMonth) {
      gameData.week = 1;
      gameData.month++;
    }
    
    // 处理跨年
    const isNewYear = gameData.month > 12;
    if (isNewYear) {
      gameData.month = 1;
      gameData.year++;
      player.ageUp();

      if (player.careerYear > 0) {
        const yearEvent = RandomEvents.getYearEvent();
        this.game.showModal(`${gameData.year}年`, 
          `又一年过去了，现在你${player.age}岁。\n\n年度事件：${yearEvent}`
        ).then(() => {
          this.game.saveGame();
          this.game.changeScene(GAME_STATE.HOME);
        });
        return;
      }
    }
    
    // 构建消息
    let message = '';
    
    // 添加过期赞助信息
    if (expiredSponsors.length > 0) {
      message += `⚠️ 赞助到期：\n`;
      for (const sponsor of expiredSponsors) {
        message += `- ${sponsor.name}\n`;
      }
      
      // 添加被回收的装备信息
      if (recoveredEquipment.length > 0) {
        message += `\n🔄 装备回收：\n`;
        const slotNames = { body: '球衣', racket: '球拍', shoes: '球鞋', head: '帽子', accessory: '配饰' };
        for (const item of recoveredEquipment) {
          message += `- ${slotNames[item.slot] || item.slot}: 已恢复为默认\n`;
        }
      }
      
      message += `\n请重新签约！\n\n`;
    }
    
    // 添加赞助费信息
    if (sponsorPayment > 0) {
      message += `💰 本月赞助费：$${sponsorPayment}`;
    }
    
    // 如果有消息需要显示
    if (message) {
      if (expiredSponsors.length > 0) {
        // 如果有过期赞助，显示弹窗
        this.game.showModal('⚠️ 赞助到期', message).then(() => {
          this.game.saveGame();
          this.game.changeScene(GAME_STATE.HOME);
        });
        return;
      } else if (sponsorPayment > 0) {
        this.game.showToast(`收到本月赞助费：$${sponsorPayment}`);
      }
    }

    // 随机事件（降低概率，因为现在是每周一次）
    if (Math.random() < 0.1) {
      this.triggerRandomEvent();
      return;
    }

    this.game.saveGame();
    this.game.changeScene(GAME_STATE.HOME);
  }

  triggerRandomEvent() {
    const player = this.game.player;
    const event = RandomEvents.triggerEvent(player);

    this.game.gameData.currentEvent = event;
    this.game.changeScene(GAME_STATE.EVENT);
  }

  retire() {
    const player = this.game.player;
    const winRate = player.getWinRate();

    let careerRating = '';
    if (player.grandSlams >= 10) {
      careerRating = '你是网球史上的传奇！GOAT（史上最佳）\n你的名字将永远被铭记在网球史册中！';
    } else if (player.grandSlams >= 5) {
      careerRating = '你是这个时代的巨星！\n你统治了一个时代，是无数球迷的偶像！';
    } else if (player.grandSlams >= 1) {
      careerRating = '你是大满贯冠军，已经创造了历史！\n你实现了无数网球选手的梦想！';
    } else if (player.titles >= 10) {
      careerRating = '你是巡回赛的冠军常客！\n你的职业生涯非常成功！';
    } else if (player.ranking <= 10) {
      careerRating = '你是世界顶尖选手！\n你在网球界留下了自己的印记！';
    } else if (player.ranking <= 100) {
      careerRating = '你拥有成功的职业生涯！\n你以职业选手的身份征战多年，值得尊敬！';
    } else {
      careerRating = '你的职业生涯比较平凡。\n但坚持追逐梦想本身就是一种成功！';
    }

    this.game.showModal('🎾 职业生涯结束',
      `球员：${player.name}\n退役年龄：${player.age}岁\n职业生涯：${player.careerYear}年\n生涯最高排名：${player.careerHighRanking <= 999 ? player.careerHighRanking : '无'}\n生涯总奖金：$${player.careerEarnings}\n\n比赛记录：${player.matchesWon}胜 ${player.matchesPlayed - player.matchesWon}负\n胜率：${winRate}%\n冠军总数：${player.titles}\n大满贯冠军：${player.grandSlams}\n\n生涯评价：\n${careerRating}`,
      false).then(() => {
      this.game.resetGame();
      this.game.changeScene(GAME_STATE.MENU);
    });
  }

  getFormColor(form) {
    if (form >= 80) return CONFIG.THEME.GREEN;
    if (form >= 60) return CONFIG.THEME.PRIMARY;
    if (form >= 40) return CONFIG.THEME.ORANGE;
    if (form >= 20) return CONFIG.THEME.RED;
    return '#e53e3e';
  }

  getRankingColor(ranking) {
    if (ranking <= 10) return CONFIG.THEME.GOLD;
    if (ranking <= 50) return '#c0c0c0';
    if (ranking <= 100) return '#cd7f32';
    return CONFIG.THEME.PRIMARY;
  }

  render(ctx) {
    const player = this.game.player;
    if (!player) return;

    const { width, height } = this.getCanvasSize();

    // 背景 - 像素风格网格
    this.drawPixelBackground(ctx);

    // 绘制顶部状态栏
    this.drawTopStatusBar(ctx, player);

    // 绘制中部操作记录面板
    this.drawActionLogPanel(ctx, player);

    // 绘制按钮 - 统一方法
    this.renderButtons(ctx);
  }

  // 绘制背景
  drawPixelBackground(ctx) {
    const { width, height } = this.getCanvasSize();

    // 深色背景
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, width, height);
  }

  // 绘制顶部状态栏
  drawTopStatusBar(ctx, player) {
    const { width, height } = this.getCanvasSize();

    // 状态栏高度
    const barHeight = height * 0.22;
    const offsetY = 50; // 往下移动50px

    // 状态栏背景
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, barHeight);

    // 顶部装饰线
    ctx.fillStyle = PIXEL_THEME.PRIMARY;
    ctx.fillRect(0, 0, width, 3);

    // ===== 左侧：角色形象 + 玩家信息 =====
    const avatarSize = width * 0.12;
    const avatarX = width * 0.04;
    const avatarY = height * 0.07 + offsetY;
    const nameX = avatarX + avatarSize + width * 0.02;

    // 保存角色形象区域用于点击检测
    this.avatarArea = { x: avatarX - 5, y: avatarY - 5, width: avatarSize + 10, height: avatarSize + 10 };

    // 绘制角色形象
    this.drawCharacterAvatar(ctx, player, avatarX, avatarY, avatarSize);

    // 玩家名字（可点击提示）
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${width * 0.04}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(player.name, nameX, height * 0.045 + offsetY);

    // 年龄和综合实力
    let overall = 0;
    let overallLevel = { level: 0, name: '新手' };
    try {
      const overallRaw = player.calculateOverall();
      overall = (typeof overallRaw === 'number' && !isNaN(overallRaw)) ? overallRaw : 0;
      if (overall > 0) {
        overallLevel = getSkillLevel(overall) || { level: 0, name: '新手' };
      }
    } catch (e) {
      console.error('Error calculating overall:', e);
    }
    
    ctx.fillStyle = PIXEL_THEME.PRIMARY;
    ctx.font = `${width * 0.024}px sans-serif`;
    ctx.fillText(`年龄 ${player.age}岁`, nameX, height * 0.075 + offsetY);
    
    // 综合实力显示（带等级）
    ctx.fillText(`综合 ${overall}`, nameX, height * 0.10 + offsetY);
    
    // 显示等级名称和颜色
    ctx.fillStyle = LEVEL_COLORS[overallLevel.level] || PIXEL_THEME.PRIMARY;
    ctx.font = `${width * 0.02}px sans-serif`;
    ctx.fillText(`(${overallLevel.name})`, nameX + width * 0.12, height * 0.10 + offsetY);

    // ===== 右侧：世界排名和训练点数 =====
    const rightX = width * 0.88;

    // 世界排名
    ctx.fillStyle = PIXEL_THEME.PRIMARY;
    ctx.font = `${width * 0.024}px sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText('世界排名', rightX, height * 0.05 + offsetY);

    ctx.fillStyle = this.rankingColor;
    ctx.font = `bold ${width * 0.045}px sans-serif`;
    ctx.fillText(player.ranking <= 999 ? `#${player.ranking}` : '无', rightX, height * 0.085 + offsetY);

    // 训练点数显示（高亮显示）
    const tpColor = player.trainingPoints > 0 ? CONFIG.THEME.GREEN : CONFIG.THEME.RED;
    ctx.fillStyle = tpColor;
    ctx.font = `bold ${width * 0.032}px sans-serif`;
    ctx.fillText(`🎯 训练点: ${player.trainingPoints}/5`, rightX, height * 0.13 + offsetY);

    // 资金显示
    ctx.fillStyle = CONFIG.THEME.GOLD;
    ctx.font = `${width * 0.028}px sans-serif`;
    ctx.fillText(`💰 $${player.money}`, rightX, height * 0.17 + offsetY);
    
    // 显示伤病状态
    if (player.injury && player.injury.isInjured) {
      const injuryNames = {
        'light_strain': '轻微拉伤',
        'muscle_soreness': '肌肉酸痛',
        'sprain': '扭伤',
        'tennis_elbow': '网球肘',
        'meniscus': '半月板损伤',
        'season_end': '赛季报销'
      };
      const injuryName = injuryNames[player.injury.type] || '伤病';
      ctx.fillStyle = CONFIG.THEME.RED;
      ctx.font = `${width * 0.026}px sans-serif`;
      ctx.fillText(`🤕 ${injuryName}`, rightX, height * 0.21 + offsetY);
      ctx.fillText(`恢复${player.injury.weeksRemaining}周`, rightX, height * 0.24 + offsetY);
    }
  }

  // 绘制角色头像
  drawCharacterAvatar(ctx, player, x, y, size) {
    const scale = size / 80;
    const equip = player.equipment || {};

    // 获取装备颜色
    const headInfo = Equipment.getItemInfo(Equipment.SLOT.HEAD, equip.head);
    const bodyInfo = Equipment.getItemInfo(Equipment.SLOT.BODY, equip.body);
    const racketInfo = Equipment.getItemInfo(Equipment.SLOT.RACKET, equip.racket);
    const shoesInfo = Equipment.getItemInfo(Equipment.SLOT.SHOES, equip.shoes);

    // 背景圆圈
    ctx.fillStyle = 'rgba(100, 255, 218, 0.15)';
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2 + 3, 0, Math.PI * 2);
    ctx.fill();

    // 身体
    ctx.fillStyle = '#f5d0b0';
    // 头
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size * 0.28, 12 * scale, 0, Math.PI * 2);
    ctx.fill();
    // 身体
    ctx.fillRect(x + size * 0.3, y + size * 0.42, size * 0.4, size * 0.35);

    // 头部装备
    if (headInfo && headInfo.color) {
      ctx.fillStyle = headInfo.color;
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size * 0.22, 14 * scale, Math.PI, 0);
      ctx.fill();
    }

    // 身体装备
    if (bodyInfo && bodyInfo.color) {
      ctx.fillStyle = bodyInfo.color;
      ctx.fillRect(x + size * 0.28, y + size * 0.42, size * 0.44, size * 0.37);
    }

    // 鞋子
    if (shoesInfo && shoesInfo.color) {
      ctx.fillStyle = shoesInfo.color;
      ctx.fillRect(x + size * 0.28, y + size * 0.78, size * 0.18, size * 0.12);
      ctx.fillRect(x + size * 0.54, y + size * 0.78, size * 0.18, size * 0.12);
    }

    // 球拍
    if (racketInfo) {
      const racketX = x + size * 0.82;
      const racketY = y + size * 0.45;
      ctx.strokeStyle = racketInfo.color || '#718096';
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.ellipse(racketX, racketY, 6 * scale, 10 * scale, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = racketInfo.handleColor || '#4a5568';
      ctx.fillRect(racketX - 2 * scale, racketY + 8 * scale, 4 * scale, 12 * scale);
    }

    // 点击提示边框
    ctx.strokeStyle = 'rgba(100, 255, 218, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2 + 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 绘制操作记录面板
  drawActionLogPanel(ctx, player) {
    const { width, height } = this.getCanvasSize();

    // 面板区域，在状态栏下方
    const panelX = width * 0.03;
    const panelY = height * 0.24;
    const panelWidth = width * 0.94;
    const panelHeight = height * 0.40;

    // 获取操作记录
    const actionHistory = this.game.gameData.actionHistory || {};
    const gameData = this.game.gameData;

    // 顶部显示当前年月周 - 确保week是有效数字
    const displayYear = gameData.year || 2024;
    const displayMonth = gameData.month || 1;
    const displayWeek = gameData.week || 1;
    
    ctx.fillStyle = PIXEL_THEME.PRIMARY;
    ctx.font = `bold ${width * 0.035}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`${displayYear}年${displayMonth}月第${displayWeek}周`, width / 2, panelY + height * 0.035);

    // 构建所有周数据（正序排列）
    const weekDataList = [];
    const startYear = 2024;

    for (let year = startYear; year <= gameData.year; year++) {
      const endMonth = (year === gameData.year) ? gameData.month : 12;
      for (let month = 1; month <= endMonth; month++) {
        const maxWeek = (year === gameData.year && month === gameData.month) ? gameData.week : 4;
        for (let week = 1; week <= maxWeek; week++) {
          const key = `${year}-${month}-${week}`;
          const actions = actionHistory[key] || [];
          weekDataList.push({
            year: year,
            month: month,
            week: week,
            actions: actions,
            hasActions: actions.length > 0
          });
        }
      }
    }

    // 渲染操作记录（正序，最早在上，最近在下）
    const contentStartY = panelY + height * 0.07;
    const lineHeight = height * 0.06 * 1.5; // 1.5倍行间距
    const monthLineHeight = height * 0.05 * 1.5; // 1.5倍行间距
    let currentY = contentStartY - this.scrollOffset;
    const maxDisplayY = panelY + panelHeight - height * 0.02;

    ctx.font = `${width * 0.037}px sans-serif`;  // 14号字体

    // 如果没有操作记录，显示提示
    if (weekDataList.every(w => !w.hasActions)) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = `${width * 0.037}px sans-serif`;  // 14号字体
      ctx.textAlign = 'center';
      ctx.fillText('暂无操作记录', width / 2, contentStartY + height * 0.1);
      return;
    }

    // 渲染所有周记录
    for (const weekData of weekDataList) {
      // 显示周标题
      if (currentY >= contentStartY && currentY <= maxDisplayY) {
        ctx.fillStyle = PIXEL_THEME.PRIMARY;
        ctx.font = `bold ${width * 0.037}px sans-serif`;  // 14号字体
        ctx.textAlign = 'left';
        ctx.fillText(`${weekData.month}月第${weekData.week}周`, panelX + width * 0.02, currentY);
      }
      currentY += monthLineHeight;

      // 如果该周没有操作，显示提示
      if (!weekData.hasActions) {
        if (currentY >= contentStartY && currentY <= maxDisplayY) {
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.font = `${width * 0.037}px sans-serif`;  // 14号字体
          ctx.textAlign = 'center';
          ctx.fillText('这周什么都没有做', width / 2, currentY);
        }
        currentY += monthLineHeight;
      } else {
        // 渲染该周的操作记录
        for (const action of weekData.actions) {
          if (currentY >= contentStartY && currentY <= maxDisplayY) {
            const config = ACTION_CONFIG[action.type] || { icon: '❓', name: '未知', color: '#ffffff' };

            // 操作图标
            ctx.fillStyle = config.color;
            ctx.textAlign = 'left';
            ctx.fillText(config.icon, panelX + width * 0.02, currentY);

            // 操作描述和结果（合并显示）
            ctx.fillStyle = '#ffffff';
            const text = `${action.details} ${action.result || ''}`;
            ctx.fillText(text, panelX + width * 0.07, currentY);
          }
          currentY += lineHeight;

          // 如果已经超出显示范围，停止渲染
          if (currentY > maxDisplayY + 50) break;
        }
      }

      if (currentY > maxDisplayY + 50) break;
    }

    // 计算最大滚动值
    let totalHeight = 0;
    for (const weekData of weekDataList) {
      totalHeight += monthLineHeight; // 周标题
      if (weekData.hasActions) {
        totalHeight += weekData.actions.length * lineHeight;
      } else {
        totalHeight += monthLineHeight; // 空周提示
      }
    }
    this.maxScroll = Math.max(0, totalHeight - (panelHeight - height * 0.10));

    // 如果是初始状态（scrollOffset为0），默认滚动到最下面显示最新记录
    if (this.scrollOffset === 0 && this.maxScroll > 0) {
      this.scrollOffset = this.maxScroll;
    }

    // 确保滚动位置不超过最大值
    if (this.scrollOffset > this.maxScroll) {
      this.scrollOffset = this.maxScroll;
    }

    // 滚动指示器
    if (this.maxScroll > 0) {
      const scrollBarHeight = Math.min(panelHeight * 0.12, panelHeight * 0.25);
      const scrollRatio = Math.min(1, Math.max(0, this.scrollOffset / this.maxScroll));
      const scrollBarY = panelY + height * 0.07 + scrollRatio * (panelHeight - height * 0.12 - scrollBarHeight);

      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(panelX + panelWidth - 4, scrollBarY, 3, scrollBarHeight);
    }
  }

  // 处理触摸事件
  handleTouch(x, y, type) {
    if (type === 'touchend') {
      // 检查是否点击了头像区域
      if (this.avatarArea) {
        if (x >= this.avatarArea.x && x <= this.avatarArea.x + this.avatarArea.width &&
            y >= this.avatarArea.y && y <= this.avatarArea.y + this.avatarArea.height) {
          // 跳转到装备页面
          this.game.changeScene(GAME_STATE.EQUIPMENT);
          return;
        }
      }
    }
    
    // 调用父类方法处理其他触摸事件
    super.handleTouch(x, y, type);
  }
}

module.exports = HomeScene;
