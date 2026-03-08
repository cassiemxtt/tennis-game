/**
 * 创建角色场景
 * 流程：输入名字 → 选择性别 → 选择天赋
 */
const { Scene, GAME_STATE, CONFIG } = require('./scene.js');
const Player = require('../models/player.js');
const { generateTalents, generateGrowthDescription, getTalentDisplayText, getAllSkillsDisplayText, applyTalentToPlayer } = require('../models/talent.js');

class CreatePlayerScene extends Scene {
  constructor(game) {
    super(game);
    this.playerName = '';
    this.selectedGender = 'male';
    this.currentStep = 1; // 1: 输入名字, 2: 选择性别, 3: 选择天赋
    
    // 天赋相关
    this.talents = [];
    this.selectedTalentIndex = -1;
    this.refreshCount = 0;
    this.maxRefreshCount = 3;
    
    this.initUI();
  }

  initUI() {
    this.buildNameStepUI();
  }

  // 第一步：输入名字
  buildNameStepUI() {
    this.clearButtons();
    const { width, height } = this.getCanvasSize();
    const centerX = width / 2;

    // 返回按钮
    this.addBackButton(GAME_STATE.MENU);

    // 输入框区域
    this.addButton(centerX - width * 0.35, height * 0.35, width * 0.7, height * 0.1, '点击输入名字', () => {
      this.showKeyboard();
    }, {
      bgColor: 'rgba(255, 255, 255, 0.05)',
      textColor: '#8892b0',
      borderColor: 'rgba(100, 255, 218, 0.2)',
      fontSize: width * 0.04
    });

    // 下一步按钮
    this.addButton(centerX - width * 0.25, height * 0.55, width * 0.5, height * 0.1, '下一步', () => {
      if (this.playerName.trim()) {
        this.currentStep = 2;
        this.buildGenderStepUI();
      } else {
        this.game.showToast('请输入名字！');
      }
    }, {
      bgColor: CONFIG.THEME.PRIMARY,
      textColor: '#0a192f',
      fontSize: width * 0.04
    });
  }

  // 第二步：选择性别
  buildGenderStepUI() {
    this.clearButtons();
    const { width, height } = this.getCanvasSize();
    const centerX = width / 2;

    // 返回按钮（回到上一步）
    this.addButton(width * 0.05, height * 0.05, width * 0.15, height * 0.05, '← 上一步', () => {
      this.currentStep = 1;
      this.buildNameStepUI();
    }, {
      bgColor: 'transparent',
      textColor: '#64ffda',
      borderColor: 'transparent',
      fontSize: width * 0.03
    });

    // 男性按钮
    this.addButton(centerX - width * 0.25, height * 0.4, width * 0.22, height * 0.1, '👨 男', () => {
      this.selectedGender = 'male';
      this.setupGenderButtons();
    }, {
      bgColor: 'rgba(255, 255, 255, 0.05)',
      textColor: '#64ffda',
      borderColor: '#64ffda',
      fontSize: width * 0.04
    });

    // 女性按钮
    this.addButton(centerX + width * 0.03, height * 0.4, width * 0.22, height * 0.1, '👩 女', () => {
      this.selectedGender = 'female';
      this.setupGenderButtons();
    }, {
      bgColor: 'rgba(255, 255, 255, 0.05)',
      textColor: '#8892b0',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      fontSize: width * 0.04
    });

    // 确认性别，进入下一步
    this.addButton(centerX - width * 0.25, height * 0.6, width * 0.5, height * 0.1, '确认并选择天赋', () => {
      this.currentStep = 3;
      this.generateNewTalents();
      this.buildTalentStepUI();
    }, {
      bgColor: CONFIG.THEME.PRIMARY,
      textColor: '#0a192f',
      fontSize: width * 0.04
    });
  }

