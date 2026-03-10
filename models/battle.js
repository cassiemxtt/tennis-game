/**
 * 战斗系统
 * 实现卡牌对战逻辑
 */
const { getCardById, CARD_TYPE } = require('../data/cards.js');

// 战斗阶段
const BATTLE_PHASE = {
  SERVE: 'serve',        // 发球阶段
  RETURN: 'return',      // 接发阶段
  RALLY: 'rally'         // 相持阶段
};

// 战斗状态
class BattleState {
  constructor() {
    // 比分
    this.playerScore = 0;   // 玩家得分
    this.opponentScore = 0; // 对手得分
    
    // 局数
    this.playerGames = 0;   // 玩家局数
    this.opponentGames = 0; // 对手局数
    
    // 盘数
    this.playerSets = 0;   // 玩家盘数
    this.opponentSets = 0; // 对手盘数
    
    // 当前发球方
    this.server = 'player'; // 'player' or 'opponent'
    
    // 当前回合
    this.round = 0;         // 当前回合数
    
    // 当前阶段
    this.phase = BATTLE_PHASE.SERVE;
    
    // 回球难度（动态累积）
    this.rallyDifficulty = 0;
    
    // 相持回合数
    this.rallyCount = 0;
    
    // 能量
    this.playerEnergy = 10;
    this.opponentEnergy = 10;
    
    // 状态效果
    this.playerBuffs = {};
    this.opponentBuffs = {};
    
    // 比赛日志
    this.logs = [];
  }
}

// 玩家/对手数据
class BattlePlayer {
  constructor(name, ranking, skills, cards = []) {
    this.name = name;
    this.ranking = ranking;
    this.skills = skills; // { baseline: 285, serve: 310, volley: 150, ... }
    this.cards = cards;   // 卡牌ID列表
    this.state = 80;      // 状态
    this.energy = 100;    // 体力
    this.form = 80;       // 状态值
    
    //  buffs
    this.buffs = {
      accBonus: 0,        // 成功率加成
      diffBonus: 0,       // 回球难度加成
      nextCardAcc: 0,     // 下一张卡成功率加成
      nextCardDiff: 0,    // 下一张卡难度加成
      guaranteeHit: false, // 必定命中
      guaranteeReturn: false, // 必定回球
      rallyCount: 0       // 相持计数
    };
  }

  // 获取技能等级
  getSkillLevel(skillType) {
    const skillValue = this.skills[skillType] || 0;
    if (skillValue >= 500) return { level: 5, name: '大师', bonus: 8 };
    if (skillValue >= 400) return { level: 4, name: '专家', bonus: 5 };
    if (skillValue >= 300) return { level: 3, name: '精进', bonus: 3 };
    if (skillValue >= 200) return { level: 2, name: '熟练', bonus: 0 };
    if (skillValue >= 100) return { level: 1, name: '普通', bonus: -3 };
    return { level: 0, name: '新手', bonus: -8 };
  }

  // 计算成功率
  calculateAcc(card) {
    let acc = card.acc;
    
    // 技能加成
    const skillType = card.skill || 'baseline';
    const skillInfo = this.getSkillLevel(skillType);
    acc += skillInfo.bonus;
    
    // 状态修正
    if (this.form > 80) acc += 3;
    else if (this.form < 50) acc -= 5;
    
    // 体力修正
    if (this.energy > 70) acc += 2;
    else if (this.energy < 30) acc -= 8;
    
    // 状态效果加成
    acc += this.buffs.accBonus;
    acc += this.buffs.nextCardAcc;
    
    // 必定命中
    if (this.buffs.guaranteeHit) {
      acc = 100;
      this.buffs.guaranteeHit = false;
    }
    
    return Math.max(5, Math.min(100, acc));
  }

