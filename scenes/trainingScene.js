/**
 * 训练场景
 * 新版：5类训练 + 训练点数 + 小游戏 + 带练教练
 */
const { Scene, GAME_STATE, CONFIG } = require('./scene.js');
const Training = require('../models/training.js');
const { COACH_TYPES, COACH_LEVELS } = require('../models/coach.js');

// 训练类型顺序
const TRAINING_ORDER = ['strength', 'technique', 'fitness', 'speed', 'recovery'];

class TrainingScene extends Scene {
  constructor(game) {
    super(game);
    this.trainingTypes = [];
    
    // 滚动相关
    this.scrollOffset = 0;
    this.maxScroll = 0;
    
    // 触摸相关 - 用于区分滑动和点击
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchStartTime = 0;
    this.isScrolling = false;
    
    // 带练教练选择相关
    this.showCoachSelector = false;
    
    this.initUI();
  }

  initUI() {
    this.buttons = [];
    this.addBackButton(GAME_STATE.HOME);

    this.trainingTypes = [];
    for (const id of TRAINING_ORDER) {
      const training = Training.TRAINING_TYPES[id];
      if (training) {
        // 构建效果描述
        const positiveEffects = [];
        const negativeEffects = [];
        
        if (!training.isRecovery) {
          for (const [skill, range] of Object.entries(training.positive)) {
            positiveEffects.push(`${skill}+${range[0]}-${range[1]}`);
          }
          for (const [skill, range] of Object.entries(training.negative)) {
            negativeEffects.push(`${skill}-${range[0]}-${range[1]}`);
          }
        }
        
        this.trainingTypes.push({
          id: id,
          name: training.name,
          description: training.description,
          cost: training.cost,
          energy: training.energy,
          fatigue: training.fatigue,
          icon: training.icon,
          positiveEffects: positiveEffects,
          negativeEffects: negativeEffects,
          isRecovery: training.isRecovery || false,
          hasMiniGame: ['strength', 'speed', 'technique'].includes(id)  // 这三种训练有小游戏
        });
      }
    }
  }

  enter() {
    // 每次进入时检查训练点数
    const player = this.game.player;
    if (player && player.trainingPoints <= 0) {
      this.game.showToast('本周训练点数已用完！');
    }
    this.initUI();
    // 重置滚动位置
    this.scrollOffset = 0;
    this.calculateMaxScroll();
    // 重置教练选择器
    this.showCoachSelector = false;
  }

  // 计算最大滚动距离
  calculateMaxScroll() {
    const { width, height } = this.getCanvasSize();
    const cardHeight = height * 0.17;
    const cardSpacing = height * 0.015;
    const startY = height * 0.21;  // 与渲染位置保持一致
    const totalHeight = this.trainingTypes.length * (cardHeight + cardSpacing);
    const panelHeight = height * 0.75;
    this.maxScroll = Math.max(0, totalHeight - panelHeight + startY);
  }

  // 处理滚动
  handleScroll(deltaY) {
    this.scrollOffset -= deltaY;
    if (this.scrollOffset < 0) this.scrollOffset = 0;
    if (this.scrollOffset > this.maxScroll) this.scrollOffset = this.maxScroll;
  }

  // 获取已雇佣的教练列表
  getMyCoaches() {
    const player = this.game.player;
    if (!player || !player.coaches) return [];
    return player.coaches;
  }

  // 获取带练教练信息
  getTrainingCoach() {
    const player = this.game.player;
    if (!player || !player.trainingCoach) return null;
    return player.coaches.find(c => c.type === player.trainingCoach);
  }

  // 选择带练教练
  selectTrainingCoach(coachType) {
    const player = this.game.player;
    if (!player) return;
    
    if (player.trainingCoach === coachType) {
      // 取消选择
      player.trainingCoach = null;
      this.game.showToast('已取消带练教练');
    } else {
      player.trainingCoach = coachType;
      const coach = player.coaches.find(c => c.type === coachType);
      if (coach) {
        this.game.showToast(`已选择${coach.name}作为带练教练`);
      }
    }
    this.showCoachSelector = false;
    this.game.saveGame();
  }

