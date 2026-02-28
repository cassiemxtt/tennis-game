/**
 * 数据模型 - Tournament 比赛签表系统
 */

// 比赛级别配置 - ATP (男子)
const ATP_TOURNAMENT_CONFIG = {
  JUNIOR: {
    name: '青少年锦标赛',
    gender: 'male',
    seedCount: 0,
    totalRounds: 3,
    prizeByRound: [0, 0, 50, 100, 200],
    championPrize: 500,
    pointsByRound: [0, 0, 10, 20, 40],
    championPoints: 100
  },
  FUTURES: {
    name: '未来赛',
    gender: 'male',
    seedCount: 0,
    totalRounds: 4,
    prizeByRound: [0, 0, 50, 100, 200, 400],
    championPrize: 1000,
    pointsByRound: [0, 0, 20, 40, 80, 150],
    championPoints: 300
  },
  CHALLENGER: {
    name: '挑战赛',
    gender: 'male',
    seedCount: 4,
    totalRounds: 5,
    prizeByRound: [0, 0, 100, 200, 400, 800, 2000],
    championPrize: 3000,
    pointsByRound: [0, 0, 50, 100, 200, 400, 800],
    championPoints: 1500
  },
  ATP125: {
    name: 'ATP125挑战赛',
    gender: 'male',
    seedCount: 4,
    totalRounds: 5,
    prizeByRound: [0, 0, 150, 300, 600, 1200, 2500],
    championPrize: 5000,
    pointsByRound: [0, 0, 30, 60, 120, 240, 400],
    championPoints: 250
  },
  ATP250: {
    name: 'ATP250巡回赛',
    gender: 'male',
    seedCount: 8,
    totalRounds: 5,
    prizeByRound: [0, 0, 200, 400, 800, 1500, 5000],
    championPrize: 12000,
    pointsByRound: [0, 0, 20, 50, 100, 200, 500],
    championPoints: 250
  },
  ATP500: {
    name: 'ATP500巡回赛',
    gender: 'male',
    seedCount: 8,
    totalRounds: 5,
    prizeByRound: [0, 0, 400, 800, 1600, 3000, 10000],
    championPrize: 25000,
    pointsByRound: [0, 0, 50, 100, 200, 400, 500],
    championPoints: 500
  },
  ATP1000: {
    name: 'ATP1000大师赛',
    gender: 'male',
    seedCount: 8,
    totalRounds: 5,
    prizeByRound: [0, 0, 800, 1600, 3200, 6000, 20000],
    championPrize: 50000,
    pointsByRound: [0, 0, 100, 200, 400, 800, 1000],
    championPoints: 1000
  },
  GRAND_SLAM: {
    name: '大满贯赛事',
    gender: 'male',
    seedCount: 16,
    totalRounds: 6,
    prizeByRound: [0, 0, 2000, 5000, 10000, 20000, 50000, 150000],
    championPrize: 200000,
    pointsByRound: [0, 0, 500, 1000, 2000, 4000, 8000, 20000],
    championPoints: 2000
  }
};

// WTA (女子) 比赛级别配置
const WTA_TOURNAMENT_CONFIG = {
  JUNIOR: {
    name: '青少年锦标赛',
    gender: 'female',
    seedCount: 0,
    totalRounds: 3,
    prizeByRound: [0, 0, 50, 100, 200],
    championPrize: 500,
    pointsByRound: [0, 0, 10, 20, 40],
    championPoints: 100
  },
  FUTURES: {
    name: '未来赛',
    gender: 'female',
    seedCount: 0,
    totalRounds: 4,
    prizeByRound: [0, 0, 50, 100, 200, 400],
    championPrize: 1000,
    pointsByRound: [0, 0, 20, 40, 80, 150],
    championPoints: 300
  },
  CHALLENGER: {
    name: '挑战赛',
    gender: 'female',
    seedCount: 4,
    totalRounds: 5,
    prizeByRound: [0, 0, 100, 200, 400, 800, 2000],
    championPrize: 3000,
    pointsByRound: [0, 0, 50, 100, 200, 400, 800],
    championPoints: 1500
  },
  WTA125: {
    name: 'WTA125挑战赛',
    gender: 'female',
    seedCount: 4,
    totalRounds: 5,
    prizeByRound: [0, 0, 150, 300, 600, 1200, 2500],
    championPrize: 5000,
    pointsByRound: [0, 0, 30, 60, 120, 240, 400],
    championPoints: 250
  },
  WTA250: {
    name: 'WTA250巡回赛',
    gender: 'female',
    seedCount: 8,
    totalRounds: 5,
    prizeByRound: [0, 0, 200, 400, 800, 1500, 5000],
    championPrize: 12000,
    pointsByRound: [0, 0, 20, 50, 100, 200, 500],
    championPoints: 280
  },
  WTA500: {
    name: 'WTA500巡回赛',
    gender: 'female',
    seedCount: 8,
    totalRounds: 5,
    prizeByRound: [0, 0, 400, 800, 1600, 3000, 10000],
    championPrize: 25000,
    pointsByRound: [0, 0, 50, 100, 200, 400, 500],
    championPoints: 500
  },
  WTA1000: {
    name: 'WTA1000强制顶级赛',
    gender: 'female',
    seedCount: 8,
    totalRounds: 5,
    prizeByRound: [0, 0, 800, 1600, 3200, 6000, 20000],
    championPrize: 50000,
    pointsByRound: [0, 0, 100, 200, 400, 800, 1000],
    championPoints: 1000
  },
  GRAND_SLAM: {
    name: '大满贯赛事',
    gender: 'female',
    seedCount: 16,
    totalRounds: 6,
    prizeByRound: [0, 0, 2000, 5000, 10000, 20000, 50000, 150000],
    championPrize: 200000,
    pointsByRound: [0, 0, 500, 1000, 2000, 4000, 8000, 20000],
    championPoints: 2000
  }
};

