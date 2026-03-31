# 回合与AI系统

## 回合流程状态机

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   waiting ──[开始游戏]──→ rolling                          │
│                               ↓                              │
│                      ┌──────┴──────┐                        │
│                      ↓              ↓                        │
│                  rolling       [AI回合]                     │
│                      ↓              ↓                        │
│              [投骰子] ──→ moving ──→ handling               │
│                                     ↓                        │
│                            ┌────────┴────────┐               │
│                            ↓                 ↓               │
│                      property              card              │
│                         ↓                   ↓                │
│              ┌────────┬┴───┐         ┌───┴────┐         │
│              ↓        ↓     ↓         ↓         ↓         │
│           action   auto  end        modal    auto  end    │
│              ↓        ↓              (等待答案)   ↓         │
│           ┌──┴──┐    └──────→ end ←──┴────→ end          │
│           ↓     ↓                                          │
│        buy/  skip                                         │
│       upgrade                                              │
│           ↓                                                 │
│        autoEndTurn                                         │
│           ↓                                                 │
│        end ──→ rolling (下一玩家)                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 游戏阶段 (phase)

| phase | 说明 |
|-------|------|
| waiting | 等待开始 |
| rolling | 可投骰子 |
| moving | 移动中（动画） |
| action | 待玩家操作（购买/升级/使用道具） |
| card | 问答/诗词答题中 |
| ending | 游戏结束 |

## 回合详细流程

### 1. 回合开始 (rolling)

**人类玩家:**
- 显示 Dice 组件，可点击投骰子
- canRoll = true

**AI玩家:**
- 自动触发 takeAITurn()

### 2. 投骰子

```typescript
function onRoll() {
  const result = store.rollDice()  // { value: 1-6, canReroll: true }
  if (result.value) {
    store.movePlayer(result.value)  // 移动玩家
  }
}
```

### 3. 移动 (movePlayer)

```typescript
function movePlayer(steps: number) {
  // 检查停留状态
  if (player.stayTurns > 0) {
    player.stayTurns--
    message.value = `停留中，剩余 ${player.stayTurns} 回合`
    autoEndTurn()
    return
  }

  // 执行移动
  const newPos = (oldPos + steps) % BOARD_SIZE
  player.position = newPos

  // 经过起点奖励
  if (newPos < oldPos) {
    player.money += 1000
  }

  // 处理地皮效果
  handleTileEffect(player, newPos)
}
```

### 4. 地皮效果 (handleTileEffect)

根据地皮类型分发:
- property → 4种效果分支
- quiz → 问答流程
- poetry → 诗词流程
- special → 特殊事件
- punishment → 惩罚流程
- reward → 奖励事件
- random → 随机事件

### 5. 回合结束 (autoEndTurn → endTurn)

```typescript
function autoEndTurn() {
  // 检测胜利条件
  const activePlayers = gameState.players.filter(p => !p.isBankrupt)
  if (activePlayers.length <= 1) {
    gameState.winner = activePlayers[0]?.id
    gameState.phase = 'ending'
    return
  }

  // 跳过破产玩家
  if (currentPlayer.isBankrupt) {
    skipBankruptPlayer()
  }

  // 无待处理动作则结束回合
  if (!pendingAction.value) {
    endTurn()
  }
}

function endTurn() {
  pendingAction.value = null
  lastDiceResult.value = null

  // 下一玩家
  currentPlayerIndex = (currentPlayerIndex + 1) % players.length
  if (currentPlayerIndex === 0) {
    turnNumber++
  }

  phase = 'rolling'
}
```

## AI玩家逻辑

### takeAITurn - AI回合入口

```typescript
function takeAITurn() {
  // 延迟1秒后投骰子
  setTimeout(() => {
    const result = rollDice()
    if (result.value) {
      movePlayer(result.value)

      // 移动后如需AI决策，进入AI决策流程
      if (phase === 'action' && pendingAction.value) {
        aiHandleAction()
      }
    }
  }, 1000)
}
```

### aiHandleAction - AI决策

```typescript
function aiHandleAction() {
  const player = currentPlayer.value
  const currentTile = getCurrentTile()
  const decision = aiMakeDecision(player, currentTile, player.money)

  setTimeout(() => {
    if (decision === 'buy' && pendingAction.value === 'buy') {
      purchaseProperty(player.id, currentTile.id)
    } else if (decision === 'upgrade' && pendingAction.value === 'upgrade') {
      upgradeProperty(player.id, currentTile.id)
    } else {
      skipAction()  // 跳过
    }
  }, 800)
}
```

### aiMakeDecision - AI估价函数

```typescript
function aiMakeDecision(player, tile, money): 'buy' | 'upgrade' | 'skip' {
  if (pendingAction.value === 'buy') {
    // 有足够资金且地皮有价值则购买
    if (money >= tile.basePrice && evaluateProperty(tile) > tile.basePrice) {
      return 'buy'
    }
  }
  if (pendingAction.value === 'upgrade') {
    // 升级有利则升级
    const upgradeCost = HOUSE_UPGRADE_PRICE
    if (money >= upgradeCost) {
      return 'upgrade'
    }
  }
  return 'skip'
}
```

### AI答题逻辑

```typescript
// phase === 'card' 时
if (currentPlayer.value?.isAI) {
  setTimeout(() => {
    const card = currentCard.value
    if (card?.type === 'quiz') {
      const correct = Math.random() > 0.5  // 50%正确率
      store.handleCardAnswer({ type: 'quiz', correct })
    } else if (card?.type === 'poetry') {
      const r = Math.random()
      if (r < 0.6) store.handleCardAnswer({ type: 'poetry', result: 'full' })      // 60%
      else if (r < 0.8) store.handleCardAnswer({ type: 'poetry', result: 'half' })   // 20%
      else store.handleCardAnswer({ type: 'poetry', result: 'wrong' })                  // 20%
    }
  }, 1000)
}
```

## AI回合不结束问题 (B00013)

### 问题现象
AI投骰子后，行动完成但回合不结束

### 根因分析
aiHandleAction 执行 skipAction() 时没有正确触发 autoEndTurn

### 修复方案
```typescript
function skipAction() {
  pendingAction.value = null
  autoEndTurn()  // 确保调用 autoEndTurn
}
```

## 验收标准

| 检查点 | 预期结果 |
|--------|---------|
| 人类回合 | 显示骰子，可点击投骰 |
| AI回合 | 自动投骰子并执行行动 |
| AI决策购买 | 有足够资金时优先购买 |
| AI答题 | 50%正确率答题 |
| 回合结束 | 正确进入下一玩家 |
| AI不结束 | AI行动后正确结束回合 |

## 相关文件

| 文件 | 作用 |
|------|------|
| `frontend/src/stores/game.ts` | 回合逻辑 |
| `frontend/src/stores/ai.ts` | AI决策 |
| `frontend/src/App.vue` | 回合UI渲染 |