  // 渲染
  render(ctx) {
    const player = this.game.player;
    if (!player) return;

    const { width, height } = this.getCanvasSize();
    const cardHeight = height * 0.17;
    const cardSpacing = height * 0.015;
    const startY = height * 0.21;  // 下移训练卡片，避免与带练教练选择区域重叠
    const cardWidth = width * 0.9;
    const cardX = width * 0.05;

    // 背景
    this.drawBackground(ctx);

    // 标题
    this.drawTitle(ctx, '🏋️ 训练中心');

    // 资源状态
    ctx.fillStyle = CONFIG.THEME.TEXT_SECONDARY;
    ctx.font = `${width * 0.035}px sans-serif`;
    ctx.textAlign = 'center';
    
    // 显示训练点数
    const tpColor = player.trainingPoints > 0 ? CONFIG.THEME.GREEN : CONFIG.THEME.RED;
    ctx.fillStyle = tpColor;
    ctx.fillText(`💰 $${player.money}  ⚡ ${player.energy}/100  🎯 ${player.trainingPoints}/5点`, width / 2, height * 0.13);

    // 渲染带练教练选择区域
    this.renderCoachSelector(ctx, player);

    // 如果显示教练选择器，绘制选择器界面
    if (this.showCoachSelector) {
      this.renderCoachList(ctx, player);
      // 渲染按钮
      this.renderButtons(ctx);
      return;
    }

    // 应用滚动偏移
    ctx.save();
    ctx.translate(0, -this.scrollOffset);

    // 渲染训练卡片
    for (let i = 0; i < this.trainingTypes.length; i++) {
      const y = startY + i * (cardHeight + cardSpacing);
      this.drawTrainingCard(ctx, this.trainingTypes[i], cardX, y, cardWidth, cardHeight, player);
    }

    ctx.restore();

    // 绘制滚动指示器
    if (this.maxScroll > 0) {
      const scrollBarHeight = Math.min(height * 0.1, height * 0.15);
      const scrollRatio = Math.min(1, Math.max(0, this.scrollOffset / this.maxScroll));
      const scrollBarY = startY + scrollRatio * (height * 0.7 - scrollBarHeight);
      
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(cardX + cardWidth + 5, scrollBarY, 3, scrollBarHeight);
    }

    // 渲染按钮
    this.renderButtons(ctx);
  }

  // 渲染带练教练选择区域
  renderCoachSelector(ctx, player) {
    const { width, height } = this.getCanvasSize();
    const selectorY = height * 0.145;
    const selectorHeight = height * 0.045;
    const selectorX = width * 0.05;
    const selectorWidth = width * 0.9;

    // 绘制选择器背景
    ctx.fillStyle = '#1a1a2e';
    this.drawRoundRect(ctx, selectorX, selectorY, selectorWidth, selectorHeight, 10, '#1a1a2e', 'rgba(100, 255, 218, 0.3)');

    // 绘制标题
    ctx.fillStyle = '#64ffda';
    ctx.font = `${width * 0.032}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('👨‍🏫 带练教练:', selectorX + width * 0.02, selectorY + selectorHeight * 0.65);

    // 显示当前选择的教练
    const currentCoach = this.getTrainingCoach();
    if (currentCoach) {
      const typeInfo = COACH_TYPES[currentCoach.type] || { name: currentCoach.type };
      ctx.fillStyle = '#ffd700';
      ctx.font = `${width * 0.032}px sans-serif`;
      ctx.fillText(`${currentCoach.name}[${typeInfo.name}]`, selectorX + width * 0.22, selectorY + selectorHeight * 0.65);
    } else {
      ctx.fillStyle = '#8892b0';
      ctx.font = `${width * 0.03}px sans-serif`;
      ctx.fillText('点击选择', selectorX + width * 0.22, selectorY + selectorHeight * 0.65);
    }

    // 教练加成提示
    if (currentCoach) {
      ctx.fillStyle = '#48bb78';
      ctx.font = `${width * 0.025}px sans-serif`;
      ctx.textAlign = 'right';
      // 计算训练加成
      const bonus = this.getTrainingCoachBonus(currentCoach);
      let bonusText = '';
      if (bonus.trainingEffect > 0) bonusText += `训练+${Math.round(bonus.trainingEffect * 100)}%`;
      if (bonus.energyRecovery > 0) bonusText += ` 恢复+${Math.round(bonus.energyRecovery * 100)}%`;
      if (bonus.serveEffect > 0) bonusText += ` 发球+${Math.round(bonus.serveEffect * 100)}%`;
      if (bonus.volleyEffect > 0) bonusText += ` 网前+${Math.round(bonus.volleyEffect * 100)}%`;
      if (bonus.baselineEffect > 0) bonusText += ` 底线+${Math.round(bonus.baselineEffect * 100)}%`;
      if (bonus.sliceEffect > 0) bonusText += ` 切削+${Math.round(bonus.sliceEffect * 100)}%`;
      if (bonusText) {
        ctx.fillText(bonusText, selectorX + selectorWidth - width * 0.02, selectorY + selectorHeight * 0.65);
      }
    }
  }

  // 获取带练教练的加成
  getTrainingCoachBonus(coachData) {
    const { Coach } = require('../models/coach.js');
    const coach = new Coach(coachData);
    return coach.getEffectValue();
  }

  // 渲染教练选择列表
  renderCoachList(ctx, player) {
    const { width, height } = this.getCanvasSize();
    const coaches = this.getMyCoaches();
    
    if (coaches.length === 0) {
      ctx.fillStyle = '#8892b0';
      ctx.font = `${width * 0.04}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('暂无雇佣的教练', width / 2, height * 0.4);
      ctx.fillText('请先去雇佣教练', width / 2, height * 0.48);
      return;
    }