  // 计算回球难度
  calculateDiff(card) {
    let diff = card.diff;
    
    // 技能加成
    const skillType = card.skill || 'baseline';
    const skillInfo = this.getSkillLevel(skillType);
    diff += skillInfo.bonus;
    
    // 相持累积
    diff += this.buffs.rallyCount * 5;
    
    // 状态效果加成
    diff += this.buffs.diffBonus;
    diff += this.buffs.nextCardDiff;
    
    return Math.max(0, Math.min(100, diff));
  }

  // 计算回球成功率
  calculateReturnAcc(opponentDiff) {
    // 基础回球成功率 = 50% - 对手的回球难度
    let acc = 50 - opponentDiff;
    
    // 状态修正
    if (this.form > 80) acc += 3;
    else if (this.form < 50) acc -= 5;
    
    // 体力修正
    if (this.energy > 70) acc += 2;
    else if (this.energy < 30) acc -= 8;
    
    // 必定回球
    if (this.buffs.guaranteeReturn) {
      acc = 100;
      this.buffs.guaranteeReturn = false;
    }
    
    return Math.max(5, Math.min(100, acc));
  }

  // 使用能量
  useEnergy(cost) {
    this.energy = Math.max(0, this.energy - cost);
  }

  // 恢复能量
  recoverEnergy(amount) {
    this.energy = Math.min(100, this.energy + amount);
  }

  // 更新状态
  updateForm(amount) {
    this.form = Math.max(0, Math.min(100, this.form + amount));
  }
}

// 战斗主类
class Battle {
  constructor(player, opponent, playerCards = []) {
    this.player = new BattlePlayer(
      player.name,
      player.ranking,
      {
        baseline: player.getSkill('baseline').getFinalScore(),
        serve: player.getSkill('serve').getFinalScore(),
        volley: player.getSkill('volley').getFinalScore(),
        dropShot: player.getSkill('dropShot').getFinalScore(),
        slice: player.getSkill('slice').getFinalScore(),
        lob: player.getSkill('lob').getFinalScore(),
        smash: player.getSkill('smash').getFinalScore()
      },
      playerCards
    );
    this.player.form = player.form;
    this.player.energy = player.energy;

    this.opponent = new BattlePlayer(
      opponent.name || '对手',
      opponent.ranking || 100,
      opponent.skills || {
        baseline: 300,
        serve: 300,
        volley: 200,
        dropShot: 150,
        slice: 150,
        lob: 150,
        smash: 200
      }
    );
    this.opponent.form = opponent.form || 75;
    this.opponent.energy = opponent.energy || 80;

    this.state = new BattleState();
    this.isFinished = false;
    this.winner = null;
  }

  // 获取当前可用的卡牌
  getAvailableCards(phase) {
    const player = this.state.server === 'player' ? this.player : this.opponent;
    const availableTypes = this.getCardTypesForPhase(phase, this.state.server);
    
    // 返回符合当前阶段的卡牌
    const cards = [];
    for (const cardId of player.cards) {
      const card = getCardById(cardId);
      if (card && availableTypes.includes(card.type)) {
        cards.push(card);
      }
    }
    
    // 如果没有合适的卡，返回所有可用卡
    return cards.length > 0 ? cards : player.cards.map(id => getCardById(id)).filter(c => c);
  }

  // 获取指定阶段可用的卡牌类型
  getCardTypesForPhase(phase, server) {
    if (phase === BATTLE_PHASE.SERVE) {
      return server === 'player' ? [CARD_TYPE.SERVE] : [CARD_TYPE.RETURN];
    } else if (phase === BATTLE_PHASE.RETURN) {
      return server === 'player' ? [CARD_TYPE.RETURN] : [CARD_TYPE.SERVE];
    } else {
      // 相持阶段：底线、截击、放小球、切削、月亮球、高压球
      return [
        CARD_TYPE.BASELINE,
        CARD_TYPE.VOLLEY,
        CARD_TYPE.DROP_SHOT,
        CARD_TYPE.SLICE,
        CARD_TYPE.LOB,
        CARD_TYPE.SMASH
      ];
    }
  }