// 赛事日历 - 模拟真实网球赛季
// 格式：{ month: 月份, weekInMonth: 第几周(1-4), tournaments: [赛事列表], gender: 'male'/'female' }
// tournaments: 数组，可以有多场比赛，玩家选择参加其中一个
const TOURNAMENT_CALENDAR = [
  // 1月 - 澳网热身赛
  { month: 1, weekInMonth: 1, tournaments: [{ type: 'ATP250', name: '布里斯班国际赛' }, { type: 'ATP250', name: '印度浦那公开赛' }], gender: 'male' },
  { month: 1, weekInMonth: 2, tournaments: [{ type: 'ATP250', name: '奥克兰公开赛' }], gender: 'male' },
  { month: 1, weekInMonth: 3, tournaments: [{ type: 'WTA250', name: '奥克兰公开赛' }, { type: 'WTA250', name: '布里斯班国际赛' }], gender: 'female' },
  { month: 1, weekInMonth: 4, tournaments: [], gender: null }, // 无固定赛事
  
  // 2月 - 澳网
  { month: 2, weekInMonth: 1, tournaments: [{ type: 'GRAND_SLAM', name: '澳大利亚公开赛' }], gender: 'both' }, // 澳网
  { month: 2, weekInMonth: 2, tournaments: [], gender: null },
  { month: 2, weekInMonth: 3, tournaments: [{ type: 'ATP500', name: '鹿特丹公开赛' }, { type: 'ATP250', name: '布宜诺斯艾利斯公开赛' }], gender: 'male' },
  { month: 2, weekInMonth: 4, tournaments: [{ type: 'WTA500', name: '迪拜免税网球冠军赛' }, { type: 'WTA250', name: '多哈公开赛' }], gender: 'female' },
  
  // 3月 - 北美硬地/中东
  { month: 3, weekInMonth: 1, tournaments: [{ type: 'ATP1000', name: '印第安维尔斯大师赛' }], gender: 'male' },
  { month: 3, weekInMonth: 2, tournaments: [{ type: 'WTA1000', name: '印第安维尔斯公开赛' }], gender: 'female' },
  { month: 3, weekInMonth: 3, tournaments: [{ type: 'ATP1000', name: '迈阿密公开赛' }], gender: 'male' },
  { month: 3, weekInMonth: 4, tournaments: [{ type: 'WTA1000', name: '迈阿密公开赛' }], gender: 'female' },
  
  // 4月 - 欧洲红土
  { month: 4, weekInMonth: 1, tournaments: [{ type: 'ATP250', name: '蒙特卡洛大师赛' }, { type: 'ATP250', name: '休斯顿公开赛' }], gender: 'male' },
  { month: 4, weekInMonth: 2, tournaments: [{ type: 'WTA250', name: '波哥大公开赛' }, { type: 'WTA250', name: '斯图加特公开赛' }], gender: 'female' },
  { month: 4, weekInMonth: 3, tournaments: [{ type: 'ATP500', name: '巴塞罗那公开赛' }, { type: 'ATP250', name: '慕尼黑公开赛' }], gender: 'male' },
  { month: 4, weekInMonth: 4, tournaments: [{ type: 'WTA500', name: '斯图加特公开赛' }, { type: 'WTA250', name: '伊斯坦布尔公开赛' }], gender: 'female' },
  
  // 5月 - 法网热身
  { month: 5, weekInMonth: 1, tournaments: [{ type: 'ATP250', name: '马德里公开赛' }, { type: 'ATP250', name: '日内瓦公开赛' }], gender: 'male' },
  { month: 5, weekInMonth: 2, tournaments: [{ type: 'WTA250', name: '拉巴特公开赛' }, { type: 'WTA250', name: '斯特拉斯堡公开赛' }], gender: 'female' },
  { month: 5, weekInMonth: 3, tournaments: [{ type: 'ATP1000', name: '罗马大师赛' }], gender: 'male' },
  { month: 5, weekInMonth: 4, tournaments: [{ type: 'WTA1000', name: '罗马公开赛' }], gender: 'female' },
  
  // 6月 - 法网
  { month: 6, weekInMonth: 1, tournaments: [{ type: 'GRAND_SLAM', name: '法国公开赛' }], gender: 'both' }, // 法网
  { month: 6, weekInMonth: 2, tournaments: [], gender: null },
  { month: 6, weekInMonth: 3, tournaments: [{ type: 'ATP250', name: '斯海尔托亨博斯公开赛' }, { type: 'ATP250', name: '马洛卡公开赛' }], gender: 'male' },
  { month: 6, weekInMonth: 4, tournaments: [{ type: 'WTA250', name: '柏林公开赛' }, { type: 'WTA250', name: '伯明翰公开赛' }], gender: 'female' },
  
  // 7月 - 温网热身/温网
  { month: 7, weekInMonth: 1, tournaments: [{ type: 'ATP500', name: '女王杯草地赛' }, { type: 'ATP250', name: '伊斯特本公开赛' }], gender: 'male' },
  { month: 7, weekInMonth: 2, tournaments: [{ type: 'WTA500', name: '伊斯特本公开赛' }, { type: 'WTA250', name: '巴特洪堡公开赛' }], gender: 'female' },
  { month: 7, weekInMonth: 3, tournaments: [{ type: 'GRAND_SLAM', name: '温布尔登公开赛' }], gender: 'both' }, // 温网
  { month: 7, weekInMonth: 4, tournaments: [], gender: null },
  
  // 8月 - 北美硬地
  { month: 8, weekInMonth: 1, tournaments: [{ type: 'ATP1000', name: '罗杰斯杯' }], gender: 'male' },
  { month: 8, weekInMonth: 2, tournaments: [{ type: 'WTA1000', name: '罗杰斯杯' }], gender: 'female' },
  { month: 8, weekInMonth: 3, tournaments: [{ type: 'ATP1000', name: '辛辛那提公开赛' }], gender: 'male' },
  { month: 8, weekInMonth: 4, tournaments: [{ type: 'WTA1000', name: '辛辛那提公开赛' }], gender: 'female' },
  
  // 9月 - 美网/中国赛季
  { month: 9, weekInMonth: 1, tournaments: [{ type: 'GRAND_SLAM', name: '美国公开赛' }], gender: 'both' }, // 美网
  { month: 9, weekInMonth: 2, tournaments: [], gender: null },
  { month: 9, weekInMonth: 3, tournaments: [{ type: 'ATP250', name: '成都公开赛' }, { type: 'ATP250', name: '珠海公开赛' }], gender: 'male' },
  { month: 9, weekInMonth: 4, tournaments: [{ type: 'WTA500', name: '中国公开赛' }, { type: 'WTA250', name: '广州公开赛' }], gender: 'female' },
  
  // 10月 - 中国赛季/欧洲室内
  { month: 10, weekInMonth: 1, tournaments: [{ type: 'ATP500', name: '上海大师赛' }], gender: 'male' },
  { month: 10, weekInMonth: 2, tournaments: [{ type: 'WTA1000', name: '中国公开赛' }], gender: 'female' },
  { month: 10, weekInMonth: 3, tournaments: [{ type: 'ATP1000', name: '巴黎大师赛' }], gender: 'male' },
  { month: 10, weekInMonth: 4, tournaments: [{ type: 'WTA500', name: '克里姆林宫杯' }, { type: 'WTA250', name: '天津公开赛' }], gender: 'female' },
  
  // 11月 - 年终总决赛
  { month: 11, weekInMonth: 1, tournaments: [{ type: 'ATP1000', name: 'ATP年终总决赛' }], gender: 'male' }, // 年终总决赛
  { month: 11, weekInMonth: 2, tournaments: [{ type: 'WTA1000', name: 'WTA年终总决赛' }], gender: 'female' }, // 年终总决赛
  { month: 11, weekInMonth: 3, tournaments: [], gender: null },
  { month: 11, weekInMonth: 4, tournaments: [], gender: null },
  
  // 12月 - 休赛期
  { month: 12, weekInMonth: 1, tournaments: [], gender: null },
  { month: 12, weekInMonth: 2, tournaments: [], gender: null },
  { month: 12, weekInMonth: 3, tournaments: [], gender: null },
  { month: 12, weekInMonth: 4, tournaments: [], gender: null }
];

