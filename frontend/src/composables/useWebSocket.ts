// WebSocket 客户端管理
import { ref, readonly } from 'vue'

export type MessageType =
  | 'player_joined'
  | 'player_left'
  | 'game_start'
  | 'player_move'
  | 'player_action'
  | 'dice_roll'
  | 'game_state_sync'
  | 'chat_message'

export interface WebSocketMessage {
  type: MessageType
  payload: any
}

const WS_URL = 'ws://localhost:8000/ws'

export function useWebSocket() {
  const connected = ref(false)
  const messages = ref<WebSocketMessage[]>([])

  let ws: WebSocket | null = null
  let reconnectTimer: number | null = null
  let currentRoomId: string | null = null
  let currentPlayerId: string | null = null

  function connect(roomId: string, playerId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close()
      }

      currentRoomId = roomId
      currentPlayerId = playerId

      ws = new WebSocket(`${WS_URL}/${roomId}/${playerId}`)

      ws.onopen = () => {
        connected.value = true
        console.log('WebSocket connected')
        resolve()
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WebSocketMessage
          messages.value.push(data)
          console.log('WebSocket message:', data)
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        reject(error)
      }

      ws.onclose = () => {
        connected.value = false
        console.log('WebSocket disconnected')
        // 5秒后尝试重连
        if (currentRoomId && currentPlayerId) {
          reconnectTimer = window.setTimeout(() => {
            connect(currentRoomId!, currentPlayerId!)
          }, 5000)
        }
      }
    })
  }

  function disconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    if (ws) {
      ws.close()
      ws = null
    }
    currentRoomId = null
    currentPlayerId = null
    connected.value = false
  }

  function send(message: WebSocketMessage) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket not connected, cannot send message')
    }
  }

  function sendGameAction(action: string, payload: any) {
    send({
      type: action as MessageType,
      payload
    })
  }

  return {
    connected: readonly(connected),
    messages: readonly(messages),
    connect,
    disconnect,
    send,
    sendGameAction
  }
}
