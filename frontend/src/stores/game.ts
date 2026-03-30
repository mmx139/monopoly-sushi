// 游戏状态管理
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { BOARD_TEMPLATES, createBoard, getProperties, getPropertyById } from '@shared/board'
import { INITIAL_MONEY, BOARD_SIZE, HOUSE_TOLLS, HOUSE_UPGRADE_PRICE } from '@shared/constants'
import type { Player, GameState, Tile, DiceResult, Property } from '@shared/types'
import { aiMakeDecision } from './ai'
import { drawQuizCard, drawPoetryCard } from '@shared/cards'
import type { QuizCard, PoetryCard } from '@shared/cards'

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
  const pendingAction = ref<'buy' | 'upgrade' | 'toll' | null>(null)

  // 卡牌相关状态
  const currentCard = ref<QuizCard | PoetryCard | null>(null)
  const showCardModal = ref(false)

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
    pendingAction.value = null
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
      // 停留后自动结束回合
      autoEndTurn()
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
  }

  // 处理地皮效果
  function handleTileEffect(player: Player, position: number) {
    const tile = gameState.value.board[position]

    switch (tile.type) {
      case 'property': {
        const property = tile as Property
        if (property.ownerId && property.ownerId !== player.id) {
          // 他人地皮 - 收取过路费
          const toll = HOUSE_TOLLS[property.houseLevel] || 0
          if (toll > 0) {
            if (player.money >= toll) {
              player.money -= toll
              const owner = gameState.value.players.find(p => p.id === property.ownerId)
              if (owner) {
                owner.money += toll
                message.value = `${player.name} 支付过路费 ${toll} 给 ${owner.name}`
              }
            } else {
              // 付不起过路费，破产
              player.isBankrupt = true
              message.value = `${player.name} 付不起过路费 ${toll}，破产！`
              transferProperties(player.id, property.ownerId!)
            }
          }
          autoEndTurn()
        } else if (!property.ownerId) {
          // 空地皮 - 可购买
          message.value = `${player.name} 来到了空地皮 ${property.name}，可选择购买`
          pendingAction.value = 'buy'
          gameState.value.phase = 'action'
        } else {
          // 自有地皮 - 检查是否可升级或领取奖金
          if (property.houseLevel >= 3) {
            // 3级地皮领取奖金
            const bonus = property.houseLevel * 50  // Lv3 = 200
            player.money += bonus
            message.value = `${player.name} 的 ${property.name} 带来奖金 ${bonus}`
            autoEndTurn()
          } else {
            // 可升级
            message.value = `${player.name} 的 ${property.name} Lv.${property.houseLevel}，可升级`
            pendingAction.value = 'upgrade'
            gameState.value.phase = 'action'
          }
        }
        break
      }
      case 'special': {
        // 特殊事件
        const effect = tile.effect || ''
        const desc = tile.description || ''

        // 丧母/丧父/通判 - 停留3回合
        if (desc.includes('丧母') || desc.includes('丧父') || desc.includes('通判')) {
          player.stayTurns = 3
          message.value = `${player.name} ${tile.name}，原地停留3回合`
          autoEndTurnWithStay()
        } else if (desc.includes('王安石变法')) {
          player.money -= 1000
          message.value = `${player.name} 遭受王安石变法，失去 1000`
          autoEndTurn()
        } else if (desc.includes('乌台诗案')) {
          // 乌台诗案 - 资产扣除到1000
          if (player.money <= 1000) {
            player.isBankrupt = true
            message.value = `${player.name} 乌台诗案，资产不足1000，破产！`
            transferProperties(player.id, getNextPlayerId())
          } else {
            player.money = 1000
            message.value = `${player.name} 乌台诗案，资产扣除到 1000`
          }
          autoEndTurn()
        } else if (desc.includes('入土为安')) {
          // 获得墓碑卡（待实现道具系统）
          message.value = `${player.name} ${tile.name}，获得墓碑卡`
          autoEndTurn()
        } else if (desc.includes('兄弟团聚')) {
          // 获得花束卡
          message.value = `${player.name} ${tile.name}，获得花束卡`
          autoEndTurn()
        } else if (desc.includes('追赠太师') || desc.includes('谥号')) {
          // 抽2张道具卡（待实现）
          message.value = `${player.name} ${tile.name}，抽2张道具卡`
          autoEndTurn()
        } else if (desc.includes('连续五贬')) {
          // 抽5张惩罚卡（待实现）
          message.value = `${player.name} ${tile.name}，抽5张惩罚卡`
          autoEndTurn()
        } else if (desc.includes('原地停留')) {
          // 通用停留效果
          const stayMatch = effect.match(/原地停留(\d+)回合/)
          if (stayMatch) {
            player.stayTurns = parseInt(stayMatch[1])
            message.value = `${player.name} ${tile.name}，原地停留${player.stayTurns}回合`
          } else {
            message.value = `${player.name} 来到了 ${tile.name}`
          }
          autoEndTurnWithStay()
        } else {
          message.value = `${player.name} 来到了 ${tile.name}`
          autoEndTurn()
        }
        break
      }
      case 'quiz': {
        // 问答事件 - 抽问答卡
        const card = drawQuizCard()
        currentCard.value = card
        showCardModal.value = true
        message.value = `${player.name} 来到了 ${tile.name}，请回答问题！`
        gameState.value.phase = 'card'
        break
      }
      case 'poetry': {
        // 诗词事件 - 抽诗词卡
        const card = drawPoetryCard()
        currentCard.value = card
        showCardModal.value = true
        message.value = `${player.name} 来到了 ${tile.name}，请背诵诗词！`
        gameState.value.phase = 'card'
        break
      }
      case 'reward': {
        // 奖励事件 - 随机获得道具卡（待实现）
        message.value = `${player.name} 来到了 ${tile.name}，获得随机道具卡（道具系统待实现）`
        // TODO: 实现道具系统
        autoEndTurn()
        break
      }
      case 'punishment': {
        // 惩罚事件 - 投骰子决定（待实现）
        message.value = `${player.name} 来到了 ${tile.name}（惩罚系统待实现）`
        // TODO: 实现惩罚系统
        autoEndTurn()
        break
      }
      case 'random': {
        // 随机事件 - 投骰子，单数惩罚卡，双数道具卡
        const dice = Math.floor(Math.random() * 6) + 1
        if (dice % 2 === 1) {
          message.value = `${player.name} 随机事件：骰子${dice}点，单数！抽取惩罚卡（待实现）`
        } else {
          message.value = `${player.name} 随机事件：骰子${dice}点，双数！抽取道具卡（待实现）`
        }
        // TODO: 实现卡牌系统
        autoEndTurn()
        break
      }
      default:
        autoEndTurn()
    }
  }

  // 自动结束回合（处理破产检测）
  function autoEndTurn() {
    // 检查是否只剩一个玩家
    const activePlayers = gameState.value.players.filter(p => !p.isBankrupt)
    if (activePlayers.length <= 1) {
      gameState.value.winner = activePlayers[0]?.id || null
      gameState.value.phase = 'ending'
      message.value = `游戏结束！胜利者：${activePlayers[0]?.name}`
      return
    }

    // 如果当前玩家破产，跳过
    if (currentPlayer.value?.isBankrupt) {
      skipBankruptPlayer()
    } else if (!pendingAction.value) {
      // 没有待处理动作，自动进入下一玩家
      endTurn()
    }
    // 有待处理动作时，保持 action 阶段让玩家选择
  }

  // 自动结束回合并停留（下回合跳过投骰子）
  function autoEndTurnWithStay() {
    // 检查是否只剩一个玩家
    const activePlayers = gameState.value.players.filter(p => !p.isBankrupt)
    if (activePlayers.length <= 1) {
      gameState.value.winner = activePlayers[0]?.id || null
      gameState.value.phase = 'ending'
      message.value = `游戏结束！胜利者：${activePlayers[0]?.name}`
      return
    }

    // 如果当前玩家破产，跳过
    if (currentPlayer.value?.isBankrupt) {
      skipBankruptPlayer()
    } else {
      // 直接进入下一玩家（停留效果已在movePlayer中设置）
      endTurn()
    }
  }

  // 获取下一个玩家ID（用于破产时转移地皮）
  function getNextPlayerId(): string {
    let nextIndex = (gameState.value.currentPlayerIndex + 1) % gameState.value.players.length
    let attempts = 0
    while (gameState.value.players[nextIndex].isBankrupt && attempts < gameState.value.players.length) {
      nextIndex = (nextIndex + 1) % gameState.value.players.length
      attempts++
    }
    return gameState.value.players[nextIndex]?.id || ''
  }

  // 跳过破产玩家
  function skipBankruptPlayer() {
    let nextIndex = (gameState.value.currentPlayerIndex + 1) % gameState.value.players.length
    let attempts = 0
    while (gameState.value.players[nextIndex].isBankrupt && attempts < gameState.value.players.length) {
      nextIndex = (nextIndex + 1) % gameState.value.players.length
      attempts++
    }
    gameState.value.currentPlayerIndex = nextIndex
    if (nextIndex === 0) {
      gameState.value.turnNumber++
    }
    gameState.value.phase = 'rolling'
    lastDiceResult.value = null
    pendingAction.value = null
  }

  // 转移玩家所有地皮
  function transferProperties(fromPlayerId: string, toPlayerId: string) {
    const properties = getBoardProperties()
    for (const prop of properties) {
      if (prop.ownerId === fromPlayerId) {
        prop.ownerId = toPlayerId
      }
    }
    // 从原玩家属性列表移除
    const fromPlayer = gameState.value.players.find(p => p.id === fromPlayerId)
    if (fromPlayer) {
      fromPlayer.properties = []
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
    property.houseLevel = 1  // 购买时建造一级房屋

    message.value = `${player.name} 购买了 ${property.name}，建造 Lv.1 房屋`
    pendingAction.value = null
    autoEndTurn()
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
    pendingAction.value = null
    autoEndTurn()
    return true
  }

  // 跳过购买/升级（不执行任何操作直接结束回合）
  function skipAction() {
    pendingAction.value = null
    autoEndTurn()
  }

  // 结束回合
  function endTurn() {
    pendingAction.value = null

    // 下一个玩家
    let nextIndex = (gameState.value.currentPlayerIndex + 1) % gameState.value.players.length

    // 跳过破产玩家
    let attempts = 0
    while (gameState.value.players[nextIndex].isBankrupt && attempts < gameState.value.players.length) {
      nextIndex = (nextIndex + 1) % gameState.value.players.length
      attempts++
    }

    gameState.value.currentPlayerIndex = nextIndex

    if (nextIndex === 0) {
      gameState.value.turnNumber++
    }

    gameState.value.phase = 'rolling'
    lastDiceResult.value = null

    // 检查是否需要跳过（停留）
    const player = currentPlayer.value
    if (player && player.stayTurns > 0) {
      player.stayTurns--
      message.value = `${player.name} 停留中，剩余 ${player.stayTurns} 回合`
      // 停留玩家直接进入下一回合
      setTimeout(() => {
        if (gameState.value.phase === 'rolling') {
          endTurn()
        }
      }, 500)
    }
  }

  // 获取当前位置信息
  function getCurrentTile(): Tile | null {
    const player = currentPlayer.value
    if (!player) return null
    return gameState.value.board[player.position]
  }

  // AI回合处理
  function takeAITurn() {
    const player = currentPlayer.value
    if (!player || !player.isAI) return

    // AI延迟思考后投骰子
    setTimeout(() => {
      if (gameState.value.phase !== 'rolling') return

      const result = rollDice()
      if (result.value) {
        movePlayer(result.value)
        // 移动后如果需要AI决策，进入AI决策流程
        if (gameState.value.phase === 'action' && pendingAction.value) {
          aiHandleAction()
        }
      }
    }, 1000)
  }

  // AI处理待定动作（购买/升级）
  function aiHandleAction() {
    const player = currentPlayer.value
    if (!player || !player.isAI) return

    const currentTile = getCurrentTile()
    const decision = aiMakeDecision(player, currentTile, player.money)

    setTimeout(() => {
      if (decision === 'buy' && pendingAction.value === 'buy') {
        if (currentTile && currentTile.type === 'property') {
          purchaseProperty(player.id, currentTile.id)
        }
      } else if (decision === 'upgrade' && pendingAction.value === 'upgrade') {
        if (currentTile && currentTile.type === 'property') {
          upgradeProperty(player.id, currentTile.id)
        }
      } else {
        skipAction()
      }
    }, 800)
  }

  // 处理卡牌答题结果
  function handleCardAnswer(correct: boolean) {
    const player = currentPlayer.value
    if (!player) return

    let reward = 0
    if (currentCard.value?.type === 'quiz') {
      reward = correct ? (currentCard.value as QuizCard).reward : 0
    } else if (currentCard.value?.type === 'poetry') {
      reward = correct ? (currentCard.value as PoetryCard).reward : -(currentCard.value as PoetryCard).penalty
    }

    player.money += reward
    showCardModal.value = false
    currentCard.value = null

    if (reward > 0) {
      message.value = `${player.name} 回答正确，获得 ${reward}！`
    } else if (reward < 0) {
      message.value = `${player.name} 回答错误，损失 ${-reward}！`
    } else {
      message.value = `${player.name} 回答错误，无奖励无惩罚`
    }

    gameState.value.phase = 'rolling'
    setTimeout(() => autoEndTurn(), 500)
  }

  // 关闭卡牌界面
  function closeCardModal() {
    showCardModal.value = false
    currentCard.value = null
    gameState.value.phase = 'rolling'
    autoEndTurn()
  }

  return {
    gameState,
    currentPlayer,
    isGameRunning,
    lastDiceResult,
    message,
    pendingAction,
    showCardModal,
    currentCard,
    initGame,
    rollDice,
    movePlayer,
    purchaseProperty,
    upgradeProperty,
    skipAction,
    endTurn,
    getCurrentTile,
    getBoardProperties,
    takeAITurn,
    aiHandleAction,
    handleCardAnswer,
    closeCardModal
  }
})