// 赛事日历管理器
class TournamentCalendar {
  // 获取指定年月的可用赛事
  static getAvailableTournaments(year, month, gender, week) {
    const tournaments = [];
    const weekInMonth = week ? this.getWeekInMonth(week) : 1;
    
    // 查找当月的赛事
    for (const calEvent of TOURNAMENT_CALENDAR) {
      if (calEvent.month === month) {
        // 检查周数是否匹配
        if (calEvent.weekInMonth !== weekInMonth) continue;
        
        // 检查性别匹配
        if (calEvent.gender === 'both' || calEvent.gender === gender) {
          // 遍历该周的所有赛事
          for (const t of calEvent.tournaments) {
            const config = gender === 'male' ? ATP_TOURNAMENT_CONFIG : WTA_TOURNAMENT_CONFIG;
            const tournamentConfig = config[t.type];
            
            if (tournamentConfig) {
              tournaments.push({
                type: t.type,
                name: t.name,  // 赛事名称
                config: tournamentConfig,
                gender: gender
              });
            }
          }
        }
      }
    }
    
    return tournaments;
  }

  // 获取指定周的实际赛事（考虑赛季进度）
  static getTournamentsForWeek(year, month, week, gender) {
    return this.getAvailableTournaments(year, month, gender, week);
  }
  
