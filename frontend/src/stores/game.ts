// 游戏状态管理
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { BOARD, getProperties } from '../../shared/board'
import { CHARACTERS, INITIAL_MONEY, BOARD_SIZE } from '../../shared/constants'
import type { Player, GameState, Tile, DiceResult } from '../../shared/types'

export const useGameStore = defineStore('game', () => {
  // 状态
  const gameState = ref<GameState>({
    board: BOARD,
    players: [],
    currentPlayerIndex: 0,
    phase: 'waiting',
    winner: null,
    turnNumber: 0
  })

  const lastDiceResult = ref<DiceResult | null>(null)

  // 计算属性
  const currentPlayer = computed(() => gameState.value.players[gameState.value.currentPlayerIndex])

  const isGameRunning = computed(() => gameState.value.phase !== 'waiting')

  // 初始化游戏
  function initGame(playerConfigs: { id: string; name: string; characterId: string; isAI: boolean }[]) {
    const players: Player[] = playerConfigs.map(config => ({
      id: config.id,
      name: config.name,
      characterId: config.characterId,
      position: 0,
      money: INITIAL_MONEY,
      properties: [],
      items: [],
      isAI: config.isAI,
      isBankrupt: false,
      stayTurns: 0
    }))

    gameState.value = {
      ...gameState.value,
      players,
      phase: 'rolling',
      turnNumber: 1
    }
  }

  // 投骰子
  function rollDice(): DiceResult {
    const value = Math.floor(Math.random() * 6) + 1
    const result = { value, canReroll: true }
    lastDiceResult.value = result
    return result
  }

  // 移动玩家
  function movePlayer(steps: number) {
    const player = currentPlayer.value
    if (!player || player.stayTurns > 0) {
      if (player && player.stayTurns > 0) {
        player.stayTurns--
      }
      return
    }

    const newPosition = (player.position + steps) % BOARD_SIZE
    player.position = newPosition

    gameState.value.phase = 'action'
  }

  // 结束回合
  function endTurn() {
    const nextIndex = (gameState.value.currentPlayerIndex + 1) % gameState.value.players.length
    gameState.value.currentPlayerIndex = nextIndex

    if (nextIndex === 0) {
      gameState.value.turnNumber++
    }

    gameState.value.phase = 'rolling'
    lastDiceResult.value = null
  }

  // 购买地皮
  function purchaseProperty(playerId: string, propertyId: number) {
    const player = gameState.value.players.find(p => p.id === playerId)
    if (!player) return false

    const property = getProperties().find(p => p.id === propertyId)
    if (!property || property.ownerId) return false

    if (player.money < property.basePrice) return false

    player.money -= property.basePrice
    player.properties.push(propertyId)
    property.ownerId = playerId
    property.houseLevel = 0

    return true
  }

  // 获取当前位置信息
  function getCurrentTile(): Tile {
    const player = currentPlayer.value
    if (!player) return BOARD[0]
    return BOARD[player.position]
  }

  return {
    gameState,
    currentPlayer,
    isGameRunning,
    lastDiceResult,
    initGame,
    rollDice,
    movePlayer,
    endTurn,
    purchaseProperty,
    getCurrentTile
  }
})
