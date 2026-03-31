<template>
  <div v-if="show" class="card-modal" @click.self="onClose">
    <!-- 抽卡动画层 -->
    <div v-if="isDrawing" class="draw-animation">
      <div class="draw-card" :style="drawStyle"></div>
    </div>

    <div class="card-content">
      <h3>{{ card.title || card.question || card.name }}</h3>
      <p v-if="card.type === 'poetry'" class="poetry-author">{{ (card as PoetryCard).author }}</p>
      <p v-else-if="card.type === 'quiz'" class="card-question">{{ (card as QuizCard).question }}</p>
      <p v-else-if="card.type === 'punishment'" class="punishment-name">{{ (card as PunishmentCard).name }}</p>

      <!-- 问答卡输入答案 -->
      <div v-if="card?.type === 'quiz'" class="answer-section">
        <input
          v-model="userAnswer"
          type="text"
          class="answer-input"
          placeholder="请输入答案"
          :disabled="answered"
          @keyup.enter="submitAnswer"
        >
        <button
          v-if="!answered"
          class="card-btn submit"
          @click="submitAnswer"
          :disabled="!userAnswer.trim()"
        >
          提交答案
        </button>
      </div>

      <div class="card-hint" v-if="card?.type !== 'punishment'">
        <span v-if="card.type === 'poetry'">完整 +{{ (card as PoetryCard).halfReward }}，部分 +100，错误 -200</span>
        <span v-else>回答正确 +{{ (card as QuizCard).reward }}</span>
      </div>

      <!-- 诗词卡输入答案 -->
      <div v-if="!answered && card?.type === 'poetry'" class="answer-section">
        <textarea
          v-model="poetryInput"
          class="poetry-input"
          placeholder="请输入背诵内容"
          :disabled="answered"
          rows="4"
        ></textarea>
        <button
          class="card-btn submit"
          @click="submitPoetryAnswer"
          :disabled="!poetryInput.trim()"
        >
          提交答案
        </button>
      </div>

      <!-- 问答卡结果 -->
      <div v-if="answered && card?.type === 'quiz'" class="card-result">
        {{ result ? '正确！' : '错误！' }} {{ result ? '+' : '' }}{{ result ? reward : 0 }}
      </div>

      <!-- 诗词卡结果 -->
      <div v-if="answered && card?.type === 'poetry'" class="card-result">
        {{ poetryResultText }}
      </div>

      <!-- 惩罚卡结果 -->
      <div v-if="card?.type === 'punishment'" class="punishment-result">
        {{ punishmentMessage }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { QuizCard, PoetryCard, PunishmentCard } from '@shared/cards'
import { checkQuizAnswer, checkPoetryAnswer } from '@shared/cards'

const props = defineProps<{
  show: boolean
  card: QuizCard | PoetryCard | PunishmentCard | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'answer', result: { type: 'quiz'; correct: boolean } | { type: 'poetry'; result: 'full' | 'half' | 'wrong' } | { type: 'punishment'; effect: string }): void
}>()

const isDrawing = ref(false)
const drawPosition = ref({ x: 0, y: 0 })
const drawScale = ref(1)

const drawStyle = computed(() => ({
  transform: `translate(${drawPosition.value.x}px, ${drawPosition.value.y}px) scale(${drawScale.value})`,
  opacity: drawScale.value < 0.5 ? drawScale.value : 1
}))

const answered = ref(false)
const result = ref(false)
const reward = ref(0)
const userAnswer = ref('')
const poetryInput = ref('')
const poetryResultValue = ref<'full' | 'half' | 'wrong'>('wrong')
const punishmentMessage = ref('')

const poetryResultText = computed(() => {
  if (!props.card || props.card.type !== 'poetry') return ''
  const pc = props.card as PoetryCard
  switch (poetryResultValue.value) {
    case 'full':
      return `完整！+${pc.halfReward || pc.reward}`
    case 'half':
      return `部分！+100`
    case 'wrong':
      return `错误！-200`
  }
})

watch(() => props.show, (newVal) => {
  if (newVal) {
    answered.value = false
    result.value = false
    reward.value = 0
    userAnswer.value = ''
    poetryInput.value = ''
    poetryResultValue.value = 'wrong'
    punishmentMessage.value = '惩罚生效中...'

    // 抽卡动画：卡片从屏幕上方飞入
    isDrawing.value = true
    drawPosition.value = { x: 0, y: -500 }
    drawScale.value = 0.5

    // 强制重绘
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // 动画执行：从上方飞到中心
        let progress = 0
        const duration = 600 // ms
        const startTime = performance.now()

        function animate(time: number) {
          const elapsed = time - startTime
          progress = Math.min(elapsed / duration, 1)

          // 缓动函数：easeOutCubic
          const ease = 1 - Math.pow(1 - progress, 3)

          drawPosition.value = { x: 0, y: -200 * (1 - ease) }
          drawScale.value = 0.5 + 0.5 * ease

          if (progress < 1) {
            requestAnimationFrame(animate)
          } else {
            // 动画结束，隐藏动画层
            isDrawing.value = false
          }
        }

        requestAnimationFrame(animate)
      })
    })

    // 惩罚卡：显示后自动执行并关闭
    if (props.card?.type === 'punishment') {
      setTimeout(() => {
        const pc = props.card as PunishmentCard
        punishmentMessage.value = `执行：${pc.name}`
        emit('answer', { type: 'punishment', effect: pc.effect })

        // 1.5秒后自动关闭
        setTimeout(() => {
          emit('close')
        }, 1500)
      }, 500)
    }
  }
})