  // AI选择卡牌
  selectOpponentCard() {
    const availableCards = this.getAvailableCards(this.state.phase);
    if (availableCards.length === 0) {
      // 如果没有卡，随机选一张
      return getCardById('baseline_001');
    }
    // AI简单策略：选择成功率最高的卡
    return availableCards.reduce((best, card) => {
      const acc = this.opponent.calculateAcc(card);
      const bestAcc = this.opponent.calculateAcc(best);
      return acc > bestAcc ? card : best;
    }, availableCards[0]);
  }

  // 执行一回合
  playRound(playerCardId) {
    if (this.isFinished) return;

    const playerCard = getCardById(playerCardId);
    const opponentCard = this.selectOpponentCard();
    
    const server = this.state.server === 'player' ? this.player : this.opponent;
    const receiver = this.state.server === 'player' ? this.opponent : this.player;

    let log = {
      round: this.state.round + 1,
      phase: this.state.phase,
      server: this.state.server,
      playerCard: playerCard ? playerCard.name : null,
      opponentCard: opponentCard.name
    };

    // ===== 步骤1: 攻击方击球 =====
    const attackAcc = server.calculateAcc(playerCard);
    const rand1 = Math.random() * 100;
    
    if (rand1 > attackAcc) {
      // 失误
      log.result = 'miss';
      log.description = `${server.name}击球失误！`;
      this.addScore(this.state.server === 'player' ? 'opponent' : 'player');
      this.state.logs.push(log);
      return;
    }

    // ===== 步骤2: 计算回球难度 =====
    const diff = server.calculateDiff(playerCard);
    this.state.rallyDifficulty = diff;
    this.state.rallyCount++;
    
    // 更新相持计数
    server.buffs.rallyCount = this.state.rallyCount;

    // ===== 步骤3: 防守方回球 =====
    const returnAcc = receiver.calculateReturnAcc(diff);
    const rand2 = Math.random() * 100;
    
    if (rand2 > returnAcc) {
      // 回球失误
      log.result = 'return_miss';
      log.description = `${receiver.name}回球失误！${server.name}得分！`;
      this.addScore(this.state.server);
      this.state.logs.push(log);
      return;
    }

    // ===== 步骤4: 回球成功，继续 ======
    log.result = 'continue';
    log.description = `${receiver.name}成功回球！继续相持`;
    
    // 消耗能量
    server.useEnergy(playerCard.cost);
    
    // 切换发球方
    this.state.server = this.state.server === 'player' ? 'opponent' : 'player';
    this.state.round++;
    
    this.state.logs.push(log);
  }

  // 得分
  addScore(winner) {
    if (winner === 'player') {
      this.state.playerScore++;
    } else {
      this.state.opponentScore++;
    }
    
    // 重置相持计数
    this.state.rallyCount = 0;
    this.state.rallyDifficulty = 0;
    this.player.buffs.rallyCount = 0;
    this.opponent.buffs.rallyCount = 0;
    
    // 检查是否赢得一局
    this.checkGame();
  }

  // 检查是否赢得一局
  checkGame() {
    const p = this.state.playerScore;
    const o = this.state.opponentScore;
    
    // 先赢4球且净胜2球
    if ((p >= 4 && p - o >= 2) || (o >= 4 && o - p >= 2)) {
      // 赢得这局
      let log;
      if (p > o) {
        this.state.playerGames++;
        log = { event: 'game_win', winner: 'player', score: `${p}-${o}` };
      } else {
        this.state.opponentGames++;
        log = { event: 'game_win', winner: 'opponent', score: `${p}-${o}` };
      }
      this.state.logs.push(log);
      
      // 重置比分
      this.state.playerScore = 0;
      this.state.opponentScore = 0;
      this.state.rallyCount = 0;
      this.state.rallyDifficulty = 0;
      
      // 切换发球权
      this.state.server = this.state.server === 'player' ? 'opponent' : 'player';
      
      // 检查是否赢得一盘
      this.checkSet();
    }
  }