  // 第三步：选择天赋
  buildTalentStepUI() {
    this.clearButtons();
    const { width, height } = this.getCanvasSize();
    const centerX = width / 2;

    // 返回按钮（回到上一步）
    this.addButton(width * 0.05, height * 0.05, width * 0.2, height * 0.05, '← 上一步', () => {
      this.currentStep = 2;
      this.buildGenderStepUI();
    }, {
      bgColor: 'transparent',
      textColor: '#64ffda',
      borderColor: 'transparent',
      fontSize: width * 0.03
    });

    // 刷新天赋按钮
    const refreshText = this.refreshCount >= this.maxRefreshCount 
      ? '刷新次数已用完' 
      : `🔄 刷新天赋 (${this.maxRefreshCount - this.refreshCount}次)`;
    
    this.addButton(width * 0.55, height * 0.05, width * 0.4, height * 0.05, refreshText, () => {
      if (this.refreshCount < this.maxRefreshCount) {
        this.refreshCount++;
        this.selectedTalentIndex = -1;
        this.generateNewTalents();
        this.buildTalentStepUI();
      }
    }, {
      bgColor: 'transparent',
      textColor: this.refreshCount >= this.maxRefreshCount ? '#666' : '#64ffda',
      borderColor: 'transparent',
      fontSize: width * 0.025
    });

    // 显示3个天赋选项
    const cardWidth = width * 0.28;
    const cardHeight = height * 0.45;
    const cardSpacing = width * 0.03;
    const startX = centerX - (cardWidth * 3 + cardSpacing * 2) / 2;
    const cardY = height * 0.2;

    for (let i = 0; i < this.talents.length; i++) {
      const talent = this.talents[i];
      const cardX = startX + i * (cardWidth + cardSpacing);
      
      const isSelected = this.selectedTalentIndex === i;
      
      // 天赋卡片按钮
      this.addButton(cardX, cardY, cardWidth, cardHeight, '', () => {
        this.selectedTalentIndex = i;
        this.buildTalentStepUI();
      }, {
        bgColor: isSelected ? 'rgba(100, 255, 218, 0.3)' : 'rgba(255, 255, 255, 0.1)',
        textColor: '#ffffff',
        borderColor: isSelected ? '#64ffda' : 'rgba(100, 255, 218, 0.3)',
        fontSize: width * 0.03
      });
    }

    // 确认选择按钮
    const canConfirm = this.selectedTalentIndex >= 0;
    this.addButton(centerX - width * 0.25, height * 0.75, width * 0.5, height * 0.1, 
      canConfirm ? '确认选择此天赋' : '请选择一个天赋', () => {
      if (this.selectedTalentIndex >= 0) {
        this.confirmCreate();
      }
    }, {
      bgColor: canConfirm ? CONFIG.THEME.PRIMARY : 'rgba(100, 100, 100, 0.5)',
      textColor: canConfirm ? '#0a192f' : '#888',
      fontSize: width * 0.04
    });
  }

  generateNewTalents() {
    this.talents = generateTalents(3);
    this.selectedTalentIndex = -1;
  }

  // 设置性别按钮样式
  setupGenderButtons() {
    const maleBtn = this.buttons[1];
    const femaleBtn = this.buttons[2];

    if (this.selectedGender === 'male') {
      maleBtn.style.bgColor = 'rgba(100, 255, 218, 0.2)';
      maleBtn.style.textColor = '#64ffda';
      maleBtn.style.borderColor = '#64ffda';
      femaleBtn.style.bgColor = 'rgba(255, 255, 255, 0.05)';
      femaleBtn.style.textColor = '#8892b0';
      femaleBtn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
    } else {
      maleBtn.style.bgColor = 'rgba(255, 255, 255, 0.05)';
      maleBtn.style.textColor = '#8892b0';
      maleBtn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      femaleBtn.style.bgColor = 'rgba(255, 182, 193, 0.2)';
      femaleBtn.style.textColor = '#ffb6c1';
      femaleBtn.style.borderColor = '#ffb6c1';
    }
  }

  showKeyboard() {
    wx.showModal({
      title: '输入球员姓名',
      editable: true,
      placeholderText: '请输入姓名',
      success: (res) => {
        if (res.confirm && res.content) {
          const name = res.content.trim();
          if (name) {
            this.playerName = name;
            this.buttons[1].text = name;
            this.buttons[1].textColor = CONFIG.THEME.TEXT_MAIN;
          }
        }
      }
    });
  }

