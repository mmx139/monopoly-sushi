# 地皮系统

## 需求来源
- 需求文档001: 3.1 可购地皮（浅绿底色）
- 需求文档001: 3.1.1 购买/升级
- 需求文档001: 3.1.2 房屋等级
- 需求文档001: 3.1.3 奖金
- 需求文档001: 3.1.4 拍卖

## 功能描述

地皮系统是可购地皮的购买、升级、过路费收取和拍卖的核心系统。

## 触发条件

棋盘格子 `type === 'property'`

## 4种地皮状态及效果分支

踩中地皮时，根据地皮当前状态只能实现以下4种效果之一：

| 状态 | 条件 | 效果 |
|------|------|------|
| **空地** | ownerId === null | 可选择购买/不购买 |
| **自有地皮 Lv.1-2** | ownerId === player.id 且 houseLevel < 3 | 可选择升级/不升级 |
| **自有地皮 Lv.3** | ownerId === player.id 且 houseLevel === 3 | 获得奖金 |
| **他人地皮** | ownerId !== player.id | 支付过路费给地皮拥有者 |

### 效果一：空地购买

```
条件: property.ownerId === null

显示: "是否购买 {地皮名}？价格 {basePrice}"
选项: [购买] [跳过]

购买 → 扣除basePrice → 设置ownerId → 建造Lv.1房屋
跳过 → 无操作
```

### 效果二：自有地皮升级

```
条件: property.ownerId === player.id && property.houseLevel < 3

显示: "是否升级 {地皮名}？升级费 {upgradePrice}，升级后Lv.{houseLevel+1}"
选项: [升级] [跳过]

升级 → 扣除upgradePrice → houseLevel++

升级费用: 1000 (一级→二级)、800 (二级→三级)
```

### 效果三：自有地皮领取奖金

```
条件: property.ownerId === player.id && property.houseLevel === 3

显示: "{地皮名} 带来奖金 {bonus}"
奖金: Lv.1=100, Lv.2=150, Lv.3=200
```

### 效果四：他人地皮过路费

```
条件: property.ownerId !== player.id

显示: "支付过路费 {toll} 给 {ownerName}"
过路费: Lv.0=0, Lv.1=500, Lv.2=800, Lv.3=1000

如金钱足够: player.money -= toll; owner.money += toll
如金钱不足: player.isBankrupt = true; 转移地皮给owner
```

## 房屋升级规则（需求3.1.2）

| 当前等级 | 升级费用 | 过路费 | 奖金 |
|---------|---------|--------|------|
| 0 (无) | 1000 | 0 | - |
| 1 | 1000 | 500 | 100 |
| 2 | 800 | 800 | 150 |
| 3 | - | 1000 | 200 |

## 核心函数实现

### handleTileEffect (property分支)

```typescript
case 'property': {
  const property = tile as Property

  if (property.ownerId && property.ownerId !== player.id) {
    // 他人地皮 - 收取过路费
    const toll = HOUSE_TOLLS[property.houseLevel] || 0
    if (player.money >= toll) {
      player.money -= toll
      owner.money += toll
    } else {
      player.isBankrupt = true
      transferProperties(player.id, property.ownerId)
    }
    autoEndTurn()

  } else if (!property.ownerId) {
    // 空地皮 - 可购买
    pendingAction.value = 'buy'
    phase = 'action'

  } else {
    // 自有地皮
    if (property.houseLevel >= 3) {
      // 3级领取奖金
      const bonus = property.houseLevel * 50
      player.money += bonus
      autoEndTurn()
    } else {
      // 可升级
      pendingAction.value = 'upgrade'
      phase = 'action'
    }
  }
  break
}
```

## 状态流转

```
rolling → action(pendingAction='buy'/'upgrade') → rolling
                      ↓
                   [跳过] → autoEndTurn
                   [购买/升级] → 执行效果 → autoEndTurn
```

## 验收标准

| 检查点 | 预期结果 |
|--------|---------|
| 空地显示购买 | 显示"是否购买 X？"和购买/跳过按钮 |
| 购买成功 | 扣除金钱，设置ownerId，建造Lv.1 |
| 跳过不购买 | 无操作，继续下一回合 |
| 自有地皮显示升级 | 显示"是否升级 X？"和升级/跳过按钮 |
| 升级成功 | 扣除升级费，houseLevel++ |
| Lv.3显示奖金 | 显示奖金，自动领取 |
| 他人地皮收过路费 | 正确计算并转移金钱 |
| 破产检测 | 金钱不足时判定破产 |

## 相关文件

| 文件 | 作用 |
|------|------|
| `shared/board.ts` | BOARD_TEMPLATES，32块可购地皮数据 |
| `shared/types.ts` | Property类型定义 |
| `frontend/src/stores/game.ts` | handleTileEffect (property分支) |
