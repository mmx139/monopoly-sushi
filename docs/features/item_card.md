# 道具卡系统

## 需求来源
- 需求文档001: 3.2.4 奖励事件（随机获得道具）
- 需求文档001: 4.3 道具卡（16种）

## 功能描述

道具卡是一类可以给玩家带来特殊效果的卡牌。玩家通过奖励事件、特殊事件或使用地契等方式获得道具卡。

## 道具分类

### 按使用方式

| 类型 | 说明 | 示例 |
|------|------|------|
| 消耗型 | 使用后从背包移除 | carriage, ruyi, broom, wine, inn, robbery, thunder, explosion, tax, deed |
| 装备型 | 装备后不消耗，破产时自动生效 | immunity |
| 放置型 | 获得时直接放置到地皮，不入背包 | rock, trap, mousetrap, tombstone, flower |

### 按目标类型

| 类型 | 说明 | 道具 |
|------|------|------|
| 无目标 | 使用即生效 | carriage, ruyi, broom, inn, deed, immunity |
| 地皮目标 | 指定地皮 | rock, trap, mousetrap, thunder |
| 玩家目标 | 指定其他玩家 | wine, robbery, explosion, tax |

## 用户操作流程

```
1. [获得道具] → 触发奖励事件/特殊事件
        ↓
2. [道具入背包] → 道具添加到 player.items
        ↓
3. [查看道具] → 右侧边栏道具栏显示拥有的道具
        ↓
4. [使用道具] → 点击道具栏中的道具
        ↓
5. [选择目标] → 如需目标，显示选择UI
              - 地皮目标：点击棋盘上的地皮
              - 玩家目标：点击其他玩家
        ↓
6. [确认使用] → 道具效果生效
        ↓
7. [移除道具] → 消耗型从背包移除
```

## 16种道具效果

| 道具ID | 名称 | 效果 | 目标 | 数量 | 拍卖价 |
|--------|------|------|------|------|-------|
| carriage | 马车 | 下回合可投2枚骰子 | 无 | 10 | 10 |
| ruyi | 如意令 | 免疫下一次道具效果 | 无 | 10 | 10 |
| rock | 巨石 | 指定地皮放置，踩中停留1回合 | 地皮 | 10 | 10 |
| broom | 扫帚 | 清除除墓碑与花束外的所有放置道具 | 无 | 10 | 10 |
| trap | 陷阱 | 指定地皮放置，踩中停留1回合 | 地皮 | 10 | 10 |
| mousetrap | 捕兽夹 | 指定地皮放置，踩中受伤就医失去500 | 地皮 | 10 | 10 |
| wine | 酒 | 使1名指定其他玩家下一回合无法操作 | 玩家 | 10 | 10 |
| inn | 客栈 | 再次触发当前地皮效果 | 无 | 10 | 10 |
| robbery | 抄家令 | 从指定1名其他玩家抽取一张道具卡 | 玩家 | 10 | 10 |
| thunder | 引雷符 | 指定地皮降一级，对未购买地皮和一级房屋无效 | 地皮 | 5 | 50 |
| explosion | 爆裂符 | 指定玩家爆炸受伤，就医失去1000 | 玩家 | 5 | 50 |
| tax | 征税令 | 向指定玩家征收2000 | 玩家 | 5 | 50 |
| deed | 地契 | 免费获得任意一块可购地皮 | 无 | 2 | 5000 |
| immunity | 免死金牌 | 破产时自动使用，重生并获得5000，使用后不放回 | 无 | 1 | 10000 |
| tombstone | 墓碑 | 获得时当场使用，指定地皮放置，踩中给予摆放玩家1000香火钱 | 地皮 | 4 | 0 |
| flower | 花束 | 获得时若未放置过墓碑便存放，否则当场使用并与墓碑放在一起 | 无 | 4 | 0 |

## 核心函数实现

### useItemCard

```typescript
function useItemCard(itemId: string, targetPlayerId?: string, targetTileId?: number): boolean {
  const player = currentPlayer.value
  const itemIndex = player.items.indexOf(itemId)

  switch (itemId) {
    case 'carriage':
      // 标记玩家可投双骰子
      player.items.splice(itemIndex, 1)
      return true

    case 'rock':
    case 'trap':
      // 放置到地皮
      const tile = gameState.value.board[targetTileId]
      if (!tile.placedItems) tile.placedItems = []
      tile.placedItems.push(itemId)
      player.items.splice(itemIndex, 1)
      return true

    case 'mousetrap':
      // 放置到地皮，踩中受伤
      // ...

    case 'broom':
      // 清除所有放置道具（除墓碑和花束）
      for (const t of gameState.value.board) {
        if (t.placedItems) {
          t.placedItems = t.placedItems.filter(id => id === 'tombstone' || id === 'flower')
        }
      }
      player.items.splice(itemIndex, 1)
      return true

    case 'wine':
      // 目标玩家跳过下回合
      target.stayTurns += 2
      player.items.splice(itemIndex, 1)
      return true

    case 'thunder':
      // 地皮降一级
      property.houseLevel--
      player.items.splice(itemIndex, 1)
      return true

    // ... 其他道具
  }
}
```

## 放置道具触发效果

玩家踩中带有放置道具的地皮时，触发 handleTilePlacedItems：

```typescript
function handleTilePlacedItems(player: Player, tile: Tile) {
  for (const itemId of tile.placedItems) {
    switch (itemId) {
      case 'rock':
      case 'trap':
        player.stayTurns += 1  // 停留1回合
        break
      case 'mousetrap':
        player.money -= 500   // 受伤就医
        break
      case 'tombstone':
        player.money -= 1000  // 香火钱
        break
    }
  }
}
```

## 使用后放回机制

根据需求4.3：道具卡使用后，排回道具卡堆最后

当前实现未完全按照此规则，需要后续优化。

## 验收标准

| 检查点 | 预期结果 |
|--------|---------|
| 奖励事件获得道具 | 随机获得一张道具卡，加入背包 |
| 道具栏显示 | 右侧显示拥有的道具图标和名称 |
| 点击使用 | 弹出使用效果 |
| 目标选择 | 对应目标类型的道具需要选择目标 |
| 效果生效 | 道具效果正确应用到目标 |
| 道具移除 | 消耗型从背包移除 |

## 相关文件

| 文件 | 作用 |
|------|------|
| `shared/cards.ts` | ITEM_CARDS数组，16种道具定义 |
| `frontend/src/stores/game.ts` | useItemCard函数 |
| `frontend/src/App.vue` | 道具栏UI，onUseItem函数 |
