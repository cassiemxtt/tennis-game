/**
 * 网球运动员职业生涯模拟器 - 微信小游戏
 * Tennis Career Simulator - WeChat Mini Game
 */

// 导入图片管理器
/*const { ImageManager } = require('./shared/imageManager.js');
*/
// 游戏配置
const CONFIG = {
  SCREEN_WIDTH: 750,
  SCREEN_HEIGHT: 1334,
  THEME: {
    PRIMARY: '#64ffda',
    SECONDARY: '#48c9b0',
    BACKGROUND: '#16213e',
    CARD_BG: '#1a1a2e',
    TEXT_MAIN: '#ccd6f6',
    TEXT_SECONDARY: '#8892b0',
    GOLD: '#ffd700',
    RED: '#fc8181',
    GREEN: '#68d391',
    ORANGE: '#f6ad55'
  }
};

// 游戏状态枚举
const GAME_STATE = {
  LOADING: 'loading',
  MENU: 'menu',
  CREATE_PLAYER: 'create_player',
  HOME: 'home',
  TRAINING: 'training',
  SPEED_TRAINING: 'speed_training',
  STRENGTH_TRAINING: 'strength_training',
  TECH_TRAINING: 'tech_training',
  MATCH: 'match',
  SPONSOR: 'sponsor',
  EQUIPMENT: 'equipment',
  STATS: 'stats',
  REST: 'rest',
  EVENT: 'event',
  COACH: 'coach'
};

// 游戏主类
class Game {
  constructor() {
    console.log('Game constructor called');
    this.canvas = null;
    this.ctx = null;
    this.state = GAME_STATE.LOADING;
    this.scenes = {};
    this.currentScene = null;
    this.player = null;
    this.gameData = {
      month: 1,
      week: 1,
      year: 2024,
      gameActive: true,
      specialEvents: [],
      actionHistory: {}, // 按周存储用户操作记录，格式: { "2024-1-1": [action1, action2], "2024-1-2": [...] }
      ongoingTournament: null, // 当前正在进行的比赛数据
      // 每周操作次数限制
      weeklyActions: {
        trainingRestCount: 0,  // 训练+休息 总共5次
        matchCount: 0            // 比赛 1次
      }
    };
    
    // 操作次数限制配置
    this.WEEKLY_LIMITS = {
      MAX_TRAINING_REST: 5,  // 训练+休息 每周最多5次
      MAX_MATCH: 1            // 比赛 每周最多1次
    };
    this.lastTime = 0;

    // 图片管理器
    /*
    this.imageManager = new ImageManager();
    this.imagesLoaded = false;
    */
    // 初始化
    this.init();
  }

  // 初始化
  init() {
    console.log('Game init');
    // 创建Canvas
    this.canvas = wx.createCanvas();
    this.ctx = this.canvas.getContext('2d');

    // 设置屏幕适配
    this.setupScreen();

    // 加载资源
    /*this.loadResources();
    */
    // 创建场景
    this.createScenes();

    // 设置触摸事件
    this.setupTouchEvents();

    // 加载存档
    this.loadGame();

    // 启动游戏循环
    this.startGameLoop();
  }

  // 设置屏幕适配
  setupScreen() {
    const sysInfo = wx.getSystemInfoSync();
    this.canvasWidth = sysInfo.windowWidth;
    this.canvasHeight = sysInfo.windowHeight;
    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;
    console.log('Canvas initialized:', this.canvasWidth, 'x', this.canvasHeight);
  }

  // 加载资源
  /*loadResources() {
    this.loadFonts();
    this.loadImages();
  }
  */
  loadFonts() {
    // 微信小游戏使用系统字体
  }

  // 加载图片资源
  /*async loadImages() {
    const imageList = [
      { key: 'avatar_player', src: 'shared/images/avatar_player.png' },
      { key: 'icon_speed', src: 'shared/images/icon_speed.png' },
      { key: 'icon_strength', src: 'shared/images/icon_strength.png' },
      { key: 'icon_technique', src: 'shared/images/icon_technique.png' },
      { key: 'icon_endurance', src: 'shared/images/icon_endurance.png' },
      { key: 'icon_mentality', src: 'shared/images/icon_mentality.png' },
      { key: 'icon_training', src: 'shared/images/icon_training.png' },
      { key: 'icon_match', src: 'shared/images/icon_match.png' },
      { key: 'icon_sponsor', src: 'shared/images/icon_sponsor.png' },
      { key: 'icon_rest', src: 'shared/images/icon_rest.png' },
      { key: 'icon_trophy', src: 'shared/images/icon_trophy.png' },
      { key: 'icon_next', src: 'shared/images/icon_next.png' },
      { key: 'bg_pattern', src: 'shared/images/bg_pattern.png' }
    ];*/

    // 设置加载完成回调
    /*this.imageManager.onLoadComplete = (images) => {
      console.log('All images loaded!');
      this.imagesLoaded = true;
    };*/

    /*// 设置进度回调
    this.imageManager.onProgress = (loaded, total) => {
      console.log(`Loading images: ${loaded}/${total}`);
    };

    try {
      await this.imageManager.loadImages(imageList);
    } catch (err) {
      console.warn('Some images failed to load:', err);
      this.imagesLoaded = true; // 继续游戏，即使图片加载失败
    }
  }*/

