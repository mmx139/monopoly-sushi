# 项目进度

## 当前阶段
Phase 3: 模块完善（道具卡、拍卖系统）

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
- [x] `shared/constants.ts` - 游戏常量
- [x] `shared/types.ts` - TypeScript 类型定义（包含PlacedItem类型）
- [x] `shared/board.ts` - 72格棋盘数据
- [x] `shared/cards.ts` - 问答卡/诗词卡/道具卡/惩罚卡题库

### 前端 (Vue3 + Pinia)
- [x] `frontend/src/stores/game.ts` - Pinia 游戏状态管理（含拍卖系统）
- [x] `frontend/src/stores/ai.ts` - AI决策逻辑
- [x] `frontend/src/composables/useWebSocket.ts` - WebSocket 客户端管理
- [x] `frontend/src/components/Dice.vue` - 骰子组件
- [x] `frontend/src/components/GameBoard.vue` - Canvas 棋盘渲染（编号修复）
- [x] `frontend/src/components/PlayerPanel.vue` - 玩家信息面板
- [x] `frontend/src/components/CardModal.vue` - 问答/诗词卡弹窗（含抽卡动画）
- [x] `frontend/src/components/RoomScreen.vue` - 房间系统UI
- [x] `frontend/src/App.vue` - 主界面（角色选择 + 游戏界面）

### 后端 (FastAPI)
- [x] `backend/game/models.py` - 游戏核心模型
- [x] `backend/main.py` - FastAPI 主入口

## 进行中
- Bug验证（非代码问题，需用户测试）

## Bug修复状态

| Bug | 描述 | 状态 |
|-----|------|------|
| B00003 | 棋盘格子编号 | Pending on Verify |
| B00005 | 棋盘中间区域布局 | Pending on Verify |
| B00014 | 问答事件卡片抽取动画 | Pending on Verify |
| B00015 | 棋盘显示不全 | Pending on Verify |
| B00019 | 卡牌抽取动画 | Pending on Verify |
| B00002 | 棋盘格子编号 | Fixed |
| B00003 | 格子内容 | Fixed |
| B00004 | 格子颜色 | Fixed |
| B00006 | 回合结束 | Fixed |
| B00007 | 可购地皮购买/升级 | Fixed |
| B00008 | 事件触发 | Fixed |
| B00009 | 棋盘格子显示 | Fixed |
| B00011 | 乌台诗案效果 | Pending on Verify |
| B00012 | 棋盘布局优化 | Pending on Verify |
| B00013 | AI玩家不行动 | Fixed |
| B00016 | 骰子显示数字 | Fixed |
| B00017 | 道具卡状态 | Pending on Verify |
| B00018 | 诗词卡全文显示 | Fixed |

## 待办

### P2 新功能
- [x] 道具卡系统（16种道具）
- [x] 墓碑/花束特殊逻辑
- [x] 奖励事件道具卡抽取
- [x] 随机事件卡牌抽取
- [x] 拍卖系统

### P2 联机
- [x] WebSocket 服务器
- [x] 房间系统（后端）
- [x] 房间UI（前端基础）
- [ ] 实时同步（前端WebSocket客户端集成）

## 卡点
- Bug验证阶段，等待用户测试反馈

## 最后更新
2026-04-01
