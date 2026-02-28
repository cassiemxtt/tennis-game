---
AIGC:
    ContentProducer: Minimax Agent AI
    ContentPropagator: Minimax Agent AI
    Label: AIGC
    ProduceID: "00000000000000000000000000000000"
    PropagateID: "00000000000000000000000000000000"
    ReservedCode1: 3044022015ca2590dc6bb7042da259694b6f91d13ea3d56d464bf2c39ba393030fad5e6902205c00c2674d5af5f5bc4f615b8fafac7dd74537304fce7f1e85ea3abaef2d5ced
    ReservedCode2: 3046022100890625aab81414a7c241ad611e553e489209b7fe3b72fe7eac9d8d7180b6b27a022100cb779ce00064279e7801390086ecccf1f2de80378d3d4483145ef1e066305d78
---

# 微信小游戏开放数据域目录

此目录用于微信小游戏的开放数据域功能，用于实现排行榜等需要隔离数据的场景。

## 目录结构

```
shared/
├── index.js          # 开放数据域入口文件
├── game.js           # 开放数据域游戏逻辑
└── README.md         # 说明文件
```

## 说明

开放数据域是一个独立的JavaScript环境，与主游戏隔离：
- 无法访问主域的全局变量
- 数据存储在 sharedCanvas 上
- 用于实现排行榜、好友成绩等功能

## 使用方法

1. 创建 shared/index.js 文件
2. 实现开放数据域逻辑
3. 使用 wx.getOpenDataContext() 获取上下文
4. 通过 sharedCanvas 绘制数据

## 注意事项

- 开放数据域有大小限制（建议不超过2MB）
- sharedCanvas 只能是只读的
- 域名校验需要在小程序后台配置
