# 特殊地皮系统

## 需求来源
- 需求文档001: 3.2.2 特殊事件（浅紫底色）

## 功能描述

特殊地皮是具有特定剧情效果的地格，通过 tile.description 关键词匹配执行不同效果。

## 触发条件

棋盘格子 `type === 'special'`

## 关键词匹配表

| 关键词 | 效果 | 说明 |
|--------|------|------|
| 丧母 | 原地停留3回合 | 1057年母亲病逝 |
| 丧父 | 原地停留3回合 | 1066年父亲去世 |
| 通判 | 原地停留3回合 | 1071年赴任杭州 |
| 王安石变法 | 失去1000 | 1069年变法 |
| 乌台诗案 | 资产扣除到1000，不足则破产 | 1079年乌台诗案 |
| 入土为安 | 获得墓碑卡 | 1102年安葬汝州 |
| 兄弟团聚 | 获得花束卡 | 1112年苏辙去世 |
| 追赠太师 | 抽2张道具卡 | 1128年追封太师 |
| 谥号 | 抽2张道具卡 | 1170年追谥文忠 |
| 连续五贬 | 抽5张惩罚卡 | 1094年接连被贬 |
| 原地停留 | 停留N回合 | 通用停留效果 |

## 用户操作流程

```
1. [踩中特殊格] → 根据description关键词匹配效果
        ↓
2. [执行效果] → 效果立即生效
        ↓
3. [显示消息] → 显示特殊事件内容
        ↓
4. [自动继续] → 进入下一回合
```

注意：特殊事件不需要玩家交互，直接自动执行。

## 核心函数实现

### handleTileEffect (special分支)

```typescript
case 'special': {
  const desc = tile.description || ''
  const effect = tile.effect || ''

  // 丧母/丧父/通判 → 停留3回合
  if (desc.includes('丧母') || desc.includes('丧父') || desc.includes('通判')) {
    player.stayTurns = 3
    message.value = `${player.name} ${tile.name}，原地停留3回合`
    autoEndTurnWithStay()
  }
  // 王安石变法 → 失去1000
  else if (desc.includes('王安石变法')) {
    player.money -= 1000
    message.value = `${player.name} 遭受王安石变法，失去 1000`
    checkBankruptcy(player)
    autoEndTurn()
  }
  // 乌台诗案 → 资产扣除到1000
  else if (desc.includes('乌台诗案')) {
    if (player.money <= 1000) {
      player.isBankrupt = true
      message.value = `${player.name} 乌台诗案，资产不足1000，破产！`
    } else {
      player.money = 1000
      message.value = `${player.name} 乌台诗案，资产扣除到 1000`
    }
    autoEndTurn()
  }
  // 入土为安 → 获得墓碑卡
  else if (desc.includes('入土为安')) {
    player.items.push('tombstone')
    message.value = `${player.name} ${tile.name}，获得墓碑卡`
    autoEndTurn()
  }
  // 兄弟团聚 → 获得花束卡
  else if (desc.includes('兄弟团聚')) {
    player.items.push('flower')
    message.value = `${player.name} ${tile.name}，获得花束卡`
    autoEndTurn()
  }
  // 追赠太师/谥号 → 抽2张道具卡
  else if (desc.includes('追赠太师') || desc.includes('谥号')) {
    for (let i = 0; i < 2; i++) {
      const item = drawItemCard()
      if (item) player.items.push(item.id)
    }
    message.value = `${player.name} ${tile.name}，抽2张道具卡`
    autoEndTurn()
  }
  // 连续五贬 → 抽5张惩罚卡
  else if (desc.includes('连续五贬')) {
    for (let i = 0; i < 5; i++) {
      const punishment = drawPunishmentCard()
      applyPunishment(punishment.id)
    }
    message.value = `${player.name} ${tile.name}，抽5张惩罚卡`
    autoEndTurn()
  }
  // 原地停留 → 解析回合数
  else if (effect.includes('原地停留')) {
    const stayMatch = effect.match(/原地停留(\d+)回合/)
    if (stayMatch) {
      player.stayTurns = parseInt(stayMatch[1])
      message.value = `${player.name} ${tile.name}，原地停留${player.stayTurns}回合`
    }
    autoEndTurnWithStay()
  }
  // 其他特殊格
  else {
    message.value = `${player.name} 来到了 ${tile.name}`
    autoEndTurn()
  }
  break
}
```

## 状态流转

```
rolling → special → rolling
           (自动执行)
```

## 验收标准

| 检查点 | 预期结果 |
|--------|---------|
| 丧母/丧父/通判 | 显示停留3回合，玩家停留 |
| 王安石变法 | 正确扣除1000金钱 |
| 乌台诗案 | 资产扣除到1000，不足则破产 |
| 入土为安 | 玩家获得墓碑卡 |
| 兄弟团聚 | 玩家获得花束卡 |
| 追赠太师/谥号 | 玩家抽取2张道具卡 |
| 连续五贬 | 玩家抽取5张惩罚卡并执行 |
| 破产检测 | 金钱为负时判定破产 |

## 相关文件

| 文件 | 作用 |
|------|------|
| `shared/board.ts` | 特殊地皮数据，description和effect字段 |
| `frontend/src/stores/game.ts` | handleTileEffect (special分支) |