  // 检查是否赢得一盘
  checkSet() {
    const pg = this.state.playerGames;
    const og = this.state.opponentGames;
    
    // 先赢6局且净胜2局
    if ((pg >= 6 && pg - og >= 2) || (og >= 6 && og - pg >= 2)) {
      let log;
      if (pg > og) {
        this.state.playerSets++;
        log = { event: 'set_win', winner: 'player', score: `${pg}-${og}` };
      } else {
        this.state.opponentSets++;
        log = { event: 'set_win', winner: 'opponent', score: `${pg}-${og}` };
      }
      this.state.logs.push(log);
      
      // 重置局数
      this.state.playerGames = 0;
      this.state.opponentGames = 0;
      
      // 检查比赛是否结束（先赢2盘）
      if (this.state.playerSets >= 2 || this.state.opponentSets >= 2) {
        this.endMatch();
      }
    }
  }

  // 结束比赛
  endMatch() {
    this.isFinished = true;
    if (this.state.playerSets > this.state.opponentSets) {
      this.winner = 'player';
    } else {
      this.winner = 'opponent';
    }
    
    this.state.logs.push({
      event: 'match_end',
      winner: this.winner,
      finalScore: `${this.state.playerSets}-${this.state.opponentSets}`
    });
  }

  // 获取比赛结果
  getResult() {
    return {
      winner: this.winner,
      playerSets: this.state.playerSets,
      opponentSets: this.state.opponentSets,
      playerGames: this.state.playerGames,
      opponentGames: this.state.opponentGames,
      finalScore: `${this.state.playerSets}-${this.state.opponentSets}`,
      logs: this.state.logs
    };
  }

  // 获取当前战斗状态
  getState() {
    return {
      playerScore: this.state.playerScore,
      opponentScore: this.state.opponentScore,
      playerGames: this.state.playerGames,
      opponentGames: this.state.opponentGames,
      playerSets: this.state.playerSets,
      opponentSets: this.state.opponentSets,
      server: this.state.server,
      round: this.state.round,
      rallyDifficulty: this.state.rallyDifficulty,
      rallyCount: this.state.rallyCount,
      playerEnergy: this.player.energy,
      opponentEnergy: this.opponent.energy,
      isFinished: this.isFinished,
      winner: this.winner
    };
  }

  // 初始化手牌（用于卡牌对战）
  initHands(playerCards) {
    // 玩家手牌（存储卡牌对象）
    this.playerHand = [];
    
    // 对手手牌（存储卡牌对象）
    this.opponentHand = [];
    
    // 随机给玩家发6张卡（从卡牌池中随机选择）
    // playerCards 是卡牌ID数组，需要转换为卡牌对象
    const cardPool = playerCards && playerCards.length > 0 
      ? playerCards.map(id => getCardById(id)).filter(c => c) 
      : [];
    
    // 随机选择6张卡作为玩家手牌
    const shuffled = [...cardPool].sort(() => Math.random() - 0.5);
    this.playerHand = shuffled.slice(0, Math.min(6, shuffled.length));
    
    // 如果手牌不足6张，重复使用现有卡牌
    while (this.playerHand.length < 6 && cardPool.length > 0) {
      const randomCard = cardPool[Math.floor(Math.random() * cardPool.length)];
      this.playerHand.push(randomCard);
    }
    
    // 对手手牌（简单随机生成）
    this.opponentHand = [];
    for (let i = 0; i < 6; i++) {
      // 随机生成对手卡牌
      const types = ['serve_001', 'return_001', 'baseline_001', 'volley_001', 'dropshot_001', 'slice_001'];
      const randomId = types[Math.floor(Math.random() * types.length)];
      const card = getCardById(randomId);
      if (card) {
        this.opponentHand.push(card);
      }
    }
    
    // 玩家已选择卡牌
    this.selectedCardIndex = -1;
    
    // 当前是谁的回合
    this.isPlayerTurn = true;
    this.isPlayerTurnComplete = false;
    
    // 玩家技能加成
    this.playerSkillBonus = 0;
  }

