// 游戏类型定义

export type TileType = 'start' | 'property' | 'special' | 'poetry' | 'quiz' | 'reward' | 'punishment' | 'random'

export interface Tile {
  id: number
  type: TileType
  name: string
  description?: string
  effect?: string  // 格子效果描述
}

export interface Property extends Tile {
  type: 'property'
  basePrice: number
  houseLevel: number  // 0-3, 0=no house
  ownerId: string | null
}

export interface Player {
  id: string
  name: string
  characterId: string
  position: number
  money: number
  properties: number[]
  items: string[]
  isAI: boolean
  isBankrupt: boolean
  stayTurns: number  // 停留回合数
}

export interface GameState {
  board: Tile[]
  players: Player[]
  currentPlayerIndex: number
  phase: 'waiting' | 'rolling' | 'moving' | 'action' | 'ending'
  winner: string | null
  turnNumber: number
}

export interface Card {
  id: string
  type: 'quiz' | 'poetry' | 'item' | 'reward' | 'punishment'
  name: string
  description: string
  used: boolean
}

export interface DiceResult {
  value: number
  canReroll: boolean
}