  // 辅助方法：计算年内周索引
  static getWeekInMonth(weekOfMonth) {
    return Math.min(4, Math.max(1, weekOfMonth || 1));
  }
}

// 获取游戏周数据的引用（需要在运行时设置）
let gameData = { week: 1 };

// 设置游戏数据引用
function setGameData(data) {
  gameData = data;
}

// 兼容旧代码的别名
const TOURNAMENT_CONFIG = ATP_TOURNAMENT_CONFIG;

// 对手生成器
class Opponent {
  constructor(ranking, level, gender = 'male') {
    this.ranking = ranking;
    this.level = level;
    this.gender = gender;
    this.name = Opponent.generateName(gender);
    this.attributes = Opponent.generateAttributes(level);
    this.skills = Opponent.generateSkills(level);
  }

  // ATP (男子) 对手名字
  static atpNames = [
    '德约科维奇', '纳达尔', '阿尔卡拉斯', '辛纳', '梅德韦杰夫',
    '鲁内', '兹维列夫', '卢布列夫', '弗里茨', '鲁德',
    '迪米特洛夫', '西西帕斯', '保罗', '布勃利克', '格里克斯普尔',
    '塔贝洛', '科达', '谢尔顿', '巴埃斯', '塞伦多洛'
  ];

  // WTA (女子) 对手名字
  static wtaNames = [
    '斯瓦泰克', '萨巴伦卡', '高芙', '莱巴金娜', '佩古拉',
    '万卓索娃', '柯林斯', '萨卡里', '郑钦文', '奥斯塔彭科',
    '库德梅托娃', '卡萨金娜', '加西亚', '本西奇', '巴多萨',
    '玛雅', '维基奇', '克雷吉茨科娃', '斯蒂芬斯', '大阪直美'
  ];

  static generateName(gender = 'male') {
    const names = gender === 'female' ? Opponent.wtaNames : Opponent.atpNames;
    const index = Math.floor(Math.random() * names.length);
    return names[index];
  }

  static generateAttributes(level) {
    const base = 50 + level * 5;
    return {
      strength: Math.min(95, base + Math.floor(Math.random() * 20)),
      speed: Math.min(95, base + Math.floor(Math.random() * 20)),
      technique: Math.min(95, base + Math.floor(Math.random() * 20)),
      endurance: Math.min(95, base + Math.floor(Math.random() * 20)),
      mentality: Math.min(95, base + Math.floor(Math.random() * 20))
    };
  }

  static generateSkills(level) {
    const base = 45 + level * 5;
    return {
      serve: Math.min(95, base + Math.floor(Math.random() * 25)),
      forehand: Math.min(95, base + Math.floor(Math.random() * 25)),
      backhand: Math.min(95, base + Math.floor(Math.random() * 25)),
      volley: Math.min(95, base + Math.floor(Math.random() * 25)),
      returnGame: Math.min(95, base + Math.floor(Math.random() * 25))
    };
  }

  calculateOverall() {
    const baseStats = Math.floor((this.attributes.strength + this.attributes.speed + 
      this.attributes.technique + this.attributes.endurance + this.attributes.mentality) / 5);
    const skills = Math.floor((this.skills.serve + this.skills.forehand + 
      this.skills.backhand + this.skills.volley + this.skills.returnGame) / 5);
    return Math.floor((baseStats * 6 + skills * 4) / 10);
  }

  // 序列化为JSON
  toJSON() {
    return {
      ranking: this.ranking,
      level: this.level,
      name: this.name,
      attributes: this.attributes,
      skills: this.skills
    };
  }

  // 从JSON反序列化
  static fromJSON(data) {
    const opponent = new Opponent(data.ranking, data.level);
    opponent.name = data.name;
    opponent.attributes = data.attributes;
    opponent.skills = data.skills;
    return opponent;
  }
}

// 签表类
class Tournament {
  constructor(matchLevel, player) {
    this.config = TOURNAMENT_CONFIG[matchLevel];
    this.matchLevel = matchLevel;
    this.player = player;
    this.rounds = [];
    this.currentRound = 1;
    this.playerPosition = 0;
    this.isEliminated = false;
    this.wonRounds = 0;
    this.eliminatedAtRound = 0;
    
    this.generateBracket();
  }

  // 生成签表
  generateBracket() {
    const totalSlots = Math.pow(2, this.config.totalRounds);
    this.rounds = [];
    
    for (let r = 0; r < this.config.totalRounds; r++) {
      const matchesInRound = totalSlots / Math.pow(2, r + 1);
      const round = {
        roundNumber: r + 1,
        matches: []
      };
      
      for (let m = 0; m < matchesInRound; m++) {
        round.matches.push({
          player1: null,
          player2: null,
          winner: null,
          isPlayerMatch: false,
          playerResult: null  // 'win', 'lose', null
        });
      }
      
      this.rounds.push(round);
    }
    
    // 放置玩家到签表（通常是第一轮）
    this.playerPosition = Math.floor(Math.random() * (totalSlots / 2));
    
    // 生成第一轮对手
    this.generateFirstRoundOpponents();
  }

