/**
 * 比赛场景 - 签表系统版
 */
const { Scene, GAME_STATE } = require('./scene.js');
const { Match, MatchLevel } = require('../models/match.js');
const { Tournament, MATCH_STRATEGY, MatchStrategy, InjurySystem, TOURNAMENT_CONFIG, TournamentCalendar, ATP_TOURNAMENT_CONFIG, WTA_TOURNAMENT_CONFIG, setGameData } = require('../models/tournament.js');
const { STRATEGY_CONFIG, STRATEGY_TYPES, getStrategyConfig, calculateStrategyBonus, checkStrategyCounter, StrategyManager } = require('../models/strategy.js');

class MatchScene extends Scene {
  constructor(game) {
    super(game);
    this.availableMatches = [];
    this.matchButtons = [];
    
    // 签表系统
    this.currentTournament = null;
    this.currentOpponent = null;
    this.selectedStrategy = 'normal';
    this.tournamentPhase = 'select'; // select, bracket, match, result
    this.currentMatchResult = null;
    this.ongoingMatchInfo = null; // 正在进行的比赛信息

    // 赛事日历相关
    this.availableTournaments = []; // 当前周可参加的赛事列表
    this.allTournaments = []; // 所有赛事（按月份分组）- 职业赛事
    this.itfTournaments = []; // ITF赛事列表
    this.tournamentScrollY = 0; // 赛事列表滚动位置
    this.maxTournamentScrollY = 0; // 最大滚动位置
    this.currentTab = 'pro'; // 'pro' 职业赛事, 'itf' ITF赛事

    this.initUI();
  }

  initUI() {
    const canvasWidth = this.game.canvasWidth || 375;
    
    // 返回按钮的回调会根据当前阶段动态决定
    this.addButton(canvasWidth * 0.03, canvasWidth * 0.03, canvasWidth * 0.12, canvasWidth * 0.12, '←', () => {
      this.handleBack();
    }, {
      bgColor: 'transparent',
      textColor: '#64ffda',
      borderColor: '#64ffda',
      fontSize: canvasWidth * 0.06
    });
    
    // 触摸相关 - 用于区分滑动和点击（与训练页面保持一致）
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchStartTime = 0;
    this.touchMoved = false;
    this.scrollThreshold = 10;  // 滑动阈值
  }

  // 计算最大滚动距离
  calculateMaxScroll() {
    const canvasHeight = this.game.canvasHeight || 667;
    const canvasWidth = this.game.canvasWidth || 375;
    
    let totalHeight = 0;
    for (const monthGroup of this.allTournaments) {
      totalHeight += canvasHeight * 0.08; // 月份标题高度
      totalHeight += monthGroup.tournaments.length * (canvasHeight * 0.17 + canvasHeight * 0.01); // 赛事卡片高度
    }
    
    const startY = canvasHeight * 0.2;
    const panelHeight = canvasHeight * 0.75;
    this.maxTournamentScrollY = Math.max(0, totalHeight - panelHeight + startY);
  }
  
  // 处理触摸事件 - 与训练页面保持一致
  handleTouch(x, y, type) {
    const canvasWidth = this.game.canvasWidth || 375;
    
    if (type === 'touchstart') {
      // 记录触摸起始位置和时间
      this.touchStartX = x;
      this.touchStartY = y;
      this.touchStartTime = Date.now();
      this.touchMoved = false;
    } else if (type === 'touchmove') {
      // 计算移动距离
      const dx = x - this.touchStartX;
      const dy = y - this.touchStartY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 如果移动超过阈值，认为是滑动
      if (distance > this.scrollThreshold) {
        this.touchMoved = true;
        
        if (this.tournamentPhase === 'bracket') {
          // 签表界面滑动
          if (Math.abs(dx) > Math.abs(dy)) {
            this.handleBracketScroll(-dx);
          } else {
            this.handleBracketScrollY(-dy);
          }
        } else if (this.tournamentPhase === 'select') {
          // 赛事选择界面滑动
          const deltaY = y - this.touchStartY;
          this.handleTournamentScroll(-deltaY);
          this.touchStartY = y; // 更新起始位置以实现连续滚动
        }
      }
      
      // 在比赛界面，持续跟踪触摸位置用于雷达图hover检测
      if (this.tournamentPhase === 'match') {
        this.lastTouchX = x;
        this.lastTouchY = y;
        this.isTouchingRadar = true;
        this.checkSkillHover(x, y);
      }
    } else if (type === 'touchend') {
      // 检查是否是点击（没有滑动且触摸时间短）
      const touchDuration = Date.now() - this.touchStartTime;
      if (!this.touchMoved && touchDuration < 300) {
        this.handleTap(x, y);
      }
      
      // 清除触摸状态
      this.isTouchingRadar = false;
      this.setHoveredSkill(null);
    }
    
    // 处理返回按钮
    super.handleTouch(x, y, type);
  }

  // 处理点击 - 与训练页面保持一致
  handleTap(x, y) {
    const canvasWidth = this.game.canvasWidth || 375;
    const canvasHeight = this.game.canvasHeight || 667;
    
    // 处理Tab切换点击
    if (this.tournamentPhase === 'select') {
      const tabY = canvasHeight * 0.155;
      const tabHeight = canvasHeight * 0.04;
      const tabWidth = canvasWidth * 0.35;
      const tabSpacing = canvasWidth * 0.03;
      const proTabX = canvasWidth * 0.08;
      const itfTabX = proTabX + tabWidth + tabSpacing;
      
      // 检查是否点击了职业赛事Tab
      if (y >= tabY && y <= tabY + tabHeight) {
        if (x >= proTabX && x <= proTabX + tabWidth) {
          this.switchTab('pro');
          return;
        } else if (x >= itfTabX && x <= itfTabX + tabWidth) {
          this.switchTab('itf');
          return;
        }
      }
      
      // 根据当前Tab处理赛事按钮点击
      if (this.currentTab === 'pro') {
        this.handleProTournamentTap(x, y, canvasWidth, canvasHeight);
      } else {
        this.handleITFTournamentTap(x, y, canvasWidth, canvasHeight);
      }
    }
  }

  // 处理职业赛事点击
  handleProTournamentTap(x, y, canvasWidth, canvasHeight) {
    if (!this.allTournaments || this.allTournaments.length === 0) return;
    
    const remaining = this.game.getRemainingActions();
    let currentY = canvasHeight * 0.21 - this.tournamentScrollY;
    
    for (const monthGroup of this.allTournaments) {
      currentY += canvasHeight * 0.07; // 月份标题
      
      for (const tournament of monthGroup.tournaments) {
        const btnX = canvasWidth * 0.83;
        const btnY = currentY + canvasHeight * 0.028;
        const btnWidth = canvasWidth * 0.14;
        const btnHeight = canvasHeight * 0.085;
        
        // 检查点击是否在按钮范围内
        if (x >= btnX && x <= btnX + btnWidth && y >= btnY && y <= btnY + btnHeight) {
          // 检查按钮状态
          const ongoingData = this.game.gameData.ongoingTournament;
          const isOngoing = ongoingData && ongoingData.matchName === tournament.name;
          
          if (isOngoing || tournament.isCurrentWeek) {
            if (isOngoing) {
              // 继续比赛
              this.resumeTournamentByMatch(tournament);
            } else if (remaining.match > 0) {
              // 参赛
              this.joinTournament(tournament);
            }
            return;
          }
        }
        
        currentY += canvasHeight * 0.15;
      }
      
      currentY += canvasHeight * 0.02;
    }
  }

  // 处理ITF赛事点击
  handleITFTournamentTap(x, y, canvasWidth, canvasHeight) {
    if (!this.itfTournaments || this.itfTournaments.length === 0) return;
    
    const remaining = this.game.getRemainingActions();
    let currentY = canvasHeight * 0.21 - this.tournamentScrollY;
    
    for (const tournament of this.itfTournaments) {
      const btnX = canvasWidth * 0.83;
      const btnY = currentY + canvasHeight * 0.028;
      const btnWidth = canvasWidth * 0.14;
      const btnHeight = canvasHeight * 0.085;
      
      // 检查点击是否在按钮范围内
      if (x >= btnX && x <= btnX + btnWidth && y >= btnY && y <= btnY + btnHeight) {
        // 检查按钮状态
        const ongoingData = this.game.gameData.ongoingTournament;
        const isOngoing = ongoingData && ongoingData.matchName === tournament.name;
        
        if (isOngoing || remaining.match > 0) {
          if (isOngoing) {
            // 继续比赛
            this.resumeTournamentByMatch(tournament);
          } else if (remaining.match > 0) {
            // 参赛
            this.joinTournament(tournament);
          }
          return;
        }
      }
      
      currentY += canvasHeight * 0.15;
    }
  }

  // 根据赛事信息恢复比赛
  resumeTournamentByMatch(tournament) {
    const ongoingData = this.game.gameData.ongoingTournament;
    if (ongoingData) {
      this.restoreOngoingTournament();
      this.tournamentPhase = 'bracket';
      this.setupBracketButtons();
    }
  }
  
  // 处理返回按钮
  handleBack() {
    if (this.tournamentPhase === 'match') {
      // 策略选择页面返回到签表页面
      this.tournamentPhase = 'bracket';
      this.setupBracketButtons();
    } else if (this.tournamentPhase === 'bracket') {
      // 签表页面返回到首页
      this.exitTournament();
    } else if (this.tournamentPhase === 'result') {
      // 结果页面返回签表
      this.tournamentPhase = 'bracket';
      this.setupBracketButtons();
    } else {
      // 选择页面直接返回首页
      this.exitTournament();
    }
  }

  // 保存正在进行比赛到存档
  saveOngoingTournament() {
    if (this.currentTournament && this.tournamentPhase !== 'select') {
      const matchInfo = this.currentTournament.getCurrentMatchInfo();
      const ongoingData = {
        tournamentData: this.currentTournament.toJSON(),
        matchInfo: matchInfo,
        phase: this.tournamentPhase,
        matchLevel: this.currentTournament.matchInfo ? this.currentTournament.matchInfo.level : null,
        matchName: this.currentTournament.matchInfo ? this.currentTournament.matchInfo.name : ''
      };
      this.game.gameData.ongoingTournament = ongoingData;
      this.game.saveGame();
    }
  }

  // 从存档恢复比赛
  restoreOngoingTournament() {
    const ongoingData = this.game.gameData.ongoingTournament;
    if (ongoingData && ongoingData.tournamentData) {
      // 创建新的Tournament实例并从JSON恢复
      this.currentTournament = Tournament.fromJSON(ongoingData.tournamentData, this.game.player);
      this.currentTournament.matchInfo = ongoingData.matchInfo;
      this.tournamentPhase = ongoingData.phase;
      
      // 设置当前正在进行的比赛信息
      this.ongoingMatchInfo = ongoingData.matchInfo;
      
      // 清除存档
      this.game.gameData.ongoingTournament = null;
      this.game.saveGame();
      
      return true;
    }
    return false;
  }

  // 清除正在进行比赛
  clearOngoingTournament() {
    this.game.gameData.ongoingTournament = null;
    this.game.saveGame();
  }