function submitAnswer() {
  if (!props.card || props.card.type !== 'quiz') return

  const quizCard = props.card as QuizCard
  answered.value = true

  // 使用 checkQuizAnswer 检查答案
  const correct = checkQuizAnswer(quizCard, userAnswer.value)
  result.value = correct

  if (correct) {
    reward.value = quizCard.reward
  } else {
    reward.value = 0
  }

  emit('answer', { type: 'quiz', correct })
}

function submitPoetryAnswer() {
  if (!props.card || props.card.type !== 'poetry' || !poetryInput.value.trim()) return

  const poetryCard = props.card as PoetryCard
  answered.value = true

  // 系统自动判断背诵结果
  const poetryResult = checkPoetryAnswer(poetryCard, poetryInput.value)
  poetryResultValue.value = poetryResult

  switch (poetryResult) {
    case 'full':
      reward.value = poetryCard.halfReward || poetryCard.reward
      break
    case 'half':
      reward.value = 100
      break
    case 'wrong':
      reward.value = -200
      break
  }

  emit('answer', { type: 'poetry', result: poetryResult })
}

function onClose() {
  emit('close')
}
</script>

<style scoped>
.card-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.card-content {
  background: #fff8e7;
  border: 3px solid #8b4513;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  text-align: center;
}

.card-content h3 {
  color: #8b4513;
  margin: 0 0 12px 0;
  font-size: 20px;
}

.poetry-author {
  color: #666;
  font-size: 14px;
  margin: 0 0 12px 0;
}

.poetry-content {
  background: #f5e6d3;
  border-radius: 8px;
  padding: 16px;
  margin: 12px 0;
}

.poetry-content p {
  margin: 4px 0;
  line-height: 1.6;
  color: #333;
}

.card-question {
  font-size: 18px;
  color: #333;
  margin: 16px 0;
}

.punishment-name {
  font-size: 24px;
  color: #d32f2f;
  margin: 20px 0;
  font-weight: bold;
}

.punishment-result {
  font-size: 18px;
  color: #8b4513;
  margin-top: 16px;
}

.answer-section {
  margin: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.answer-input {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  border: 2px solid #8b4513;
  border-radius: 8px;
  font-family: 'Noto Serif SC', serif;
  text-align: center;
}

.answer-input:disabled {
  background: #f5f5f5;
}

.poetry-input {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  border: 2px solid #8b4513;
  border-radius: 8px;
  font-family: 'Noto Serif SC', serif;
  text-align: center;
  resize: vertical;
  min-height: 80px;
}

.poetry-input:disabled {
  background: #f5f5f5;
}

.card-btn.submit {
  background: #2196f3;
  border-color: #1976d2;
  color: #fff;
}

.card-btn.submit:hover:not(:disabled) {
  background: #42a5f5;
}

.card-btn.submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.card-hint {
  font-size: 14px;
  color: #ff6600;
  margin: 12px 0;
}

.card-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 16px;
}

.card-btn {
  padding: 10px 32px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  border: 2px solid;
  font-family: 'Noto Serif SC', serif;
}

.card-btn.full {
  background: #4caf50;
  border-color: #388e3c;
  color: #fff;
}

.card-btn.full:hover {
  background: #5cb860;
}

.card-btn.half {
  background: #ff9800;
  border-color: #e65100;
  color: #fff;
}

.card-btn.half:hover {
  background: #ffa726;
}

.card-btn.correct {
  background: #4caf50;
  border-color: #388e3c;
  color: #fff;
}

.card-btn.correct:hover {
  background: #5cb860;
}

.card-btn.wrong {
  background: #f44336;
  border-color: #d32f2f;
  color: #fff;
}

.card-btn.wrong:hover {
  background: #e53935;
}

.card-result {
  font-size: 24px;
  font-weight: bold;
  color: #8b4513;
  margin-top: 16px;
}

/* 抽卡动画 */
.draw-animation {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.draw-card {
  width: 160px;
  height: 240px;
  background: linear-gradient(135deg, #fff8e7, #fff);
  border: 3px solid #8b4513;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
}

.draw-card::before {
  content: '';
  position: absolute;
  width: 140px;
  height: 220px;
  border: 1px solid #8b4513;
  border-radius: 8px;
}

.draw-card::after {
  content: '抽卡中...';
  position: absolute;
  font-size: 14px;
  color: #8b4513;
  animation: pulse 0.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}
</style>
