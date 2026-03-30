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
const boardSize = 900
const padding = 50

// 格子颜色配置（基于 001_game_rules.md）
const TILE_COLORS: Record<string, string> = {
  start: '#98fb98',        // 起点 - 浅绿
  property: '#90EE90',      // 可购地皮 - 浅绿色
  special: '#dda0dd',       // 特殊事件 - 浅紫
  poetry: '#ffd700',        // 诗词事件 - 橙色
  quiz: '#ffb6c1',         // 问答事件 - 浅红
  reward: '#87ceeb',        // 奖励事件 - 浅蓝
  punishment: '#d3d3d3',    // 惩罚事件 - 浅灰
  random: '#fffacd'         // 随机事件 - 浅黄
}

// 棋盘格子位置计算（正方形，4边）
// 每边18格（包含边角），外圈68格 + 内圈4个边角 = 72
function getTilePosition(tileIndex: number): { x: number; y: number } {
  const availableSize = boardSize - padding * 2
  const gridSize = availableSize / 18  // 18格一边

  // 0-17: 左边往上 (左下角起点0，到左上角17)
  if (tileIndex <= 17) {
    return {
      x: padding,
      y: boardSize - padding - (tileIndex + 1) * gridSize
    }
  }
  // 18-35: 上边往右 (左上角18，到右上角35)
  if (tileIndex <= 35) {
    return {
      x: padding + (tileIndex - 18 + 1) * gridSize,
      y: padding
    }
  }
  // 36-53: 右边往下 (右上角36，到右下角53)
  if (tileIndex <= 53) {
    return {
      x: boardSize - padding,
      y: padding + (tileIndex - 36 + 1) * gridSize
    }
  }
  // 54-71: 下边往左 (右下角54，到左下角71)
  return {
    x: boardSize - padding - (tileIndex - 54 + 1) * gridSize,
    y: boardSize - padding
  }
}

function drawBoard() {
  const canvas = canvasRef.value
  if (!canvas) {
    console.log('Canvas not found')
    return
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    console.log('Context not found')
    return
  }

  // 清空画布
  ctx.fillStyle = '#f5e6d3'
  ctx.fillRect(0, 0, boardSize, boardSize)

  const availableSize = boardSize - padding * 2
  const gridSize = availableSize / 18
  const centerX = padding + availableSize / 2
  const centerY = padding + availableSize / 2

  console.log(`Drawing board: size=${boardSize}, padding=${padding}, gridSize=${gridSize}`)
  console.log(`BOARD_TEMPLATES length: ${BOARD_TEMPLATES.length}`)

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
    ctx.fillRect(pos.x, pos.y, gridSize - 2, gridSize - 2)  // 减2让格子之间有缝隙

    // 格子边框
    ctx.strokeStyle = '#8b4513'
    ctx.lineWidth = 1
    ctx.strokeRect(pos.x, pos.y, gridSize - 2, gridSize - 2)

    // 格子编号（右上角，小字）
    ctx.fillStyle = '#666'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'top'
    ctx.fillText(String(tile.id), pos.x + gridSize - 4, pos.y + 2)

    // 格子名称（居中，2行显示）
    ctx.fillStyle = '#333'
    ctx.font = 'bold 11px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const name = tile.name
    const mid = Math.floor(name.length / 2)
    ctx.fillText(name.substring(0, mid), pos.x + gridSize / 2, pos.y + gridSize / 2 - 5)
    ctx.fillText(name.substring(mid), pos.x + gridSize / 2, pos.y + gridSize / 2 + 5)
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

    const playerIndex = props.players.indexOf(player)
    const offsetX = (playerIndex % 2) * 8 - 4
    const offsetY = Math.floor(playerIndex / 2) * 8 - 4

    ctx.beginPath()
    ctx.arc(pos.x + gridSize / 2 + offsetX, pos.y + gridSize / 2 + offsetY, 8, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()

    if (player.id === props.currentPlayerId) {
      ctx.beginPath()
      ctx.arc(pos.x + gridSize / 2 + offsetX, pos.y + gridSize / 2 + offsetY, 12, 0, Math.PI * 2)
      ctx.strokeStyle = '#ffd700'
      ctx.lineWidth = 3
      ctx.stroke()
    }
  }

  // 绘制中间区域
  drawCenterArea(ctx, centerX, centerY, gridSize)
}

function drawCenterArea(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, gridSize: number) {
  // 中间区域尺寸
  const cardWidth = gridSize * 2
  const cardHeight = gridSize * 1.5
  const cardGap = gridSize * 0.3

  // 卡堆颜色
  const cardColors: Record<string, string> = {
    quiz: '#ffb6c1',      // 问答卡 - 浅红
    poetry: '#ffd700',     // 诗词卡 - 金色
    item: '#87ceeb',       // 道具卡 - 浅蓝
    punishment: '#d3d3d3', // 惩罚卡 - 浅灰
    reward: '#90EE90'      // 奖励卡 - 浅绿
  }

  // 卡堆配置
  const cardStacks = [
    { type: 'quiz', name: '问答卡', x: -cardWidth - cardGap, y: -cardHeight - cardGap },
    { type: 'poetry', name: '诗词卡', x: 0, y: -cardHeight - cardGap },
    { type: 'item', name: '道具卡', x: cardWidth + cardGap, y: -cardHeight - cardGap },
    { type: 'punishment', name: '惩罚卡', x: -cardWidth - cardGap, y: 0 },
    { type: 'reward', name: '奖励卡', x: cardWidth + cardGap, y: 0 }
  ]

  // 绘制每个卡堆
  for (const stack of cardStacks) {
    const x = centerX + stack.x
    const y = centerY + stack.y
    const color = cardColors[stack.type] || '#fff'

    // 绘制卡片背景
    ctx.fillStyle = color
    ctx.fillRect(x, y, cardWidth, cardHeight)

    // 卡片边框
    ctx.strokeStyle = '#8b4513'
    ctx.lineWidth = 2
    ctx.strokeRect(x, y, cardWidth, cardHeight)

    // 卡片名称
    ctx.fillStyle = '#333'
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(stack.name, x + cardWidth / 2, y + cardHeight / 2)

    // 绘制堆叠效果（3张卡片偏移）
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    for (let i = 1; i <= 3; i++) {
      ctx.fillRect(x + i * 2, y - i * 2, cardWidth, cardHeight)
    }
  }

  // 绘制货币图标（中央）
  ctx.fillStyle = '#ffd700'
  ctx.beginPath()
  ctx.arc(centerX, centerY, gridSize * 0.8, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#8b4513'
  ctx.lineWidth = 3
  ctx.stroke()

  ctx.fillStyle = '#333'
  ctx.font = 'bold 16px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('💰', centerX, centerY)
}

onMounted(() => {
  console.log('Board mounted, drawing...')
  drawBoard()
})

watch(() => [props.players, props.currentPlayerId], () => {
  console.log('Props changed, redrawing...')
  drawBoard()
}, { deep: true })
</script>

<style scoped>
.board-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  margin-top: 0;
}

.board {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  overflow: hidden;
}
</style>
