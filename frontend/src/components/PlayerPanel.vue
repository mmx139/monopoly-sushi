<template>
  <div class="player-panel">
    <h3>玩家信息</h3>
    <div class="player-list">
      <div
        v-for="player in players"
        :key="player.id"
        class="player-card"
        :class="{ active: player.id === currentPlayerId, bankrupt: player.isBankrupt }"
      >
        <div class="player-avatar" :style="{ backgroundColor: getColor(player.characterId) }">
          {{ getInitial(player.characterId) }}
        </div>
        <div class="player-info">
          <div class="player-name">{{ player.name }}</div>
          <div class="player-money">💰 {{ player.money }}</div>
          <div class="player-position">📍 {{ player.position }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Player } from '@shared/types'

const props = defineProps<{
  players: Player[]
  currentPlayerId: string | null
}>()

function getColor(characterId: string): string {
  const colors: Record<string, string> = {
    sushi: '#ff6b6b',
    suzhe: '#4ecdc4',
    wanganshi: '#9b59b6',
    zhanghuaimin: '#f39c12'
  }
  return colors[characterId] || '#333'
}

function getInitial(characterId: string): string {
  const initials: Record<string, string> = {
    sushi: '苏',
    suzhe: '辙',
    wanganshi: '荆',
    zhanghuaimin: '怀'
  }
  return initials[characterId] || '?'
}
</script>

<style scoped>
.player-panel {
  background: #fff8e7;
  border: 2px solid #8b4513;
  border-radius: 8px;
  padding: 16px;
}

h3 {
  margin: 0 0 12px 0;
  color: #8b4513;
  font-family: 'Noto Serif SC', serif;
}

.player-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.player-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 6px;
  background: #fff;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.player-card.active {
  border-color: #ffd700;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
}

.player-card.bankrupt {
  opacity: 0.5;
  text-decoration: line-through;
}

.player-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: bold;
  font-size: 18px;
}

.player-info {
  flex: 1;
}

.player-name {
  font-weight: bold;
  color: #333;
}

.player-money, .player-position {
  font-size: 12px;
  color: #666;
}
</style>
