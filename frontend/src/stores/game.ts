// 游戏状态管理
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { BOARD_TEMPLATES, createBoard, getProperties, getPropertyById } from '@shared/board'
import { INITIAL_MONEY, BOARD_SIZE, HOUSE_TOLLS, HOUSE_UPGRADE_PRICE } from '@shared/constants'
import type { Player, GameState, Tile, DiceResult, Property, PlacedItem } from '@shared/types'
import { aiMakeDecision } from './ai'
import { drawQuizCard, drawPoetryCard, drawPunishmentCard, drawItemCard } from '@shared/cards'
import type { QuizCard, PoetryCard, PunishmentCard, ItemCard } from '@shared/cards'

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

  // 联机相关状态
  const isMultiplayer = ref(false)
  const roomId = ref<string | null>(null)
  const localPlayerId = ref<string | null>(null)

  // 联机回调函数
  let broadcastAction: ((action: string, payload: any) => void) | null = null
  let syncGameState: ((state: GameState) => void) | null = null

  // 设置联机回调
  function setMultiplayerCallbacks(
    broadcast: (action: string, payload: any) => void,
    sync: (state: GameState) => void
  ) {
    broadcastAction = broadcast
    syncGameState = sync
  }

  // 开始联机模式
  function startMultiplayer(rid: string, pid: string) {
    isMultiplayer.value = true
    roomId.value = rid
    localPlayerId.value = pid
  }

  // 离开联机模式
  function leaveMultiplayer() {
    isMultiplayer.value = false
    roomId.value = null
    localPlayerId.value = null
    broadcastAction = null
    syncGameState = null
  }

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
      stayTurns: 0,
      noItemTurns: 0,
      tollX2Turns: 0,
      doubleDice: false,
      hasImmunity: false,
      hasTombstone: false,
      tombstoneTileId: undefined,
      tombstoneOwnerId: undefined
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
    const player = currentPlayer.value
    let value: number

    if (player?.doubleDice) {
      // 马车道具：投2枚骰子
      const dice1 = Math.floor(Math.random() * 6) + 1
      const dice2 = Math.floor(Math.random() * 6) + 1
      value = dice1 + dice2
      player.doubleDice = false // 消耗一次
      message.value = `${player.name} 使用马车，投出 ${dice1} + ${dice2} = ${value}`
    } else {
      value = Math.floor(Math.random() * 6) + 1
    }

    const result = { value, canReroll: false }
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

    // 先处理格子上的放置道具效果
    handleTilePlacedItems(player, tile)

    switch (tile.type) {
      case 'property': {
        const property = tile as Property
        if (property.ownerId && property.ownerId !== player.id) {
          // 他人地皮 - 收取过路费
          let toll = HOUSE_TOLLS[property.houseLevel] || 0
          if (toll > 0) {
            // 检查过路费翻倍
            if (player.tollX2Turns > 0) {
              toll *= 2
              message.value = `${player.name} 过路费翻倍！`
            }
            if (player.money >= toll) {
              player.money -= toll
              const owner = gameState.value.players.find(p => p.id === property.ownerId)
              if (owner) {
                owner.money += toll
                message.value = `${player.name} 支付过路费 ${toll} 给 ${owner.name}`
              }
            } else {
              // 付不起过路费，破产
              if (player.hasImmunity) {
                player.hasImmunity = false
                player.money = 1000
                message.value = `${player.name} 免死金牌生效！保留 1000`
              } else {
                player.isBankrupt = true
                message.value = `${player.name} 付不起过路费 ${toll}，破产！`
                transferProperties(player.id, property.ownerId!)
              }
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
          // 获得墓碑卡
          if (!player.hasTombstone) {
            player.items.push('tombstone')
            message.value = `${player.name} ${tile.name}，获得墓碑卡（可放置）`
          } else {
            message.value = `${player.name} ${tile.name}，但已拥有墓碑卡`
          }
          autoEndTurn()
        } else if (desc.includes('兄弟团聚')) {
          // 获得花束卡
          // 检查是否已有墓碑
          const hasTombstone = gameState.value.board.some(tile => tile.placedItems?.includes('tombstone'))
          if (hasTombstone) {
            // 与墓碑放在一起
            for (const tile of gameState.value.board) {
              if (tile.placedItems?.includes('tombstone')) {
                tile.placedItems.push('flower')
                break
              }
            }
            message.value = `${player.name} ${tile.name}，与墓碑放在一起`
          } else {
            player.items.push('flower')
            message.value = `${player.name} ${tile.name}，获得花束卡（可放置）`
          }
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
        // 奖励事件 - 随机获得道具卡
        const itemCard = drawItemCard()
        if (itemCard) {
          player.items.push(itemCard.id)
          message.value = `${player.name} 来到了 ${tile.name}，获得道具卡【${itemCard.name}】`
        } else {
          message.value = `${player.name} 来到了 ${tile.name}，但道具卡已用完`
        }
        autoEndTurn()
        break
      }
      case 'punishment': {
        // 惩罚事件 - 抽取惩罚卡
        const card = drawPunishmentCard()
        currentCard.value = card
        showCardModal.value = true
        message.value = `${player.name} 来到了 ${tile.name}，抽取惩罚卡！`
        gameState.value.phase = 'card'
        break
      }
      case 'random': {
        // 随机事件 - 投骰子，单数惩罚卡，双数道具卡
        const dice = Math.floor(Math.random() * 6) + 1
        if (dice % 2 === 1) {
          const card = drawPunishmentCard()
          currentCard.value = card
          showCardModal.value = true
          message.value = `${player.name} 随机事件：骰子${dice}点，单数！抽取惩罚卡【${card.name}】`
          gameState.value.phase = 'card'
        } else {
          const itemCard = drawItemCard()
          if (itemCard) {
            player.items.push(itemCard.id)
            message.value = `${player.name} 随机事件：骰子${dice}点，双数！获得道具卡【${itemCard.name}】`
          } else {
            message.value = `${player.name} 随机事件：骰子${dice}点，双数！但道具卡已用完`
          }
          autoEndTurn()
        }
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

    // 衰减当前玩家的状态
    const current = currentPlayer.value
    if (current) {
      if (current.noItemTurns > 0) current.noItemTurns--
      if (current.tollX2Turns > 0) current.tollX2Turns--
    }

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
  function handleCardAnswer(result: { type: 'quiz'; correct: boolean } | { type: 'poetry'; result: 'full' | 'half' | 'wrong' } | { type: 'punishment'; effect: string }) {
    const player = currentPlayer.value
    if (!player) return

    let reward = 0
    let msg = ''

    if (currentCard.value?.type === 'quiz' && result.type === 'quiz') {
      reward = result.correct ? (currentCard.value as QuizCard).reward : 0
      if (reward > 0) {
        msg = `${player.name} 回答正确，获得 ${reward}！`
      } else {
        msg = `${player.name} 回答错误，无奖励`
      }
    } else if (currentCard.value?.type === 'poetry' && result.type === 'poetry') {
      const poetryCard = currentCard.value as PoetryCard
      switch (result.result) {
        case 'full':
          reward = poetryCard.reward
          msg = `${player.name} 完整背诵，获得 ${reward}！`
          break
        case 'half':
          reward = -poetryCard.halfPenalty
          msg = `${player.name} 半首背诵，损失 ${-reward}！`
          break
        case 'wrong':
          reward = 0
          msg = `${player.name} 背诵错误，无奖惩`
          break
      }
    } else if (currentCard.value?.type === 'punishment' && result.type === 'punishment') {
      // 惩罚卡执行惩罚效果
      applyPunishment(result.effect)
      msg = message.value
    }

    // 惩罚卡不在这里处理（已在CardModal中处理），只更新状态
    if (currentCard.value?.type !== 'punishment') {
      player.money += reward
    }

    showCardModal.value = false
    currentCard.value = null
    message.value = msg

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

  // 使用道具卡
  function useItemCard(itemId: string, targetPlayerId?: string, targetTileId?: number): boolean {
    const player = currentPlayer.value
    if (!player) return false

    // 检查是否无法使用道具
    if (player.noItemTurns > 0) {
      message.value = `${player.name} 本回合无法使用道具`
      return false
    }

    const itemIndex = player.items.indexOf(itemId)
    if (itemIndex === -1) return false

    const itemEffects: Record<string, () => boolean> = {
      // 马车：可投2枚骰子按点数移动
      carriage: () => {
        player.doubleDice = true
        message.value = `${player.name} 使用了马车，下回合可投2枚骰子`
        player.items.splice(itemIndex, 1)
        return true
      },
      // 如意令：免疫任意道具效果
      ruyi: () => {
        message.value = `${player.name} 使用了如意令，免疫下一次道具效果`
        player.items.splice(itemIndex, 1)
        return true
      },
      // 巨石/陷阱：指定地皮放置，踩中玩家停留1回合
      rock: () => {
        if (targetTileId === undefined) return false
        const tile = gameState.value.board[targetTileId]
        if (!tile.placedItems) tile.placedItems = []
        tile.placedItems.push('rock')
        message.value = `${player.name} 在 ${tile.name} 放置了巨石`
        // 消耗型道具从背包移除
        player.items.splice(itemIndex, 1)
        return true
      },
      trap: () => {
        if (targetTileId === undefined) return false
        const tile = gameState.value.board[targetTileId]
        if (!tile.placedItems) tile.placedItems = []
        tile.placedItems.push('trap')
        message.value = `${player.name} 在 ${tile.name} 放置了陷阱`
        player.items.splice(itemIndex, 1)
        return true
      },
      // 捕兽夹：踩中受伤就医失去500
      mousetrap: () => {
        if (targetTileId === undefined) return false
        const tile = gameState.value.board[targetTileId]
        if (!tile.placedItems) tile.placedItems = []
        tile.placedItems.push('mousetrap')
        message.value = `${player.name} 在 ${tile.name} 放置了捕兽夹`
        player.items.splice(itemIndex, 1)
        return true
      },
      // 扫帚：清除除墓碑与花束外的所有放置道具
      broom: () => {
        let cleared = 0
        for (const tile of gameState.value.board) {
          if (tile.placedItems) {
            const before = tile.placedItems.length
            tile.placedItems = tile.placedItems.filter(id => id === 'tombstone' || id === 'flower')
            cleared += before - tile.placedItems.length
          }
        }
        message.value = `${player.name} 使用扫帚清除了 ${cleared} 个陷阱`
        player.items.splice(itemIndex, 1)
        return true
      },
      // 酒：使1名指定其他玩家下一回合无法操作
      wine: () => {
        if (!targetPlayerId) return false
        const target = gameState.value.players.find(p => p.id === targetPlayerId)
        if (!target) return false
        target.stayTurns = Math.max(target.stayTurns, 1) + 1 // 额外跳过1回合
        message.value = `${player.name} 使用酒使 ${target.name} 跳过下回合`
        player.items.splice(itemIndex, 1)
        return true
      },
      // 客栈：再次触发当前地皮效果
      inn: () => {
        const currentTile = getCurrentTile()
        if (currentTile) {
          message.value = `${player.name} 使用客栈，再次触发 ${currentTile.name} 效果`
          handleTileEffect(player, currentTile.id)
        }
        player.items.splice(itemIndex, 1)
        return true
      },
      // 抄家令：从指定1名其他玩家抽取一张道具卡
      robbery: () => {
        if (!targetPlayerId) return false
        const target = gameState.value.players.find(p => p.id === targetPlayerId)
        if (!target || target.items.length === 0) {
          message.value = `${target?.name || '目标'} 没有道具卡`
          return false
        }
        const stolen = target.items.splice(0, 1)[0]
        player.items.push(stolen)
        message.value = `${player.name} 从 ${target.name} 抽取了 ${stolen}`
        player.items.splice(itemIndex, 1)
        return true
      },
      // 引雷符：指定地皮降一级
      thunder: () => {
        if (targetTileId === undefined) return false
        const property = getPropertyById(gameState.value.board, targetTileId)
        if (!property || property.type !== 'property' || !property.ownerId) {
          message.value = '该地皮无法降级'
          return false
        }
        if (property.houseLevel > 0) {
          property.houseLevel--
          message.value = `${player.name} 使用引雷符，${property.name} 降为 Lv.${property.houseLevel}`
        }
        player.items.splice(itemIndex, 1)
        return true
      },
      // 爆裂符：指定玩家爆炸受伤，就医失去1000
      explosion: () => {
        if (!targetPlayerId) return false
        const target = gameState.value.players.find(p => p.id === targetPlayerId)
        if (!target) return false
        target.money -= 1000
        message.value = `${player.name} 使用爆裂符攻击 ${target.name}，失去 1000`
        if (target.money < 0) {
          target.isBankrupt = true
          transferProperties(target.id, getNextPlayerId())
        }
        player.items.splice(itemIndex, 1)
        return true
      },
      // 征税令：向指定玩家征收2000
      tax: () => {
        if (!targetPlayerId) return false
        const target = gameState.value.players.find(p => p.id === targetPlayerId)
        if (!target) return false
        const amount = Math.min(2000, target.money)
        target.money -= amount
        player.money += amount
        message.value = `${player.name} 向 ${target.name} 征收 ${amount}`
        player.items.splice(itemIndex, 1)
        return true
      },
      // 地契：免费获得任意一块可购地皮
      deed: () => {
        // 打开地皮选择界面（待实现）
        message.value = `${player.name} 使用地契，可免费获得任意地皮`
        pendingAction.value = 'deed'
        gameState.value.phase = 'action'
        player.items.splice(itemIndex, 1)
        return true
      },
      // 免死金牌：破产时自动使用，重生并获得5000（被动技能，装备即生效）
      immunity: () => {
        player.hasImmunity = true
        message.value = `${player.name} 装备了免死金牌，破产时自动生效`
        return true // 不消耗
      },
      // 墓碑：获得时当场使用，指定地皮放置，踩中给予摆放玩家1000香火钱（需配合花束获得2000）
      tombstone: () => {
        if (targetTileId === undefined) return false
        const tile = gameState.value.board[targetTileId]
        if (!tile.placedItems) tile.placedItems = []
        // 使用新类型 PlacedItem
        tile.placedItems.push({ itemId: 'tombstone', ownerId: player.id })
        player.hasTombstone = true
        player.tombstoneTileId = targetTileId
        message.value = `${player.name} 在 ${tile.name} 放置了墓碑`
        // 不从背包移除（装备型）
        return true
      },
      // 花束：获得时若未放置过墓碑便存放，否则当场使用并与墓碑放在一起
      flower: () => {
        // 检查是否已有墓碑
        let hasTombstone = false
        let tombstoneTile: Tile | null = null
        for (const tile of gameState.value.board) {
          if (tile.placedItems?.some(pi => pi.itemId === 'tombstone')) {
            hasTombstone = true
            tombstoneTile = tile
            break
          }
        }
        if (hasTombstone && tombstoneTile) {
          // 与墓碑放在一起
          tombstoneTile.placedItems?.push({ itemId: 'flower', ownerId: player.id })
          message.value = `${player.name} 使用花束，放在墓碑旁`
        } else {
          // 没有墓碑，存放花束
          player.items.push('flower')
          message.value = `${player.name} 获得花束卡（可与墓碑配合）`
        }
        // 花束总是消耗（除了存放的情况，但这里逻辑是获取时就消耗）
        return true
      }
    }

    const effectFn = itemEffects[itemId]
    if (effectFn) {
      return effectFn()
    }
    return false
  }

  // 处理玩家踩中的格子道具效果
  function handleTilePlacedItems(player: Player, tile: Tile) {
    if (!tile.placedItems || tile.placedItems.length === 0) return

    for (const placedItem of tile.placedItems as PlacedItem[]) {
      const itemId = placedItem.itemId
      switch (itemId) {
        case 'rock':
        case 'trap':
          // 停留1回合
          player.stayTurns = Math.max(player.stayTurns, 1) + 1
          message.value = `${player.name} 踩中了 ${itemId === 'rock' ? '巨石' : '陷阱'}，停留1回合`
          break
        case 'mousetrap':
          // 就医失去500
          player.money -= 500
          message.value = `${player.name} 踩中了捕兽夹，就医失去 500`
          if (player.money < 0) {
            player.isBankrupt = true
            transferProperties(player.id, getNextPlayerId())
          }
          break
        case 'tombstone':
          // 给摆放玩家香火钱（需与花束配合获得2000）
          let tombstoneReward = 1000
          let tombstoneHasFlower = false
          for (const tile of gameState.value.board) {
            const placedItems = tile.placedItems as PlacedItem[] | undefined
            if (placedItems?.some(pi => pi.itemId === 'tombstone')) {
              tombstoneHasFlower = placedItems.some(pi => pi.itemId === 'flower')
              tombstoneReward = tombstoneHasFlower ? 2000 : 1000
              break
            }
          }
          player.money -= tombstoneReward
          message.value = `${player.name} 踩中墓碑，失去 ${tombstoneReward} 香火钱`
          if (player.money < 0) {
            player.isBankrupt = true
            transferProperties(player.id, getNextPlayerId())
          }
          break
        case 'flower':
          // 花束无负面效果
          break
      }
    }
  }

  // 应用惩罚卡效果
  function applyPunishment(punishmentId: string) {
    const player = currentPlayer.value
    if (!player) return

    const punishmentEffects: Record<string, () => void> = {
      // 原地停留2回合
      stay_2: () => {
        player.stayTurns = Math.max(player.stayTurns, 0) + 2
        message.value = `${player.name} 原地停留2回合`
      },
      // 2回合无法使用道具卡片
      no_item_2: () => {
        player.noItemTurns = 2
        message.value = `${player.name} 2回合无法使用道具卡片`
      },
      // 失去100
      lose_100: () => {
        player.money -= 100
        message.value = `${player.name} 失去 100`
      },
      // 失去500
      lose_500: () => {
        player.money -= 500
        message.value = `${player.name} 失去 500`
      },
      // 强制拍卖最高级地皮
      auction_max: () => {
        const properties = getBoardProperties().filter(p => p.ownerId === player.id)
        if (properties.length > 0) {
          const maxLevel = Math.max(...properties.map(p => p.houseLevel))
          const maxProps = properties.filter(p => p.houseLevel === maxLevel)
          // 随机选一个拍卖（待实现拍卖系统）
          message.value = `${player.name} 的 ${maxProps[0].name} 被强制拍卖（待实现）`
        }
      },
      // 后退10格
      back_10: () => {
        player.position = (player.position - 10 + BOARD_SIZE) % BOARD_SIZE
        message.value = `${player.name} 后退10格`
      },
      // 失去1000
      lose_1000: () => {
        player.money -= 1000
        message.value = `${player.name} 失去 1000`
        if (player.money < 0) {
          if (player.hasImmunity) {
            player.hasImmunity = false
            player.money = 1000
            message.value = `${player.name} 免死金牌生效！保留 1000`
          } else {
            player.isBankrupt = true
            transferProperties(player.id, getNextPlayerId())
          }
        }
      },
      // 失去5000
      lose_5000: () => {
        player.money -= 5000
        message.value = `${player.name} 失去 5000`
        if (player.money < 0) {
          if (player.hasImmunity) {
            player.hasImmunity = false
            player.money = 1000
            message.value = `${player.name} 免死金牌生效！保留 1000`
          } else {
            player.isBankrupt = true
            transferProperties(player.id, getNextPlayerId())
          }
        }
      },
      // 回到起始格
      back_start: () => {
        player.position = 0
        message.value = `${player.name} 回到起始格`
      },
      // 失去所有道具卡片
      lose_all_items: () => {
        player.items = []
        message.value = `${player.name} 失去所有道具卡片`
      },
      // 接下来3回合过路费x2
      toll_x2_3: () => {
        player.tollX2Turns = 3
        message.value = `${player.name} 接下来3回合过路费x2`
      },
      // 给所有其他玩家1000
      give_all_1000: () => {
        for (const p of gameState.value.players) {
          if (p.id !== player.id && !p.isBankrupt) {
            player.money -= 1000
            p.money += 1000
          }
        }
        message.value = `${player.name} 给所有其他玩家 1000`
      },
      // 赠与上一位玩家500
      give_prev_500: () => {
        const prevIndex = (gameState.value.currentPlayerIndex - 1 + gameState.value.players.length) % gameState.value.players.length
        const prevPlayer = gameState.value.players[prevIndex]
        if (prevPlayer && !prevPlayer.isBankrupt) {
          player.money -= 500
          prevPlayer.money += 500
          message.value = `${player.name} 赠与 ${prevPlayer.name} 500`
        }
      },
      // 随意赠与自己一个地皮给任意玩家
      give_property: () => {
        message.value = `${player.name} 可以将一个地皮赠与任意玩家（待实现）`
        pendingAction.value = 'give_property'
        gameState.value.phase = 'action'
      }
    }

    const effectFn = punishmentEffects[punishmentId]
    if (effectFn) {
      effectFn()
    }
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
    isMultiplayer,
    roomId,
    localPlayerId,
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
    closeCardModal,
    useItemCard,
    handleTilePlacedItems,
    applyPunishment,
    setMultiplayerCallbacks,
    startMultiplayer,
    leaveMultiplayer
  }
})