  // 获取图片管理器
  /*getImageManager() {
    return this.imageManager;
  }
*/
  // 创建场景
  createScenes() {
    this.scenes = {
      menu: new MenuScene(this),
      create_player: new CreatePlayerScene(this),
      home: new HomeScene(this),
      training: new TrainingScene(this),
      speed_training: new SpeedTrainingScene(this),
      strength_training: new StrengthTrainingScene(this),
      tech_training: new TechTrainingScene(this),
      match: new MatchScene(this),
      sponsor: new SponsorScene(this),
      equipment: new EquipmentScene(this),
      stats: new StatsScene(this),
      rest: new RestScene(this),
      event: new EventScene(this),
      coach: new CoachScene(this)
    };
  }

  // 设置触摸事件 - 微信小游戏全局触摸 API
  setupTouchEvents() {
    const self = this;

    // 记录触摸起始位置
    this.touchStartY = 0;
    this.touchStartX = 0;

    wx.onTouchStart(function(res) {
      const touches = res.touches || [];
      for (const touch of touches) {
        const x = touch.clientX;
        const y = touch.clientY;
        console.log('touchstart:', x, y);
        self.touchStartY = y;
        self.touchStartX = x;
        self.handleTouch(x, y, 'touchstart');
      }
    });

    wx.onTouchEnd(function(res) {
      const changedTouches = res.changedTouches || [];
      for (const touch of changedTouches) {
        const x = touch.clientX;
        const y = touch.clientY;
        console.log('touchend:', x, y);

        // 计算滑动距离
        const deltaY = y - self.touchStartY;
        const deltaX = x - self.touchStartX;

        // 如果是滑动操作，传递给当前场景
        if (self.currentScene && Math.abs(deltaY) > 20 && Math.abs(deltaY) > Math.abs(deltaX)) {
          self.currentScene.handleScroll(deltaY);
        }

        self.handleTouch(x, y, 'touchend');
      }
    });

    wx.onTouchMove(function(res) {
      const touches = res.touches || [];
      for (const touch of touches) {
        const x = touch.clientX;
        const y = touch.clientY;
        self.handleTouch(x, y, 'touchmove');
      }
    });
  }

  // 处理触摸
  handleTouch(x, y, type) {
    console.log('handleTouch:', type, x, y, 'scene:', this.state);
    if (this.currentScene) {
      this.currentScene.handleTouch(x, y, type);
    }
  }

  // 切换场景
  changeScene(sceneName) {
    console.log('changeScene:', sceneName);
    // 调用当前场景的exit方法进行清理
    if (this.currentScene && typeof this.currentScene.exit === 'function') {
      this.currentScene.exit();
    }
    this.state = sceneName;
    this.currentScene = this.scenes[sceneName];
    if (this.currentScene) {
      this.currentScene.enter();
    } else {
      console.error('Scene not found:', sceneName);
    }
  }

  // 加载游戏
  loadGame() {
    const savedData = wx.getStorageSync('tennisGameData');
    if (savedData && savedData.player) {
      this.player = Player.fromJSON(savedData.player);
      this.gameData = savedData.gameData;
      // 设置player的gameData引用，用于赞助到期计算
      this.player.gameData = this.gameData;
      // 确保 actionHistory 字段存在（兼容旧存档）
      if (!this.gameData.actionHistory) {
        this.gameData.actionHistory = {};
      }
      // 确保 weeklyActions 字段存在（兼容旧存档）
      if (!this.gameData.weeklyActions) {
        this.gameData.weeklyActions = {
          trainingRestCount: 0,
          matchCount: 0
        };
      }
      this.changeScene(GAME_STATE.HOME);
    } else {
      this.changeScene(GAME_STATE.MENU);
    }
  }

  // 保存游戏
  saveGame() {
    const data = {
      player: this.player ? this.player.toJSON() : null,
      gameData: this.gameData
    };
    wx.setStorageSync('tennisGameData', data);
  }

  // 记录用户操作
  recordAction(actionType, details, result) {
    // 兼容处理：确保 actionHistory 存在
    if (!this.gameData.actionHistory) {
      this.gameData.actionHistory = {};
    }

    // 使用年-月-周作为key
    const key = `${this.gameData.year}-${this.gameData.month}-${this.gameData.week}`;
    if (!this.gameData.actionHistory[key]) {
      this.gameData.actionHistory[key] = [];
    }
    this.gameData.actionHistory[key].push({
      type: actionType,
      details: details,
      result: result,
      timestamp: Date.now()
    });
    this.saveGame();
  }

  // 获取指定周的操作记录
  getActionHistory(year, month, week) {
    const key = `${year}-${month}-${week}`;
    return this.gameData.actionHistory[key] || [];
  }

  // 获取当前周的操作记录
  getCurrentWeekActions() {
    return this.getActionHistory(this.gameData.year, this.gameData.month, this.gameData.week);
  }

