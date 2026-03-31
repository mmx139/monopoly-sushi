# 问答事件系统

## 需求来源
- 需求文档001: 3.2.1 问答事件（浅红底色）
- 需求文档001: 4.1 问答卡

## 功能描述

踩中浅红色底的问答事件格时，触发问答抽卡流程。

## 触发条件

棋盘格子 `type === 'quiz'`

## 用户操作流程

```
1. [踩中格子] → 玩家移动到问答格
        ↓
2. [抽取动画] → 屏幕中间卡堆区域显示"抽取动画"
              （卡牌从问答卡堆飞入中央）
        ↓
3. [弹出卡片] → CardModal弹窗显示：
              - 问题内容（如"苏轼是哪个朝代的文学家？"）
              - 输入框提示"请输入答案"
              - 提交按钮
        ↓
4. [输入答案] → 用户在输入框输入答案
        ↓
5. [提交判断] → 用户点击"提交答案"
              系统调用 checkQuizAnswer(card, userInput)
        ↓
6. [显示结果] → 弹出结果：正确/错误
              - 正确：显示"+100"或地皮要求的奖励
              - 错误：显示"无奖励"
        ↓
7. [自动关闭] → 2秒后自动关闭弹窗
              进入下一回合
```

## 系统行为

### 状态流转

```
rolling → card(QuizModal) → rolling
         (phase='card')    (autoEndTurn)
```

### 核心函数调用链

```
movePlayer(steps)
  → handleTileEffect(player, position)
      → case 'quiz':
          → drawQuizCard()          // 抽取一张问答卡
          → currentCard.value = card // 设置当前卡牌
          → showCardModal.value = true
          → gameState.phase = 'card' // 进入卡牌阶段
```

### 奖励规则（需求4.1）

- 答对：按地皮要求奖励，或无地皮要求时+100
- 答错：无惩罚
- 使用后卡牌排回问答卡堆最后

### checkQuizAnswer 实现

```typescript
function checkQuizAnswer(card: QuizCard, userAnswer: string): boolean {
  // 标准化输入：去除标点符号
  const normalized = userAnswer.trim().replace(/[，。？！、；：""''（）]/g, '')
  // 遍历 answers 数组，匹配任意一个即算正确
  return card.answers.some(answer => {
    const normalizedAnswer = answer.replace(/[，。？！、；：""''（）]/g, '')
    // 答案匹配：用户答案包含标准答案，或标准答案包含用户答案
    return normalized.includes(normalizedAnswer) || normalizedAnswer.includes(normalized)
  })
}
```

## 验收标准

| 检查点 | 预期结果 |
|--------|---------|
| 踩中问答格 | 显示抽取动画，然后弹出CardModal |
| 显示问题 | 正确显示问答卡的问题内容 |
| 输入答案 | 用户可在输入框输入文字 |
| 提交判断 | 点击提交后调用checkQuizAnswer判断 |
| 正确奖励 | 答对显示"+100"或对应奖励 |
| 错误处理 | 答错显示"无奖励" |
| 自动关闭 | 2秒后弹窗关闭，进入下一回合 |

## 题库（需求4.1）

共15道问答，详见 `shared/cards.ts` QUIZ_CARDS数组。

每道题的 `answers` 是一个 JavaScript 数组，答对任意一个答案即算正确。

**判断逻辑**：`checkQuizAnswer` 使用 `answers.some()` 遍历，只要用户答案匹配数组中任意一个元素即可。
