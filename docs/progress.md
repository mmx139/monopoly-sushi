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
- [x] `frontend/src/components/Dice.vue` - 骰子组件
- [x] `frontend/src/components/GameBoard.vue` - Canvas 棋盘渲染
- [x] `frontend/src/components/PlayerPanel.vue` - 玩家信息面板
- [x] `frontend/src/App.vue` - 主界面（角色选择 + 游戏界面）

### 后端 (FastAPI)
- [x] `backend/game/models.py` - 游戏核心模型（Player, Property, Tile, GameState）
- [x] `backend/main.py` - FastAPI 主入口

## 进行中
- [ ] B00002 格子编号修复
- [ ] B00012 棋盘布局优化

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

### P2 联机
- [x] WebSocket 服务器
- [x] 房间系统（后端）
- [x] 房间UI（前端基础）
- [ ] 实时同步（前端WebSocket客户端集成）

## 卡点
- B00002: 格子编号与需求不一致，需重新检查棋盘数据和位置计算
- B00008: 问答题库非需求文档正式题库，需获取001中4.1题库

## 最后更新
2026-03-31
