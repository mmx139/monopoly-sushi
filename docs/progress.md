# 项目进度

## 当前阶段
Phase 2: 游戏核心开发

## 确定的技术方案

| 项目 | 选择 |
|------|------|
| 平台 | 浏览器 (Web)，后续移植移动端 |
| 前端 | Vue3 + Canvas |
| 后端 | Python FastAPI |
| 实时通信 | WebSocket |
| P2P | WebRTC |
| 数据库 | SQLite |
| 用户系统 | 简单账号（昵称） |
| 房间人数 | 最多 4 人 |
| 回合机制 | 同步回合 |
| AI 难度 | 中等（规则策略） |

## 已完成

### 共享模块
- [x] `shared/constants.ts` - 游戏常量（ BOARD_SIZE, PLAYER_COUNT, INITIAL_MONEY, TILE_TYPE, CHARACTERS, CARD_COUNTS）
- [x] `shared/types.ts` - TypeScript 类型定义（Tile, Property, Player, GameState, Card, DiceResult）
- [x] `shared/board.ts` - 72格棋盘数据

### 前端 (Vue3 + Pinia)
- [x] `frontend/src/stores/game.ts` - Pinia 游戏状态管理
- [x] `frontend/src/stores/ai.ts` - AI决策逻辑
- [x] `frontend/src/composables/useWebSocket.ts` - WebSocket 客户端管理
- [x] `frontend/src/components/Dice.vue` - 骰子组件
- [x] `frontend/src/components/GameBoard.vue` - Canvas 棋盘渲染
- [x] `frontend/src/components/PlayerPanel.vue` - 玩家信息面板
- [x] `frontend/src/components/CardModal.vue` - 问答/诗词卡弹窗
- [x] `frontend/src/components/RoomScreen.vue` - 房间系统UI
- [x] `frontend/src/App.vue` - 主界面（角色选择 + 游戏界面）

### 后端 (FastAPI)
- [x] `backend/game/models.py` - 游戏核心模型（Player, Property, Tile, GameState）
- [x] `backend/main.py` - FastAPI 主入口

## 进行中
- [ ] P2 联机WebSocket客户端集成（useWebSocket.ts已创建，game.ts已支持联机状态）

## Bug修复状态

| Bug | 描述 | 状态 |
|-----|------|------|
| B00018 | 诗词事件UI修复：用户输入→系统自动判断 | Fixed |
| B00013 | AI玩家不处理惩罚卡 | Fixed |
| B00016 | 骰子投出后不显示数字 | Fixed |
| B00017 | 道具卡系统状态未生效 | Pending on Verify |
| B00014 | 问答卡抽卡动画 | Open |
| B00019 | 卡牌抽取动画 | Open |
| B00002 | 棋盘格子编号 | Open |
| B00005 | 中间区域布局 | Open |
| B00015 | 棋盘显示不全 | Open |

## 待办

### P0 核心
- [x] 棋盘渲染 (Canvas)
- [x] 骰子系统
- [x] 玩家移动
- [x] 地皮购买（基础）
- [x] 回合流程完善
- [x] 胜利判定

### P1 功能
- [x] 房屋升级系统
- [x] 过路费系统
- [x] AI 玩家
- [x] 问答卡/诗词卡
- [x] 中间区域卡堆
- [x] 道具卡系统
- [x] 惩罚卡系统
- [x] 道具栏UI

### P2 联机
- [x] WebSocket 服务器
- [x] 房间系统（后端）
- [x] 房间UI（前端基础）
- [ ] 实时同步（前端WebSocket客户端集成）

## 卡点
- P2联机: 前端WebSocket客户端与游戏逻辑的完整集成尚未完成

## 最后更新
2026-03-31 (晚间)
