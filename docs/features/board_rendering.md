# 棋盘渲染系统

## 概述

棋盘使用 Canvas 2D API 渲染 72 格正方形棋盘，包含外圈格子、中间区域、玩家图标。

## 棋盘规格

| 项目 | 值 |
|------|-----|
| 棋盘大小 | 800x800 px |
| 内边距 | 25 px |
| 每边格子数 | 18 格（含边角） |
| 总格子数 | 72 格 |

## 位置编号系统

棋盘采用逆时针编号系统：

| 位置范围 | 方向 | 起点/终点 |
|---------|------|-----------|
| 0-17 | 左边往上 | 左下角(0) → 左上角(17) |
| 18-35 | 上边往右 | 左上角(18) → 右上角(35) |
| 36-53 | 右边往下 | 右上角(36) → 右下角(53) |
| 54-71 | 下边往左 | 右下角(54) → 左下角(71) |

### 绘制偏移

由于 board.ts 数据顺序与位置编号存在偏移，绘制时需要应用 `(i + 71) % 72` 偏移：

```javascript
// i: 数组索引 (0-71)
// 绘制位置: (i + 71) % 72
const pos = getTilePosition((i + 71) % 72)
```

## 核心代码

### getTilePosition 函数

```typescript
function getTilePosition(tileIndex: number): { x: number; y: number } {
  const availableSize = boardSize - padding * 2
  const gridSize = availableSize / 18

  // 0-17: 左边往上
  if (tileIndex <= 17) {
    return {
      x: padding,
      y: boardSize - padding - (tileIndex + 1) * gridSize
    }
  }
  // 18-35: 上边往右
  if (tileIndex <= 35) {
    return {
      x: padding + (tileIndex - 18 + 1) * gridSize,
      y: padding
    }
  }
  // 36-53: 右边往下
  if (tileIndex <= 53) {
    return {
      x: boardSize - padding,
      y: padding + (tileIndex - 36 + 1) * gridSize
    }
  }
  // 54-71: 下边往左
  return {
    x: boardSize - padding - (tileIndex - 54 + 1) * gridSize,
    y: boardSize - padding
  }
}
```

## 格子类型与颜色

| 类型 | 颜色 | 说明 |
|------|------|------|
| start | #98fb98 | 起点 |
| property | #90EE90 | 可购地皮（浅绿） |
| special | #dda0dd | 特殊事件（浅紫） |
| poetry | #ffd700 | 诗词事件（橙） |
| quiz | #ffb6c1 | 问答事件（浅红） |
| reward | #87ceeb | 奖励事件（浅蓝） |
| punishment | #d3d3d3 | 惩罚事件（浅灰） |
| random | #fffacd | 随机事件（浅黄） |

## 绘制流程

### 1. 清空画布

```typescript
ctx.fillStyle = '#f5e6d3'
ctx.fillRect(0, 0, boardSize, boardSize)
```

### 2. 绘制外框

```typescript
ctx.strokeStyle = '#8b4513'
ctx.lineWidth = 3
ctx.strokeRect(padding, padding, availableSize, availableSize)
```

### 3. 绘制72格

```typescript
for (let i = 0; i < BOARD_TEMPLATES.length; i++) {
  const pos = getTilePosition((i + 71) % 72)
  const tile = BOARD_TEMPLATES[i]

  // 格子背景
  ctx.fillStyle = TILE_COLORS[tile.type]
  ctx.fillRect(pos.x, pos.y, gridSize - 2, gridSize - 2)

  // 格子边框
  ctx.strokeStyle = '#8b4513'
  ctx.strokeRect(pos.x, pos.y, gridSize - 2, gridSize - 2)

  // 格子编号
  ctx.fillStyle = '#666'
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'top'
  ctx.fillText(String((i + 71) % 72), pos.x + gridSize - 4, pos.y + 2)

  // 格子名称
  ctx.fillStyle = '#333'
  ctx.font = 'bold 12px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const mid = Math.floor(tile.name.length / 2)
  ctx.fillText(tile.name.substring(0, mid), pos.x + gridSize / 2, pos.y + gridSize / 2 - 5)
  ctx.fillText(tile.name.substring(mid), pos.x + gridSize / 2, pos.y + gridSize / 2 + 5)
}
```

