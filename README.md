---
AIGC:
    ContentProducer: Minimax Agent AI
    ContentPropagator: Minimax Agent AI
    Label: AIGC
    ProduceID: "00000000000000000000000000000000"
    PropagateID: "00000000000000000000000000000000"
    ReservedCode1: 304402207d5d24811d01d0b991578a1ebeb08af5e704c394929160b2c5b66e9205ed4e240220307cbcdde2e6481b49050767c04265450e56a063f2112ad687686c913190806d
    ReservedCode2: 304402205296bd285387e7fffbb189dfffad5f314f104896ebd7bdb5a0a4b923f3f6a7630220701b08f32ebe90f5565586cb7c2c712d518afe27a58e5224f8c8856972ce846e
---

# 网球运动员职业生涯模拟器 - 微信小游戏配置指南

## 📁 项目结构

```
tennis-game-miniprogram/
├── project.config.json          # 微信小游戏项目配置
├── game.json                    # 小游戏配置
├── game.js                      # 游戏主入口文件
├── game.wxss                    # 全局样式（可选）
├── game/
│   └── images/                  # 图片资源文件夹
├── models/
│   ├── player.js                # 球员数据模型
│   ├── training.js              # 训练系统
│   ├── match.js                 # 比赛系统
│   ├── sponsor.js               # 赞助系统
│   └── events.js                # 随机事件系统
└── scenes/
    ├── scene.js                 # 场景基类
    ├── menuScene.js             # 菜单场景
    ├── createPlayerScene.js     # 创建角色场景
    ├── homeScene.js             # 首页场景
    ├── trainingScene.js         # 训练场景
    ├── matchScene.js            # 比赛场景
    ├── sponsorScene.js          # 赞助场景
    ├── statsScene.js            # 生涯统计场景
    ├── restScene.js             # 休息场景
    └── eventScene.js            # 随机事件场景
```

## 🎮 游戏类型

本项目是**微信小游戏**版本，基于Canvas进行渲染，使用原生JavaScript开发。

**与小程序版本的区别：**
- ✅ 使用Canvas 2D渲染
- ✅ 更接近传统游戏开发模式
- ✅ 无需WXML/WXSS页面结构
- ✅ 更轻量级，加载更快

## 🚀 快速开始

### 1. 安装微信开发者工具
下载并安装微信开发者工具：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html

### 2. 导入项目
1. 打开微信开发者工具
2. 点击"导入项目"
3. 选择项目目录：`/workspace/tennis-game-miniprogram`
4. AppID：如果你没有AppID，可以选择使用测试号

**重要：** 确保项目类型选择为"小游戏"

### 3. 配置AppID
在 `project.config.json` 中替换你的AppID：
```json
{
  "appid": "你的AppID"
}
```

## 🎮 游戏功能

### 核心系统
1. **球员培养**
   - 7种训练类型：力量、速度、技术、耐力、心理、网前、综合
   - 5项核心属性：力量、速度、技术、耐力、心理
   - 5项技能专长：发球、正手、反手、网前、接发

2. **比赛系统**
   - 8种比赛级别：青少年赛、未来赛、挑战赛、ATP250/500/1000、大满贯
   - 实时胜率计算
   - 奖金和排名积分奖励

3. **赞助系统**
   - 5个赞助级别：本地、国家、国际、顶级、传奇
   - 签约奖金和月度收入

4. **时间系统**
   - 月份流逝
   - 年龄增长和属性变化
   - 季度赞助收入

5. **随机事件**
   - 伤病、状态火热、技术突破
   - 赞助邀请、名人指导

## ⚙️ 配置说明

### game.json 配置
```json
{
  "deviceOrientation": "portrait",
  "openDataContext": "sharedCanvas",
  "networkTimeout": {
    "request": 10000,
    "connectSocket": 10000,
    "uploadFile": 10000,
    "downloadFile": 10000
  }
}
```

### 游戏配置 (game.js)
```javascript
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
```

### 数据存储
游戏数据保存在本地存储 `tennisGameData` 中，包含：
- 玩家属性和状态
- 游戏进度（月份、年份）
- 赞助商信息

## 🎨 主题颜色
- 主色：#64ffda (青色)
- 背景：#16213e (深蓝)
- 卡片背景：#1a1a2e (更深蓝)
- 文字主色：#ccd6f6
- 辅助文字：#8892b0
- 金色：#ffd700 (排名、奖金)
- 红色：#fc8181 (警告、低属性)
- 绿色：#68d391 (成功、高胜率)

## 🎯 场景说明

| 场景 | 功能 |
|------|------|
| menu | 游戏入口、角色创建/加载 |
| createPlayer | 创建新角色 |
| home | 玩家状态总览、快速操作入口 |
| training | 选择并执行训练 |
| match | 选择并参加比赛 |
| sponsor | 查看和申请赞助 |
| stats | 查看完整生涯数据 |
| rest | 休息恢复 |
| event | 随机事件弹窗 |

## 🔧 自定义配置

### 修改初始资金
在 `models/player.js` 中修改：
```javascript
this.money = 1000; // 初始资金
```

### 修改比赛奖金
在 `models/match.js` 中修改：
```javascript
MatchLevel: {
  JUNIOR: { name: '青少年赛', prize: 100, points: 10 },
  // ...
}
```

### 修改训练效果
在 `models/training.js` 中修改：
```javascript
TRAINING_TYPES: {
  '1': {
    name: '力量训练',
    cost: 50,
    effects: { strength: [1, 3], serve: [1, 2] }
  },
  // ...
}
```

### 添加新场景
1. 在 `scenes/` 目录下创建新的场景文件
2. 继承 `Scene` 基类
3. 实现 `enter()`, `update()`, `render()`, `handleTouch()` 方法
4. 在 `game.js` 的 `createScenes()` 方法中注册新场景

## 📝 注意事项

1. **游戏类型**：确保选择"小游戏"类型导入
2. **AppID**：正式发布需要有效的AppID
3. **数据保存**：游戏数据自动保存在本地存储
4. **退役机制**：球员40岁自动退役
5. **Canvas适配**：游戏会自动适配不同屏幕尺寸

## 🎨 扩展指南

### 添加图片资源
1. 将图片放入 `game/images/` 目录
2. 使用 `wx.createImage()` 加载图片
3. 在渲染时使用 `ctx.drawImage()`

### 添加音效
1. 使用 `wx.createInnerAudioContext()` 创建音频
2. 加载音效文件
3. 在适当时机调用 `play()`

### 添加动画
1. 使用 `requestAnimationFrame` 实现动画循环
2. 在 `update()` 方法中更新动画状态
3. 在 `render()` 方法中绘制动画

## 🎯 下一步优化建议

1. **性能优化** - 使用离屏Canvas减少重绘
2. **视觉效果** - 添加更多动画和特效
3. **社交功能** - 添加排行榜和分享功能
4. **数据持久化** - 使用云存储实现多设备同步
5. **新手引导** - 添加教程和提示
6. **多语言支持** - 国际化支持

---

**祝你游戏愉快！🎾**