  // 获取当前轮次对手的实力范围
  getOpponentLevelRange(roundIndex) {
    const baseSkill = this.getBaseSkillForLevel();
    
    // 根据轮次调整对手实力
    // roundIndex: 0=第一轮, 1=第二轮, ...
    const ranges = [
      { min: -12, max: 3 },   // 第一轮：较弱
      { min: -8, max: 5 },    // 第二轮
      { min: -3, max: 10 },   // 第三轮
      { min: 2, max: 15 },    // 第四轮
      { min: 5, max: 20 },    // 第五轮
      { min: 10, max: 25 }    // 决赛
    ];
    
    const range = ranges[Math.min(roundIndex, ranges.length - 1)];
    const level = baseSkill + Math.floor(Math.random() * (range.max - range.min)) + range.min;
    
    return level;
  }

  // 生成第一轮对手
  generateFirstRoundOpponents() {
    const firstRound = this.rounds[0];
    const baseSkill = this.getBaseSkillForLevel();
    
    // 玩家在第一轮的对手 - 较弱
    const playerSlot = this.playerPosition * 2;
    const opponentLevel = this.getOpponentLevelRange(0); // 第一轮
    const opponent = new Opponent(this.getOpponentRanking(), opponentLevel);
    
    // 找到玩家所在比赛
    const matchIndex = Math.floor(playerSlot / 2);
    const isPlayerFirst = playerSlot % 2 === 0;
    
    firstRound.matches[matchIndex].player1 = isPlayerFirst ? { isPlayer: true } : opponent;
    firstRound.matches[matchIndex].player2 = isPlayerFirst ? opponent : { isPlayer: true };
    firstRound.matches[matchIndex].isPlayerMatch = true;
    
    // 生成其他对手
    for (let i = 0; i < firstRound.matches.length; i++) {
      if (i === matchIndex) continue;
      
      const level = this.getOpponentLevelRange(0);
      const opp = new Opponent(this.getOpponentRanking() + Math.floor(Math.random() * 50), level);
      
      firstRound.matches[i].player1 = opp;
      firstRound.matches[i].player2 = new Opponent(
        this.getOpponentRanking() + Math.floor(Math.random() * 50), 
        this.getOpponentLevelRange(0)
      );
    }
  }

  getBaseSkillForLevel() {
    const levelMap = {
      'JUNIOR': 20,
      'FUTURES': 35,
      'CHALLENGER': 45,
      'ATP250': 55,
      'ATP500': 65,
      'ATP1000': 75,
      'GRAND_SLAM': 80
    };
    return levelMap[this.matchLevel] || 50;
  }

  getOpponentRanking() {
    const rankingMap = {
      'JUNIOR': 500,
      'FUTURES': 400,
      'CHALLENGER': 200,
      'ATP250': 100,
      'ATP500': 50,
      'ATP1000': 20,
      'GRAND_SLAM': 10
    };
    return rankingMap[this.matchLevel] || 100;
  }

  // 获取当前轮次的对手
  getCurrentOpponent() {
    if (this.isEliminated || this.currentRound > this.config.totalRounds) {
      return null;
    }
    
    const roundIndex = this.currentRound - 1;
    const currentRound = this.rounds[roundIndex];
    if (!currentRound) {
      return null;
    }
    
    // 找到玩家的比赛
    let playerMatch = null;
    let playerMatchIndex = -1;
    
    for (let i = 0; i < currentRound.matches.length; i++) {
      if (currentRound.matches[i].isPlayerMatch) {
        playerMatch = currentRound.matches[i];
        playerMatchIndex = i;
        break;
      }
    }
    
    if (!playerMatch) {
      // 如果当前轮没有找到玩家的比赛，尝试根据playerPosition查找
      // 玩家在每一轮的位置
      const playerSlot = this.playerPosition % Math.pow(2, this.config.totalRounds - roundIndex);
      const isPlayerFirst = playerSlot < (Math.pow(2, this.config.totalRounds - roundIndex - 1));
      
      // 计算在当前轮的match位置
      const matchIndexInRound = Math.floor(playerSlot / 2);
      
      if (matchIndexInRound < currentRound.matches.length) {
        playerMatch = currentRound.matches[matchIndexInRound];
        playerMatchIndex = matchIndexInRound;
        
        // 如果这个位置不是玩家的比赛，需要初始化
        if (!playerMatch.isPlayerMatch) {
          // 设置玩家标记
          playerMatch.isPlayerMatch = true;
          
          // 如果没有玩家，初始化
          if (isPlayerFirst && (!playerMatch.player1 || !playerMatch.player1.isPlayer)) {
            playerMatch.player1 = { isPlayer: true, name: this.player.name };
          } else if (!isPlayerFirst && (!playerMatch.player2 || !playerMatch.player2.isPlayer)) {
            playerMatch.player2 = { isPlayer: true, name: this.player.name };
          }
        }
      }
    }
    
    if (!playerMatch) return null;
    
    // 获取对手 - 根据位置判断
    const playerSlot = this.playerPosition % Math.pow(2, this.config.totalRounds - roundIndex);
    const isPlayerFirst = playerSlot < (Math.pow(2, this.config.totalRounds - roundIndex - 1));
    
    let opponent = isPlayerFirst ? playerMatch.player2 : playerMatch.player1;
    
    // 如果对手为空或玩家自己
    if (!opponent || (opponent.isPlayer === true)) {
      // 模拟上一轮比赛
      if (roundIndex > 0) {
        this.simulateNPcMatches(roundIndex - 1);
        
        // 从上一轮晋级获取对手
        const prevRound = this.rounds[roundIndex - 1];
        const prevMatchIndex = Math.floor(playerMatchIndex / 2);
        
        if (prevRound.matches[prevMatchIndex] && prevRound.matches[prevMatchIndex].winner) {
          opponent = prevRound.matches[prevMatchIndex].winner;
        }
      }
    }
    
    // 如果仍然没有对手，根据当前轮次生成一个新对手
    if (!opponent || (opponent.isPlayer === true)) {
      const level = this.getOpponentLevelRange(roundIndex);
      opponent = new Opponent(this.getOpponentRanking(), level);
    }
    
    // 设置对手到当前轮
    if (isPlayerFirst) {
      playerMatch.player2 = opponent;
    } else {
      playerMatch.player1 = opponent;
    }
    
    return opponent;
  }