### 4. 绘制玩家图标

```typescript
for (const player of props.players) {
  const pos = getTilePosition((player.position + 71) % 72)
  const color = charColors[player.characterId] || '#333'
  const offsetX = (playerIndex % 2) * 8 - 4
  const offsetY = Math.floor(playerIndex / 2) * 8 - 4

  // 玩家圆形图标
  ctx.beginPath()
  ctx.arc(pos.x + gridSize / 2 + offsetX, pos.y + gridSize / 2 + offsetY, 8, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()

  // 当前玩家高亮
  if (player.id === props.currentPlayerId) {
    ctx.beginPath()
    ctx.arc(pos.x + gridSize / 2 + offsetX, pos.y + gridSize / 2 + offsetY, 12, 0, Math.PI * 2)
    ctx.strokeStyle = '#ffd700'
    ctx.lineWidth = 3
    ctx.stroke()
  }
}
```

## 中间区域布局

参照 image66.png，中间区域放置 5 种卡堆和货币图标：

```
     [问答卡] [诗词卡] [道具卡]
        [惩罚卡]   [奖励卡]
              💰
```

### 卡堆尺寸

| 项目 | 值 |
|------|-----|
| 卡宽 | gridSize * 2 |
| 卡高 | gridSize * 1.5 |
| 卡片间距 | gridSize * 0.3 |

### 绘制代码

```typescript
function drawCenterArea(ctx, centerX, centerY, gridSize) {
  const cardWidth = gridSize * 2
  const cardHeight = gridSize * 1.5
  const cardGap = gridSize * 0.3

  // 卡堆配置
  const cardStacks = [
    { type: 'quiz', name: '问答卡', x: -cardWidth - cardGap, y: -cardHeight - cardGap },
    { type: 'poetry', name: '诗词卡', x: 0, y: -cardHeight - cardGap },
    { type: 'item', name: '道具卡', x: cardWidth + cardGap, y: -cardHeight - cardGap },
    { type: 'punishment', name: '惩罚卡', x: -cardWidth - cardGap, y: 0 },
    { type: 'reward', name: '奖励卡', x: cardWidth + cardGap, y: 0 }
  ]

  // 绘制每个卡堆
  for (const stack of cardStacks) {
    const x = centerX + stack.x
    const y = centerY + stack.y
    const color = cardColors[stack.type]

    // 卡片背景
    ctx.fillStyle = color
    ctx.fillRect(x, y, cardWidth, cardHeight)

    // 卡片边框
    ctx.strokeStyle = '#8b4513'
    ctx.strokeRect(x, y, cardWidth, cardHeight)

    // 卡片名称
    ctx.fillText(stack.name, x + cardWidth / 2, y + cardHeight / 2)
  }

  // 货币图标（缩小避免覆盖）
  ctx.beginPath()
  ctx.arc(centerX, centerY, gridSize * 0.4, 0, Math.PI * 2)
  ctx.fillStyle = '#ffd700'
  ctx.fill()
  ctx.fillText('💰', centerX, centerY)
}
```

## 问题修复

### B00002 格子编号错位

**问题**: 数组索引 i 直接作为位置编号显示，导致编号与实际位置错位

**修复**: 绘制时使用 `(i + 71) % 72` 偏移

### B00005 中间区域被覆盖

**问题**: 货币圆圈太大 (gridSize * 0.8) 覆盖卡堆

**修复**: 缩小到 gridSize * 0.4

### B00015 棋盘显示不全

**问题**: boardSize 900 太大超出布局

**修复**: boardSize 改为 800，padding 改为 25

## 验收标准

| 检查点 | 预期结果 |
|--------|---------|
| 72格显示 | 72个格子全部显示 |
| 编号正确 | 左下角为0，顺时针递增 |
| 颜色正确 | 各类型格子显示对应颜色 |
| 玩家图标 | 玩家图标正确显示在对应格子 |
| 中间卡堆 | 5种卡堆正确显示 |
| 货币图标 | 居中显示，不覆盖卡堆 |

## 相关文件

| 文件 | 作用 |
|------|------|
| `frontend/src/components/GameBoard.vue` | Canvas 渲染 |
| `shared/board.ts` | 棋盘数据 |
