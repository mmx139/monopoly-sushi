<template>
  <div class="board-container">
    <div class="board">
      <canvas ref="canvasRef" :width="boardSize" :height="boardSize"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { BOARD_TEMPLATES } from '@shared/board'
import type { Player } from '@shared/types'

const props = defineProps<{
  players: Player[]
  currentPlayerId: string | null
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const boardSize = 600

// 棋盘格子位置计算（正方形，4边）
function getTilePosition(tileIndex: number): { x: number; y: number } {
  const padding = 40
  const gridSize = (boardSize - padding * 2) / 17  // 每边17格

  // 0-17: 左边往上 (左下角起点)
  if (tileIndex <= 17) {
    return {
      x: padding,
      y: boardSize - padding - tileIndex * gridSize
    }
  }
  // 18-36: 上边往右 (左上角到右上角)
  if (tileIndex <= 36) {
    return {
      x: padding + (tileIndex - 18) * gridSize,
      y: padding
    }
  }
  // 37-54: 右边往下 (右上角到右下角)
  if (tileIndex <= 54) {
    return {
      x: boardSize - padding,
      y: padding + (tileIndex - 37) * gridSize
    }
  }
  // 55-71: 下边往左 (右下角到左下角)
  return {
    x: boardSize - padding - (tileIndex - 55) * gridSize,
    y: boardSize - padding
  }
}

function drawBoard() {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 清空画布
  ctx.fillStyle = '#f5e6d3'
  ctx.fillRect(0, 0, boardSize, boardSize)

  // 绘制棋盘背景
  ctx.strokeStyle = '#8b4513'
  ctx.lineWidth = 3

  // 外框
  const padding = 40
  ctx.strokeRect(padding, padding, boardSize - padding * 2, boardSize - padding * 2)

  // 绘制72格
  const gridSize = (boardSize - padding * 2) / 17

  for (let i = 0; i < BOARD_TEMPLATES.length; i++) {
    const pos = getTilePosition(i)
    const tile = BOARD_TEMPLATES[i]

    // 格子背景色
    let bgColor = '#fff8e7'
    if (tile.type === 'property') bgColor = '#ffe4b5'
    if (tile.type === 'special') bgColor = '#ffd700'
    if (tile.type === 'start') bgColor = '#98fb98'
    if (tile.type === 'poetry' || tile.type === 'quiz') bgColor = '#add8e6'
    if (tile.type === 'reward') bgColor = '#90ee90'
    if (tile.type === 'punishment') bgColor = '#ffb6c1'

    ctx.fillStyle = bgColor
    ctx.fillRect(pos.x, pos.y, gridSize, gridSize)

    // 格子边框
    ctx.strokeStyle = '#8b4513'
    ctx.lineWidth = 1
    ctx.strokeRect(pos.x, pos.y, gridSize, gridSize)

    // 格子编号
    ctx.fillStyle = '#333'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(i), pos.x + gridSize / 2, pos.y + gridSize / 2)
  }

  // 绘制玩家位置
  for (const player of props.players) {
    const pos = getTilePosition(player.position)
    const charColors: Record<string, string> = {
      sushi: '#ff6b6b',
      suzhe: '#4ecdc4',
      wanganshi: '#9b59b6',
      zhanghuaimin: '#f39c12'
    }
    const color = charColors[player.characterId] || '#333'

    // 玩家标记
    ctx.beginPath()
    ctx.arc(pos.x + gridSize / 2, pos.y + gridSize / 2, 12, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()

    // 当前玩家光环
    if (player.id === props.currentPlayerId) {
      ctx.beginPath()
      ctx.arc(pos.x + gridSize / 2, pos.y + gridSize / 2, 16, 0, Math.PI * 2)
      ctx.strokeStyle = '#ffd700'
      ctx.lineWidth = 3
      ctx.stroke()
    }
  }
}

onMounted(() => {
  drawBoard()
})

watch(() => [props.players, props.currentPlayerId], () => {
  drawBoard()
}, { deep: true })
</script>

<style scoped>
.board-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.board {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  overflow: hidden;
}
</style>
