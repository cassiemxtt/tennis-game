/**
 * 比赛场景 - 签表系统版
 */
const { Scene, GAME_STATE } = require('./scene.js');
const { Match, MatchLevel } = require('../models/match.js');
const { Tournament, MATCH_STRATEGY, MatchStrategy, InjurySystem, TOURNAMENT_CONFIG, TournamentCalendar, ATP_TOURNAMENT_CONFIG, WTA_TOURNAMENT_CONFIG, setGameData } = require('../models/tournament.js');

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
    
    // 滑动相关
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.lastTouchX = 0;
    this.lastTouchY = 0;
    this.isDragging = false;
  }
  
  // 处理触摸事件
  handleTouch(x, y, type) {
    const canvasWidth = this.game.canvasWidth || 375;
    
    if (type === 'touchstart') {
      this.touchStartX = x;
      this.touchStartY = y;
      this.lastTouchX = x;
      this.lastTouchY = y;
      this.isDragging = true;
    } else if (type === 'touchmove') {
      if (this.isDragging && this.tournamentPhase === 'bracket') {
        const deltaX = x - this.lastTouchX;
        const deltaY = y - this.lastTouchY;
        
        // 判断是水平还是垂直滑动（取绝对值较大的方向）
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // 水平滑动
          if (Math.abs(deltaX) > 3) {
            this.handleBracketScroll(-deltaX);
          }
        } else {
          // 垂直滑动
          if (Math.abs(deltaY) > 3) {
            this.handleBracketScrollY(-deltaY);
          }
        }
      }
      this.lastTouchX = x;
      this.lastTouchY = y;
    } else if (type === 'touchend') {
      this.isDragging = false;
    }
    
    // 调用父类方法处理按钮点击
    super.handleTouch(x, y, type);
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

    // 清除旧的参赛按钮（保留返回按钮）
    const returnButton = this.buttons[0];
    this.buttons = returnButton ? [returnButton] : [];
    this.matchButtons = [];

    // 为每个比赛创建参赛按钮
    const canvasWidth = this.game.canvasWidth || 375;
    const canvasHeight = this.game.canvasHeight || 667;

    const startY = canvasHeight * 0.18;
    const cardSpacing = canvasHeight * 0.01;

    for (let i = 0; i < this.availableMatches.length; i++) {
      const match = this.availableMatches[i];
      const cardX = canvasWidth * 0.05;
      const cardWidth = canvasWidth * 0.9;
      const cardHeight = canvasHeight * 0.16;
      const y = startY + i * (cardHeight + cardSpacing);

      // 检查是否有正在进行的与此比赛相关的比赛
      const ongoingData = this.game.gameData.ongoingTournament;
      const isOngoing = ongoingData && ongoingData.matchName === match.name;
      
      // 创建参赛/继续按钮
      const btnX = cardX + cardWidth * 0.78;
      const btnY = y + cardHeight * 0.2;
      const btnWidth = cardWidth * 0.2;
      const btnHeight = cardHeight * 0.4;

      const buttonText = isOngoing ? '继续' : '参赛';
      const btnColor = isOngoing ? '#ed8936' : '#64ffda';

      const button = this.addButton(btnX, btnY, btnWidth, btnHeight, buttonText, () => {
        if (isOngoing) {
          this.resumeTournament();
        } else {
          this.joinTournament(match);
        }
      }, {
        bgColor: btnColor,
        textColor: '#0a192f',
        fontSize: canvasWidth * 0.04
      });

      button.match = match;
      button.isOngoing = isOngoing;
      this.matchButtons.push(button);
    }
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
    // 不在这里消耗精力和比赛次数，等正式开始比赛时才消耗

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
    
    this.tournamentPhase = 'match';
    
    // 重新设置按钮
    this.buttons = this.buttons.slice(0, 1); // 只保留返回
    
    // 添加策略选择按钮
    const canvasWidth = this.game.canvasWidth || 375;
    const canvasHeight = this.game.canvasHeight || 667;
    
    const strategies = [
      { key: 'conservative', label: '保守', color: '#48bb78' },
      { key: 'normal', label: '正常', color: '#4299e1' },
      { key: 'aggressive', label: '冒险', color: '#ed8936' },
      { key: 'desperate', label: '拼死', color: '#f56565' }
    ];
    
    const btnWidth = canvasWidth * 0.2;
    const btnHeight = canvasHeight * 0.06;
    const spacing = canvasWidth * 0.02;
    const startX = (canvasWidth - (btnWidth * 4 + spacing * 3)) / 2;
    const btnY = canvasHeight * 0.65;
    
    strategies.forEach((s, i) => {
      this.addButton(startX + i * (btnWidth + spacing), btnY, btnWidth, btnHeight, s.label, () => {
        this.selectedStrategy = s.key;
        this.playCurrentMatch(s.key);
      }, {
        bgColor: s.color,
        textColor: '#fff',
        fontSize: canvasWidth * 0.035
      });
    });
  }

  // 进行当前比赛
  playCurrentMatch(strategyKey) {
    const player = this.game.player;
    const strategy = MATCH_STRATEGY[strategyKey.toUpperCase()];
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
    
    // 计算胜率
    const winRate = MatchStrategy.calculateWinRate(player, opponent, strategy, player.form);
    
    // 随机结果
    const playerWins = Math.random() * 100 < winRate;
    
    // 消耗精力（根据策略不同消耗不同精力）
    player.energy -= strategy.energyCost;
    player.fatigue = Math.min(100, player.fatigue + strategy.energyCost);
    
    // 处理比赛结果
    const result = this.currentTournament.playMatch(playerWins);
    
    // 检查伤病
    const injury = InjurySystem.rollInjury();
    let injuryResult = null;
    if (injury.id !== 'none') {
      player.getInjured(injury.id, injury.duration);
      injuryResult = injury;
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
    
    // 保存结果
    this.currentMatchResult = {
      won: playerWins,
      prize: prize,
      points: points,
      winRate: winRate,
      strategy: strategy.name,
      injury: injuryResult,
      round: result.currentRound
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

  // 渲染比赛选择界面
  renderMatchSelection(ctx, player) {
    const canvasWidth = this.game.canvasWidth || 375;
    const canvasHeight = this.game.canvasHeight || 667;

    // 标题
    ctx.fillStyle = '#64ffda';
    ctx.font = `bold ${canvasWidth * 0.05}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('🎾 比赛中心', canvasWidth / 2, canvasHeight * 0.1);

    // 玩家状态
    ctx.fillStyle = '#8892b0';
    ctx.font = (canvasWidth * 0.035) + 'px sans-serif';
    
    let statusText = '能力: ' + player.calculateOverall() + ' | 状态: ' + player.form + ' | 精力: ' + player.energy;
    if (player.injury && player.injury.isInjured) {
      statusText += ` | ⚠️ 受伤中`;
    }
    ctx.fillText(statusText, canvasWidth / 2, canvasHeight * 0.14);

    // 比赛列表
    if (this.availableMatches.length > 0) {
      const startY = canvasHeight * 0.18;
      const cardSpacing = canvasHeight * 0.01;
      for (let i = 0; i < this.availableMatches.length; i++) {
        this.drawMatchCard(ctx, this.availableMatches[i], startY + i * (canvasHeight * 0.16 + cardSpacing), i);
      }
    } else {
      ctx.fillStyle = '#8892b0';
      ctx.font = `${canvasWidth * 0.04}px sans-serif`;
      ctx.fillText('😔 暂无可以参加的比赛', canvasWidth / 2, canvasHeight * 0.35);
      ctx.fillText('建议先提升排名或年龄', canvasWidth / 2, canvasHeight * 0.39);
    }

    for (const button of this.buttons) {
      button.render(ctx);
    }
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

  // 渲染比赛界面
  renderMatch(ctx, player) {
    const canvasWidth = this.game.canvasWidth || 375;
    const canvasHeight = this.game.canvasHeight || 667;
    const tournament = this.currentTournament;
    const config = tournament.config;
    const opponent = this.currentOpponent;

    // 标题
    ctx.fillStyle = '#64ffda';
    ctx.font = `bold ${canvasWidth * 0.045}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`🎾 ${config.name}`, canvasWidth / 2, canvasHeight * 0.06);

    // 轮次
    ctx.fillStyle = '#ffd700';
    ctx.font = `${canvasWidth * 0.04}px sans-serif`;
    const roundNames = ['', '第一轮', '第二轮', '第三轮', '第四轮', '第五轮', '决赛'];
    ctx.fillText(roundNames[tournament.currentRound] || `第${tournament.currentRound}轮`, canvasWidth / 2, canvasHeight * 0.1);

    // 对手信息
    if (opponent) {
      ctx.fillStyle = '#ccd6f6';
      ctx.font = `${canvasWidth * 0.04}px sans-serif`;
      ctx.fillText(`👤 对手: ${opponent.name}`, canvasWidth / 2, canvasHeight * 0.18);
      
      // 对手属性
      ctx.fillStyle = '#8892b0';
      ctx.font = `${canvasWidth * 0.03}px sans-serif`;
      ctx.fillText(`实力: ${opponent.calculateOverall()}`, canvasWidth / 2, canvasHeight * 0.23);
    }

    // 玩家状态
    ctx.fillStyle = '#ccd6f6';
    ctx.font = `${canvasWidth * 0.035}px sans-serif`;
    ctx.fillText(`你的状态: ${player.form}`, canvasWidth / 2, canvasHeight * 0.32);
    
    // 伤病提示
    if (player.injury && player.injury.isInjured) {
      ctx.fillStyle = '#f56565';
      ctx.fillText(`⚠️ 受伤中: ${player.injury.type}`, canvasWidth / 2, canvasHeight * 0.36);
    }

    // 策略说明
    ctx.fillStyle = '#8892b0';
    ctx.font = `${canvasWidth * 0.03}px sans-serif`;
    ctx.fillText('选择比赛策略:', canvasWidth / 2, canvasHeight * 0.44);

    const strategies = [
      { key: 'conservative', name: '保守', desc: '胜率-10% 伤病-80%', color: '#48bb78' },
      { key: 'normal', name: '正常', desc: '基准', color: '#4299e1' },
      { key: 'aggressive', name: '冒险', desc: '胜率+15% 伤病x2', color: '#ed8936' },
      { key: 'desperate', name: '拼死', desc: '胜率+25% 伤病x3', color: '#f56565' }
    ];

    strategies.forEach((s, i) => {
      const y = canvasHeight * (0.48 + i * 0.04);
      ctx.fillStyle = s.color;
      ctx.font = `${canvasWidth * 0.03}px sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(`${s.name}: ${s.desc}`, canvasWidth * 0.1, y);
    });

    // 渲染按钮
    for (const button of this.buttons) {
      button.render(ctx);
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
    ctx.font = `bold ${canvasWidth * 0.06}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(result.won ? '🎉 获胜！' : '😔 淘汰', canvasWidth / 2, canvasHeight * 0.12);

    // 轮次
    ctx.fillStyle = '#ffd700';
    ctx.font = `${canvasWidth * 0.04}px sans-serif`;
    ctx.fillText(`第${result.round}轮`, canvasWidth / 2, canvasHeight * 0.18);

    // 详细信息
    ctx.fillStyle = '#ccd6f6';
    ctx.font = `${canvasWidth * 0.035}px sans-serif`;
    ctx.fillText(`使用策略: ${result.strategy}`, canvasWidth / 2, canvasHeight * 0.26);
    ctx.fillText(`预计胜率: ${Math.round(result.winRate)}%`, canvasWidth / 2, canvasHeight * 0.31);

    // 奖金
    ctx.fillStyle = '#ffd700';
    ctx.font = canvasWidth * 0.05 + 'px sans-serif';
    ctx.fillText('奖金: $' + result.prize, canvasWidth / 2, canvasHeight * 0.4);
    ctx.fillStyle = '#8892b0';
    ctx.font = canvasWidth * 0.035 + 'px sans-serif';
    ctx.fillText('积分: +' + result.points, canvasWidth / 2, canvasHeight * 0.45);

    // 伤病
    if (result.injury && result.injury.id !== 'none') {
      ctx.fillStyle = '#f56565';
      ctx.font = canvasWidth * 0.04 + 'px sans-serif';
      ctx.fillText('⚠️ 受伤: ' + result.injury.name + ' (' + result.injury.duration + '周)', canvasWidth / 2, canvasHeight * 0.53);
    }

    // 当前排名
    ctx.fillStyle = '#64ffda';
    ctx.font = `${canvasWidth * 0.035}px sans-serif`;
    ctx.fillText(`当前排名: #${player.ranking}`, canvasWidth / 2, canvasHeight * 0.6);

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
    ctx.font = `bold ${canvasWidth * 0.04}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(match.level.name, cardX + canvasWidth * 0.05, y + cardHeight * 0.25);

    ctx.fillStyle = '#ccd6f6';
    ctx.font = `bold ${canvasWidth * 0.045}px sans-serif`;
    ctx.fillText(match.name, cardX + cardWidth * 0.25, y + cardHeight * 0.25);

    ctx.fillStyle = '#8892b0';
    ctx.font = `${canvasWidth * 0.035}px sans-serif`;
    ctx.fillText(`推荐: ${match.minSkill}+`, cardX + cardWidth * 0.25, y + cardHeight * 0.5);

    ctx.fillStyle = match.entryCost <= this.game.player.money ? '#ffd700' : '#fc8181';
    ctx.fillText(`💰 报名费 $${match.entryCost}`, cardX + canvasWidth * 0.05, y + cardHeight * 0.75);

    ctx.fillStyle = '#68d391';
    ctx.fillText(`🏆 奖金 $${match.level ? match.level.championPrize : 0}`, cardX + cardWidth * 0.35, y + cardHeight * 0.75);

    ctx.fillStyle = '#f6ad55';
    // ctx.fillText(`⭐ +${match.level ? (match.level.pointsByRound ? match.level.pointsByRound[match.level.pointsByRound.length-1] : 0) : 0}积分`, cardX + cardWidth * 0.65, y + cardHeight * 0.75);
  }
}

module.exports = MatchScene;
