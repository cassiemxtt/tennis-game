/**
 * 场景基类
 */

// 配置常量 - 不从 game.js 导入，避免循环引用
const CONFIG = {
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

class Scene {
  constructor(game) {
    this.game = game;
    this.buttons = [];
    this.widgets = [];
    this.inputBuffer = '';
    this.keyboard = null;
    this._canvasWidth = 375;
    this._canvasHeight = 667;
  }

  // 获取 Canvas 尺寸（统一方法）
  getCanvasSize() {
    this._canvasWidth = this.game.canvasWidth || 375;
    this._canvasHeight = this.game.canvasHeight || 667;
    return { width: this._canvasWidth, height: this._canvasHeight };
  }

  enter() {}

  exit() {}

  // 处理滚动（子类可重写）
  handleScroll(deltaY) {
    // 默认不处理滚动
  }

  update(deltaTime) {}

  render(ctx) {}

  handleTouch(x, y, type) {
    if (type === 'touchstart') {
      for (const button of this.buttons) {
        if (button.contains(x, y)) {
          button.pressed = true;
          break;
        }
      }
    } else if (type === 'touchend') {
      for (const button of this.buttons) {
        if (button.contains(x, y) && button.pressed) {
          button.pressed = false;
          button.onClick();
          break;
        }
        button.pressed = false;
      }
    }
  }

  // 统一的添加按钮方法
  addButton(x, y, width, height, text, onClick, style = {}) {
    const button = new Button(x, y, width, height, text, onClick, style);
    this.buttons.push(button);
    return button;
  }

  // 统一的添加返回按钮方法
  addBackButton(targetScene, options = {}) {
    const { width, height } = this.getCanvasSize();
    const size = Math.min(width * 0.12, height * 0.1);
    const padding = Math.min(width * 0.03, height * 0.03);

    return this.addButton(
      padding,
      padding,
      size,
      size,
      options.icon || '←',
      () => {
        this.game.changeScene(targetScene);
      },
      {
        bgColor: options.bgColor || 'transparent',
        textColor: options.textColor || CONFIG.THEME.PRIMARY,
        borderColor: options.borderColor || CONFIG.THEME.PRIMARY,
        fontSize: options.fontSize || width * 0.06
      }
    );
  }

  // 统一的绘制页面标题方法
  drawTitle(ctx, title, options = {}) {
    const { width, height } = this.getCanvasSize();
    const fontSize = options.fontSize || width * 0.05;
    const y = options.y || height * 0.1;
    const color = options.color || CONFIG.THEME.PRIMARY;

    ctx.fillStyle = color;
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(title, width / 2, y);
  }

  // 统一的绘制背景方法
  drawBackground(ctx) {
    const { width, height } = this.getCanvasSize();
    ctx.fillStyle = CONFIG.THEME.BACKGROUND;
    ctx.fillRect(0, 0, width, height);
  }

  // 统一的绘制圆角矩形
  drawRoundRect(ctx, x, y, width, height, radius, fillColor, strokeColor) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();

    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }

    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // 统一的绘制进度条
  drawProgressBar(ctx, x, y, width, height, progress, color) {
    // 背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    this.drawRoundRect(ctx, x, y, width, height, height / 2);

    // 进度
    if (progress > 0) {
      const progressWidth = Math.min(width, width * progress / 100);
      ctx.fillStyle = color;
      this.drawRoundRect(ctx, x, y, progressWidth, height, height / 2);
    }
  }

  // 统一的绘制卡片
  drawCard(ctx, x, y, width, height, title) {
    // 卡片背景
    this.drawRoundRect(ctx, x, y, width, height, 20, CONFIG.THEME.CARD_BG, 'rgba(100, 255, 218, 0.15)');

    // 标题
    if (title) {
      const { width: cw } = this.getCanvasSize();
      ctx.fillStyle = CONFIG.THEME.PRIMARY;
      ctx.font = `bold ${cw * 0.038}px sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(title, x + width * 0.04, y + height * 0.25);
    }
  }

  // 统一的绘制按钮
  renderButtons(ctx) {
    for (const button of this.buttons) {
      button.render(ctx);
    }
  }
}

// 按钮类
class Button {
  constructor(x, y, width, height, text, onClick, style = {}) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.text = text;
    this.onClick = onClick;
    this.style = {
      bgColor: style.bgColor || CONFIG.THEME.PRIMARY,
      textColor: style.textColor || '#0a192f',
      borderColor: style.borderColor || CONFIG.THEME.PRIMARY,
      borderRadius: style.borderRadius || 20,
      fontSize: style.fontSize || 30,
      fontWeight: style.fontWeight || 'bold'
    };
    this.pressed = false;
  }

  contains(x, y) {
    return x >= this.x && x <= this.x + this.width &&
           y >= this.y && y <= this.y + this.height;
  }

  render(ctx) {
    const bgColor = this.pressed ? this.style.bgColor + '80' : this.style.bgColor;

    // 绘制圆角矩形
    this.roundRect(ctx, this.x, this.y, this.width, this.height, this.style.borderRadius);

    ctx.fillStyle = bgColor;
    ctx.fill();

    ctx.strokeStyle = this.style.borderColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 绘制文字
    ctx.fillStyle = this.style.textColor;
    ctx.font = `${this.style.fontWeight} ${this.style.fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.text, this.x + this.width / 2, this.y + this.height / 2);
  }

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

module.exports = { Scene, Button, CONFIG, GAME_STATE };