  // 获取所有赛事（按月份分组）
  getAllTournamentsGrouped() {
    const playerGender = this.game.player.gender || 'male';
    const currentMonth = this.game.gameData.month || 1;
    const currentWeek = this.game.gameData.week || 1;
    const currentYear = this.game.gameData.year || 2024;
    
    // 月份名称
    const monthNames = ['', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    
    // 按月份分组
    const grouped = {};
    for (let month = 1; month <= 12; month++) {
      // 获取该月所有周的比赛
      for (let week = 1; week <= 4; week++) {
        const tournaments = TournamentCalendar.getAvailableTournaments(
          currentYear,
          month,
          playerGender,
          week
        );
        
        for (const t of tournaments) {
          const monthKey = month;
          if (!grouped[monthKey]) {
            grouped[monthKey] = {
              month: month,
              monthName: monthNames[month],
              tournaments: []
            };
          }
          
          // 只有当前月份且当前周的比赛才能参加
          const isCurrentWeek = (month === currentMonth && week === currentWeek);
          const canJoin = isCurrentWeek && this.game.canPlayMatch();
          
          grouped[monthKey].tournaments.push({
            id: t.type + '_' + t.name + '_' + month + '_' + week,
            name: t.name,
            level: t.config,
            entryCost: Math.floor(t.config.championPrize * 0.02),
            minSkill: 30,
            tournamentType: t.type,
            month: month,
            week: week,
            isCurrentWeek: isCurrentWeek,
            canJoin: canJoin,
            calendarTournament: t
          });
        }
      }
    }
    
    // 转换为数组
    const result = [];
    for (const monthKey in grouped) {
      if (grouped[monthKey].tournaments.length > 0) {
        result.push(grouped[monthKey]);
      }
    }
    
    return result;
  }

  // 获取ITF赛事列表 - 只显示当前周的比赛
  getITFTournaments() {
    const playerGender = this.game.player.gender || 'male';
    const config = playerGender === 'male' ? ATP_TOURNAMENT_CONFIG : WTA_TOURNAMENT_CONFIG;
    const currentYear = this.game.gameData.year || 2024;
    const currentMonth = this.game.gameData.month || 1;
    const currentWeek = this.game.gameData.week || 1;
    
    // ITF赛事：FUTURES和CHALLENGER级别
    const itfLevels = ['FUTURES', 'CHALLENGER'];
    const itfTournaments = [];
    
    // 只获取当前周的ITF赛事
    const itfEvents = TournamentCalendar.getITFTournaments(currentYear, currentMonth, playerGender, currentWeek);
    
    for (const itfEvent of itfEvents) {
      const level = itfEvent.type;
      const levelConfig = itfEvent.config;
      const levelName = level === 'FUTURES' ? '未来赛' : '挑战赛';
      
      itfTournaments.push({
        id: `${level}_week${currentWeek}_${currentMonth}`,
        name: `ITF ${levelName}`,
        level: levelConfig,
        entryCost: Math.floor(levelConfig.championPrize * 0.02),
        minSkill: level === 'FUTURES' ? 20 : 30,
        tournamentType: level,
        week: currentWeek,
        month: currentMonth,
        isCurrentWeek: true,
        canJoin: this.game.canPlayMatch(),
        calendarTournament: itfEvent
      });
    }
    
    // 如果赛事日历中没有找到，使用备用逻辑
    if (itfTournaments.length === 0) {
      for (const level of itfLevels) {
        if (config[level]) {
          const levelConfig = config[level];
          const levelName = level === 'FUTURES' ? '未来赛' : '挑战赛';
          itfTournaments.push({
            id: `${level}_week${currentWeek}_${currentMonth}`,
            name: `ITF ${levelName}`,
            level: levelConfig,
            entryCost: Math.floor(levelConfig.championPrize * 0.02),
            minSkill: level === 'FUTURES' ? 20 : 30,
            tournamentType: level,
            week: currentWeek,
            month: currentMonth,
            isCurrentWeek: true,
            canJoin: this.game.canPlayMatch()
          });
        }
      }
    }
    
    return itfTournaments;
  }

  enter() {
    // 检查是否有正在进行的比赛
    const hasOngoing = this.game.gameData.ongoingTournament != null;
    
    // 如果在签表流程中但不是从存档恢复，保持当前状态
    if (this.tournamentPhase !== 'select') {
      // 如果是从home场景重新进入（可能是恢复状态）
      if (!this.currentTournament && hasOngoing) {
        this.restoreOngoingTournament();
      }
      return;
    }
    
    // 尝试恢复正在进行的比赛
    if (hasOngoing) {
      const restored = this.restoreOngoingTournament();
      if (restored) {
        // 恢复到签表界面
        this.tournamentPhase = 'bracket';
        this.setupBracketButtons();
        return;
      }
    }
    
    // 获取玩家性别
    const playerGender = this.game.player.gender || 'male';
    
    // 设置游戏数据引用（用于赛事日历计算）
    setGameData(this.game.gameData);
    
    // 获取当前周的赛事日历
    const currentMonth = this.game.gameData.month || 1;
    const currentWeek = this.game.gameData.week || 1;
    
    // 从赛事日历获取本周可参加的赛事
    this.availableTournaments = TournamentCalendar.getAvailableTournaments(
      this.game.gameData.year || 2024,
      currentMonth,
      playerGender,
      currentWeek
    );
    
    // 获取所有职业赛事（按月份分组）
    this.allTournaments = this.getAllTournamentsGrouped();
    
    // 获取ITF赛事列表
    this.itfTournaments = this.getITFTournaments();
    
    // 计算最大滚动距离
    this.calculateMaxScroll();
    
    // 只使用赛事日历中的比赛
    this.availableMatches = [];
    
    // 添加赛事日历中的比赛
    for (const t of this.availableTournaments) {
      this.availableMatches.push({
        id: t.type + '_' + t.name,
        name: t.name,  // 使用赛事名称
        level: t.config,
        entryCost: Math.floor(t.config.championPrize * 0.02),  // 报名费为冠军奖金的2%
        minSkill: 30,  // 默认最低技能
        tournamentType: t.type,
        calendarTournament: t
      });
    }

    // 重置滚动位置
    this.tournamentScrollY = 0;
    
    // 根据当前tab设置滚动位置
    if (this.currentTab === 'pro' && this.allTournaments.length > 0) {
      // 找到当前月份的索引位置（用于默认滚动到当前位置）
      let currentMonthIndex = 0;
      for (let i = 0; i < this.allTournaments.length; i++) {
        if (this.allTournaments[i].month === currentMonth) {
          currentMonthIndex = i;
          break;
        }
      }
      // 默认滚动到当前月份
      const canvasHeight = this.game.canvasHeight || 667;
      this.tournamentScrollY = currentMonthIndex * canvasHeight * 0.35;
      // 确保滚动位置不超过最大滚动距离
      if (this.tournamentScrollY > this.maxTournamentScrollY) {
        this.tournamentScrollY = this.maxTournamentScrollY;
      }
    }

    // 清除旧的参赛按钮（保留返回按钮）
    const returnButton = this.buttons[0];
    this.buttons = returnButton ? [returnButton] : [];
    this.matchButtons = [];
  }

  // 恢复正在进行比赛
  resumeTournament() {
    if (this.currentTournament) {
      this.tournamentPhase = 'bracket';
      this.setupBracketButtons();
    }
  }

  // 设置签表界面按钮
  setupBracketButtons() {
    // 清除按钮，只保留返回
    this.buttons = this.buttons.slice(0, 1);
    
    const canvasWidth = this.game.canvasWidth || 375;
    const canvasHeight = this.game.canvasHeight || 667;
    
    // 获取当前比赛状态
    const matchInfo = this.currentTournament ? this.currentTournament.getCurrentMatchInfo() : null;
    
    if (matchInfo) {
      if (matchInfo.champion || matchInfo.eliminated) {
        // 比赛已结束，如果是玩家被淘汰，模拟剩余比赛
        if (matchInfo.eliminated) {
          this.currentTournament.simulateRemainingMatches();
        }
        
        this.addButton(canvasWidth * 0.3, canvasHeight * 0.75, canvasWidth * 0.4, canvasHeight * 0.08, '完成', () => {
          this.finishTournament();
        }, {
          bgColor: '#64ffda',
          textColor: '#0a192f',
          fontSize: canvasWidth * 0.04
        });
      } else {
        // 继续比赛按钮
        this.addButton(canvasWidth * 0.3, canvasHeight * 0.73, canvasWidth * 0.4, canvasHeight * 0.08, '继续比赛', () => {
          this.startCurrentMatch();
        }, {
          bgColor: '#64ffda',
          textColor: '#0a192f',
          fontSize: canvasWidth * 0.04
        });
        
        // 退出比赛按钮
        this.addButton(canvasWidth * 0.3, canvasHeight * 0.83, canvasWidth * 0.4, canvasHeight * 0.08, '退出比赛', () => {
          this.quitTournament();
        }, {
          bgColor: '#f56565',
          textColor: '#fff',
          fontSize: canvasWidth * 0.04
        });
      }
    }
  }

  // 退出签表流程
  exitTournament() {
    if (this.tournamentPhase !== 'select') {
      // 保存当前比赛状态
      this.saveOngoingTournament();
      this.tournamentPhase = 'select';
      this.currentTournament = null;
      this.currentOpponent = null;
    }
    this.game.changeScene(GAME_STATE.HOME);
  }

  // 加入比赛（创建签表）
  joinTournament(match) {
    const player = this.game.player;
    
    // 检查本周比赛次数是否用完
    if (!this.game.canPlayMatch()) {
      this.game.showToast('本周比赛次数已用完！');
      return;
    }
    
    // 检查伤病
    if (player.injury && player.injury.isInjured) {
      this.game.showToast(`受伤中！需要休息${player.injury.weeksRemaining}周`);
      return;
    }

    // 检查是否有足够的资源参赛
    if (player.money < match.entryCost) {
      this.game.showToast('资金不足，无法报名');
      return;
    }

    if (player.energy < 10) {
      this.game.showToast('精力不足，需要至少10精力');
      return;
    }

    const playerSkill = player.calculateOverall();
    if (playerSkill < match.minSkill) {
      this.game.showToast(`能力不足，需要${match.minSkill}以上能力`);
      return;
    }

    // 扣除报名费
    player.money -= match.entryCost;

    // 找到对应的比赛级别
    let tournamentLevel = 'CHALLENGER';
    
    // 如果是赛事日历中的比赛，使用tournamentType
    if (match.tournamentType) {
      tournamentLevel = match.tournamentType;
    } else if (match.level === MatchLevel.JUNIOR) {
      tournamentLevel = 'JUNIOR';
    } else if (match.level === MatchLevel.FUTURES) {
      tournamentLevel = 'FUTURES';
    } else if (match.level === MatchLevel.CHALLENGER) {
      tournamentLevel = 'CHALLENGER';
    } else if (match.level === MatchLevel.ATP250) {
      tournamentLevel = 'ATP250';
    } else if (match.level === MatchLevel.ATP500) {
      tournamentLevel = 'ATP500';
    } else if (match.level === MatchLevel.ATP1000) {
      tournamentLevel = 'ATP1000';
    } else if (match.level === MatchLevel.GRAND_SLAM) {
      tournamentLevel = 'GRAND_SLAM';
    }

    // 创建签表
    this.currentTournament = new Tournament(tournamentLevel, player);
    this.currentTournament.matchInfo = match;
    this.tournamentPhase = 'bracket';
    
    // 清除按钮，只保留返回
    this.buttons = this.buttons.slice(0, 1);
    
    // 添加继续按钮
    const canvasWidth = this.game.canvasWidth || 375;
    const canvasHeight = this.game.canvasHeight || 667;
    
    this.addButton(canvasWidth * 0.3, canvasHeight * 0.75, canvasWidth * 0.4, canvasHeight * 0.08, '开始比赛', () => {
      this.startCurrentMatch();
    }, {
      bgColor: '#64ffda',
      textColor: '#0a192f',
      fontSize: canvasWidth * 0.04
    });
  }

  // 获取场地类型（根据赛事名称判断）
  getCourtType(tournamentName) {
    const name = tournamentName || '';
    if (name.includes('草地') || name.includes('温网') || name.includes('草') || name.includes('女王杯')) {
      return 'grass';
    } else if (name.includes('红土') || name.includes('法网') || name.includes('蒙特卡洛') || name.includes('罗马')) {
      return 'clay';
    } else {
      return 'hard'; // 硬地
    }
  }

  // 开始当前轮次比赛
  startCurrentMatch() {
    const player = this.game.player;
    
    // 检查精力（至少需要10点精力来开始比赛）
    if (player.energy < 10) {
      this.game.showToast('精力不足，需要至少10精力');
      return;
    }
    
    // 增加比赛次数计数（只在正式开始比赛时计算）
    this.game.addMatchAction();
    
    if (!this.currentTournament) return;
    
    const matchInfo = this.currentTournament.getCurrentMatchInfo();
    
    // 检查是否已经结束
    if (matchInfo.champion) {
      this.handleTournamentEnd(true);
      return;
    }
    
    if (matchInfo.eliminated) {
      this.handleTournamentEnd(false);
      return;
    }
    
    this.currentOpponent = matchInfo.opponent;
    
    // 如果还是没有对手，提示错误
    if (!this.currentOpponent) {
      this.game.showToast('无法获取对手信息');
      return;
    }
    
    // 生成对手策略概率
    this.generateOpponentStrategyProbabilities();
    
    this.tournamentPhase = 'match';
    this.selectedStrategyPreview = null; // 重置胜率预览
    
    // 重新设置按钮
    this.buttons = this.buttons.slice(0, 1); // 只保留返回
    
    // 添加策略选择按钮 - 使用新策略系统
    const canvasWidth = this.game.canvasWidth || 375;
    const canvasHeight = this.game.canvasHeight || 667;
    
    // 获取玩家的策略管理器
    const strategyManager = player.strategyManager || new StrategyManager();
    const ownedStrategies = strategyManager.getOwnedStrategies() || [];
    const currentStrategy = strategyManager.getCurrentStrategy();
    const courtType = this.getCourtType(this.currentTournament.matchInfo.name);
    
    // 6种策略定义
    const strategies = [
      { key: STRATEGY_TYPES.SERVE_VOLLEY, label: '发球上网', color: '#805ad5', type: STRATEGY_TYPES.SERVE_VOLLEY },
      { key: STRATEGY_TYPES.BASELINE_RALLY, label: '底线相持', color: '#3182ce', type: STRATEGY_TYPES.BASELINE_RALLY },
      { key: STRATEGY_TYPES.DEFENSIVE_COUNTER, label: '防守反击', color: '#38a169', type: STRATEGY_TYPES.DEFENSIVE_COUNTER },
      { key: STRATEGY_TYPES.DROP_SHOT_Lob, label: '小球+穿越', color: '#d69e2e', type: STRATEGY_TYPES.DROP_SHOT_Lob },
      { key: STRATEGY_TYPES.ALL_COVER, label: '全场覆盖', color: '#e53e3e', type: STRATEGY_TYPES.ALL_COVER },
      { key: STRATEGY_TYPES.ALL_ATTACK, label: '全场进攻', color: '#dd6b20', type: STRATEGY_TYPES.ALL_ATTACK }
    ];
    
    // 显示策略按钮 - 2行3列布局
    const btnWidth = canvasWidth * 0.28;
    const btnHeight = canvasHeight * 0.065;
    const spacingX = canvasWidth * 0.02;
    const spacingY = canvasHeight * 0.01;
    const startX = (canvasWidth - (btnWidth * 3 + spacingX * 2)) / 2;
    const startY = canvasHeight * 0.68;
    
    strategies.forEach((s, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = startX + col * (btnWidth + spacingX);
      const y = startY + row * (btnHeight + spacingY);
      
      // 检查是否拥有该策略
      const isOwned = ownedStrategies.includes(s.type);
      const isSelected = currentStrategy === s.type;
      const bgColor = isOwned ? (isSelected ? s.color : '#2d3748') : '#1a202c';
      const textColor = isOwned ? '#fff' : '#718096';
      
      this.addButton(x, y, btnWidth, btnHeight, s.label, () => {
        // 点击策略后先显示胜率预览和确认/取消按钮
        // 不管是否拥有该策略，都需要确认后才能进入比赛
        
        // 计算胜率预览（如果是未拥有的策略，使用0加成）
        const preview = this.calculateStrategyPreview(isOwned ? s.type : null);
        this.selectedStrategyPreview = preview;
        this.selectedStrategyType = s.type; // 保存选中的策略类型

        // 重新渲染显示胜率预览
        this.buttons = this.buttons.slice(0, 1); // 只保留返回

        const canvasWidth = this.game.canvasWidth || 375;
        const canvasHeight = this.game.canvasHeight || 667;

        // 显示确认按钮
        this.addButton(canvasWidth * 0.08, canvasHeight * 0.58, canvasWidth * 0.42, canvasHeight * 0.065, '✓ 确认', () => {
          if (isOwned) {
            strategyManager.selectStrategy(s.type);
            player.strategyManager = strategyManager;
          }
          this.playCurrentMatch(isOwned ? s.type : null);
        }, {
          bgColor: isOwned ? s.color : '#4a5568',
          textColor: '#fff',
          fontSize: canvasWidth * 0.035,
          borderColor: isOwned ? s.color : '#718096',
          borderWidth: 2
        });

        // 添加取消按钮
        this.addButton(canvasWidth * 0.5, canvasHeight * 0.58, canvasWidth * 0.42, canvasHeight * 0.065, '✗ 取消', () => {
          this.selectedStrategyPreview = null;
          this.selectedStrategyType = null;
          this.startCurrentMatch(); // 重新渲染
        }, {
          bgColor: '#4a5568',
          textColor: '#fff',
          fontSize: canvasWidth * 0.035
        });
      }, {
        bgColor: bgColor,
        textColor: textColor,
        fontSize: canvasWidth * 0.032,
        borderColor: isSelected ? s.color : 'transparent',
        borderWidth: isSelected ? 2 : 0
      });
    });
    
    // 添加默认策略按钮（如果没有策略，使用默认策略）
    if (ownedStrategies.length === 0) {
      const defaultBtnY = canvasHeight * 0.62;
      this.addButton(canvasWidth * 0.15, defaultBtnY, canvasWidth * 0.7, canvasHeight * 0.065, '⚔️ 默认策略（无加成）', () => {
        // 点击默认策略后也显示确认流程
        const preview = this.calculateStrategyPreview(null);
        this.selectedStrategyPreview = preview;
        this.selectedStrategyType = null;

        // 重新渲染显示胜率预览
        this.buttons = this.buttons.slice(0, 1); // 只保留返回

        const canvasWidth = this.game.canvasWidth || 375;
        const canvasHeight = this.game.canvasHeight || 667;

        // 显示确认按钮
        this.addButton(canvasWidth * 0.08, canvasHeight * 0.58, canvasWidth * 0.42, canvasHeight * 0.065, '✓ 确认', () => {
          this.playCurrentMatch(null);
        }, {
          bgColor: '#4a5568',
          textColor: '#fff',
          fontSize: canvasWidth * 0.035,
          borderColor: '#718096',
          borderWidth: 2
        });

        // 添加取消按钮
        this.addButton(canvasWidth * 0.5, canvasHeight * 0.58, canvasWidth * 0.42, canvasHeight * 0.065, '✗ 取消', () => {
          this.selectedStrategyPreview = null;
          this.selectedStrategyType = null;
          this.startCurrentMatch(); // 重新渲染
        }, {
          bgColor: '#4a5568',
          textColor: '#fff',
          fontSize: canvasWidth * 0.035
        });
      }, {
        bgColor: '#4a5568',
        textColor: '#fff',
        fontSize: canvasWidth * 0.035,
        borderColor: '#718096',
        borderWidth: 1
      });
    }
    
    // 存储当前场地类型供比赛使用
    this.currentCourtType = courtType;
  }

  // 生成对手策略概率
  generateOpponentStrategyProbabilities() {
    const strategies = Object.values(STRATEGY_TYPES);
    const probabilities = {};
    
    // 为每个策略生成一个随机概率权重
    const weights = strategies.map(() => Math.random());
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    
    strategies.forEach((strategy, i) => {
      probabilities[strategy] = weights[i] / totalWeight;
    });
    
    this.opponentStrategyProbabilities = probabilities;
  }

  // 计算策略预览胜率
  calculateStrategyPreview(strategyKey) {
    const player = this.game.player;
    const opponent = this.currentOpponent;
    const courtType = this.currentCourtType || 'hard';
    const strategyConfig = getStrategyConfig(strategyKey);
    
    const playerOverall = player.calculateOverall();
    const opponentOverall = opponent ? opponent.calculateOverall() : 50;
    
    // 获取玩家技能数据
    const playerSkills = player.getAllSkills ? player.getAllSkills() : {};
    
    // 1. 基础能力对比
    let baseWinRate = 50 + (playerOverall - opponentOverall) * 0.4;
    
    // 2. 排名修正
    let rankingBonus = 0;
    if (player.ranking < opponent.ranking) {
      const rankDiff = Math.min(opponent.ranking - player.ranking, 200);
      rankingBonus = rankDiff * 0.05;
    } else {
      const rankDiff = Math.min(player.ranking - opponent.ranking, 200);
      rankingBonus = -rankDiff * 0.03;
    }
    
    // 3. 状态修正
    let formAdjust = 0;
    if (player.form >= 95) formAdjust = 15;
    else if (player.form >= 90) formAdjust = 10;
    else if (player.form >= 80) formAdjust = 7;
    else if (player.form >= 70) formAdjust = 3;
    else if (player.form >= 50) formAdjust = 0;
    else if (player.form >= 30) formAdjust = -5;
    else if (player.form >= 20) formAdjust = -12;
    else formAdjust = -20;
    
    // 4. 疲劳修正
    let fatiguePenalty = 0;
    if (player.fatigue >= 90) fatiguePenalty = -15;
    else if (player.fatigue >= 80) fatiguePenalty = -10;
    else if (player.fatigue >= 60) fatiguePenalty = -5;
    else if (player.fatigue >= 40) fatiguePenalty = -2;
    
    // 5. 精力修正
    let energyBonus = 0;
    if (player.energy >= 90) energyBonus = 8;
    else if (player.energy >= 70) energyBonus = 5;
    else if (player.energy >= 50) energyBonus = 2;
    else if (player.energy >= 30) energyBonus = -3;
    else energyBonus = -8;
    
    // 6. 策略加成
    let strategyBonus = 0;
    let counterInfo = null;
    if (strategyConfig) {
      // 技能加成
      const playerSkills = player.skills || {};
      const skillBonusObj = strategyConfig.skillBonus || {};
      
      if (skillBonusObj.serve && playerSkills.serve) {
        const skillLevel = Math.floor(playerSkills.serve / 20);
        strategyBonus += skillBonusObj.serve * 20 * (skillLevel + 1);
      }
      if (skillBonusObj.baseline && playerSkills.baseline) {
        const skillLevel = Math.floor(playerSkills.baseline / 20);
        strategyBonus += skillBonusObj.baseline * 20 * (skillLevel + 1);
      }
      if (skillBonusObj.volley && playerSkills.volley) {
        const skillLevel = Math.floor(playerSkills.volley / 20);
        strategyBonus += skillBonusObj.volley * 20 * (skillLevel + 1);
      }
      if (skillBonusObj.dropShot && playerSkills.dropShot) {
        const skillLevel = Math.floor(playerSkills.dropShot / 20);
        strategyBonus += skillBonusObj.dropShot * 20 * (skillLevel + 1);
      }
      
      // 场地适应加成
      const courtAdaptation = strategyConfig.courtAdaptation || {};
      const courtBonus = courtAdaptation[courtType] ? courtAdaptation[courtType].bonus : 0;
      strategyBonus += courtBonus * 15;
      
      // 计算策略克制 - 考虑对手可能使用的策略概率
      if (this.opponentStrategyProbabilities) {
        let totalCounterBonus = 0;
        
        for (const [oppStrategy, prob] of Object.entries(this.opponentStrategyProbabilities)) {
          const counterResult = checkStrategyCounter(strategyKey, oppStrategy);
          if (counterResult === 1) {
            totalCounterBonus += 8 * prob;
          } else if (counterResult === -1) {
            totalCounterBonus -= 8 * prob;
          }
        }
        
        strategyBonus += totalCounterBonus;
        
        if (totalCounterBonus > 2) {
          counterInfo = { bonus: totalCounterBonus, text: '✓ 策略克制对手' };
        } else if (totalCounterBonus < -2) {
          counterInfo = { bonus: totalCounterBonus, text: '⚠ 对手策略克制你' };
        } else {
          counterInfo = { bonus: totalCounterBonus, text: '○ 策略持平' };
        }
      }
    }
    
    // 7. 伤病修正
    let injuryPenalty = 0;
    if (player.injury && player.injury.isInjured) {
      const injuryEffects = player.injury.effect || {};
      if (injuryEffects.strength) injuryPenalty += injuryEffects.strength * 0.3;
      if (injuryEffects.speed) injuryPenalty += injuryEffects.speed * 0.3;
      if (injuryEffects.technique) injuryPenalty += injuryEffects.technique * 0.3;
      if (injuryEffects.all) injuryPenalty += injuryEffects.all * 0.3;
    }
    
    // 计算最终胜率
    let finalWinRate = baseWinRate + rankingBonus + formAdjust + 
                       fatiguePenalty + energyBonus + strategyBonus - injuryPenalty;
    
    finalWinRate = Math.max(5, Math.min(95, finalWinRate));
    
    return {
      winRate: finalWinRate,
      counterInfo: counterInfo,
      baseWinRate: baseWinRate,
      rankingBonus: rankingBonus,
      formAdjust: formAdjust,
      fatiguePenalty: fatiguePenalty,
      energyBonus: energyBonus,
      strategyBonus: strategyBonus,
      injuryPenalty: injuryPenalty
    };
  }

  // 进行当前比赛 - 使用改进的胜率计算系统
  playCurrentMatch(strategyKey) {
    const player = this.game.player;
    const strategyConfig = getStrategyConfig(strategyKey);
    let opponent = this.currentOpponent;
    
    // 如果对手为空，从签表信息中重新获取
    if (!opponent) {
      const matchInfo = this.currentTournament.getCurrentMatchInfo();
      opponent = matchInfo.opponent;
    }
    
    // 仍然没有对手则报错
    if (!opponent) {
      this.game.showToast('无法获取对手信息');
      return;
    }
    
    // ========== 改进的胜率计算系统 ==========
    const courtType = this.currentCourtType || 'hard';
    const playerOverall = player.calculateOverall();
    const opponentOverall = opponent.calculateOverall();
    
    // 1. 基础能力对比 (权重: 40%)
    // 每1点能力差 = 0.4%胜率差
    let baseWinRate = 50 + (playerOverall - opponentOverall) * 0.4;
    
    // 2. 排名修正 (权重: 15%)
    // 排名越高，胜率加成越大
    let rankingBonus = 0;
    if (player.ranking < opponent.ranking) {
      // 玩家排名更高
      const rankDiff = Math.min(opponent.ranking - player.ranking, 200);
      rankingBonus = rankDiff * 0.05; // 每高1名 +0.05%
    } else {
      // 玩家排名更低
      const rankDiff = Math.min(player.ranking - opponent.ranking, 200);
      rankingBonus = -rankDiff * 0.03; // 每低1名 -0.03%
    }
    
    // 3. 状态修正 (权重: 15%)
    // 状态对比赛有显著影响
    let formAdjust = 0;
    if (player.form >= 95) formAdjust = 15;      // 巅峰状态
    else if (player.form >= 90) formAdjust = 10; // 极佳
    else if (player.form >= 80) formAdjust = 7;  // 良好
    else if (player.form >= 70) formAdjust = 3;  // 一般
    else if (player.form >= 50) formAdjust = 0;  // 普通
    else if (player.form >= 30) formAdjust = -5; // 低迷
    else if (player.form >= 20) formAdjust = -12; // 很差
    else formAdjust = -20; // 极差
    
    // 4. 疲劳度修正 (权重: 10%)
    // 疲劳越高，胜率越低
    let fatiguePenalty = 0;
    if (player.fatigue >= 90) fatiguePenalty = -15; // 极度疲劳
    else if (player.fatigue >= 80) fatiguePenalty = -10; // 严重疲劳
    else if (player.fatigue >= 60) fatiguePenalty = -5; // 中度疲劳
    else if (player.fatigue >= 40) fatiguePenalty = -2; // 轻度疲劳
    
    // 5. 精力修正 (权重: 10%)
    // 精力影响发挥
    let energyBonus = 0;
    if (player.energy >= 90) energyBonus = 8;  // 精力充沛
    else if (player.energy >= 70) energyBonus = 5; // 精力充足
    else if (player.energy >= 50) energyBonus = 2; // 精力一般
    else if (player.energy >= 30) energyBonus = -3; // 精力不足
    else energyBonus = -8; // 精力耗尽
    
    // 6. 策略加成 (权重: 15%)
    let strategyBonus = 0;
    let strategyName = '默认策略';
    if (strategyConfig) {
      strategyName = strategyConfig.name;
      
      // 6.1 技能加成 - 根据玩家技能计算
      const playerSkills = player.skills || {};
      const skillBonusObj = strategyConfig.skillBonus || {};
      
      // 发球技能加成
      if (skillBonusObj.serve && playerSkills.serve) {
        const skillLevel = Math.floor(playerSkills.serve / 20); // 0-4级
        strategyBonus += skillBonusObj.serve * 20 * (skillLevel + 1);
      }
      // 底线技能加成
      if (skillBonusObj.baseline && playerSkills.baseline) {
        const skillLevel = Math.floor(playerSkills.baseline / 20);
        strategyBonus += skillBonusObj.baseline * 20 * (skillLevel + 1);
      }
      // 网前技能加成
      if (skillBonusObj.volley && playerSkills.volley) {
        const skillLevel = Math.floor(playerSkills.volley / 20);
        strategyBonus += skillBonusObj.volley * 20 * (skillLevel + 1);
      }
      // 小球技能加成
      if (skillBonusObj.dropShot && playerSkills.dropShot) {
        const skillLevel = Math.floor(playerSkills.dropShot / 20);
        strategyBonus += skillBonusObj.dropShot * 20 * (skillLevel + 1);
      }
      
      // 6.2 场地适应加成
      const courtAdaptation = strategyConfig.courtAdaptation || {};
      const courtBonus = courtAdaptation[courtType] ? courtAdaptation[courtType].bonus : 0;
      strategyBonus += courtBonus * 15;
      
      // 6.3 策略克制修正
      // 模拟对手使用的策略（随机）
      const opponentStrategies = Object.values(STRATEGY_TYPES);
      const opponentStrategy = opponentStrategies[Math.floor(Math.random() * opponentStrategies.length)];
      const counterResult = checkStrategyCounter(strategyKey, opponentStrategy);
      
      if (counterResult === 1) {
        // 我克对手
        strategyBonus += 8;
      } else if (counterResult === -1) {
        // 对手克我
        strategyBonus -= 8;
      }
    }
    
    // 7. 伤病修正
    let injuryPenalty = 0;
    if (player.injury && player.injury.isInjured) {
      const injuryEffects = player.injury.effect || {};
      if (injuryEffects.strength) injuryPenalty += injuryEffects.strength * 0.3;
      if (injuryEffects.speed) injuryPenalty += injuryEffects.speed * 0.3;
      if (injuryEffects.technique) injuryPenalty += injuryEffects.technique * 0.3;
      if (injuryEffects.all) injuryPenalty += injuryEffects.all * 0.3;
    }
    
    // ========== 计算最终胜率 ==========
    let finalWinRate = baseWinRate + rankingBonus + formAdjust + 
                       fatiguePenalty + energyBonus + strategyBonus - injuryPenalty;
    
    // 限制胜率范围
    finalWinRate = Math.max(5, Math.min(95, finalWinRate));
    
    // 随机结果（加入一定运气因素）
    const luckFactor = (Math.random() - 0.5) * 10; // ±5% 运气波动
    finalWinRate = Math.max(5, Math.min(95, finalWinRate + luckFactor));
    
    // 决定胜负
    const playerWins = Math.random() * 100 < finalWinRate;
    
    // 计算精力消耗（基础10点 * 策略精力消耗系数）
    let energyCost = 10;
    if (strategyConfig && strategyConfig.energyCost) {
      energyCost = Math.floor(10 * strategyConfig.energyCost.multiplier);
    }
    // 疲劳时消耗更多精力
    if (player.fatigue >= 80) {
      energyCost = Math.floor(energyCost * 1.2);
    }
    
    player.energy = Math.max(0, player.energy - energyCost);
    player.fatigue = Math.min(100, player.fatigue + energyCost);
    
    // 处理比赛结果
    const result = this.currentTournament.playMatch(playerWins);
    
    // 检查伤病 - 基础10% + 策略风险 + 疲劳风险
    let injuryChance = 0.10;
    if (strategyConfig && strategyConfig.energyCost) {
      // 高精力消耗策略增加伤病风险
      if (strategyConfig.energyCost.multiplier >= 1.2) {
        injuryChance += 0.05;
      }
    }
    // 极度疲劳增加伤病风险
    if (player.fatigue >= 90) {
      injuryChance += 0.08;
    }
    
    const injuryRand = Math.random();
    let injuryResult = null;
    if (injuryRand < injuryChance) {
      const injury = InjurySystem.rollInjury();
      if (injury.id !== 'none') {
        player.getInjured(injury.id, injury.duration);
        injuryResult = injury;
      }
    }
    
    // 更新玩家数据
    player.matchesPlayed++;
    if (playerWins) {
      player.matchesWon++;
    }
    
    // 计算奖金和积分
    const prize = result.prize;
    const points = result.points;
    
    if (playerWins) {
      player.money += prize;
      player.careerEarnings += prize;
      player.points += points;
      player.titles++;
      
      if (prize > 0) {
        this.game.showToast(`🎉 第${result.currentRound}轮获胜！奖金$${prize}`);
      }
    } else {
      player.points = Math.max(0, player.points - 10);
      this.game.showToast(`😔 第${result.currentRound}轮淘汰...奖金$${prize}`);
    }
    
    // 记录操作
    const match = this.currentTournament ? this.currentTournament.matchInfo : null;
    const matchName = match ? match.name : '比赛';
    // 如果赢了，显示刚赢的轮次；如果输了，显示被淘汰的轮次
    const displayRound = playerWins ? result.currentRound : this.currentTournament.currentRound;
    const roundName = ['', '第一轮', '第二轮', '第三轮', '第四轮', '第五轮', '决赛'][displayRound] || `第${displayRound}轮`;
    this.game.recordAction('match', matchName, playerWins ? `${roundName}获胜 奖金$${prize}` : `${roundName}淘汰`);
    
    // 更新排名
    if (points > 0) {
      player.ranking = Math.max(1, player.ranking - Math.floor(points / 10));
      if (player.ranking < player.careerHighRanking) {
        player.careerHighRanking = player.ranking;
      }
    }
    
    // 保存结果（包含详细计算信息）
    this.currentMatchResult = {
      won: playerWins,
      prize: prize,
      points: points,
      winRate: finalWinRate,
      strategy: strategyName,
      injury: injuryResult,
      round: result.currentRound,
      energyCost: energyCost,
      // 详细计算数据
      calculationDetails: {
        baseWinRate: baseWinRate.toFixed(1),
        rankingBonus: rankingBonus.toFixed(1),
        formAdjust: formAdjust,
        fatiguePenalty: fatiguePenalty,
        energyBonus: energyBonus,
        strategyBonus: strategyBonus.toFixed(1),
        injuryPenalty: injuryPenalty.toFixed(1),
        luckFactor: luckFactor.toFixed(1)
      }
    };
    
    // 进入结果界面
    this.tournamentPhase = 'result';
    
    // 重新设置按钮
    this.buttons = this.buttons.slice(0, 1);
    
    const canvasWidth = this.game.canvasWidth || 375;
    const canvasHeight = this.game.canvasHeight || 667;
    
    // 检查是否还有下一轮
    const nextMatchInfo = this.currentTournament.getCurrentMatchInfo();
    
    if (nextMatchInfo.champion) {
      this.addButton(canvasWidth * 0.3, canvasHeight * 0.7, canvasWidth * 0.4, canvasHeight * 0.08, '🏆 夺冠！', () => {
        this.finishTournament();
      }, {
        bgColor: '#ffd700',
        textColor: '#0a192f',
        fontSize: canvasWidth * 0.045
      });
    } else if (nextMatchInfo.eliminated) {
      this.addButton(canvasWidth * 0.3, canvasHeight * 0.7, canvasWidth * 0.4, canvasHeight * 0.08, '继续', () => {
        this.finishTournament();
      }, {
        bgColor: '#64ffda',
        textColor: '#0a192f',
        fontSize: canvasWidth * 0.04
      });
    } else {
      this.addButton(canvasWidth * 0.3, canvasHeight * 0.7, canvasWidth * 0.4, canvasHeight * 0.08, '下一轮', () => {
        this.startCurrentMatch();
      }, {
        bgColor: '#64ffda',
        textColor: '#0a192f',
        fontSize: canvasWidth * 0.04
      });
    }
  }

  // 处理比赛结束
  handleTournamentEnd(champion) {
    const player = this.game.player;
    
    if (champion) {
      player.titles++;
      player.grandSlams++;
      this.game.showToast('🎊 恭喜夺冠！！！');
    }
    
    this.finishTournament();
  }

  // 完成比赛
  finishTournament() {
    this.game.saveGame();
    this.tournamentPhase = 'select';
    this.currentTournament = null;
    this.currentOpponent = null;
    this.enter();
  }

  // 退出比赛
  quitTournament() {
    // 清除当前比赛
    this.currentTournament = null;
    this.currentOpponent = null;
    
    // 清除正在进行比赛的存档
    this.clearOngoingTournament();
    
    // 返回比赛选择界面
    this.tournamentPhase = 'select';
    this.enter();
    
    this.game.showToast('已退出比赛');
  }

  render(ctx) {
    const player = this.game.player;
    if (!player) return;

    const canvasWidth = this.game.canvasWidth || 375;
    const canvasHeight = this.game.canvasHeight || 667;

    // 背景
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    if (this.tournamentPhase === 'select') {
      this.renderMatchSelection(ctx, player);
    } else if (this.tournamentPhase === 'bracket') {
      this.renderBracket(ctx, player);
    } else if (this.tournamentPhase === 'match') {
      this.renderMatch(ctx, player);
    } else if (this.tournamentPhase === 'result') {
      this.renderMatchResult(ctx, player);
    }
  }

  // 处理赛事列表滑动
  handleTournamentScroll(deltaY) {
    const canvasHeight = this.game.canvasHeight || 667;
    // 计算内容总高度
    let totalHeight = 0;
    for (const monthGroup of this.allTournaments) {
      totalHeight += canvasHeight * 0.08; // 月份标题高度
      totalHeight += monthGroup.tournaments.length * (canvasHeight * 0.16 + canvasHeight * 0.01); // 赛事卡片高度
    }
    
    const visibleHeight = canvasHeight * 0.75;
    this.maxTournamentScrollY = Math.max(0, totalHeight - visibleHeight);
    
    this.tournamentScrollY += deltaY;
    if (this.tournamentScrollY < 0) this.tournamentScrollY = 0;
    if (this.tournamentScrollY > this.maxTournamentScrollY) {
      this.tournamentScrollY = this.maxTournamentScrollY;
    }
  }

  // 切换Tab
  switchTab(tab) {
    if (this.currentTab !== tab) {
      this.currentTab = tab;
      this.tournamentScrollY = 0;
      // 重新计算滚动范围
      if (tab === 'pro') {
        this.calculateMaxScroll();
      } else {
        // ITF赛事滚动范围
        const canvasHeight = this.game.canvasHeight || 667;
        const itfCount = this.itfTournaments ? this.itfTournaments.length : 0;
        const totalHeight = itfCount * (canvasHeight * 0.17);
        const panelHeight = canvasHeight * 0.72;
        this.maxTournamentScrollY = Math.max(0, totalHeight - panelHeight);
      }
    }
  }

  // 渲染比赛选择界面 - 显示所有赛事（按月份分组）
  renderMatchSelection(ctx, player) {
    const canvasWidth = this.game.canvasWidth || 375;
    const canvasHeight = this.game.canvasHeight || 667;

    // 标题
    ctx.fillStyle = '#64ffda';
    ctx.font = 'bold ' + (canvasWidth * 0.05) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎾 比赛中心', canvasWidth / 2, canvasHeight * 0.06);

    // 玩家状态和本周次数
    ctx.fillStyle = '#8892b0';
    ctx.font = (canvasWidth * 0.028) + 'px sans-serif';
    
    const remaining = this.game.getRemainingActions();
    let statusText = '能力:' + player.calculateOverall() + ' 状态:' + player.form + ' 精力:' + player.energy;
    ctx.fillText(statusText, canvasWidth / 2, canvasHeight * 0.105);
    
    // 显示本周剩余次数
    ctx.fillStyle = remaining.match > 0 ? '#68d391' : '#fc8181';
    ctx.fillText('本周还可参加 ' + remaining.match + ' 场比赛', canvasWidth / 2, canvasHeight * 0.135);

    // 绘制Tab切换
    const tabY = canvasHeight * 0.155;
    const tabHeight = canvasHeight * 0.04;
    const tabWidth = canvasWidth * 0.35;
    const tabSpacing = canvasWidth * 0.03;
    
    // 职业赛事Tab
    const proTabX = canvasWidth * 0.08;
    const proTabSelected = this.currentTab === 'pro';
    this.drawRoundRect(ctx, proTabX, tabY, tabWidth, tabHeight, 8, 
      proTabSelected ? '#64ffda' : '#1a1a2e', 
      proTabSelected ? '#64ffda' : 'rgba(100, 255, 218, 0.3)');
    ctx.fillStyle = proTabSelected ? '#0a192f' : '#64ffda';
    ctx.font = (canvasWidth * 0.032) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 职业赛事', proTabX + tabWidth / 2, tabY + tabHeight * 0.65);
    
    // ITF赛事Tab
    const itfTabX = proTabX + tabWidth + tabSpacing;
    const itfTabSelected = this.currentTab === 'itf';
    this.drawRoundRect(ctx, itfTabX, tabY, tabWidth, tabHeight, 8, 
      itfTabSelected ? '#64ffda' : '#1a1a2e', 
      itfTabSelected ? '#64ffda' : 'rgba(100, 255, 218, 0.3)');
    ctx.fillStyle = itfTabSelected ? '#0a192f' : '#64ffda';
    ctx.fillText('🎖️ ITF赛事', itfTabX + tabWidth / 2, tabY + tabHeight * 0.65);

    // 根据当前Tab渲染不同内容
    if (this.currentTab === 'pro') {
      this.renderProTournaments(ctx, player, remaining, canvasWidth, canvasHeight);
    } else {
      this.renderITFTournaments(ctx, player, remaining, canvasWidth, canvasHeight);
    }

    for (const button of this.buttons) {
      button.render(ctx);
    }
  }

  // 渲染职业赛事列表
  renderProTournaments(ctx, player, remaining, canvasWidth, canvasHeight) {
    // 赛事列表（带滚动）
    if (this.allTournaments && this.allTournaments.length > 0) {
      ctx.save();
      
      // 限制绘制区域
      const listStartY = canvasHeight * 0.21;
      const listHeight = canvasHeight * 0.72;
      ctx.beginPath();
      ctx.rect(0, listStartY, canvasWidth, listHeight);
      ctx.clip();
      
      // 应用滚动偏移
      ctx.translate(0, -this.tournamentScrollY);
      
      let currentY = listStartY;
      
      for (const monthGroup of this.allTournaments) {
        // 月份标题
        const isCurrentMonth = monthGroup.month === this.game.gameData.month;
        ctx.fillStyle = isCurrentMonth ? '#ffd700' : '#64ffda';
        ctx.font = 'bold ' + (canvasWidth * 0.04) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('📅 ' + monthGroup.monthName, canvasWidth / 2, currentY + canvasHeight * 0.045);
        currentY += canvasHeight * 0.07;
        
        // 该月所有赛事
        for (const tournament of monthGroup.tournaments) {
          // 绘制赛事卡片
          this.drawTournamentCard(ctx, tournament, currentY);
          
          // 绘制参赛按钮
          const ongoingData = this.game.gameData.ongoingTournament;
          const isOngoing = ongoingData && ongoingData.matchName === tournament.name;
          
          // 检查是否正在比赛中
          const btnX = canvasWidth * 0.83;
          const btnY = currentY + canvasHeight * 0.028;
          const btnWidth = canvasWidth * 0.14;
          const btnHeight = canvasHeight * 0.085;
          
          let btnText, btnColor;
          
          if (isOngoing) {
            btnText = '继续';
            btnColor = '#ed8936';
          } else if (tournament.isCurrentWeek) {
            if (remaining.match > 0) {
              btnText = '参赛';
              btnColor = '#64ffda';
            } else {
              btnText = '已满';
              btnColor = '#718096';
            }
          } else {
            btnText = '未开放';
            btnColor = '#4a5568';
          }
          
          // 绘制按钮
          this.drawRoundRect(ctx, btnX, btnY, btnWidth, btnHeight, 6, btnColor);
          ctx.fillStyle = '#0a192f';
          ctx.font = (canvasWidth * 0.028) + 'px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(btnText, btnX + btnWidth / 2, btnY + btnHeight * 0.6);
          
          currentY += canvasHeight * 0.15;
        }
        
        currentY += canvasHeight * 0.02; // 月份间隔
      }
      
      ctx.restore();
      
      // 绘制滚动条
      if (this.maxTournamentScrollY > 0) {
        const scrollBarHeight = canvasHeight * 0.12;
        const scrollBarX = canvasWidth - 8;
        const scrollBarY = canvasHeight * 0.23;
        
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(scrollBarX, scrollBarY, 3, scrollBarHeight);
        
        const scrollRatio = this.tournamentScrollY / this.maxTournamentScrollY;
        const thumbHeight = scrollBarHeight * 0.3;
        const thumbY = scrollBarY + scrollRatio * (scrollBarHeight - thumbHeight);
        ctx.fillStyle = '#64ffda';
        ctx.fillRect(scrollBarX, thumbY, 3, thumbHeight);
        
        // 提示文字
        ctx.fillStyle = '#8892b0';
        ctx.font = (canvasWidth * 0.02) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('上下滑动查看更多', canvasWidth / 2, canvasHeight * 0.94);
      }
    } else {
      ctx.fillStyle = '#8892b0';
      ctx.font = (canvasWidth * 0.04) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('😔 暂无可以参加的职业赛事', canvasWidth / 2, canvasHeight * 0.45);
    }
  }

  // 渲染ITF赛事列表
  renderITFTournaments(ctx, player, remaining, canvasWidth, canvasHeight) {
    if (this.itfTournaments && this.itfTournaments.length > 0) {
      ctx.save();
      
      // 限制绘制区域
      const listStartY = canvasHeight * 0.21;
      const listHeight = canvasHeight * 0.72;
      ctx.beginPath();
      ctx.rect(0, listStartY, canvasWidth, listHeight);
      ctx.clip();
      
      // 应用滚动偏移
      ctx.translate(0, -this.tournamentScrollY);
      
      let currentY = listStartY;
      
      for (const tournament of this.itfTournaments) {
        // 绘制ITF赛事卡片
        this.drawTournamentCard(ctx, tournament, currentY);
        
        // 绘制参赛按钮
        const ongoingData = this.game.gameData.ongoingTournament;
        const isOngoing = ongoingData && ongoingData.matchName === tournament.name;
        
        const btnX = canvasWidth * 0.83;
        const btnY = currentY + canvasHeight * 0.028;
        const btnWidth = canvasWidth * 0.14;
        const btnHeight = canvasHeight * 0.085;
        
        let btnText, btnColor;
        
        if (isOngoing) {
          btnText = '继续';
          btnColor = '#ed8936';
        } else if (remaining.match > 0) {
          btnText = '参赛';
          btnColor = '#64ffda';
        } else {
          btnText = '已满';
          btnColor = '#718096';
        }
        
        // 绘制按钮
        this.drawRoundRect(ctx, btnX, btnY, btnWidth, btnHeight, 6, btnColor);
        ctx.fillStyle = '#0a192f';
        ctx.font = (canvasWidth * 0.028) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(btnText, btnX + btnWidth / 2, btnY + btnHeight * 0.6);
        
        currentY += canvasHeight * 0.15;
      }
      
      ctx.restore();
      
      // 绘制滚动条
      if (this.maxTournamentScrollY > 0) {
        const scrollBarHeight = canvasHeight * 0.12;
        const scrollBarX = canvasWidth - 8;
        const scrollBarY = canvasHeight * 0.23;
        
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(scrollBarX, scrollBarY, 3, scrollBarHeight);
        
        const scrollRatio = this.tournamentScrollY / this.maxTournamentScrollY;
        const thumbHeight = scrollBarHeight * 0.3;
        const thumbY = scrollBarY + scrollRatio * (scrollBarHeight - thumbHeight);
        ctx.fillStyle = '#64ffda';
        ctx.fillRect(scrollBarX, thumbY, 3, thumbHeight);
        
        // 提示文字
        ctx.fillStyle = '#8892b0';
        ctx.font = (canvasWidth * 0.02) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('上下滑动查看更多', canvasWidth / 2, canvasHeight * 0.94);
      }
    } else {
      ctx.fillStyle = '#8892b0';
      ctx.font = (canvasWidth * 0.04) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('😔 暂无ITF赛事', canvasWidth / 2, canvasHeight * 0.45);
    }
  }

  // 绘制赛事卡片（新版）
  drawTournamentCard(ctx, tournament, y) {
    const canvasWidth = this.game.canvasWidth || 375;
    const canvasHeight = this.game.canvasHeight || 667;

    const cardX = canvasWidth * 0.03;
    const cardWidth = canvasWidth * 0.78;
    const cardHeight = canvasHeight * 0.15;

    // 卡片背景
    const bgColor = tournament.isCurrentWeek ? '#1a1a2e' : '#0f1419';
    const borderColor = tournament.isCurrentWeek ? 'rgba(100, 255, 218, 0.3)' : 'rgba(255, 255, 255, 0.1)';
    this.drawRoundRect(ctx, cardX, y, cardWidth, cardHeight, 10, bgColor, borderColor);

    // 赛事级别颜色
    let levelColor = '#667eea';
    const levelName = tournament.level ? tournament.level.name : '赛事';
    if (levelName.includes('大满贯') || levelName.includes('GRAND_SLAM')) levelColor = '#ffd700';
    else if (levelName.includes('1000') || levelName.includes('ATP1000')) levelColor = '#805ad5';
    else if (levelName.includes('500') || levelName.includes('ATP500')) levelColor = '#68d391';
    else if (levelName.includes('250') || levelName.includes('ATP250')) levelColor = '#fc8181';
    else if (levelName.includes('CHALLENGER')) levelColor = '#4299e1';

    // 赛事级别
    ctx.fillStyle = levelColor;
    ctx.font = 'bold ' + (canvasWidth * 0.032) + 'px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(levelName, cardX + canvasWidth * 0.02, y + cardHeight * 0.22);

    // 赛事名称
    ctx.fillStyle = '#ccd6f6';
    ctx.font = 'bold ' + (canvasWidth * 0.04) + 'px sans-serif';
    ctx.fillText(tournament.name, cardX + canvasWidth * 0.15, y + cardHeight * 0.22);

    // 周数标识
    ctx.fillStyle = tournament.isCurrentWeek ? '#ffd700' : '#718096';
    ctx.font = (canvasWidth * 0.028) + 'px sans-serif';
    ctx.fillText('第' + tournament.week + '周', cardX + cardWidth * 0.55, y + cardHeight * 0.22);

    // 奖金和报名费
    ctx.fillStyle = '#ffd700';
    ctx.font = (canvasWidth * 0.028) + 'px sans-serif';
    const prize = tournament.level ? tournament.level.championPrize : 0;
    ctx.fillText('🏆 $' + prize, cardX + canvasWidth * 0.02, y + cardHeight * 0.7);

    ctx.fillStyle = tournament.entryCost <= this.game.player.money ? '#68d391' : '#fc8181';
    ctx.fillText('💰 $' + tournament.entryCost, cardX + cardWidth * 0.25, y + cardHeight * 0.7);

    // 推荐能力
    ctx.fillStyle = '#8892b0';
    ctx.font = (canvasWidth * 0.026) + 'px sans-serif';
    ctx.fillText('推荐: ' + tournament.minSkill + '+', cardX + cardWidth * 0.5, y + cardHeight * 0.7);
  }

  // 渲染签表界面 - 改进版竖向展示+横向+纵向滑动
  renderBracket(ctx, player) {
    const canvasWidth = this.game.canvasWidth || 375;
    const canvasHeight = this.game.canvasHeight || 667;
    const tournament = this.currentTournament;
    const config = tournament.config;
    
    // 确保当前轮的NPC比赛已完成
    if (tournament.currentRound > 1) {
      for (let r = 0; r < tournament.currentRound - 1; r++) {
        tournament.simulateNPcMatches(r);
      }
    }

    // 标题
    ctx.fillStyle = '#64ffda';
    ctx.font = 'bold ' + (canvasWidth * 0.045) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(config.name, canvasWidth / 2, canvasHeight * 0.06);

    // 轮次信息
    ctx.fillStyle = '#ffd700';
    ctx.font = (canvasWidth * 0.03) + 'px sans-serif';
    
    // 检查比赛是否结束
    const matchInfo = tournament.getCurrentMatchInfo();
    if (matchInfo.champion) {
      // 显示冠军
      const champion = tournament.getChampion();
      const championName = champion && champion.name ? champion.name : '未知';
      ctx.fillText('🏆 冠军: ' + championName, canvasWidth / 2, canvasHeight * 0.1);
    } else if (matchInfo.eliminated) {
      ctx.fillText('你已被淘汰 | 冠军奖金 $' + config.championPrize, canvasWidth / 2, canvasHeight * 0.1);
    } else {
      ctx.fillText('第' + tournament.currentRound + '轮进行中 | 冠军奖金 $' + config.championPrize, canvasWidth / 2, canvasHeight * 0.1);
    }

    // 初始化滑动偏移量
    if (!this.scrollOffsetX) this.scrollOffsetX = 0;
    if (!this.scrollOffsetY) this.scrollOffsetY = 0;
    if (!this.maxScrollOffsetX) this.maxScrollOffsetX = 0;
    if (!this.maxScrollOffsetY) this.maxScrollOffsetY = 0;

    // 计算需要的尺寸 - 高度减小为原来的一半
    const rounds = tournament.rounds;
    const roundNames = ['第一轮', '第二轮', '第三轮', '第四轮', '第五轮', '决赛'];
    const cardWidth = canvasWidth * 0.35;
    const cardHeight = canvasHeight * 0.06; // 高度减小为一半
    const cardSpacing = canvasWidth * 0.02;
    const titleHeight = canvasHeight * 0.035; // 标题高度也减小
    const startY = canvasHeight * 0.14;
    
    // 计算内容区域大小
    const contentWidth = rounds.length * (cardWidth + cardSpacing) - cardSpacing + canvasWidth * 0.1;
    
    // 计算每轮需要的总高度
    let maxMatchesInRound = 0;
    for (const round of rounds) {
      if (round.matches.length > maxMatchesInRound) {
        maxMatchesInRound = round.matches.length;
      }
    }
    const contentHeight = rounds.length * (titleHeight + maxMatchesInRound * (cardHeight + cardSpacing) * 0.5);
    
    // 设置最大滑动范围
    this.maxScrollOffsetX = Math.max(0, contentWidth - canvasWidth);
    this.maxScrollOffsetY = Math.max(0, contentHeight - canvasHeight * 0.55);
    
    if (this.scrollOffsetX > this.maxScrollOffsetX) this.scrollOffsetX = this.maxScrollOffsetX;
    if (this.scrollOffsetY > this.maxScrollOffsetY) this.scrollOffsetY = this.maxScrollOffsetY;

    // 使用裁剪区域限制绘制范围
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, canvasHeight * 0.12, canvasWidth, canvasHeight * 0.6);
    ctx.clip();
    
    // 应用横向和纵向滑动
    ctx.translate(-this.scrollOffsetX, -this.scrollOffsetY);
    
    // 竖向展示每轮的选手列表 - 所有轮次顶端对齐
    for (let rIndex = 0; rIndex < rounds.length; rIndex++) {
      const round = rounds[rIndex];
      const isCurrentRound = rIndex === tournament.currentRound - 1;
      const roundX = canvasWidth * 0.05 + rIndex * (cardWidth + cardSpacing);
      
      // 轮次标题 - 都在同一Y位置
      ctx.fillStyle = isCurrentRound ? '#64ffda' : '#8892b0';
      ctx.font = 'bold ' + (canvasWidth * 0.03) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(roundNames[rIndex] || '第' + (rIndex + 1) + '轮', roundX + cardWidth / 2, startY + titleHeight * 0.7);
      
      // 绘制该轮所有选手（竖向排列）- 从标题下方开始
      for (let mIndex = 0; mIndex < round.matches.length; mIndex++) {
        const match = round.matches[mIndex];
        const cardY = startY + titleHeight + mIndex * (cardHeight + cardSpacing * 0.5);
        
        // 背景高亮（玩家比赛）
        if (match.isPlayerMatch) {
          this.drawRoundRect(ctx, roundX, cardY, cardWidth, cardHeight, 8, '#1a1a2e', 'rgba(100, 255, 218, 0.3)');
        } else {
          this.drawRoundRect(ctx, roundX, cardY, cardWidth, cardHeight, 8, '#1a1a2e', 'rgba(100, 255, 218, 0.1)');
        }
        
        // 选手1
        ctx.fillStyle = '#ccd6f6';
        ctx.font = (canvasWidth * 0.022) + 'px sans-serif';
        ctx.textAlign = 'left';
        const p1Name = match.player1 && match.player1.name ? match.player1.name.substring(0, 5) : (match.player1 && match.player1.isPlayer ? '你' : '?');
        ctx.fillText(p1Name, roundX + 5, cardY + cardHeight * 0.55);
        
        // VS
        ctx.fillStyle = '#8892b0';
        ctx.textAlign = 'center';
        ctx.fillText('vs', roundX + cardWidth / 2, cardY + cardHeight * 0.55);
        
        // 选手2
        ctx.fillStyle = '#ccd6f6';
        ctx.textAlign = 'right';
        const p2Name = match.player2 && match.player2.name ? match.player2.name.substring(0, 5) : (match.player2 && match.player2.isPlayer ? '你' : '?');
        ctx.fillText(p2Name, roundX + cardWidth - 5, cardY + cardHeight * 0.55);
        
        // 结果显示
        if (match.playerResult) {
          ctx.fillStyle = match.playerResult === 'win' ? '#48bb78' : '#f56565';
          ctx.font = 'bold ' + (canvasWidth * 0.022) + 'px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(match.playerResult === 'win' ? '胜' : '负', roundX + cardWidth / 2, cardY + cardHeight * 0.9);
        }
      }
    }
    
    ctx.restore();
    
    // 绘制滚动指示器
    const scrollAreaY = canvasHeight * 0.75;
    
    // 横向滚动条
    if (this.maxScrollOffsetX > 0) {
      const scrollBarWidth = canvasWidth * 0.25;
      const scrollBarX = (canvasWidth - scrollBarWidth) / 2;
      
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(scrollBarX, scrollAreaY, scrollBarWidth, 3);
      
      const scrollRatio = this.scrollOffsetX / this.maxScrollOffsetX;
      const thumbWidth = scrollBarWidth * 0.3;
      const thumbX = scrollBarX + scrollRatio * (scrollBarWidth - thumbWidth);
      ctx.fillStyle = '#64ffda';
      ctx.fillRect(thumbX, scrollAreaY, thumbWidth, 3);
    }
    
    // 纵向滚动条
    if (this.maxScrollOffsetY > 0) {
      const scrollBarHeight = canvasHeight * 0.15;
      const scrollBarX = canvasWidth - 10;
      const scrollBarY = canvasHeight * 0.25;
      
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(scrollBarX, scrollBarY, 3, scrollBarHeight);
      
      const scrollRatio = this.scrollOffsetY / this.maxScrollOffsetY;
      const thumbHeight = scrollBarHeight * 0.3;
      const thumbY = scrollBarY + scrollRatio * (scrollBarHeight - thumbHeight);
      ctx.fillStyle = '#64ffda';
      ctx.fillRect(scrollBarX, thumbY, 3, thumbHeight);
    }
    
    // 提示文字
    ctx.fillStyle = '#8892b0';
    ctx.font = (canvasWidth * 0.022) + 'px sans-serif';
    ctx.textAlign = 'center';
    let hintText = '';
    if (this.maxScrollOffsetX > 0 && this.maxScrollOffsetY > 0) {
      hintText = '← 左右 / 上下 滑动查看更多 →';
    } else if (this.maxScrollOffsetX > 0) {
      hintText = '← 左右滑动查看更多 →';
    } else if (this.maxScrollOffsetY > 0) {
      hintText = '上下滑动查看更多';
    }
    if (hintText) {
      ctx.fillText(hintText, canvasWidth / 2, scrollAreaY + 18);
    }

    for (const button of this.buttons) {
      button.render(ctx);
    }
  }
  