  // 获取玩家当前轮次的比赛信息
  getCurrentMatchInfo() {
    if (this.isEliminated) {
      return { eliminated: true, round: this.eliminatedAtRound };
    }
    
    if (this.currentRound > this.config.totalRounds) {
      return { champion: true };
    }
    
    return {
      round: this.currentRound,
      totalRounds: this.config.totalRounds,
      opponent: this.getCurrentOpponent()
    };
  }

  // 处理玩家比赛结果
  playMatch(playerWin) {
    const roundIndex = this.currentRound - 1;
    const currentRound = this.rounds[roundIndex];
    
    // 找到当前轮中玩家的比赛
    let match = null;
    let matchIndex = -1;
    let playerSlot = 0;
    
    for (let i = 0; i < currentRound.matches.length; i++) {
      if (currentRound.matches[i].isPlayerMatch) {
        match = currentRound.matches[i];
        matchIndex = i;
        // 判断玩家是player1还是player2
        playerSlot = match.player1 && match.player1.isPlayer ? 0 : 1;
        break;
      }
    }
    
    if (!match) {
      // 找不到玩家的比赛
      return {
        won: false,
        currentRound: this.currentRound,
        prize: 0,
        points: 0
      };
    }
    
    if (playerWin) {
      // 玩家获胜
      match.winner = playerSlot === 0 ? match.player1 : match.player2;
      match.playerResult = 'win';
      this.wonRounds = this.currentRound;
      
      // 晋级的玩家进入下一轮
      const nextRoundIndex = this.currentRound;
      if (nextRoundIndex < this.rounds.length) {
        const nextMatchIndex = Math.floor(matchIndex / 2);
        const isFirstPlayer = matchIndex % 2 === 0;
        
        const playerObj = { isPlayer: true, name: this.player.name };
        
        if (this.rounds[nextRoundIndex].matches[nextMatchIndex]) {
          if (isFirstPlayer) {
            this.rounds[nextRoundIndex].matches[nextMatchIndex].player1 = playerObj;
          } else {
            this.rounds[nextRoundIndex].matches[nextMatchIndex].player2 = playerObj;
          }
          // 标记下一轮的比赛是玩家的比赛
          this.rounds[nextRoundIndex].matches[nextMatchIndex].isPlayerMatch = true;
        }
      }
      
      this.currentRound++;
    } else {
      // 玩家淘汰
      match.winner = playerSlot === 0 ? match.player2 : match.player1;
      match.playerResult = 'lose';
      this.isEliminated = true;
      this.eliminatedAtRound = this.currentRound;
    }
    
    // 模拟同一轮其他NPC的比赛结果
    this.simulateNPcMatches(roundIndex);
    
    return {
      won: playerWin,
      currentRound: this.currentRound - 1,
      prize: this.getPrize(),
      points: this.getPoints()
    };
  }

  // 模拟同一轮其他NPC的比赛
  simulateNPcMatches(roundIndex) {
    const currentRound = this.rounds[roundIndex];
    const nextRound = this.rounds[roundIndex + 1];
    
    if (!nextRound) return; // 没有下一轮
    
    for (let i = 0; i < currentRound.matches.length; i++) {
      const match = currentRound.matches[i];
      
      // 跳过玩家的比赛
      if (match.isPlayerMatch) continue;
      
      // 如果比赛还没有结果，随机决定胜负
      if (!match.winner && match.player1 && match.player2) {
        // 简单的随机决定胜负
        const winner = Math.random() < 0.5 ? match.player1 : match.player2;
        match.winner = winner;
        
        // 将胜者放入下一轮
        const nextMatchIndex = Math.floor(i / 2);
        const isFirstPlayer = i % 2 === 0;
        
        if (nextRound.matches[nextMatchIndex]) {
          if (isFirstPlayer) {
            nextRound.matches[nextMatchIndex].player1 = winner;
          } else {
            nextRound.matches[nextMatchIndex].player2 = winner;
          }
        }
      }
    }
  }

