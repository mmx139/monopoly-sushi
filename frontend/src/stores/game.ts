// 游戏状态管理
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { BOARD_TEMPLATES, createBoard, getProperties, getPropertyById } from '@shared/board'
import { INITIAL_MONEY, BOARD_SIZE, HOUSE_TOLLS, HOUSE_UPGRADE_PRICE } from '@shared/constants'
import type { Player, GameState, Tile, DiceResult, Property } from '@shared/types'

export const useGameStore = defineStore('game', () => {
  // 状态
  const gameState = ref<GameState>({
    board: [],
    players: [],
    currentPlayerIndex: 0,
    phase: 'waiting',
    winner: null,
    turnNumber: 0
  })

  const lastDiceResult = ref<DiceResult | null>(null)
  const message = ref<string>('')

  // 计算属性
  const currentPlayer = computed(() => gameState.value.players[gameState.value.currentPlayerIndex])

  const isGameRunning = computed(() => gameState.value.phase !== 'waiting')

  // 获取当前可购地皮列表
  function getBoardProperties(): Property[] {
    return getProperties(gameState.value.board)
  }

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
      board: createBoard(),
      players,
      currentPlayerIndex: 0,
      phase: 'rolling',
      winner: null,
      turnNumber: 1
    }

    message.value = ''
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
    if (!player) return

    // 检查停留状态
    if (player.stayTurns > 0) {
      player.stayTurns--
      message.value = `${player.name} 停留 ${player.stayTurns + 1} 回合`
      endTurn()
      return
    }

    // 移动
    const oldPos = player.position
    const newPos = (oldPos + steps) % BOARD_SIZE
    player.position = newPos

    // 经过起点奖励
    if (newPos < oldPos) {
      player.money += 1000
      message.value = `${player.name} 经过起点，获得 1000`
    }

    // 处理地皮效果
    handleTileEffect(player, newPos)

    gameState.value.phase = 'action'

    // 检查胜利
    checkWinner()
  }

  // 处理地皮效果
  function handleTileEffect(player: Player, position: number) {
    const tile = gameState.value.board[position]

    switch (tile.type) {
      case 'property': {
        const property = tile as Property
        if (property.ownerId && property.ownerId !== player.id) {
          // 收取过路费
          const toll = HOUSE_TOLLS[property.houseLevel] || 0
          if (toll > 0 && player.money >= toll) {
            player.money -= toll
            const owner = gameState.value.players.find(p => p.id === property.ownerId)
            if (owner) {
              owner.money += toll
              message.value = `${player.name} 支付过路费 ${toll} 给 ${owner.name}`
            }
          } else if (toll > 0) {
            // 付不起过路费，破产
            player.isBankrupt = true
            message.value = `${player.name} 付不起过路费，破产！`
            // 将所有地皮转给所有者
            transferProperties(player.id, property.ownerId!)
          }
        } else if (!property.ownerId) {
          message.value = `${player.name} 来到了空地皮 ${property.name}`
        }
        break
      }
      case 'special':
        // 特殊事件（如丧母、丧父等）暂时设为停留
        if (tile.name.includes('丧母') || tile.name.includes('丧父') || tile.name.includes('通判')) {
          player.stayTurns = 3
          message.value = `${player.name} ${tile.name}，停留3回合`
        }
        break
      case 'start':
        // 起点效果
        message.value = `${player.name} 来到了 ${tile.name}`
        break
      default:
        message.value = `${player.name} 来到了 ${tile.name}`
    }
  }

  // 转移玩家所有地皮
  function transferProperties(fromPlayerId: string, toPlayerId: string) {
    const properties = getBoardProperties()
    for (const prop of properties) {
      if (prop.ownerId === fromPlayerId) {
        prop.ownerId = toPlayerId
        const toPlayer = gameState.value.players.find(p => p.id === toPlayerId)
        if (toPlayer) {
          toPlayer.properties.push(prop.id)
        }
      }
    }
  }

  // 购买地皮
  function purchaseProperty(playerId: string, propertyId: number): boolean {
    const player = gameState.value.players.find(p => p.id === playerId)
    if (!player) return false

    const property = getPropertyById(gameState.value.board, propertyId)
    if (!property || property.ownerId) return false

    if (player.money < property.basePrice) {
      message.value = `${player.name} 金钱不足`
      return false
    }

    player.money -= property.basePrice
    player.properties.push(propertyId)
    property.ownerId = playerId
    property.houseLevel = 0

    message.value = `${player.name} 购买了 ${property.name}`
    return true
  }

  // 升级房屋
  function upgradeProperty(playerId: string, propertyId: number): boolean {
    const player = gameState.value.players.find(p => p.id === playerId)
    if (!player) return false

    const property = getPropertyById(gameState.value.board, propertyId)
    if (!property || property.ownerId !== playerId) return false

    if (property.houseLevel >= 3) {
      message.value = `${property.name} 已达最高级`
      return false
    }

    const upgradePrice = HOUSE_UPGRADE_PRICE
    if (player.money < upgradePrice) {
      message.value = `${player.name} 金钱不足`
      return false
    }

    player.money -= upgradePrice
    property.houseLevel++

    message.value = `${player.name} 将 ${property.name} 升级为 Lv.${property.houseLevel}`
    return true
  }

  // 结束回合
  function endTurn() {
    // 检查是否只剩一个玩家
    const activePlayers = gameState.value.players.filter(p => !p.isBankrupt)
    if (activePlayers.length <= 1) {
      gameState.value.winner = activePlayers[0]?.id || null
      gameState.value.phase = 'ending'
      message.value = `游戏结束！胜利者：${activePlayers[0]?.name}`
      return
    }

    // 下一个玩家
    let nextIndex = (gameState.value.currentPlayerIndex + 1) % gameState.value.players.length
    while (gameState.value.players[nextIndex].isBankrupt) {
      nextIndex = (nextIndex + 1) % gameState.value.players.length
    }

    gameState.value.currentPlayerIndex = nextIndex

    if (nextIndex === 0) {
      gameState.value.turnNumber++
    }

    gameState.value.phase = 'rolling'
    lastDiceResult.value = null
  }

  // 检查胜利者
  function checkWinner() {
    const activePlayers = gameState.value.players.filter(p => !p.isBankrupt)
    if (activePlayers.length === 1) {
      gameState.value.winner = activePlayers[0].id
      gameState.value.phase = 'ending'
      message.value = `游戏结束！胜利者：${activePlayers[0].name}`
    }
  }

  // 获取当前位置信息
  function getCurrentTile(): Tile | null {
    const player = currentPlayer.value
    if (!player) return null
    return gameState.value.board[player.position]
  }

  return {
    gameState,
    currentPlayer,
    isGameRunning,
    lastDiceResult,
    message,
    initGame,
    rollDice,
    movePlayer,
    purchaseProperty,
    upgradeProperty,
    endTurn,
    getCurrentTile,
    getBoardProperties
  }
})