  // 处理横向滑动
  handleBracketScroll(deltaX) {
    this.scrollOffsetX = (this.scrollOffsetX || 0) + deltaX;
    if (this.scrollOffsetX < 0) this.scrollOffsetX = 0;
    if (this.maxScrollOffsetX && this.scrollOffsetX > this.maxScrollOffsetX) {
      this.scrollOffsetX = this.maxScrollOffsetX;
    }
  }
  
  // 处理纵向滑动
  handleBracketScrollY(deltaY) {
    this.scrollOffsetY = (this.scrollOffsetY || 0) + deltaY;
    if (this.scrollOffsetY < 0) this.scrollOffsetY = 0;
    if (this.maxScrollOffsetY && this.scrollOffsetY > this.maxScrollOffsetY) {
      this.scrollOffsetY = this.maxScrollOffsetY;
    }
  }

  // 获取玩家技能数据用于雷达图 - 返回7种技能的对象格式
  // 兼容Player（使用skillManager）和Opponent（使用attributes属性）
  getPlayerSkillsForRadar(playerOrOpponent) {
    // 检查是否是Opponent（有attributes属性但没有skillManager）
    if (playerOrOpponent && playerOrOpponent.attributes && !playerOrOpponent.skillManager) {
      // Opponent格式：{ strength, speed, technique, endurance, mentality }
      const attrs = playerOrOpponent.attributes;
      // 将5种能力映射到7种技能显示
      return {
        baseline: attrs.technique || 50,
        volley: Math.floor((attrs.speed + attrs.technique) / 2) || 50,
        serve: Math.floor((attrs.strength + attrs.technique) / 2) || 50,
        dropShot: Math.floor((attrs.technique + attrs.speed) / 2) || 50,
        slice: Math.floor((attrs.technique + attrs.endurance) / 2) || 50,
        lob: Math.floor((attrs.technique + attrs.speed) / 2) || 50,
        smash: Math.floor((attrs.strength + attrs.technique) / 2) || 50
      };
    }
    
    // Player格式：使用skillManager
    if (!playerOrOpponent || !playerOrOpponent.skillManager || !playerOrOpponent.skillManager.skills) {
      return {
        baseline: 50,
        volley: 50,
        serve: 50,
        dropShot: 50,
        slice: 50,
        lob: 50,
        smash: 50
      };
    }
    
    const skills = playerOrOpponent.skillManager.skills;
    
    return {
      baseline: skills.baseline ? skills.baseline.getFinalScore() : 50,
      volley: skills.volley ? skills.volley.getFinalScore() : 50,
      serve: skills.serve ? skills.serve.getFinalScore() : 50,
      dropShot: skills.dropShot ? skills.dropShot.getFinalScore() : 50,
      slice: skills.slice ? skills.slice.getFinalScore() : 50,
      lob: skills.lob ? skills.lob.getFinalScore() : 50,
      smash: skills.smash ? skills.smash.getFinalScore() : 50
    };
  }

