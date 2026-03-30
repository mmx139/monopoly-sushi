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

// 格子颜色配置（基于 001_game_rules.md）
const TILE_COLORS: Record<string, string> = {
  start: '#98fb98',        // 起点 - 浅绿
  property: '#ffe4b5',      // 可购地皮 - 米色
  special: '#dda0dd',       // 特殊事件 - 浅紫
  poetry: '#ffd700',        // 诗词事件 - 橙色
  quiz: '#ffb6c1',         // 问答事件 - 浅红
  reward: '#87ceeb',        // 奖励事件 - 浅蓝
  punishment: '#d3d3d3',    // 惩罚事件 - 浅灰
  random: '#fffacd'         // 随机事件 - 浅黄
}

// 棋盘格子位置计算（正方形，4边）
function getTilePosition(tileIndex: number): { x: number; y: number } {
  const padding = 50
  const availableSize = boardSize - padding * 2
  const gridSize = availableSize / 18  // 18格一边（包含边角）

  // 0-17: 左边往上 (左下角起点，0在左下角)
  if (tileIndex <= 17) {
    return {
      x: padding,
      y: boardSize - padding - tileIndex * gridSize
    }
  }
  // 18-35: 上边往右 (左上角18到右上角35)
  if (tileIndex <= 35) {
    return {
      x: padding + (tileIndex - 18) * gridSize,
      y: padding
    }
  }
  // 36-53: 右边往下 (右上角36到右下角53)
  if (tileIndex <= 53) {
    return {
      x: boardSize - padding,
      y: padding + (tileIndex - 36) * gridSize
    }
  }
  // 54-71: 下边往左 (右下角54到左下角71，71的右边是0)
  return {
    x: boardSize - padding - (tileIndex - 54) * gridSize,
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

  const padding = 50
  const availableSize = boardSize - padding * 2
  const gridSize = availableSize / 18

  // 绘制外框
  ctx.strokeStyle = '#8b4513'
  ctx.lineWidth = 3
  ctx.strokeRect(padding, padding, availableSize, availableSize)

  // 绘制72格
  for (let i = 0; i < BOARD_TEMPLATES.length; i++) {
    const pos = getTilePosition(i)
    const tile = BOARD_TEMPLATES[i]

    // 格子背景色
    const bgColor = TILE_COLORS[tile.type] || '#fff8e7'
    ctx.fillStyle = bgColor
    ctx.fillRect(pos.x, pos.y, gridSize, gridSize)

    // 格子边框
    ctx.strokeStyle = '#8b4513'
    ctx.lineWidth = 1
    ctx.strokeRect(pos.x, pos.y, gridSize, gridSize)

    // 格子编号（右上角，小字）
    ctx.fillStyle = '#666'
    ctx.font = '8px sans-serif'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'top'
    ctx.fillText(String(i), pos.x + gridSize - 2, pos.y + 2)

    // 格子名称（居中，中等字）
    ctx.fillStyle = '#333'
    ctx.font = 'bold 10px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // 名称换行处理
    const name = tile.name
    if (name.length <= 4) {
      ctx.fillText(name, pos.x + gridSize / 2, pos.y + gridSize / 2)
    } else {
      // 长名称分成两行
      const mid = Math.floor(name.length / 2)
      ctx.fillText(name.substring(0, mid), pos.x + gridSize / 2, pos.y + gridSize / 2 - 6)
      ctx.fillText(name.substring(mid), pos.x + gridSize / 2, pos.y + gridSize / 2 + 6)
    }
  }

  // 绘制中间区域（待完善：卡堆、货币、房屋）
  drawCenterArea(ctx)

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

    // 计算玩家在格子内的偏移（同一格子可能多个玩家）
    const playerIndex = props.players.indexOf(player)
    const offsetX = (playerIndex % 2) * 8 - 4
    const offsetY = Math.floor(playerIndex / 2) * 8 - 4

    // 玩家标记
    ctx.beginPath()
    ctx.arc(pos.x + gridSize / 2 + offsetX, pos.y + gridSize / 2 + offsetY, 10, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()

    // 当前玩家光环
    if (player.id === props.currentPlayerId) {
      ctx.beginPath()
      ctx.arc(pos.x + gridSize / 2 + offsetX, pos.y + gridSize / 2 + offsetY, 14, 0, Math.PI * 2)
      ctx.strokeStyle = '#ffd700'
      ctx.lineWidth = 3
      ctx.stroke()
    }
  }
}

function drawCenterArea(ctx: CanvasRenderingContext2D) {
  const centerX = boardSize / 2
  const centerY = boardSize / 2
  const centerSize = boardSize - 100

  // 中心区域背景
  ctx.fillStyle = '#fff8e7'
  ctx.fillRect(centerX - centerSize / 2, centerY - centerSize / 2, centerSize, centerSize)
  ctx.strokeStyle = '#8b4513'
  ctx.lineWidth = 2
  ctx.strokeRect(centerX - centerSize / 2, centerY - centerSize / 2, centerSize, centerSize)

  // 中心文字
  ctx.fillStyle = '#8b4513'
  ctx.font = '14px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('一蓑烟雨任平生', centerX, centerY - 20)

  ctx.font = '12px sans-serif'
  ctx.fillStyle = '#666'
  ctx.fillText('棋盘中央', centerX, centerY + 10)
  ctx.fillText('（卡堆/货币待显示）', centerX, centerY + 30)
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