  // 模拟剩余所有轮次的比赛（玩家被淘汰后使用）
  simulateRemainingMatches() {
    // 从当前轮开始，模拟所有轮次
    for (let r = 0; r < this.rounds.length; r++) {
      const currentRound = this.rounds[r];
      const nextRound = this.rounds[r + 1];
      
      for (let i = 0; i < currentRound.matches.length; i++) {
        const match = currentRound.matches[i];
        
        // 如果没有选手，需要生成
        if (!match.player1 || !match.player2) {
          // 生成缺失的选手
          const level = this.getOpponentLevelRange(r);
          const opponent = new Opponent(this.getOpponentRanking(), level);
          
          if (!match.player1) {
            match.player1 = opponent;
          }
          if (!match.player2) {
            // 如果已经有player1是玩家，不处理
            if (!match.player1 || !match.player1.isPlayer) {
              match.player2 = new Opponent(this.getOpponentRanking() + Math.floor(Math.random() * 50), level);
            }
          }
        }
        
        // 如果比赛还没有结果，随机决定胜负
        if (!match.winner && match.player1 && match.player2) {
          // 简单的随机决定胜负
          const winner = Math.random() < 0.5 ? match.player1 : match.player2;
          match.winner = winner;
          
          // 将胜者放入下一轮
          if (nextRound) {
            const nextMatchIndex = Math.floor(i / 2);
            const isFirstPlayer = i % 2 === 0;
            
            if (nextRound.matches[nextMatchIndex]) {
              if (isFirstPlayer) {
                nextRound.matches[nextMatchIndex].player1 = winner;
              } else {
                nextRound.matches[nextMatchIndex].player2 = winner;
              }
            }
          }
        }
      }
    }
    
    // 确保冠军已确定
    const finalRound = this.rounds[this.rounds.length - 1];
    if (finalRound && finalRound.matches.length > 0) {
      const finalMatch = finalRound.matches[0];
      if (!finalMatch.winner && finalMatch.player1 && finalMatch.player2) {
        finalMatch.winner = Math.random() < 0.5 ? finalMatch.player1 : finalMatch.player2;
      }
    }
  }

  // 获取冠军
  getChampion() {
    const finalRound = this.rounds[this.rounds.length - 1];
    if (finalRound && finalRound.matches.length > 0) {
      return finalRound.matches[0].winner;
    }
    return null;
  }

  // 获取当前晋级的奖金
  getPrize() {
    if (this.currentRound > this.config.totalRounds) {
      // 夺冠
      return this.config.championPrize;
    } else if (this.isEliminated) {
      // 淘汰轮次
      const round = this.eliminatedAtRound - 1;
      return this.config.prizeByRound[round] || 0;
    } else {
      // 刚赢了一轮
      return this.config.prizeByRound[this.currentRound - 1] || 0;
    }
  }

  // 获取排名积分
  getPoints() {
    if (this.currentRound > this.config.totalRounds) {
      return this.config.championPoints;
    } else if (this.isEliminated) {
      const round = this.eliminatedAtRound - 1;
      return this.config.pointsByRound[round] || 0;
    } else {
      return this.config.pointsByRound[this.currentRound - 1] || 0;
    }
  }

  // 获取签表用于显示
  getBracketForDisplay() {
    return {
      rounds: this.rounds,
      currentRound: this.currentRound,
      playerPosition: this.playerPosition,
      config: this.config
    };
  }

  // 序列化为JSON
  toJSON() {
    return {
      config: this.config,
      matchLevel: this.matchLevel,
      rounds: this.rounds,
      currentRound: this.currentRound,
      playerPosition: this.playerPosition,
      isEliminated: this.isEliminated,
      wonRounds: this.wonRounds,
      eliminatedAtRound: this.eliminatedAtRound
    };
  }

  // 从JSON反序列化
  static fromJSON(data, player) {
    const tournament = new Tournament(data.matchLevel, player);
    tournament.rounds = data.rounds;
    tournament.currentRound = data.currentRound;
    tournament.playerPosition = data.playerPosition;
    tournament.isEliminated = data.isEliminated;
    tournament.wonRounds = data.wonRounds;
    tournament.eliminatedAtRound = data.eliminatedAtRound;
    
    // 将对手数据转换为 Opponent 对象
    if (tournament.rounds) {
      for (const round of tournament.rounds) {
        if (round.matches) {
          for (const match of round.matches) {
            if (match.player1 && match.player1.ranking !== undefined && !match.player1.isPlayer) {
              match.player1 = Opponent.fromJSON(match.player1);
            }
            if (match.player2 && match.player2.ranking !== undefined && !match.player2.isPlayer) {
              match.player2 = Opponent.fromJSON(match.player2);
            }
            // 处理已晋级的对手（winner）
            if (match.winner && match.winner.ranking !== undefined && !match.winner.isPlayer) {
              match.winner = Opponent.fromJSON(match.winner);
            }
          }
        }
      }
    }
    
    return tournament;
  }
}

