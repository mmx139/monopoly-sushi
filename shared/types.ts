// 游戏类型定义

export type TileType = 'start' | 'property' | 'special' | 'poetry' | 'quiz' | 'reward' | 'punishment' | 'random'

export interface Tile {
  id: number
  type: TileType
  name: string
  description?: string
  effect?: string  // 格子效果描述
  placedItems?: string[]  // 放置在此格子的道具ID列表
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
  noItemTurns: number  // 无法使用道具的回合数
  tollX2Turns: number  // 过路费翻倍的回合数
  doubleDice: boolean  // 下次可以投2枚骰子
  hasImmunity: boolean  // 免疫一次破产
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
