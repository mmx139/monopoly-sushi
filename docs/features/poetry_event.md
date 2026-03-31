# 诗词事件系统

## 需求来源
- 需求文档001: 3.2.3 诗词事件（橙色底色）
- 需求文档001: 4.2 诗词题卡

## 功能描述

踩中橙色底的诗词事件格时，触发诗词背诵流程。玩家需在输入框输入背诵内容，系统自动判断断句/全诗。

## 触发条件

棋盘格子 `type === 'poetry'`

## 用户操作流程

```
1. [踩中格子] → 玩家移动到诗词格
        ↓
2. [系统判断] → 当前格子有没有定义的“效果”
              -"效果"定义为"抽一张诗词题卡"，跳转到4.
              -"效果"无定义,进行下一步
        ↓
3. [弹出选择] → 弹窗显示:
              -2行2个按钮 "抽诗词卡/背诵《取自当前格子名称的诗名》"
              -用户点击其中1个按钮"
              -如果点击"抽诗词卡",关闭当前弹窗，跳转到4
              -如果点击"背诵《诗名》",关闭当前弹窗，跳转到5
        ↓
4. [抽取动画] → 屏幕中间卡堆区域显示"抽取动画"
              （卡牌从诗词卡堆飞入中央）
        ↓
5. [弹出卡片] → CardModal弹窗显示：
              - 标题：诗词题目（如《念奴娇·赤壁怀古》）
              - 输入提示："请输入背诵内容"
              - 输入框：多行文本输入
              - 提交按钮
        ↓
6. [输入背诵] → 用户在输入框输入诗词（可输入部分或全文）
        ↓
7. [提交判断] → 用户点击"提交答案"
              系统调用 checkPoetryAnswer(card, userInput)
        ↓
8. [系统判断] → 自动判定：
              - 准确写出一句完整诗词（匹配任一断句）→ +100
              - 写出的一句诗词不符合任一完整诗句 → -200
              - 准确写出全诗（忽略标点，允许错3字）→ 赐予当前手头货币的一半
        ↓
9. [显示结果] → 弹出结果：
              - "完整！+{halfReward}"
              - "部分！+100"
              - "错误！-200"
        ↓
10. [自动关闭] → 2秒后自动关闭弹窗
              进入下一回合
```

## 系统判断逻辑

### checkPoetryAnswer 实现

```typescript
function checkPoetryAnswer(card: PoetryCard, userInput: string): 'full' | 'half' | 'wrong' {
  const normalized = userInput.trim().replace(/[，。？！、；：""''（）]/g, '')

  // 1. 先检查是否匹配任一完整诗句（断句）
  const sentences = card.fullText.split(/[。！？]/).filter(s => s.trim())
  for (const sentence of sentences) {
    const normalizedSentence = sentence.replace(/[，。？！、；：""''（）]/g, '').trim()
    if (normalizedSentence && (normalized.includes(normalizedSentence) || normalizedSentence.includes(normalized))) {
      return 'half'
    }
  }

  // 2. 检查是否匹配全诗（允许3个字符误差）
  const fullTextNormalized = card.fullText.replace(/[，。？！、；：""''（）]/g, '')
  if (isFullMatch(normalized, fullTextNormalized)) {
    return 'full'
  }

  // 3. 否则判定为错误
  return 'wrong'
}

// 全诗匹配：忽略标点，允许3个字符误差
function isFullMatch(input: string, full: string): boolean {
  if (input === full) return true
  const errors = countErrors(input, full)
  return errors <= 3
}

// 计算两个字符串的字符误差数
function countErrors(input: string, full: string): number {
  const maxLen = Math.max(input.length, full.length)
  if (maxLen === 0) return 0
  let errors = 0
  const minLen = Math.min(input.length, full.length)
  for (let i = 0; i < minLen; i++) {
    if (input[i] !== full[i]) errors++
  }
  errors += Math.abs(input.length - full.length)
  return errors
}
```

### 判断优先级

1. **部分正确** (half): 匹配任一完整诗句 → +100
2. **全诗正确** (full): 匹配全文，误差≤3字 → +halfReward
3. **错误** (wrong): 不匹配任何诗句 → -200

## 奖励规则（需求4.2）

| 判断结果 | 奖励/惩罚 |
|---------|----------|
| half 部分 | +100 |
| full 完整 | +halfReward (如500) |
| wrong 错误 | -200 |

## 状态流转

```
rolling → card(PoetryModal) → rolling
         (phase='card')       (autoEndTurn)
```

## 核心函数调用链

```
movePlayer(steps)
  → handleTileEffect(player, position)
      → case 'poetry':
          → drawPoetryCard()           // 抽取一张诗词卡
          → currentCard.value = card   // 设置当前卡牌
          → showCardModal.value = true
          → gameState.phase = 'card'   // 进入卡牌阶段

handleCardAnswer({ type: 'poetry', result })
  → 计算 reward
  → player.money += reward
  → showCardModal.value = false
  → autoEndTurn()
```

## 验收标准

| 检查点 | 预期结果 |
|--------|---------|
| 踩中诗词格 | 显示抽取动画，然后弹出CardModal |
| 显示诗词题目 | 正确显示诗词标题和全文 |
| 输入框 | 用户可在输入框输入文字 |
| 提交判断 | 点击提交后调用checkPoetryAnswer判断 |
| 完整正确 | 显示"完整！+{halfReward}" |
| 部分正确 | 显示"部分！+100" |
| 错误 | 显示"错误！-200" |
| 自动关闭 | 2秒后弹窗关闭，进入下一回合 |

## 题库（需求4.2）

共9首诗词，详见 `shared/cards.ts` POETRY_CARDS数组。

每首诗词包含：
- `title`: 诗词标题
- `author`: 作者
- `fullText`: 完整诗词原文
- `reward`: 答对奖励（full时给halfReward）
- `halfPenalty`: 惩罚
- `halfReward`: 全诗正确时赐予的货币（当前手头的一半）

## 与问答事件的区别

| 特征 | 问答事件 | 诗词事件 |
|------|---------|---------|
| 底色 | 浅红 | 橙色 |
| 用户输入 | 单行答案 | 多行诗词输入 |
| 判断方式 | checkQuizAnswer | checkPoetryAnswer |
| 结果类型 | 正确/错误 | full/half/wrong |
| 奖励 | +100或按地皮要求 | full:+halfReward, half:+100, wrong:-200 |