// 比赛策略
const MATCH_STRATEGY = {
  CONSERVATIVE: {
    id: 'conservative',
    name: '保守比赛',
    winRateAdjust: -10,  // 胜率-10%
    injuryRate: 0.05,   // 5% 伤病率
    energyCost: 5,
    description: '稳扎稳打，减少风险'
  },
  NORMAL: {
    id: 'normal',
    name: '正常比赛',
    winRateAdjust: 0,
    injuryRate: 0.15,
    energyCost: 10,
    description: '常规打法'
  },
  AGGRESSIVE: {
    id: 'aggressive',
    name: '冒险比赛',
    winRateAdjust: 15,
    injuryRate: 0.30,
    energyCost: 15,
    description: '放手一搏，增加胜率'
  },
  DESPERATE: {
    id: 'desperate',
    name: '拼死一搏',
    winRateAdjust: 25,
    injuryRate: 0.50,
    energyCost: 20,
    description: '背水一战，风险极高'
  }
};

// 策略计算
class MatchStrategy {
  // 计算实际胜率
  static calculateWinRate(player, opponent, strategy, playerForm) {
    const playerOverall = player.calculateOverall();
    const opponentOverall = opponent.calculateOverall();
    
    // 基础胜率
    let baseWinRate = 50 + (playerOverall - opponentOverall) * 0.5;
    
    // 状态修正
    let formAdjust = 0;
    if (playerForm >= 90) formAdjust = 10;
    else if (playerForm >= 70) formAdjust = 5;
    else if (playerForm <= 30) formAdjust = -10;
    else if (playerForm <= 20) formAdjust = -20;
    
    // 策略修正
    const strategyAdjust = strategy.winRateAdjust;
    
    // 最终胜率
    let finalWinRate = baseWinRate + formAdjust + strategyAdjust;
    finalWinRate = Math.max(5, Math.min(95, finalWinRate));
    
    return finalWinRate;
  }

  // 计算可能的伤病
  static rollInjury(strategy) {
    // 基础伤病率
    let injuryChance = strategy.injuryRate;
    
    // 状态影响
    const playerForm = this.playerForm || 50;
    if (playerForm >= 80) {
      injuryChance *= 0.7; // 状态好减少伤病
    } else if (playerForm <= 40) {
      injuryChance *= 1.3; // 状态差增加伤病
    }
    
    return Math.random() < injuryChance;
  }
}

// 伤病系统
const INJURY_TYPE = {
  NONE: { id: 'none', name: '无', duration: 0, effect: {} },
  LIGHT_STRAIN: { id: 'light_strain', name: '轻微拉伤', duration: 1, effect: { speed: -10 } },
  MUSCLE_SORENESS: { id: 'muscle_soreness', name: '肌肉酸痛', duration: 1, effect: { strength: -10 } },
  SPRAIN: { id: 'srain', name: '扭伤', duration: 2, effect: { speed: -15 } },
  TENNIS_ELBOW: { id: 'tennis_elbow', name: '网球肘', duration: 3, effect: { technique: -20 } },
  MENISCUS: { id: 'meniscus', name: '半月板损伤', duration: 4, effect: { strength: -15, speed: -15, technique: -10 } },
  SEASON_END: { id: 'season_end', name: '赛季报销', duration: 8, effect: { all: -20 } }
};

class InjurySystem {
  static rollInjury() {
    const rand = Math.random();
    
    if (rand < 0.60) {
      return INJURY_TYPE.NONE; // 60% 无伤病
    } else if (rand < 0.80) {
      return INJURY_TYPE.LIGHT_STRAIN; // 20% 轻微拉伤
    } else if (rand < 0.90) {
      return INJURY_TYPE.MUSCLE_SORENESS; // 10% 肌肉酸痛
    } else if (rand < 0.95) {
      return INJURY_TYPE.SPRAIN; // 5% 扭伤
    } else if (rand < 0.98) {
      return INJURY_TYPE.TENNIS_ELBOW; // 3% 网球肘
    } else if (rand < 0.995) {
      return INJURY_TYPE.MENISCUS; // 1.5% 半月板
    } else {
      return INJURY_TYPE.SEASON_END; // 0.5% 赛季报销
    }
  }
}

module.exports = {
  TOURNAMENT_CONFIG,
  ATP_TOURNAMENT_CONFIG,
  WTA_TOURNAMENT_CONFIG,
  TOURNAMENT_CALENDAR,
  TournamentCalendar,
  Tournament,
  Opponent,
  MATCH_STRATEGY,
  MatchStrategy,
  INJURY_TYPE,
  InjurySystem,
  setGameData
};
