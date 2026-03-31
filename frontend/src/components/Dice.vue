<template>
  <div class="dice-container">
    <div class="dice" :class="{ rolling: isRolling }" @click="onClick">
      <span v-if="value">{{ value }}</span>
      <span v-else class="placeholder">?</span>
    </div>
    <button v-if="canRoll" class="roll-btn" @click="onRoll" :disabled="isRolling">
      投骰子
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  value: number | null
  canRoll: boolean
}>()

const emit = defineEmits<{
  roll: []
}>()

const isRolling = ref(false)
let prevValue: number | null = null

function onRoll() {
  if (!props.canRoll || isRolling.value) return
  emit('roll')
}

function onClick() {
  if (props.canRoll && !isRolling.value) {
    onRoll()
  }
}

// 监听value变化时播放动画
watch(() => props.value, (newVal) => {
  if (newVal !== null && newVal !== prevValue) {
    prevValue = newVal
    // 新值，开始动画
    isRolling.value = true
    let count = 0
    const interval = setInterval(() => {
      count++
      if (count >= 10) {
        clearInterval(interval)
        isRolling.value = false
      }
    }, 80)
  }
})
</script>

<style scoped>
.dice-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.dice {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #f5f5f5, #e0e0e0);
  border: 3px solid #8b4513;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: bold;
  color: #333;
  cursor: pointer;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  transition: transform 0.1s;
}

.dice:hover:not(.rolling) {
  transform: scale(1.05);
}

.dice.rolling {
  animation: shake 0.5s infinite;
}

@keyframes shake {
  0%, 100% { transform: rotate(-5deg) }
  50% { transform: rotate(5deg) }
}

.placeholder {
  color: #999;
}

.roll-btn {
  padding: 10px 24px;
  font-size: 16px;
  background: linear-gradient(135deg, #d4a574, #c4956a);
  border: 2px solid #8b4513;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  font-family: 'Noto Serif SC', serif;
  transition: all 0.2s;
}

.roll-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #e0b588, #d4a574);
}

.roll-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
