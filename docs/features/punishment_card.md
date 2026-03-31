# 惩罚卡系统

## 需求来源
- 需求文档001: 3.2.5 惩罚事件（浅灰底色）
- 需求文档001: 4.4 惩罚卡

## 功能描述

踩中浅灰色底的惩罚事件格时，触发惩罚卡流程。或随机事件骰子掷出单数时触发。

## 触发条件

1. 棋盘格子 `type === 'punishment'`
2. 随机事件（需求3.2.6）骰子掷出单数

## 用户操作流程

```
1. [踩中格子/触发条件] → 抽取动画：屏幕中间卡堆区域显示"抽取动画"
                       （卡牌从惩罚卡堆飞入中央）
        ↓
2. [弹出卡片] → 弹窗显示:
                 惩罚卡内容
        ↓
3. [执行惩罚] → 惩罚效果立即生效
        ↓
4. [显示消息] → 显示惩罚内容
        ↓
5. [自动继续] → 进入下一回合
```

注意：惩罚卡不需要玩家交互，直接自动执行并显示结果。

## 14种惩罚效果

| 惩罚ID | 效果 | 数量 |
|--------|------|------|
| stay_2 | 原地停留2回合 | 10 |
| no_item_2 | 2回合无法使用道具卡片 | 10 |
| lose_100 | 失去100 | 10 |
| lose_500 | 失去500 | 10 |
| auction_max | 强制拍卖最高级地皮 | 10 |
| back_10 | 后退10格 | 10 |
| lose_1000 | 失去1000（可能破产） | 5 |
| lose_5000 | 失去5000（可能破产） | 5 |
| back_start | 回到起始格 | 5 |
| lose_all_items | 失去所有道具卡片 | 5 |
| toll_x2_3 | 接下来3回合过路费x2 | 5 |
| give_all_1000 | 给所有其他玩家1000 | 5 |
| give_prev_500 | 赠与上一位玩家500 | 5 |
| give_property | 随意赠与自己一个地皮给任意玩家 | 2 |

## 核心函数实现

### applyPunishment

```typescript
function applyPunishment(punishmentId: string) {
  const player = currentPlayer.value

  switch (punishmentId) {
    case 'stay_2':
      player.stayTurns += 2
      message.value = `${player.name} 原地停留2回合`
      break

    case 'lose_100':
      player.money -= 100
      message.value = `${player.name} 失去 100`
      break

    case 'lose_500':
      player.money -= 500
      message.value = `${player.name} 失去 500`
      checkBankruptcy(player)
      break

    case 'lose_1000':
      player.money -= 1000
      message.value = `${player.name} 失去 1000`
      checkBankruptcy(player)
      break

    case 'back_10':
      player.position = (player.position - 10 + BOARD_SIZE) % BOARD_SIZE
      message.value = `${player.name} 后退10格`
      break

    case 'back_start':
      player.position = 0
      message.value = `${player.name} 回到起始格`
      break

    case 'lose_all_items':
      player.items = []
      message.value = `${player.name} 失去所有道具卡片`
      break

    case 'give_all_1000':
      for (const p of gameState.value.players) {
        if (p.id !== player.id && !p.isBankrupt) {
          player.money -= 1000
          p.money += 1000
        }
      }
      message.value = `${player.name} 给所有其他玩家 1000`
      break

    case 'give_prev_500':
      const prevIndex = (gameState.value.currentPlayerIndex - 1 + gameState.value.players.length) % gameState.value.players.length
      const prevPlayer = gameState.value.players[prevIndex]
      if (prevPlayer && !prevPlayer.isBankrupt) {
        player.money -= 500
        prevPlayer.money += 500
        message.value = `${player.name} 赠与 ${prevPlayer.name} 500`
      }
      break

    // ... 其他惩罚
  }

  autoEndTurn()
}
```

## 使用后放回机制

根据需求4.4：惩罚卡使用后，排回惩罚卡堆最后

当前实现未完全按照此规则，需要后续优化。

## 状态流转

```
rolling → punishment → rolling
            (自动执行)
```

## 验收标准

| 检查点 | 预期结果 |
|--------|---------|
| 踩中惩罚格 | 自动抽取并执行惩罚效果 |
| 显示惩罚 | 正确显示惩罚内容的消息 |
| 金钱扣除 | 正确扣除相应金钱 |
| 破产检测 | 金钱为负时判定破产 |
| 自动继续 | 惩罚执行后自动进入下一回合 |

## 相关文件

| 文件 | 作用 |
|------|------|
| `shared/cards.ts` | PUNISHMENT_CARDS数组，14种惩罚定义 |
| `frontend/src/stores/game.ts` | applyPunishment函数 |