  confirmCreate() {
    const name = this.playerName.trim() || '网球新星';
    this.game.player = new Player(name, this.selectedGender);
    
    // 应用天赋
    const selectedTalent = this.talents[this.selectedTalentIndex];
    applyTalentToPlayer(this.game.player, selectedTalent);
    
    // 初始化所有技能（即使是0的也要设置）
    this.game.player.updateSkillBonuses();
    
    this.game.gameData = {
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
    this.game.saveGame();
    this.game.changeScene(GAME_STATE.HOME);
  }

  render(ctx) {
    const { width, height } = this.getCanvasSize();
    const centerX = width / 2;

    // 背景
    this.drawBackground(ctx);

    // 步骤指示器
    this.drawStepIndicator(ctx);

    // 根据步骤渲染不同内容
    if (this.currentStep === 1) {
      this.renderNameStep(ctx);
    } else if (this.currentStep === 2) {
      this.renderGenderStep(ctx);
    } else if (this.currentStep === 3) {
      this.renderTalentStep(ctx);
    }

    // 绘制按钮
    this.renderButtons(ctx);
  }

  drawStepIndicator(ctx) {
    const { width, height } = this.getCanvasSize();
    const centerX = width / 2;
    const stepY = height * 0.12;
    const stepWidth = width * 0.15;
    const stepSpacing = width * 0.05;
    
    const steps = ['名字', '性别', '天赋'];
    
    for (let i = 0; i < 3; i++) {
      const x = centerX - (stepWidth * 3 + stepSpacing * 2) / 2 + i * (stepWidth + stepSpacing);
      const isActive = i + 1 <= this.currentStep;
      const isCurrent = i + 1 === this.currentStep;
      
      // 背景
      ctx.fillStyle = isActive ? 'rgba(100, 255, 218, 0.3)' : 'rgba(255, 255, 255, 0.1)';
      ctx.strokeStyle = isActive ? '#64ffda' : 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      
      // 圆角矩形
      const radius = 8;
      ctx.beginPath();
      this.drawRoundRect(ctx, x, stepY - height * 0.025, stepWidth, height * 0.05, radius);
      ctx.fill();
      ctx.stroke();
      
      // 文字
      ctx.fillStyle = isCurrent ? '#64ffda' : '#8892b0';
      ctx.font = `${width * 0.025}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`${i + 1}. ${steps[i]}`, x + stepWidth / 2, stepY + height * 0.008);
    }
  }

  renderNameStep(ctx) {
    const { width, height } = this.getCanvasSize();
    const centerX = width / 2;

    // 标题
    this.drawTitle(ctx, '创建你的球员');
    
    // 副标题
    ctx.fillStyle = '#8892b0';
    ctx.font = `${width * 0.035}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('第1步：输入你的名字', centerX, height * 0.25);
  }

  renderGenderStep(ctx) {
    const { width, height } = this.getCanvasSize();
    const centerX = width / 2;

    // 标题
    this.drawTitle(ctx, '选择性别');
    
    // 副标题
    ctx.fillStyle = '#8892b0';
    ctx.font = `${width * 0.035}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('第2步：选择你的性别', centerX, height * 0.32);
    
    // 性别描述
    ctx.font = `${width * 0.028}px sans-serif`;
    ctx.fillText('性别会影响你的角色外观', centerX, height * 0.35);
  }

  renderTalentStep(ctx) {
    const { width, height } = this.getCanvasSize();
    const centerX = width / 2;

    // 标题
    this.drawTitle(ctx, '选择天赋');
    
    // 副标题
    ctx.fillStyle = '#8892b0';
    ctx.font = `${width * 0.03}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('第3步：选择你的天赋（3选1）', centerX, height * 0.16);
    
    // 提示
    ctx.font = `${width * 0.022}px sans-serif`;
    ctx.fillStyle = '#666';
    ctx.fillText('点击卡片查看详情，长大后会影响训练效果', centerX, height * 0.165);

    // 绘制天赋卡片内容
    const cardWidth = width * 0.28;
    const cardHeight = height * 0.45;
    const cardSpacing = width * 0.03;
    const startX = centerX - (cardWidth * 3 + cardSpacing * 2) / 2;
    const cardY = height * 0.2;

    for (let i = 0; i < this.talents.length; i++) {
      const talent = this.talents[i];
      const cardX = startX + i * (cardWidth + cardSpacing);
      const isSelected = this.selectedTalentIndex === i;
      
      this.drawTalentCard(ctx, cardX, cardY, cardWidth, cardHeight, talent, isSelected);
    }
  }

  drawTalentCard(ctx, x, y, width, height, talent, isSelected) {
    const { width: canvasWidth } = this.getCanvasSize();
    
    // 卡片背景
    ctx.fillStyle = isSelected ? 'rgba(100, 255, 218, 0.2)' : 'rgba(26, 26, 46, 0.8)';
    ctx.strokeStyle = isSelected ? '#64ffda' : 'rgba(100, 255, 218, 0.3)';
    ctx.lineWidth = isSelected ? 2 : 1;
    
    // 圆角矩形
    const radius = 10;
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
    ctx.fill();
    ctx.stroke();

    // 卡片标题
    ctx.fillStyle = '#64ffda';
    ctx.font = `bold ${canvasWidth * 0.035}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`天赋 ${talent.skills.baseline ? 'A' : 'B'}`, x + width / 2, y + canvasWidth * 0.05);

    // 显示初始能力
    const displayText = getAllSkillsDisplayText(talent);
    const lines = displayText.split('\n');
    
    ctx.font = `${canvasWidth * 0.028}px sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    
    let textY = y + canvasWidth * 0.12;
    for (const line of lines) {
      ctx.fillText(line, x + canvasWidth * 0.02, textY);
      textY += canvasWidth * 0.04;
    }

    // 成长性描述
    const growthDesc = generateGrowthDescription(talent);
    ctx.fillStyle = '#8892b0';
    ctx.font = `${canvasWidth * 0.022}px sans-serif`;
    ctx.textAlign = 'left';
    
    // 简单的文本换行
    const maxWidth = width - canvasWidth * 0.04;
    const words = growthDesc.split('');
    let line = '';
    let lineY = textY + canvasWidth * 0.02;
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line, x + canvasWidth * 0.02, lineY);
        line = words[i];
        lineY += canvasWidth * 0.035;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x + canvasWidth * 0.02, lineY);
  }
}

module.exports = CreatePlayerScene;
