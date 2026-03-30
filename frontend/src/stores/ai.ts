// AI玩家决策逻辑
import type { Player, Property, Tile } from '@shared/types'
import { HOUSE_UPGRADE_PRICE, HOUSE_TOLLS } from '@shared/constants'

/**
 * AI玩家决策
 * 返回: 'buy' | 'upgrade' | 'skip'
 */
export function aiMakeDecision(
  player: Player,
  currentTile: Tile | null,
  aiMoney: number
): 'buy' | 'upgrade' | 'skip' {
  if (!currentTile) return 'skip'

  // 地皮决策
  if (currentTile.type === 'property') {
    const property = currentTile as Property

    // 无主地皮 - 考虑购买
    if (!property.ownerId) {
      // 价格不超过余额的60%才考虑购买
      if (property.basePrice <= aiMoney * 0.6) {
        return 'buy'
      }
      return 'skip'
    }

    // 自有地皮 - 考虑升级
    if (property.ownerId === player.id) {
      // 还没到最高级且有钱升级
      if (property.houseLevel < 3 && aiMoney >= HOUSE_UPGRADE_PRICE) {
        return 'upgrade'
      }
      return 'skip'
    }

    // 他人地皮 - 无法操作
    return 'skip'
  }

  // 非地皮格子 - 直接跳过
  return 'skip'
}

/**
 * AI延迟决策（模拟思考时间）
 */
export function aiDelayedDecision(
  player: Player,
  currentTile: Tile | null,
  aiMoney: number,
  callback: (decision: 'buy' | 'upgrade' | 'skip') => void,
  delayMs: number = 800
): void {
  setTimeout(() => {
    const decision = aiMakeDecision(player, currentTile, aiMoney)
    callback(decision)
  }, delayMs)
}
