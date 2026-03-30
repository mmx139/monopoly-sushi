<template>
  <div id="app">
    <header>
      <h1>一蓑烟雨任平生</h1>
    </header>

    <!-- 等待开始界面 -->
    <div v-if="gameState.phase === 'waiting'" class="setup-screen">
      <h2>游戏设置</h2>
      <div class="character-select">
        <div
          v-for="char in CHARACTERS"
          :key="char.id"
          class="character-option"
          :class="{ selected: selectedCharacters.includes(char.id) }"
          @click="toggleCharacter(char.id)"
        >
          <span class="char-name">{{ char.name }}</span>
          <span class="char-title">{{ char.title }}</span>
          <span v-if="selectedCharacters.includes(char.id)" class="player-type">
            {{ playerConfigs[char.id]?.isAI ? '🤖 AI' : '👤 玩家' }}
          </span>
        </div>
      </div>

      <!-- 已选角色AI/玩家切换 -->
      <div v-if="selectedCharacters.length > 0" class="player-config-section">
        <h3>玩家设置</h3>
        <div v-for="charId in selectedCharacters" :key="charId" class="player-config-item">
          <span>{{ getCharacterName(charId) }}</span>
          <label class="ai-toggle">
            <input
              type="checkbox"
              :checked="playerConfigs[charId]?.isAI"
              @change="toggleAI(charId)"
            >
            <span>AI玩家</span>
          </label>
        </div>
      </div>

      <button class="start-btn" @click="startGame" :disabled="selectedCharacters.length < 2">
        开始游戏 ({{ selectedCharacters.length }}/4)
      </button>
    </div>

    <!-- 游戏结束 -->
    <div v-else-if="gameState.phase === 'ending'" class="ending-screen">
      <h2>游戏结束</h2>
      <p class="winner-text">{{ winnerName }} 获胜！</p>
      <button class="start-btn" @click="resetGame">再来一局</button>
    </div>

    <!-- 游戏进行中 -->
    <div v-else class="game-screen">
      <div class="game-main">
        <GameBoard
          :players="gameState.players"
          :currentPlayerId="currentPlayer?.id || null"
        />

        <!-- 消息显示 -->
        <div v-if="message" class="message-bar">
          {{ message }}
        </div>

        <div class="action-bar">
          <!-- 待处理动作时显示操作按钮 -->
          <template v-if="pendingAction">
            <div class="action-hint">{{ actionHint }}</div>
            <button v-if="pendingAction === 'buy'" class="action-btn buy" @click="onBuy">购买</button>
            <button v-if="pendingAction === 'upgrade'" class="action-btn upgrade" @click="onUpgrade">升级</button>
            <button class="action-btn skip" @click="onSkip">跳过</button>
          </template>

          <!-- 投骰子 -->
          <Dice
            v-else
            :value="lastDiceResult?.value || null"
            :canRoll="gameState.phase === 'rolling' && currentPlayer && !currentPlayer.isAI && !isStaying"
            @roll="onRoll"
          />

          <!-- 当前格子信息 -->
          <div v-if="currentTile" class="current-tile-info">
            <strong>{{ currentTile.name }}</strong>
            <span v-if="currentTile.description"> - {{ currentTile.description }}</span>
            <span v-if="currentTile.effect" class="effect-info">【{{ currentTile.effect }}】</span>
          </div>

          <!-- 结束回合按钮（action阶段无待处理动作时显示） -->
          <button
            v-if="gameState.phase === 'action' && !pendingAction"
            class="action-btn end"
            @click="onEndTurn"
          >
            结束回合
          </button>
        </div>
      </div>

      <div class="game-sidebar">
        <PlayerPanel
          :players="gameState.players"
          :currentPlayerId="currentPlayer?.id || null"
        />

        <!-- 玩家拥有的地皮列表 -->
        <div v-if="currentPlayer && currentPlayer.properties.length > 0" class="owned-properties">
          <h4>{{ currentPlayer.name }} 的地皮</h4>
          <div
            v-for="propId in currentPlayer.properties"
            :key="propId"
            class="property-item"
          >
            <span>{{ getPropertyName(propId) }}</span>
            <span class="house-level">Lv.{{ getPropertyLevel(propId) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 卡牌弹窗 -->
    <CardModal
      :show="showCardModal"
      :card="currentCard"
      @close="onCardClose"
      @answer="onCardAnswer"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useGameStore } from './stores/game'
import { CHARACTERS, HOUSE_TOLLS } from '@shared/constants'
import { getPropertyById } from '@shared/board'
import GameBoard from './components/GameBoard.vue'
import Dice from './components/Dice.vue'
import PlayerPanel from './components/PlayerPanel.vue'
import CardModal from './components/CardModal.vue'

const store = useGameStore()

const selectedCharacters = ref<string[]>([])
const playerConfigs = ref<Record<string, { isAI: boolean }>>({})

// AI回合自动触发
watch(() => gameState.value.phase, (phase) => {
  if (phase === 'rolling' && currentPlayer.value?.isAI) {
    store.takeAITurn()
  } else if (phase === 'card' && currentPlayer.value?.isAI) {
    // AI答题：50%正确率
    const correct = Math.random() > 0.5
    setTimeout(() => {
      store.handleCardAnswer(correct)
    }, 1000)
  }
})

const gameState = computed(() => store.gameState)
const currentPlayer = computed(() => store.currentPlayer)
const lastDiceResult = computed(() => store.lastDiceResult)
const message = computed(() => store.message)
const pendingAction = computed(() => store.pendingAction)

const actionHint = computed(() => {
  if (pendingAction.value === 'buy') return '是否购买此地皮？'
  if (pendingAction.value === 'upgrade') return '是否升级房屋？'
  return ''
})

const winnerName = computed(() => {
  if (!gameState.value.winner) return ''
  const winner = gameState.value.players.find(p => p.id === gameState.value.winner)
  return winner?.name || ''
})

const currentTile = computed(() => store.getCurrentTile())

const isStaying = computed(() => {
  return currentPlayer.value?.stayTurns > 0 || false
})

const showCardModal = computed(() => store.showCardModal)
const currentCard = computed(() => store.currentCard)

function toggleCharacter(charId: string) {
  const index = selectedCharacters.value.indexOf(charId)
  if (index === -1) {
    if (selectedCharacters.value.length < 4) {
      selectedCharacters.value.push(charId)
      playerConfigs.value[charId] = { isAI: false }
    }
  } else {
    selectedCharacters.value.splice(index, 1)
    delete playerConfigs.value[charId]
  }
}

function toggleAI(charId: string) {
  if (playerConfigs.value[charId]) {
    playerConfigs.value[charId].isAI = !playerConfigs.value[charId].isAI
  }
}

function getCharacterName(charId: string): string {
  return CHARACTERS.find(c => c.id === charId)?.name || ''
}

function startGame() {
  const configs = selectedCharacters.value.map((charId, index) => ({
    id: `player-${index}`,
    name: CHARACTERS.find(c => c.id === charId)?.name || `玩家${index + 1}`,
    characterId: charId,
    isAI: playerConfigs.value[charId]?.isAI || false
  }))

  store.initGame(configs)
}

function resetGame() {
  gameState.value.phase = 'waiting'
  selectedCharacters.value = []
  playerConfigs.value = {}
}

function onRoll() {
  const result = store.rollDice()
  if (result.value) {
    store.movePlayer(result.value)
  }
}

function onBuy() {
  if (!currentPlayer.value || !currentTile.value) return
  if (currentTile.value.type === 'property') {
    store.purchaseProperty(currentPlayer.value.id, currentTile.value.id)
  }
}

function onUpgrade() {
  if (!currentPlayer.value || !currentTile.value) return
  if (currentTile.value.type === 'property') {
    store.upgradeProperty(currentPlayer.value.id, currentTile.value.id)
  }
}

function onSkip() {
  store.skipAction()
}

function onEndTurn() {
  store.endTurn()
}

function onCardAnswer(correct: boolean) {
  store.handleCardAnswer(correct)
}

function onCardClose() {
  store.closeCardModal()
}

function getPropertyName(propertyId: number): string {
  const prop = getPropertyById(gameState.value.board, propertyId)
  return prop?.name || `地皮${propertyId}`
}

function getPropertyLevel(propertyId: number): number {
  const prop = getPropertyById(gameState.value.board, propertyId)
  return prop?.houseLevel || 0
}

function getToll(propertyId: number): number {
  const prop = getPropertyById(gameState.value.board, propertyId)
  return prop ? HOUSE_TOLLS[prop.houseLevel] || 0 : 0
}
</script>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: linear-gradient(135deg, #f5e6d3 0%, #e8d5c4 100%);
  min-height: 100vh;
}

#app {
  font-family: 'Noto Serif SC', serif;
  text-align: center;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

header h1 {
  color: #8b4513;
  margin-bottom: 20px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
}

.setup-screen {
  max-width: 600px;
  margin: 0 auto;
}

.character-select {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin: 20px 0;
}

.character-option {
  background: #fff;
  border: 3px solid #ddd;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.character-option:hover {
  border-color: #d4a574;
}

.character-option.selected {
  border-color: #8b4513;
  background: #fff8e7;
}

.char-name {
  display: block;
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.char-title {
  display: block;
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.player-type {
  display: block;
  font-size: 12px;
  color: #888;
  margin-top: 4px;
}

.player-config-section {
  background: #fff;
  border: 2px solid #8b4513;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  text-align: left;
}

.player-config-section h3 {
  margin: 0 0 12px 0;
  color: #8b4513;
}

.player-config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.player-config-item:last-child {
  border-bottom: none;
}

.ai-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.ai-toggle input {
  cursor: pointer;
}

.start-btn {
  padding: 16px 48px;
  font-size: 18px;
  background: linear-gradient(135deg, #d4a574, #c4956a);
  border: 3px solid #8b4513;
  border-radius: 12px;
  color: #fff;
  cursor: pointer;
  font-family: 'Noto Serif SC', serif;
  transition: all 0.2s;
}

.start-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #e0b588, #d4a574);
  transform: scale(1.02);
}

.start-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ending-screen {
  max-width: 400px;
  margin: 100px auto;
}

.winner-text {
  font-size: 24px;
  color: #8b4513;
  margin: 20px 0;
}

.game-screen {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.game-sidebar {
  width: 280px;
  flex-shrink: 0;
  order: 1;
}

.owned-properties {
  background: #fff;
  border: 2px solid #8b4513;
  border-radius: 8px;
  padding: 12px;
  margin-top: 12px;
  text-align: left;
}

.owned-properties h4 {
  margin: 0 0 8px 0;
  color: #8b4513;
}

.property-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid #eee;
}

.property-item:last-child {
  border-bottom: none;
}

.house-level {
  font-size: 12px;
  color: #ff9800;
  margin-left: auto;
}

.game-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.message-bar {
  background: #fff3e0;
  border: 2px solid #ff9800;
  border-radius: 8px;
  padding: 12px 20px;
  color: #333;
  font-size: 16px;
  width: 100%;
}

.action-bar {
  background: #fff;
  border: 2px solid #8b4513;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  justify-content: center;
  flex-wrap: wrap;
}

.action-hint {
  font-size: 14px;
  color: #666;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 6px;
}

.current-tile-info {
  flex: 1;
  text-align: left;
  padding: 8px 12px;
  background: #fff8e7;
  border-radius: 6px;
  color: #333;
  min-width: 200px;
}

.effect-info {
  display: block;
  font-size: 12px;
  color: #ff6600;
  margin-top: 4px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  font-family: 'Noto Serif SC', serif;
  border: 2px solid;
  transition: all 0.2s;
}

.action-btn.buy {
  background: #4caf50;
  border-color: #388e3c;
  color: #fff;
}

.action-btn.buy:hover {
  background: #5cb860;
}

.action-btn.upgrade {
  background: #2196f3;
  border-color: #1976d2;
  color: #fff;
}

.action-btn.upgrade:hover {
  background: #42a5f5;
}

.action-btn.skip {
  background: #9e9e9e;
  border-color: #757575;
  color: #fff;
}

.action-btn.skip:hover {
  background: #bdbdbd;
}

.action-btn.end {
  background: #ff9800;
  border-color: #f57c00;
  color: #fff;
}

.action-btn.end:hover {
  background: #ffa726;
}
</style>