    // 背景遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, width, height);

    // 标题栏
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, height * 0.1, width, height * 0.08);
    ctx.fillStyle = '#64ffda';
    ctx.font = `bold ${width * 0.045}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('选择带练教练', width / 2, height * 0.155);

    // 关闭按钮
    ctx.fillStyle = '#fc8181';
    ctx.font = `${width * 0.045}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('✕', width * 0.9, height * 0.155);

    // 教练列表
    const startY = height * 0.22;
    const cardHeight = height * 0.12;
    const cardSpacing = height * 0.015;
    const cardWidth = width * 0.9;
    const cardX = width * 0.05;

    for (let i = 0; i < coaches.length; i++) {
      const coach = coaches[i];
      const y = startY + i * (cardHeight + cardSpacing);
      const isSelected = player.trainingCoach === coach.type;
      
      // 卡片背景
      const bgColor = isSelected ? 'rgba(100, 255, 218, 0.2)' : '#1a1a2e';
      const borderColor = isSelected ? '#64ffda' : 'rgba(100, 255, 218, 0.15)';
      this.drawRoundRect(ctx, cardX, y, cardWidth, cardHeight, 12, bgColor, borderColor);

      // 教练名称
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${width * 0.038}px sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(coach.name, cardX + width * 0.03, y + cardHeight * 0.3);

      // 等级
      const levelColors = { 1: '#718096', 2: '#48bb78', 3: '#4299e1', 4: '#9f7aea', 5: '#ed8936' };
      ctx.fillStyle = levelColors[coach.level] || '#718096';
      ctx.font = `${width * 0.028}px sans-serif`;
      const levelName = COACH_LEVELS[coach.level] ? COACH_LEVELS[coach.level].name : '初级';
      ctx.fillText(`[${levelName}]`, cardX + width * 0.22, y + cardHeight * 0.3);

      // 类型
      const typeInfo = COACH_TYPES[coach.type] || { name: coach.type };
      const typeColors = { 'technique': '#4299e1', 'fitness': '#48bb78', 'mental': '#a855f7', 'serve': '#ed8936', 'volley': '#f56565', 'baseline': '#38b2ac', 'slice': '#ed64a6', 'physio': '#38b2ac', 'agent': '#ecc94b' };
      ctx.fillStyle = typeColors[coach.type] || '#8892b0';
      ctx.font = `${width * 0.03}px sans-serif`;
      ctx.fillText(typeInfo.name, cardX + width * 0.03, y + cardHeight * 0.55);

      // 效果
      const bonus = this.getTrainingCoachBonus(coach);
      ctx.fillStyle = '#68d391';
      ctx.font = `${width * 0.028}px sans-serif`;
      let effectText = '';
      if (bonus.trainingEffect > 0) effectText += `训练+${Math.round(bonus.trainingEffect * 100)}% `;
      if (bonus.energyRecovery > 0) effectText += `恢复+${Math.round(bonus.energyRecovery * 100)}% `;
      if (bonus.serveEffect > 0) effectText += `发球+${Math.round(bonus.serveEffect * 100)}% `;
      if (bonus.volleyEffect > 0) effectText += `网前+${Math.round(bonus.volleyEffect * 100)}% `;
      if (bonus.baselineEffect > 0) effectText += `底线+${Math.round(bonus.baselineEffect * 100)}% `;
      if (bonus.sliceEffect > 0) effectText += `切削+${Math.round(bonus.sliceEffect * 100)}%`;
      ctx.fillText(effectText, cardX + width * 0.03, y + cardHeight * 0.8);

      // 选中标记
      if (isSelected) {
        ctx.fillStyle = '#64ffda';
        ctx.font = `${width * 0.035}px sans-serif`;
        ctx.textAlign = 'right';
        ctx.fillText('✓ 已选择', cardX + cardWidth - width * 0.03, y + cardHeight * 0.55);
      }
    }
  }

  // 绘制卡片
  drawTrainingCard(ctx, training, x, y, width, height, player) {
    const isRecovery = training.isRecovery;
    // 只有训练点数为0时才置灰
    const noTrainingPoints = player.trainingPoints <= 0;
    const canTrain = !noTrainingPoints;
    
    // 统一使用休息卡片的样式（深色背景+青色边框）
    const bgColor = canTrain ? CONFIG.THEME.CARD_BG : '#1a202c';
    const borderColor = canTrain ? 'rgba(100, 255, 218, 0.3)' : 'rgba(100, 100, 100, 0.2)';
    
    this.drawRoundRect(ctx, x, y, width, height, 15, bgColor, borderColor);

    // 图标
    ctx.font = `${width * 0.1}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(training.icon, x + width * 0.1, y + height * 0.4);

    // 训练名称
    ctx.fillStyle = canTrain ? CONFIG.THEME.TEXT_MAIN : 'rgba(255,255,255,0.5)';
    ctx.font = `bold ${width * 0.038}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(training.name, x + width * 0.18, y + height * 0.28);

    // 描述
    ctx.fillStyle = canTrain ? CONFIG.THEME.TEXT_SECONDARY : 'rgba(255,255,255,0.3)';
    ctx.font = `${width * 0.03}px sans-serif`;
    ctx.fillText(training.description, x + width * 0.18, y + height * 0.45);

    // 消耗显示
    ctx.font = `${width * 0.032}px sans-serif`;
    
    if (isRecovery) {
      // 康复/休息显示恢复效果
      ctx.fillStyle = canTrain ? CONFIG.THEME.GREEN : 'rgba(72, 187, 120, 0.5)';
      ctx.fillText(`💰 $${training.cost}  恢复: 精力+30 疲劳-20`, x + width * 0.18, y + height * 0.75);
    } else {
      // 训练消耗
      ctx.fillStyle = canTrain ? CONFIG.THEME.GOLD : 'rgba(255, 215, 0, 0.5)';
      ctx.fillText(`💰 $${training.cost}`, x + width * 0.18, y + height * 0.65);
      
      ctx.fillStyle = canTrain ? CONFIG.THEME.PRIMARY : 'rgba(100, 255, 218, 0.5)';
      ctx.fillText(`⚡ -${training.energy}`, x + width * 0.38, y + height * 0.65);
      
      ctx.fillStyle = canTrain ? CONFIG.THEME.ORANGE : 'rgba(246, 173, 85, 0.5)';
      ctx.fillText(`😴 +${training.fatigue}`, x + width * 0.55, y + height * 0.65);
    }
    
    // 瓶颈期警告
    if (!isRecovery && player.inPlateau && canTrain) {
      const affectedSkills = [];
      for (const [skill, inPlateau] of Object.entries(player.inPlateau)) {
        if (inPlateau) affectedSkills.push(skill);
      }
      if (affectedSkills.length > 0) {
        ctx.fillStyle = CONFIG.THEME.ORANGE;
        ctx.font = `${width * 0.025}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText('⚠️ 部分技能进入瓶颈期', x + width * 0.18, y + height * 0.95);
      }
    }
  }

  // 触摸处理 - 与其他场景保持一致
  handleTouch(x, y, type) {
    if (type === 'touchstart') {
      // 记录触摸起始位置和时间
      this.touchStartX = x;
      this.touchStartY = y;
      this.touchStartTime = Date.now();
      this.isScrolling = false;
    } else if (type === 'touchmove') {
      // 计算移动距离
      const dx = x - this.touchStartX;
      const dy = y - this.touchStartY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 如果移动超过阈值，认为是滑动
      if (distance > 10) {
        this.isScrolling = true;
        // 触发了滑动，处理滚动
        const deltaY = y - this.touchStartY;
        this.handleScroll(deltaY);
        this.touchStartY = y; // 更新起始位置以实现连续滚动
      }
    } else if (type === 'touchend') {
      // 检查是否是点击（没有滑动且触摸时间短）
      const touchDuration = Date.now() - this.touchStartTime;
      if (!this.isScrolling && touchDuration < 300) {
        this.handleTap(x, y);
      }
    }
    // 处理返回按钮
    super.handleTouch(x, y, type);
  }

  // 处理点击
  handleTap(x, y) {
    const { width, height } = this.getCanvasSize();
    
    // 如果显示教练选择器
    if (this.showCoachSelector) {
      // 检查关闭按钮
      if (x >= width * 0.85 && x <= width * 0.95 && y >= height * 0.1 && y <= height * 0.18) {
        this.showCoachSelector = false;
        return;
      }
      
      // 检查教练卡片点击
      const player = this.game.player;
      const coaches = this.getMyCoaches();
      const startY = height * 0.22;
      const cardHeight = height * 0.12;
      const cardSpacing = height * 0.015;
      const cardWidth = width * 0.9;
      const cardX = width * 0.05;

      for (let i = 0; i < coaches.length; i++) {
        const cardY = startY + i * (cardHeight + cardSpacing);
        if (x >= cardX && x <= cardX + cardWidth && y >= cardY && y <= cardY + cardHeight) {
          this.selectTrainingCoach(coaches[i].type);
          return;
        }
      }
      return;
    }

    // 检查是否点击了带练教练选择区域
    const selectorY = height * 0.145;
    const selectorHeight = height * 0.045;
    const selectorX = width * 0.05;
    const selectorWidth = width * 0.9;
    
    if (x >= selectorX && x <= selectorX + selectorWidth && y >= selectorY && y <= selectorY + selectorHeight) {
      const coaches = this.getMyCoaches();
      if (coaches.length === 0) {
        this.game.showToast('请先去雇佣教练');
      } else {
        this.showCoachSelector = true;
      }
      return;
    }

    // 处理训练卡片点击
    const cardHeight = height * 0.17;
    const cardSpacing = height * 0.015;
    const startY = height * 0.21;  // 与渲染位置保持一致
    const cardWidth = width * 0.9;
    const cardX = width * 0.05;

    // 调整y坐标以考虑滚动偏移
    const adjustedY = y + this.scrollOffset;

    // 检查点击范围
    if (x < cardX || x > cardX + cardWidth) return;

    for (let i = 0; i < this.trainingTypes.length; i++) {
      const cardY = startY + i * (cardHeight + cardSpacing);
      const training = this.trainingTypes[i];
      
      if (adjustedY >= cardY && adjustedY <= cardY + cardHeight) {
        // 如果有小游戏，点击卡片直接开始小游戏
        if (training.hasMiniGame) {
          this.startMiniGame(training.id);
        } else {
          // 否则执行普通训练
          this.doTraining(training);
        }
        break;
      }
    }
  }

  // 开始小游戏
  startMiniGame(trainingId) {
    const player = this.game.player;
    
    // 检查训练点数
    if (player.trainingPoints <= 0) {
      this.game.showToast('训练点数不足！');
      return;
    }

    // 根据训练类型跳转到对应的小游戏
    let sceneName;
    switch (trainingId) {
      case 'strength':
        sceneName = GAME_STATE.STRENGTH_TRAINING;
        break;
      case 'speed':
        sceneName = GAME_STATE.SPEED_TRAINING;
        break;
      case 'technique':
        sceneName = GAME_STATE.TECH_TRAINING;
        break;
      default:
        this.game.showToast('该训练暂无小游戏');
        return;
    }

    // 扣除训练点数
    player.useTrainingPoints(1);
    this.game.addTrainingRestAction();
    this.game.saveGame();

    // 跳转到小游戏场景
    this.game.changeScene(sceneName);
  }

  doTraining(training) {
    const player = this.game.player;

    // 检查训练点数
    if (player.trainingPoints <= 0) {
      this.game.showToast('训练点数不足！');
      return;
    }

    // 执行训练
    const result = Training.train(player, training.id);

    if (result.success) {
      // 记录操作
      this.game.addTrainingRestAction();
      this.game.saveGame();
      
      let message = '';
      if (training.isRecovery) {
        message = result.message;
      } else {
        message = `${training.name}完成！\n`;
        
        // 显示带练教练加成效果
        const currentCoach = this.getTrainingCoach();
        if (currentCoach) {
          const bonus = this.getTrainingCoachBonus(currentCoach);
          if (bonus.trainingEffect > 0) {
            message += `\n👨‍🏫 ${currentCoach.name}指导: 训练效果+${Math.round(bonus.trainingEffect * 100)}%\n`;
          }
        }
        
        for (const [skill, value] of Object.entries(result.results.positive || {})) {
          if (value > 0) message += `${Training.getAttrName(skill)} +${value} `;
        }
        for (const [skill, value] of Object.entries(result.results.negative || {})) {
          if (value < 0) message += `${Training.getAttrName(skill)} ${value} `;
        }
        message += `\n消耗: $${result.cost}`;
        
        // 瓶颈期警告
        if (result.plateauWarnings && result.plateauWarnings.length > 0) {
          message += '\n⚠️ ' + result.plateauWarnings.join('\n⚠️ ');
        }
      }

      this.game.showModal('🎉 训练完成', message, false);
    } else {
      this.game.showToast(result.message);
    }
  }
}

module.exports = TrainingScene;
