<template>
  <div class="room-screen">
    <!-- 创建/加入房间 -->
    <div v-if="!joinedRoom" class="room-join">
      <h2>多人游戏</h2>
      <div class="room-form">
        <input
          v-model="playerName"
          placeholder="你的名字"
          class="room-input"
        >
        <button class="room-btn" @click="createRoom">创建房间</button>
      </div>
      <div class="room-divider">或</div>
      <div class="room-form">
        <input
          v-model="roomCode"
          placeholder="房间代码"
          class="room-input"
        >
        <button class="room-btn" @click="joinRoom">加入房间</button>
      </div>
      <p v-if="error" class="error-text">{{ error }}</p>
    </div>

    <!-- 等待房间 -->
    <div v-else-if="roomStatus === 'waiting'" class="room-waiting">
      <h2>房间: {{ roomId }}</h2>
      <p>房间代码: <strong>{{ roomId }}</strong></p>
      <p>分享房间代码给朋友</p>

      <div class="player-list">
        <div v-for="player in players" :key="player.id" class="player-item">
          <span>{{ player.name }}</span>
          <span v-if="player.id === hostId" class="host-badge">房主</span>
        </div>
      </div>

      <div v-if="isHost" class="host-controls">
        <button
          class="start-btn"
          @click="startGame"
          :disabled="players.length < 2"
        >
          开始游戏 ({{ players.length }}/4)
        </button>
      </div>
      <div v-else>
        <p>等待房主开始游戏...</p>
      </div>
    </div>

    <!-- 游戏进行中 -->
    <div v-else class="room-playing">
      <p>游戏进行中...</p>
      <p>WebSocket联机功能开发中</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const emit = defineEmits<{
  (e: 'start-game', players: any[]): void
}>()

const API_URL = 'http://localhost:8000'

const playerName = ref('')
const roomCode = ref('')
const error = ref('')
const roomId = ref('')
const playerId = ref('')
const hostId = ref('')
const players = ref<any[]>([])
const roomStatus = ref<'waiting' | 'playing'>('waiting')

const joinedRoom = computed(() => !!roomId.value)
const isHost = computed(() => playerId.value === hostId.value)

async function createRoom() {
  if (!playerName.value.trim()) {
    error.value = '请输入名字'
    return
  }
  error.value = ''

  try {
    const res = await fetch(`${API_URL}/api/rooms/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `${playerName.value}的房间`,
        host_name: playerName.value
      })
    })
    const data = await res.json()
    roomId.value = data.room_id
    playerId.value = data.player_id
    hostId.value = data.player_id
    players.value = [{ id: data.player_id, name: playerName.value }]
    roomStatus.value = 'waiting'
  } catch (e) {
    error.value = '创建房间失败，请检查服务器'
  }
}

async function joinRoom() {
  if (!playerName.value.trim()) {
    error.value = '请输入名字'
    return
  }
  if (!roomCode.value.trim()) {
    error.value = '请输入房间代码'
    return
  }
  error.value = ''

  try {
    const res = await fetch(`${API_URL}/api/rooms/${roomCode.value}/join?player_name=${playerName.value}`, {
      method: 'POST'
    })
    if (!res.ok) {
      const data = await res.json()
      error.value = data.detail || '加入房间失败'
      return
    }
    const data = await res.json()
    roomId.value = roomCode.value
    playerId.value = data.player_id
    hostId.value = data.room.host_id
    players.value = data.room.players
    roomStatus.value = 'waiting'
  } catch (e) {
    error.value = '加入房间失败，请检查服务器'
  }
}

function startGame() {
  emit('start-game', players.value)
}
</script>

<style scoped>
.room-screen {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}

.room-form {
  display: flex;
  gap: 12px;
  margin: 12px 0;
}

.room-input {
  flex: 1;
  padding: 12px;
  border: 2px solid #8b4513;
  border-radius: 8px;
  font-size: 16px;
  font-family: 'Noto Serif SC', serif;
}

.room-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #d4a574, #c4956a);
  border: 2px solid #8b4513;
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  font-family: 'Noto Serif SC', serif;
}

.room-btn:hover {
  background: linear-gradient(135deg, #e0b588, #d4a574);
}

.room-divider {
  text-align: center;
  color: #888;
  margin: 16px 0;
}

.error-text {
  color: #f44336;
  font-size: 14px;
  margin: 8px 0;
}

.player-list {
  background: #fff;
  border: 2px solid #8b4513;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
}

.player-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.player-item:last-child {
  border-bottom: none;
}

.host-badge {
  background: #ffd700;
  color: #8b4513;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.start-btn {
  padding: 16px 48px;
  font-size: 18px;
  background: linear-gradient(135deg, #4caf50, #388e3c);
  border: 3px solid #2e7d32;
  border-radius: 12px;
  color: #fff;
  cursor: pointer;
  font-family: 'Noto Serif SC', serif;
}

.start-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