  // 玩家出牌
  playCard(who, cardIndex) {
    if (who === 'player') {
      if (cardIndex < 0 || cardIndex >= this.playerHand.length) {
        return null;
      }
      const card = this.playerHand[cardIndex];
      // 移除打出的卡
      this.playerHand.splice(cardIndex, 1);
      return card;
    } else {
      // 对手出牌
      if (this.opponentHand.length === 0) {
        return null;
      }
      // 随机选一张
      const idx = Math.floor(Math.random() * this.opponentHand.length);
      const card = this.opponentHand[idx];
      this.opponentHand.splice(idx, 1);
      return card;
    }
  }

  // 计算这一回合的结果
  calculateRound() {
    // 简化版：直接返回玩家获胜（因为完整版逻辑太复杂）
    // 实际应该根据卡牌效果和技能计算
    const playerWins = Math.random() > 0.5;
    const opponentWins = !playerWins;
    
    return {
      playerWins: playerWins,
      opponentWins: opponentWins,
      draw: false
    };
  }

  // 获取结果 - 检查是否需要结束比赛
  checkAndEndMatch() {
    // 检查比分，判断是否需要结束比赛
    // 网球比赛规则：先赢2盘，每盘先赢6局且净胜2局
    const playerSets = this.state.playerSets;
    const opponentSets = this.state.opponentSets;
    const playerGames = this.state.playerGames;
    const opponentGames = this.state.opponentGames;
    const playerScore = this.state.playerScore;
    const opponentScore = this.state.opponentScore;
    
    // 如果某一方已经赢得2盘，比赛结束
    if (playerSets >= 2) {
      this.isFinished = true;
      this.winner = 'player';
      return true;
    }
    if (opponentSets >= 2) {
      this.isFinished = true;
      this.winner = 'opponent';
      return true;
    }
    
    return false;
  }
  
  // 获取结果（用于matchScene调用）
  getResult() {
    // 先检查是否需要结束比赛
    this.checkAndEndMatch();
    
    const playerWins = this.winner === 'player';
    
    return {
      isComplete: this.isFinished,
      playerWins: playerWins,
      playerScore: this.state.playerSets,
      opponentScore: this.state.opponentSets,
      playerGames: this.state.playerGames,
      opponentGames: this.state.opponentGames,
      playerPoints: this.state.playerScore,
      opponentPoints: this.state.opponentScore,
      playerSkillBonus: this.playerSkillBonus,
      logs: this.state.logs
    };
  }

  // 补充手牌
  drawCards(cardPool, count) {
    // 随机从卡池中抽取卡牌补充手牌
    const shuffled = [...cardPool].sort(() => Math.random() - 0.5);
    const toDraw = shuffled.slice(0, Math.min(count, shuffled.length));
    
    for (const card of toDraw) {
      if (this.playerHand.length < 8) {  // 最多8张手牌
        this.playerHand.push(card);
      }
    }
  }

  // 对手出牌（根据类型选择）
  playCardForOpponent(cardType) {
    // 根据类型过滤对手手牌
    const typeCards = this.opponentHand.filter(card => card && card.type === cardType);
    
    let selectedCard;
    if (typeCards.length > 0) {
      // 如果有对应类型的卡牌，随机选择一张
      selectedCard = typeCards[Math.floor(Math.random() * typeCards.length)];
    } else {
      // 如果没有对应类型的卡牌，从所有手牌中随机选择
      if (this.opponentHand.length > 0) {
        const idx = Math.floor(Math.random() * this.opponentHand.length);
        selectedCard = this.opponentHand[idx];
      }
    }
    
    // 移除打出的卡
    if (selectedCard) {
      const cardIndex = this.opponentHand.indexOf(selectedCard);
      if (cardIndex > -1) {
        this.opponentHand.splice(cardIndex, 1);
      }
    }
    
    return selectedCard;
  }
}

module.exports = {
  Battle,
  BattleState,
  BattlePlayer,
  BATTLE_PHASE
};