  // 获取技能在雷达图上的位置
  getSkillPosition(x, y, radius, skillIndex) {
    const skillOrder = ['baseline', 'volley', 'serve', 'dropShot', 'slice', 'lob', 'smash'];
    const numPoints = skillOrder.length;
    const angleStep = (Math.PI * 2) / numPoints;
    const startAngle = -Math.PI / 2;
    const angle = startAngle + skillIndex * angleStep;
    
    return {
      x: x + Math.cos(angle) * radius,
      y: y + Math.sin(angle) * radius
    };
  }

  // 绘制技能雷达图 - 与生涯一致，使用100分制，按住可查看等级
  drawSkillsRadarChart(ctx, x, y, radius, playerSkills, opponentSkills = null) {
    // 技能显示顺序（与生涯雷达图一致）
    const skillOrder = ['baseline', 'volley', 'serve', 'dropShot', 'slice', 'lob', 'smash'];
    
    // 技能中文名称
    const skillConfig = {
      baseline: { name: '底线' },
      volley: { name: '截击' },
      serve: { name: '发球' },
      dropShot: { name: '放小球' },
      slice: { name: '切削' },
      lob: { name: '月亮球' },
      smash: { name: '高压球' }
    };
    
    // 等级颜色（与生涯一致）
    const LEVEL_COLORS = ['#888888', '#4ade80', '#60a5fa', '#c084fc', '#fbbf24', '#f97316'];
    const LEVEL_NAMES = ['新手', '普通', '熟练', '精进', '专家', '大师'];
    
    const numPoints = skillOrder.length;
    const angleStep = (Math.PI * 2) / numPoints;
    const startAngle = -Math.PI / 2; // 从顶部开始
    const maxScore = 100; // 最大100分
    
    // 检查是否有按住的技能
    const hoveredSkill = this.getHoveredSkill ? this.getHoveredSkill() : null;
    
    // 绘制网格
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.font = `${radius * 0.15}px sans-serif`;
    ctx.fillStyle = '#8892b0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 绘制同心五边形网格
    for (let level = 1; level <= 5; level++) {
      const levelRadius = (radius / 5) * level;
      ctx.beginPath();
      for (let i = 0; i <= numPoints; i++) {
        const idx = i % numPoints;
        const angle = startAngle + idx * angleStep;
        const px = x + Math.cos(angle) * levelRadius;
        const py = y + Math.sin(angle) * levelRadius;
        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
      
      // 绘制刻度值
      const value = (maxScore / 5) * level;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillText(value.toString(), x + radius + 15, y);
    }
    
    // 绘制轴线
    for (let i = 0; i < numPoints; i++) {
      const angle = startAngle + i * angleStep;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(px, py);
      ctx.stroke();
    }
    
    // 绘制对手数据（如果有）
    if (opponentSkills) {
      ctx.beginPath();
      ctx.fillStyle = 'rgba(252, 129, 129, 0.2)';
      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 2;
      
      for (let i = 0; i <= numPoints; i++) {
        const idx = i % numPoints;
        const skillType = skillOrder[idx];
        const value = opponentSkills[skillType] || 0;
        const angle = startAngle + i * angleStep;
        const valueRadius = (Math.min(value, maxScore) / maxScore) * radius;
        
        const px = x + Math.cos(angle) * valueRadius;
        const py = y + Math.sin(angle) * valueRadius;
        
        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
    }
    
    // 绘制玩家数据
    ctx.beginPath();
    ctx.fillStyle = 'rgba(100, 200, 150, 0.25)';
    ctx.strokeStyle = '#9bbc0f';
    ctx.lineWidth = 2;
    
    for (let i = 0; i <= numPoints; i++) {
      const idx = i % numPoints;
      const skillType = skillOrder[idx];
      const value = playerSkills[skillType] || 0;
      const angle = startAngle + i * angleStep;
      const valueRadius = (Math.min(value, maxScore) / maxScore) * radius;
      
      const px = x + Math.cos(angle) * valueRadius;
      const py = y + Math.sin(angle) * valueRadius;
      
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    
    ctx.fill();
    ctx.stroke();
    
    // 绘制各点的圆点（玩家数据点）
    for (let i = 0; i < numPoints; i++) {
      const skillType = skillOrder[i];
      const value = playerSkills[skillType] || 0;
      const angle = startAngle + i * angleStep;
      const valueRadius = (Math.min(value, maxScore) / maxScore) * radius;
      
      const px = x + Math.cos(angle) * valueRadius;
      const py = y + Math.sin(angle) * valueRadius;
      
      // 根据等级显示不同颜色
      const level = Math.floor(value / 20); // 0-4级 (0-19=0, 20-39=1, etc)
      const dotColor = LEVEL_COLORS[Math.min(level, LEVEL_COLORS.length - 1)];
      
      // 如果是hover的技能，画更大的圈
      const isHovered = hoveredSkill === i;
      
      ctx.beginPath();
      ctx.fillStyle = dotColor;
      ctx.arc(px, py, isHovered ? 8 : 4, 0, Math.PI * 2);
      ctx.fill();
      
      // 如果hover，显示白色边框
      if (isHovered) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
    
    // 绘制对手数据点（红色小点）
    if (opponentSkills) {
      for (let i = 0; i < numPoints; i++) {
        const skillType = skillOrder[i];
        const value = opponentSkills[skillType] || 0;
        const angle = startAngle + i * angleStep;
        const valueRadius = (Math.min(value, maxScore) / maxScore) * radius;
        
        const px = x + Math.cos(angle) * valueRadius;
        const py = y + Math.sin(angle) * valueRadius;
        
        ctx.beginPath();
        ctx.fillStyle = '#ff6b6b';
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // 绘制标签 - 显示技能名称（如果hover显示详细信息）
    for (let i = 0; i < numPoints; i++) {
      const skillType = skillOrder[i];
      const config = skillConfig[skillType];
      const value = playerSkills[skillType] || 0;
      const opponentValue = opponentSkills ? (opponentSkills[skillType] || 0) : 0;
      const angle = startAngle + i * angleStep;
      const labelRadius = radius + 25;
      const px = x + Math.cos(angle) * labelRadius;
      const py = y + Math.sin(angle) * labelRadius;
      
      const level = Math.floor(value / 20);
      const levelName = LEVEL_NAMES[Math.min(level, LEVEL_NAMES.length - 1)];
      const labelColor = LEVEL_COLORS[Math.min(level, LEVEL_COLORS.length - 1)];
      const isHovered = hoveredSkill === i;
      
      if (isHovered && opponentSkills) {
        // hover时显示详细信息
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${radius * 0.16}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(config.name, px, py - radius * 0.12);
        
        // 玩家数值
        ctx.fillStyle = '#9bbc0f';
        ctx.font = `${radius * 0.14}px sans-serif`;
        ctx.fillText(`你: ${value}分 [${levelName}]`, px, py + radius * 0.05);
        
        // 对手数值
        const oppLevel = Math.floor(opponentValue / 20);
        const oppLevelName = LEVEL_NAMES[Math.min(oppLevel, LEVEL_NAMES.length - 1)];
        ctx.fillStyle = '#ff6b6b';
        ctx.fillText(`对手: ${opponentValue}分 [${oppLevelName}]`, px, py + radius * 0.22);
      } else {
        // 显示技能名称和等级
        ctx.fillStyle = labelColor;
        ctx.font = `bold ${radius * 0.14}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(config.name, px, py - radius * 0.08);
        
        ctx.font = `${radius * 0.11}px sans-serif`;
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText(`${value}分 [${levelName}]`, px, py + radius * 0.08);
      }
    }
    
    // 绘制图例
    ctx.font = `${radius * 0.12}px sans-serif`;
    ctx.textAlign = 'center';
    
    // 玩家图例（绿色）
    ctx.fillStyle = '#9bbc0f';
    ctx.fillText('● 你', x - radius * 0.5, y + radius + 25);
    
    // 对手图例（红色）
    if (opponentSkills) {
      ctx.fillStyle = '#ff6b6b';
      ctx.fillText('● 对手', x + radius * 0.5, y + radius + 25);
    }
  }
  
  // 获取当前hover的技能索引
  getHoveredSkill() {
    return this.hoveredSkillIndex;
  }
  
  // 设置hover的技能索引
  setHoveredSkill(index) {
    this.hoveredSkillIndex = index;
  }
  
  // 检查触摸位置是否在技能点上（按住时持续检测）
  checkSkillHover(touchX, touchY) {
    if (touchX === undefined || touchY === undefined) return;
    
    const canvasWidth = this.game.canvasWidth || 375;
    const canvasHeight = this.game.canvasHeight || 667;
    const centerX = canvasWidth / 2;
    const radarY = canvasHeight * 0.27;
    const radarRadius = canvasWidth * 0.18;
    
    // 检查是否在雷达图区域内
    const dist = Math.sqrt((touchX - centerX) ** 2 + (touchY - radarY) ** 2);
    if (dist <= radarRadius + 30) {
      // 在雷达图区域内，检测接近哪个技能点
      const skillOrder = ['baseline', 'volley', 'serve', 'dropShot', 'slice', 'lob', 'smash'];
      const numPoints = skillOrder.length;
      const angleStep = (Math.PI * 2) / numPoints;
      const startAngle = -Math.PI / 2;
      
      let closestSkill = -1;
      let closestDist = 9999;
      
      for (let i = 0; i < numPoints; i++) {
        const angle = startAngle + i * angleStep;
        const skillX = centerX + Math.cos(angle) * radarRadius;
        const skillY = radarY + Math.sin(angle) * radarRadius;
        const skillDist = Math.sqrt((touchX - skillX) ** 2 + (touchY - skillY) ** 2);
        if (skillDist < closestDist && skillDist < 40) {
          closestDist = skillDist;
          closestSkill = i;
        }
      }
      
      this.setHoveredSkill(closestSkill >= 0 ? closestSkill : null);
    } else {
      this.setHoveredSkill(null);
    }
  }

  // 渲染比赛界面 - 优化版：玩家和对手信息分别放两边，同一张雷达图展示技能对比
  renderMatch(ctx, player) {
    const canvasWidth = this.game.canvasWidth || 375;
    const canvasHeight = this.game.canvasHeight || 667;
    const tournament = this.currentTournament;
    const config = tournament.config;
    const opponent = this.currentOpponent;
    
    // 获取玩家的策略信息
    const strategyManager = player.strategyManager || new StrategyManager();
    const ownedStrategies = strategyManager.getOwnedStrategies() || [];
    const courtType = this.currentCourtType || 'hard';

    // 标题
    ctx.fillStyle = '#64ffda';
    ctx.font = 'bold ' + (canvasWidth * 0.045) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎾 ' + config.name, canvasWidth / 2, canvasHeight * 0.038);

    // 轮次
    ctx.fillStyle = '#ffd700';
    ctx.font = (canvasWidth * 0.032) + 'px sans-serif';
    const roundNames = ['', '第一轮', '第二轮', '第三轮', '第四轮', '第五轮', '决赛'];
    ctx.fillText(roundNames[tournament.currentRound] || '第' + tournament.currentRound + '轮', canvasWidth / 2, canvasHeight * 0.068);

    // 左侧：玩家信息
    const leftX = canvasWidth * 0.08;
    
    // 玩家名称和综合
    ctx.fillStyle = '#64ffda';
    ctx.font = 'bold ' + (canvasWidth * 0.034) + 'px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('👤 你', leftX, canvasHeight * 0.1);
    
    ctx.fillStyle = '#ccd6f6';
    ctx.font = (canvasWidth * 0.026) + 'px sans-serif';
    ctx.fillText('综合: ' + player.calculateOverall(), leftX, canvasHeight * 0.13);
    ctx.fillText('状态: ' + player.form + ' | 精力: ' + player.energy, leftX, canvasHeight * 0.155);
    
    // 伤病提示
    if (player.injury && player.injury.isInjured) {
      ctx.fillStyle = '#f56565';
      ctx.font = (canvasWidth * 0.024) + 'px sans-serif';
      ctx.fillText('⚠️ 受伤: ' + player.injury.type, leftX, canvasHeight * 0.175);
    }

    // 右侧：对手信息
    const rightX = canvasWidth * 0.92;
    
    if (opponent) {
      ctx.fillStyle = '#f56565';
      ctx.font = 'bold ' + (canvasWidth * 0.034) + 'px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('👤 ' + opponent.name, rightX, canvasHeight * 0.1);
      
      ctx.fillStyle = '#8892b0';
      ctx.font = (canvasWidth * 0.026) + 'px sans-serif';
      ctx.fillText('综合: ' + opponent.calculateOverall(), rightX, canvasHeight * 0.13);
      
      // 场地信息
      const courtTypeName = courtType === 'grass' ? '草地' : (courtType === 'clay' ? '红土' : '硬地');
      ctx.fillStyle = '#ed8936';
      ctx.fillText('场地: ' + courtTypeName, rightX, canvasHeight * 0.155);
    }

    // 中间：能力雷达图（使用5种核心能力）
    const centerX = canvasWidth / 2;
    const radarY = canvasHeight * 0.27;
    const radarRadius = canvasWidth * 0.18;
    
    // 获取玩家和对手的技能数据
    const playerSkills = this.getPlayerSkillsForRadar(player);
    const opponentSkills = opponent ? this.getPlayerSkillsForRadar(opponent) : null;
    
    // 检测触摸位置是否在雷达图区域
    if (this.lastTouchX !== undefined && this.lastTouchY !== undefined) {
      const touchX = this.lastTouchX;
      const touchY = this.lastTouchY;
      
      // 检查是否在雷达图区域内
      const dist = Math.sqrt((touchX - centerX) ** 2 + (touchY - radarY) ** 2);
      if (dist <= radarRadius + 30) {
        // 在雷达图区域内，检测接近哪个技能点
        const skillOrder = ['baseline', 'volley', 'serve', 'dropShot', 'slice', 'lob', 'smash'];
        const numPoints = skillOrder.length;
        const angleStep = (Math.PI * 2) / numPoints;
        const startAngle = -Math.PI / 2;
        
        let closestSkill = -1;
        let closestDist = 9999;
        
        for (let i = 0; i < numPoints; i++) {
          const skillPos = this.getSkillPosition(centerX, radarY, radarRadius, i);
          const skillDist = Math.sqrt((touchX - skillPos.x) ** 2 + (touchY - skillPos.y) ** 2);
          if (skillDist < closestDist && skillDist < 40) {
            closestDist = skillDist;
            closestSkill = i;
          }
        }
        
        this.setHoveredSkill(closestSkill >= 0 ? closestSkill : null);
      } else {
        this.setHoveredSkill(null);
      }
    } else {
      this.setHoveredSkill(null);
    }
    
    // 重置触摸位置
    this.lastTouchX = undefined;
    this.lastTouchY = undefined;
    
    // 绘制技能雷达图
    this.drawSkillsRadarChart(ctx, centerX, radarY, radarRadius, playerSkills, opponentSkills);

    // 对手策略偏好（显示在右侧）
    if (opponent && this.opponentStrategyProbabilities) {
      ctx.fillStyle = '#f56565';
      ctx.font = 'bold ' + (canvasWidth * 0.028) + 'px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('对手策略倾向:', canvasWidth * 0.95, canvasHeight * 0.4);
      
      const strategyLabels = {
        'SERVE_VOLLEY': '发球上网',
        'BASELINE_RALLY': '底线相持',
        'DEFENSIVE_COUNTER': '防守反击',
        'DROP_SHOT_Lob': '小球+穿越',
        'ALL_COVER': '全场覆盖',
        'ALL_ATTACK': '全场进攻'
      };
      
      let probY = canvasHeight * 0.43;
      const strategyColors = {
        'SERVE_VOLLEY': '#805ad5',
        'BASELINE_RALLY': '#3182ce',
        'DEFENSIVE_COUNTER': '#38a169',
        'DROP_SHOT_Lob': '#d69e2e',
        'ALL_COVER': '#e53e3e',
        'ALL_ATTACK': '#dd6b20'
      };
      
      for (const [strategy, prob] of Object.entries(this.opponentStrategyProbabilities)) {
        const label = strategyLabels[strategy] || strategy;
        const color = strategyColors[strategy] || '#8892b0';
        const percent = Math.round(prob * 100);
        
        ctx.fillStyle = color;
        ctx.font = (canvasWidth * 0.024) + 'px sans-serif';
        ctx.fillText(label + ': ' + percent + '%', canvasWidth * 0.95, probY);
        
        probY += canvasHeight * 0.028;
      }
    }

    // 选择策略区域
    ctx.fillStyle = '#64ffda';
    ctx.font = (canvasWidth * 0.03) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('选择你的比赛策略:', canvasWidth / 2, canvasHeight * 0.52);

    // 如果已选择策略，显示胜率预览
    if (this.selectedStrategyPreview) {
      const preview = this.selectedStrategyPreview;
      ctx.fillStyle = preview.winRate >= 50 ? '#68d391' : '#fc8181';
      ctx.font = 'bold ' + (canvasWidth * 0.038) + 'px sans-serif';
      ctx.fillText('预计胜率: ' + Math.round(preview.winRate) + '%', canvasWidth / 2, canvasHeight * 0.57);
      
      // 显示策略克制情况
      if (preview.counterInfo) {
        ctx.fillStyle = preview.counterInfo.bonus >= 0 ? '#68d391' : '#fc8181';
        ctx.font = (canvasWidth * 0.024) + 'px sans-serif';
        ctx.fillText(preview.counterInfo.text, canvasWidth / 2, canvasHeight * 0.605);
      }
    }

    // 渲染按钮
    for (const button of this.buttons) {
      button.render(ctx);
    }
    
    // 底部提示
    ctx.fillStyle = '#8892b0';
    ctx.font = (canvasWidth * 0.022) + 'px sans-serif';
    ctx.textAlign = 'center';
    // 如果已经显示了胜率预览，提示不同
    if (this.selectedStrategyPreview) {
      ctx.fillText('点击"确认"开始比赛，点击"取消"重新选择', canvasWidth / 2, canvasHeight * 0.92);
    } else {
      const hintText = ownedStrategies.length > 0 ? '点击策略查看胜率，确认后进入比赛' : '暂无策略，点击默认策略查看胜率';
      ctx.fillText(hintText, canvasWidth / 2, canvasHeight * 0.92);
    }
  }

  // 渲染比赛结果
  renderMatchResult(ctx, player) {
    const canvasWidth = this.game.canvasWidth || 375;
    const canvasHeight = this.game.canvasHeight || 667;
    const result = this.currentMatchResult;
    const tournament = this.currentTournament;

    // 标题
    ctx.fillStyle = result.won ? '#48bb78' : '#f56565';
    ctx.font = 'bold ' + (canvasWidth * 0.06) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(result.won ? '🎉 获胜！' : '😔 淘汰', canvasWidth / 2, canvasHeight * 0.09);

    // 轮次
    ctx.fillStyle = '#ffd700';
    ctx.font = (canvasWidth * 0.035) + 'px sans-serif';
    ctx.fillText('第' + result.round + '轮', canvasWidth / 2, canvasHeight * 0.14);

    // 详细信息
    ctx.fillStyle = '#ccd6f6';
    ctx.font = (canvasWidth * 0.032) + 'px sans-serif';
    ctx.fillText('使用策略: ' + result.strategy, canvasWidth / 2, canvasHeight * 0.19);
    ctx.fillText('预计胜率: ' + Math.round(result.winRate) + '%', canvasWidth / 2, canvasHeight * 0.23);

    // 胜率计算详情（如果有）
    if (result.calculationDetails) {
      const details = result.calculationDetails;
      ctx.fillStyle = '#8892b0';
      ctx.font = (canvasWidth * 0.022) + 'px sans-serif';
      ctx.textAlign = 'left';
      
      let detailY = canvasHeight * 0.28;
      const lineHeight = canvasHeight * 0.028;
      
      ctx.fillText('胜率计算:', canvasWidth * 0.05, detailY);
      detailY += lineHeight;
      
      // 基础胜率
      ctx.fillStyle = '#64ffda';
      ctx.fillText('• 基础: ' + details.baseWinRate + '%', canvasWidth * 0.08, detailY);
      detailY += lineHeight;
      
      // 排名加成
      const rankingBonus = parseFloat(details.rankingBonus);
      ctx.fillStyle = rankingBonus >= 0 ? '#68d391' : '#fc8181';
      ctx.fillText('• 排名: ' + (rankingBonus >= 0 ? '+' : '') + details.rankingBonus + '%', canvasWidth * 0.08, detailY);
      detailY += lineHeight;
      
      // 状态修正
      const formAdjust = parseFloat(details.formAdjust);
      ctx.fillStyle = formAdjust >= 0 ? '#68d391' : '#fc8181';
      ctx.fillText('• 状态: ' + (formAdjust >= 0 ? '+' : '') + details.formAdjust + '%', canvasWidth * 0.08, detailY);
      detailY += lineHeight;
      
      // 疲劳修正
      const fatiguePenalty = parseFloat(details.fatiguePenalty);
      ctx.fillStyle = fatiguePenalty >= 0 ? '#68d391' : '#fc8181';
      ctx.fillText('• 疲劳: ' + details.fatiguePenalty + '%', canvasWidth * 0.08, detailY);
      detailY += lineHeight;
      
      // 精力修正
      const energyBonus = parseFloat(details.energyBonus);
      ctx.fillStyle = energyBonus >= 0 ? '#68d391' : '#fc8181';
      ctx.fillText('• 精力: ' + (energyBonus >= 0 ? '+' : '') + details.energyBonus + '%', canvasWidth * 0.08, detailY);
      detailY += lineHeight;
      
      // 策略加成
      const strategyBonus = parseFloat(details.strategyBonus);
      ctx.fillStyle = strategyBonus >= 0 ? '#68d391' : '#fc8181';
      ctx.fillText('• 策略: ' + (strategyBonus >= 0 ? '+' : '') + details.strategyBonus + '%', canvasWidth * 0.08, detailY);
      detailY += lineHeight;
      
      // 伤病惩罚
      const injuryPenalty = parseFloat(details.injuryPenalty);
      if (injuryPenalty < 0) {
        ctx.fillStyle = '#fc8181';
        ctx.fillText('• 伤病: ' + details.injuryPenalty + '%', canvasWidth * 0.08, detailY);
        detailY += lineHeight;
      }
      
      // 运气因素
      ctx.fillStyle = '#d69e2e';
      ctx.fillText('• 运气: ' + details.luckFactor + '%', canvasWidth * 0.08, detailY);
      
      ctx.textAlign = 'center';
    }

    // 精力消耗
    ctx.fillStyle = '#ed8936';
    ctx.font = (canvasWidth * 0.03) + 'px sans-serif';
    ctx.fillText('精力消耗: -' + result.energyCost, canvasWidth / 2, canvasHeight * 0.5);

    // 奖金和积分
    ctx.fillStyle = '#ffd700';
    ctx.font = canvasWidth * 0.045 + 'px sans-serif';
    ctx.fillText('奖金: $' + result.prize, canvasWidth / 2, canvasHeight * 0.56);
    ctx.fillStyle = '#8892b0';
    ctx.font = canvasWidth * 0.032 + 'px sans-serif';
    ctx.fillText('积分: +' + result.points, canvasWidth / 2, canvasHeight * 0.61);

    // 伤病
    if (result.injury && result.injury.id !== 'none') {
      ctx.fillStyle = '#f56565';
      ctx.font = canvasWidth * 0.035 + 'px sans-serif';
      ctx.fillText('⚠️ 受伤: ' + result.injury.name + ' (' + result.injury.duration + '周)', canvasWidth / 2, canvasHeight * 0.68);
    }

    // 当前排名
    ctx.fillStyle = '#64ffda';
    ctx.font = (canvasWidth * 0.032) + 'px sans-serif';
    ctx.fillText('当前排名: #' + player.ranking, canvasWidth / 2, canvasHeight * 0.74);

    for (const button of this.buttons) {
      button.render(ctx);
    }
  }

  drawMatchCard(ctx, match, y, index) {
    const canvasWidth = this.game.canvasWidth || 375;
    const canvasHeight = this.game.canvasHeight || 667;

    const cardX = canvasWidth * 0.05;
    const cardWidth = canvasWidth * 0.9;
    const cardHeight = canvasHeight * 0.16;

    this.drawRoundRect(ctx, cardX, y, cardWidth, cardHeight, 15, '#1a1a2e', 'rgba(100, 255, 218, 0.15)');

    let levelColor = '#667eea';
    if (match.level === MatchLevel.GRAND_SLAM) levelColor = '#ffd700';
    else if (match.level === MatchLevel.ATP1000) levelColor = '#805ad5';
    else if (match.level === MatchLevel.ATP500) levelColor = '#68d391';
    else if (match.level === MatchLevel.ATP250) levelColor = '#fc8181';

    ctx.fillStyle = levelColor;
    ctx.font = 'bold ' + (canvasWidth * 0.04) + 'px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(match.level.name, cardX + canvasWidth * 0.05, y + cardHeight * 0.25);

    ctx.fillStyle = '#ccd6f6';
    ctx.font = 'bold ' + (canvasWidth * 0.045) + 'px sans-serif';
    ctx.fillText(match.name, cardX + cardWidth * 0.25, y + cardHeight * 0.25);

    ctx.fillStyle = '#8892b0';
    ctx.font = (canvasWidth * 0.035) + 'px sans-serif';
    ctx.fillText('推荐: ' + match.minSkill + '+', cardX + cardWidth * 0.25, y + cardHeight * 0.5);

    ctx.fillStyle = match.entryCost <= this.game.player.money ? '#ffd700' : '#fc8181';
    ctx.fillText('💰 报名费 $' + match.entryCost, cardX + canvasWidth * 0.05, y + cardHeight * 0.75);

    ctx.fillStyle = '#68d391';
    ctx.fillText('🏆 奖金 $' + (match.level ? match.level.championPrize : 0), cardX + cardWidth * 0.35, y + cardHeight * 0.75);
  }
}

module.exports = MatchScene;
