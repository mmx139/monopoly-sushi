// 游戏常量

export const BOARD_SIZE = 72
export const PLAYER_COUNT = 4
export const INITIAL_MONEY = 15000
export const PROPERTY_PRICE = 1000
export const HOUSE_UPGRADE_PRICE = 800

export const HOUSE_TOLLS = {
  0: 0,    // no house
  1: 500,  // level 1
  2: 800,  // level 2
  3: 1000  // level 3
}

export const HOUSE_BONUS = {
  1: 100,
  2: 150,
  3: 200
}

export const AUCTION_PRICES = {
  1: 500,
  2: 1000,
  3: 1500
}

// 地皮类型
export const TILE_TYPE = {
  START: 'start',           // 起点
  PROPERTY: 'property',      // 可购地皮
  SPECIAL: 'special',        // 特殊事件
  POETRY: 'poetry',         // 诗词事件
  QUIZ: 'quiz',              // 问答事件
  REWARD: 'reward',         // 奖励事件
  PUNISHMENT: 'punishment',  // 惩罚事件
  RANDOM: 'random'           // 随机事件
}

// 角色
export const CHARACTERS = [
  { id: 'sushi', name: '苏轼', title: '东坡居士' },
  { id: 'suzhe', name: '苏辙', title: '颍滨遗老' },
  { id: 'wanganshi', name: '王安石', title: '临川先生' },
  { id: 'zhanghuaimin', name: '张怀民', title: 'TODO' }
]

// 卡牌数量
export const CARD_COUNTS = {
  // 道具卡
  carriage: 10,      // 马车
  ruyi: 10,          // 如意令
  rock: 10,           // 巨石
  broom: 10,          // 扫帚
  trap: 10,           // 陷阱
  mousetrap: 10,      // 捕兽夹
  wine: 10,           // 酒
  inn: 10,            // 客栈
  robbery: 10,        // 抄家令
  thunder: 5,         // 引雷符
  explosion: 5,       // 爆裂符
  tax: 5,             // 征税令
  deed: 2,            // 地契
  immunity: 1,         // 免死金牌
  tombstone: 4,       // 墓碑
  flower: 4           // 花束
}