  // 检查训练/休息次数限制
  canDoTrainingOrRest() {
    // 兼容处理：确保 weeklyActions 存在
    if (!this.gameData.weeklyActions) {
      this.gameData.weeklyActions = {
        trainingRestCount: 0,
        matchCount: 0
      };
    }
    return this.gameData.weeklyActions.trainingRestCount < this.WEEKLY_LIMITS.MAX_TRAINING_REST;
  }

  // 检查比赛次数限制
  canPlayMatch() {
    // 兼容处理：确保 weeklyActions 存在
    if (!this.gameData.weeklyActions) {
      this.gameData.weeklyActions = {
        trainingRestCount: 0,
        matchCount: 0
      };
    }
    return this.gameData.weeklyActions.matchCount < this.WEEKLY_LIMITS.MAX_MATCH;
  }

  // 增加训练/休息次数
  addTrainingRestAction() {
    // 兼容处理：确保 weeklyActions 存在
    if (!this.gameData.weeklyActions) {
      this.gameData.weeklyActions = {
        trainingRestCount: 0,
        matchCount: 0
      };
    }
    this.gameData.weeklyActions.trainingRestCount++;
    this.saveGame();
  }

  // 增加比赛次数
  addMatchAction() {
    // 兼容处理：确保 weeklyActions 存在
    if (!this.gameData.weeklyActions) {
      this.gameData.weeklyActions = {
        trainingRestCount: 0,
        matchCount: 0
      };
    }
    this.gameData.weeklyActions.matchCount++;
    this.saveGame();
  }

  // 获取剩余次数
  getRemainingActions() {
    const weeklyActions = this.gameData.weeklyActions || { trainingRestCount: 0, matchCount: 0 };
    return {
      trainingRest: this.WEEKLY_LIMITS.MAX_TRAINING_REST - weeklyActions.trainingRestCount,
      match: this.WEEKLY_LIMITS.MAX_MATCH - weeklyActions.matchCount
    };
  }

  // 重置每周操作次数（进入新一周时调用）
  resetWeeklyActions() {
    // 兼容处理：确保 weeklyActions 存在
    if (!this.gameData.weeklyActions) {
      this.gameData.weeklyActions = {
        trainingRestCount: 0,
        matchCount: 0
      };
    }
    this.gameData.weeklyActions.trainingRestCount = 0;
    this.gameData.weeklyActions.matchCount = 0;
    this.saveGame();
  }

  // 重置游戏（用于退役后重新开始）
  resetGame() {
    // 重置 gameData 到初始状态
    this.gameData = {
      month: 1,
      week: 1,
      year: 2024,
      gameActive: true,
      specialEvents: [],
      actionHistory: {},
      ongoingTournament: null,
      weeklyActions: {
        trainingRestCount: 0,
        matchCount: 0
      }
    };
    
    // 重置 player
    this.player = null;
    
    // 清除存储
    wx.removeStorageSync('tennisGameData');
  }

  // 启动游戏循环
  startGameLoop() {
    const loop = (timestamp) => {
      const deltaTime = timestamp - this.lastTime;
      this.lastTime = timestamp;
      this.update(deltaTime);
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  update(deltaTime) {
    if (this.currentScene) {
      this.currentScene.update(deltaTime);
    }
  }

  render() {
    // 清屏
    this.ctx.fillStyle = CONFIG.THEME.BACKGROUND;
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    // 渲染当前场景
    if (this.currentScene) {
      this.currentScene.render(this.ctx);
    }
  }

  showToast(message, duration = 2000) {
    wx.showToast({ title: message, icon: 'none', duration });
  }

  showModal(title, content, showCancel = true, confirmText = '确定', cancelText = '取消') {
    return new Promise((resolve) => {
      wx.showModal({
        title,
        content,
        showCancel,
        confirmText,
        cancelText,
        success: (res) => resolve(res.confirm)
      });
    });
  }
}

// 导入数据模型和场景
const Player = require('./models/player.js');
const Training = require('./models/training.js');
const { Match, MatchLevel } = require('./models/match.js');
const Sponsor = require('./models/sponsor.js');
const { RandomEvents } = require('./models/events.js');

const MenuScene = require('./scenes/menuScene.js');
const CreatePlayerScene = require('./scenes/createPlayerScene.js');
const HomeScene = require('./scenes/homeScene.js');
const TrainingScene = require('./scenes/trainingScene.js');
const SpeedTrainingScene = require('./scenes/speedTrainingScene.js');
const StrengthTrainingScene = require('./scenes/strengthTrainingScene.js');
const TechTrainingScene = require('./scenes/techTrainingScene.js');
const MatchScene = require('./scenes/matchScene.js');
const SponsorScene = require('./scenes/sponsorScene.js');
const EquipmentScene = require('./scenes/equipmentScene.js');
const StatsScene = require('./scenes/statsScene.js');
const RestScene = require('./scenes/restScene.js');
const EventScene = require('./scenes/eventScene.js');
const CoachScene = require('./scenes/coachScene.js');

// 创建并启动游戏实例（关键：确保游戏运行）
const game = new Game();

// 可选：将实例挂载到 wx 对象上供调试或其他模块使用
if (typeof wx !== 'undefined') {
  wx.gameInstance = game;
}
