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
        </div>
      </div>
      <button class="start-btn" @click="startGame" :disabled="selectedCharacters.length < 2">
        开始游戏 ({{ selectedCharacters.length }}/4)
      </button>
    </div>

    <!-- 游戏进行中 -->
    <div v-else class="game-screen">
      <div class="game-sidebar">
        <PlayerPanel
          :players="gameState.players"
          :currentPlayerId="currentPlayer?.id || null"
        />
      </div>

      <div class="game-main">
        <GameBoard
          :players="gameState.players"
          :currentPlayerId="currentPlayer?.id || null"
        />

        <div class="action-bar">
          <Dice
            :value="lastDiceResult?.value || null"
            :canRoll="gameState.phase === 'rolling' && currentPlayer && !currentPlayer.isAI"
            @roll="onRoll"
          />

          <div v-if="currentTile" class="current-tile-info">
            <strong>{{ currentTile.name }}</strong>
            <span v-if="currentTile.description"> - {{ currentTile.description }}</span>
          </div>

          <div class="action-buttons" v-if="gameState.phase === 'action' && currentPlayer && !currentPlayer.isAI">
            <button class="action-btn buy" @click="onBuy" v-if="canBuy">购买</button>
            <button class="action-btn end" @click="onEndTurn">结束回合</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from './stores/game'
import { CHARACTERS } from '../shared/constants'
import { BOARD } from '../shared/board'
import { getProperties } from '../shared/board'
import GameBoard from './components/GameBoard.vue'
import Dice from './components/Dice.vue'
import PlayerPanel from './components/PlayerPanel.vue'

const store = useGameStore()

const selectedCharacters = ref<string[]>([])

const gameState = computed(() => store.gameState)
const currentPlayer = computed(() => store.currentPlayer)
const lastDiceResult = computed(() => store.lastDiceResult)

const currentTile = computed(() => {
  if (!currentPlayer.value) return null
  return BOARD[currentPlayer.value.position]
})

const canBuy = computed(() => {
  if (!currentPlayer.value || !currentTile.value) return false
  if (currentTile.value.type !== 'property') return false

  const property = getProperties().find(p => p.id === currentTile.value!.id)
  if (!property || property.ownerId) return false

  return currentPlayer.value.money >= property.basePrice
})

function toggleCharacter(charId: string) {
  const index = selectedCharacters.value.indexOf(charId)
  if (index === -1) {
    if (selectedCharacters.value.length < 4) {
      selectedCharacters.value.push(charId)
    }
  } else {
    selectedCharacters.value.splice(index, 1)
  }
}

function startGame() {
  const configs = selectedCharacters.value.map((charId, index) => ({
    id: `player-${index}`,
    name: CHARACTERS.find(c => c.id === charId)?.name || `玩家${index + 1}`,
    characterId: charId,
    isAI: false
  }))

  store.initGame(configs)
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

function onEndTurn() {
  store.endTurn()
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

.game-screen {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.game-sidebar {
  width: 280px;
  flex-shrink: 0;
}

.game-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.action-bar {
  background: #fff;
  border: 2px solid #8b4513;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 20px;
  width: 100%;
  justify-content: center;
}

.current-tile-info {
  flex: 1;
  text-align: left;
  padding: 8px 12px;
  background: #fff8e7;
  border-radius: 6px;
  color: #333;
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

.action-btn.end {
  background: #ff9800;
  border-color: #f57c00;
  color: #fff;
}

.action-btn.end:hover {
  background: #ffa726;
}
</style>
