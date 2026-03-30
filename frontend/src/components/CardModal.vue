<template>
  <div v-if="show" class="card-modal" @click.self="onClose">
    <div class="card-content">
      <h3>{{ card.title || card.question }}</h3>
      <p v-if="card.type === 'poetry'" class="poetry-author">{{ (card as PoetryCard).author }}</p>
      <div class="poetry-content" v-if="card.type === 'poetry'">
        <p v-for="(line, i) in (card as PoetryCard).content.split('。').filter(l => l)" :key="i">
          {{ line }}。
        </p>
      </div>
      <p v-else class="card-question">{{ (card as QuizCard).question }}</p>

      <div class="card-hint">
        <span v-if="card.type === 'poetry'">背诵正确 +{{ (card as PoetryCard).reward }}，错误 -{{ (card as PoetryCard).penalty }}</span>
        <span v-else>回答正确 +{{ (card as QuizCard).reward }}</span>
      </div>

      <div v-if="!answered" class="card-actions">
        <button class="card-btn correct" @click="onAnswer(true)">正确</button>
        <button class="card-btn wrong" @click="onAnswer(false)">错误</button>
      </div>
      <div v-else class="card-result">
        {{ result ? '正确！' : '错误！' }} {{ result ? '+' : '' }}{{ result ? reward : 0 }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { QuizCard, PoetryCard } from '@shared/cards'

const props = defineProps<{
  show: boolean
  card: QuizCard | PoetryCard | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'answer', correct: boolean): void
}>()

const answered = ref(false)
const result = ref(false)
const reward = ref(0)

watch(() => props.show, (newVal) => {
  if (newVal) {
    answered.value = false
    result.value = false
    reward.value = 0
  }
})

function onAnswer(correct: boolean) {
  answered.value = true
  result.value = correct
  if (correct) {
    reward.value = props.card?.type === 'poetry'
      ? (props.card as PoetryCard).reward
      : (props.card as QuizCard).reward
  } else {
    reward.value = props.card?.type === 'poetry'
      ? -(props.card as PoetryCard).penalty
      : 0
  }
  emit('answer', correct)
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
</style>
