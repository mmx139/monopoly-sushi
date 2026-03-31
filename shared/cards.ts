// 问答卡和诗词卡数据 - 基于需求文档001
import { CARD_COUNTS } from './constants'

export interface QuizCard {
  id: string
  type: 'quiz'
  question: string
  answers: string[]  // 多个答案，答对任意一个即可
  reward: number
}

export interface PoetryCard {
  id: string
  type: 'poetry'
  title: string
  author: string
  fullText: string  // 完整诗词
  reward: number    // 完整写出
  halfPenalty: number  // 半首惩罚
  halfReward?: number   // 全诗正确给一半货币
}

// 问答卡题库 - 需求文档001中4.1
export const QUIZ_CARDS: QuizCard[] = [
  { id: 'q1', type: 'quiz', question: '苏轼是哪个朝代的文学家？', answers: ['宋朝', '北宋'], reward: 100 },
  { id: 'q2', type: 'quiz', question: '苏轼字什么？', answers: ['子瞻', '和仲'], reward: 100 },
  { id: 'q3', type: 'quiz', question: '苏轼号什么？', answers: ['铁冠道人', '东坡居士'], reward: 100 },
  { id: 'q4', type: 'quiz', question: '"三苏"指哪三人？', answers: ['苏洵，苏轼，苏辙'], reward: 100 },
  { id: 'q5', type: 'quiz', question: '"苏堤"与其他哪两堤并称"西湖三堤"，用/分隔？', answers: ['白堤/杨公堤', '杨公堤/白堤'], reward: 100 },
  { id: 'q6', type: 'quiz', question: '"但愿人长久，千里共婵娟"出自哪首诗？', answers: ['水调歌头明月几时有', '水调歌头'], reward: 100 },
  { id: 'q7', type: 'quiz', question: '"大江东去，浪淘尽，千古风流人物"这句词描写的是哪一个古代战场？', answers: ['赤壁'], reward: 100 },
  { id: 'q8', type: 'quiz', question: '"宋四家"的"苏黄米蔡"中的"黄"是指？', answers: ['黄庭坚'], reward: 100 },
  { id: 'q9', type: 'quiz', question: '苏轼被认为是宋代词坛哪一个流派的开创者？', answers: ['豪放派'], reward: 100 },
  { id: 'q10', type: 'quiz', question: '"横看成岭侧成峰，远近高低各不同"描写的是哪座山？', answers: ['庐山'], reward: 100 },
  { id: 'q11', type: 'quiz', question: '哪道著名的传统菜肴是由苏轼在黄州时改良并推广的？', answers: ['东坡肉'], reward: 100 },
  { id: 'q12', type: 'quiz', question: '苏轼与谁并称"苏辛"', answers: ['辛弃疾'], reward: 100 },
  { id: 'q13', type: 'quiz', question: '苏轼在《记承天寺夜游》中，与哪位好友一起在月色下散步？', answers: ['张怀民'], reward: 100 },
  { id: 'q14', type: 'quiz', question: '《念奴娇·赤壁怀古》中提到的"羽扇纶巾"形容的是谁？', answers: ['周瑜'], reward: 100 },
  { id: 'q15', type: 'quiz', question: '"老夫聊发少年狂，左牵黄，右擎苍"，"苍"是指什么动物？', answers: ['苍鹰'], reward: 100 },
]

// 诗词卡题库 - 需求文档001中4.2
export const POETRY_CARDS: PoetryCard[] = [
  {
    id: 'p1',
    type: 'poetry',
    title: '江城子·乙卯正月二十日夜记梦',
    author: '苏轼',
    fullText: '十年生死两茫茫，不思量，自难忘。千里孤坟，无处话凄凉。纵使相逢应不识，尘满面，鬓如霜。夜来幽梦忽还乡，小轩窗，正梳妆。相顾无言，惟有泪千行。料得年年肠断处，明月夜，短松冈。',
    reward: 100,
    halfPenalty: 200,
    halfReward: 500
  },
  {
    id: 'p2',
    type: 'poetry',
    title: '念奴娇·赤壁怀古',
    author: '苏轼',
    fullText: '大江东去，浪淘尽，千古风流人物。故垒西边，人道是，三国周郎赤壁。乱石穿空，惊涛拍岸，卷起千堆雪。遥想公瑾当年，小乔初嫁了，雄姿英发。羽扇纶巾，谈笑间，樯橹灰飞烟灭。故国神游，多情应笑我，早生华发。人生如梦，一尊还酹江月。江山如画，一时多少豪杰。',
    reward: 100,
    halfPenalty: 200,
    halfReward: 500
  },
  {
    id: 'p3',
    type: 'poetry',
    title: '水调歌头·明月几时有',
    author: '苏轼',
    fullText: '明月几时有？把酒问青天。不知天上宫阙，今夕是何年。我欲乘风归去，又恐琼楼玉宇，高处不胜寒。起舞弄清影，何似在人间。转朱阁，低绮户，照无眠。不应有恨，何事长向别时圆？人有悲欢离合，月有阴晴圆缺，此事古难全。但愿人长久，千里共婵娟。',
    reward: 100,
    halfPenalty: 200,
    halfReward: 500
  },
  {
    id: 'p4',
    type: 'poetry',
    title: '饮湖上初晴后雨',
    author: '苏轼',
    fullText: '水光潋滟晴方好，山色空蒙雨亦奇。欲把西湖比西子，淡妆浓抹总相宜。',
    reward: 100,
    halfPenalty: 200,
    halfReward: 500
  },
  {
    id: 'p5',
    type: 'poetry',
    title: '蝶恋花·春景',
    author: '苏轼',
    fullText: '花褪残红青杏小。燕子飞时，绿水人家绕。枝上柳绵吹又少，天涯何处无芳草！墙里秋千墙外道。墙外行人，墙里佳人笑，笑渐不闻声渐悄，多情却被无情恼。',
    reward: 100,
    halfPenalty: 200,
    halfReward: 500
  },
  {
    id: 'p6',
    type: 'poetry',
    title: '卜算子·黄州定慧院寓居作',
    author: '苏轼',
    fullText: '缺月挂疏桐，漏断人初静。谁见幽人独往来，缥缈孤鸿影。惊起却回头，有恨无人省。拣尽寒枝不肯栖，寂寞沙洲冷。',
    reward: 100,
    halfPenalty: 200,
    halfReward: 500
  },
  {
    id: 'p7',
    type: 'poetry',
    title: '和子由渑池怀旧',
    author: '苏轼',
    fullText: '人生到处知何似，应似飞鸿踏雪泥。泥上偶然留指爪，鸿飞那复计东西。老僧已死成新塔，坏壁无由见旧题。往日崎岖还记否，路长人困蹇驴嘶。',
    reward: 100,
    halfPenalty: 200,
    halfReward: 500
  },
  {
    id: 'p8',
    type: 'poetry',
    title: '题西林壁',
    author: '苏轼',
    fullText: '横看成岭侧成峰，远近高低各不同。不识庐山真面目，只缘身在此山中。',
    reward: 100,
    halfPenalty: 200,
    halfReward: 500
  },
  {
    id: 'p9',
    type: 'poetry',
    title: '惠崇春江晚景',
    author: '苏轼',
    fullText: '竹外桃花三两枝，春江水暖鸭先知。蒌蒿满地芦芽短，正是河豚欲上时。',
    reward: 100,
    halfPenalty: 200,
    halfReward: 500
  },
]

// 道具卡 - 需求文档001中4.3
export interface ItemCard {
  id: string
  type: 'item'
  name: string
  description: string
  effect: string
  count: number
  auctionPrice: number
  consumeOnUse: boolean  // 使用后是否消耗
}

export const ITEM_CARDS: ItemCard[] = [
  { id: 'carriage', type: 'item', name: '马车', description: '可投2枚骰子按点数移动', effect: 'double_roll', count: 10, auctionPrice: 10, consumeOnUse: true },
  { id: 'ruyi', type: 'item', name: '如意令', description: '免疫任意道具效果', effect: 'immunity', count: 10, auctionPrice: 10, consumeOnUse: true },
  { id: 'rock', type: 'item', name: '巨石', description: '指定地皮放置，踩中玩家停留1回合', effect: 'trap_stay', count: 10, auctionPrice: 10, consumeOnUse: false },
  { id: 'broom', type: 'item', name: '扫帚', description: '清除除墓碑与花束外的所有放置道具', effect: 'clear_traps', count: 10, auctionPrice: 10, consumeOnUse: true },
  { id: 'trap', type: 'item', name: '陷阱', description: '指定地皮放置，踩中的玩家停留1回合', effect: 'trap_stay', count: 10, auctionPrice: 10, consumeOnUse: false },
  { id: 'mousetrap', type: 'item', name: '捕兽夹', description: '指定地皮放置，踩中受伤就医失去500', effect: 'trap_damage', count: 10, auctionPrice: 10, consumeOnUse: false },
  { id: 'wine', type: 'item', name: '酒', description: '使1名指定其他玩家下一回合无法操作', effect: 'skip_turn', count: 10, auctionPrice: 10, consumeOnUse: true },
  { id: 'inn', type: 'item', name: '客栈', description: '再次触发当前地皮效果', effect: 'reroll_tile', count: 10, auctionPrice: 10, consumeOnUse: true },
  { id: 'robbery', type: 'item', name: '抄家令', description: '从指定1名其他玩家抽取一张道具卡', effect: 'steal_item', count: 10, auctionPrice: 10, consumeOnUse: true },
  { id: 'thunder', type: 'item', name: '引雷符', description: '指定地皮降一级，对未被购买的可购地皮与一级房屋无效', effect: 'downgrade', count: 5, auctionPrice: 50, consumeOnUse: true },
  { id: 'explosion', type: 'item', name: '爆裂符', description: '指定1名其他玩家爆炸受伤，就医失去1000', effect: 'damage_1000', count: 5, auctionPrice: 50, consumeOnUse: true },
  { id: 'tax', type: 'item', name: '征税令', description: '向指定1名其他玩家征收2000', effect: 'tax_2000', count: 5, auctionPrice: 50, consumeOnUse: true },
  { id: 'deed', type: 'item', name: '地契', description: '免费获得任意一块可购地皮', effect: 'free_property', count: 2, auctionPrice: 5000, consumeOnUse: true },
  { id: 'immunity', type: 'item', name: '免死金牌', description: '破产时自动使用，重生并获得5000，使用后不放回', effect: 'rebirth', count: 1, auctionPrice: 10000, consumeOnUse: false },
  { id: 'tombstone', type: 'item', name: '墓碑', description: '获得时当场使用，指定地皮放置，踩中给予摆放玩家1000香火钱（需配合花束获得）', effect: 'tombstone', count: 4, auctionPrice: 0, consumeOnUse: false },
  { id: 'flower', type: 'item', name: '花束', description: '获得时若未放置过墓碑便存放，否则当场使用并与墓碑放在一起，墓碑收益提升至2000', effect: 'flower', count: 4, auctionPrice: 0, consumeOnUse: false },
]

// 惩罚卡 - 需求文档001中4.4
export interface PunishmentCard {
  id: string
  type: 'punishment'
  name: string
  effect: string
  count: number
}

export const PUNISHMENT_CARDS: PunishmentCard[] = [
  { id: 'pun1', type: 'punishment', name: '原地停留2回合', effect: 'stay_2', count: 10 },
  { id: 'pun2', type: 'punishment', name: '2回合无法使用道具卡片', effect: 'no_item_2', count: 10 },
  { id: 'pun3', type: 'punishment', name: '失去100', effect: 'lose_100', count: 10 },
  { id: 'pun4', type: 'punishment', name: '失去500', effect: 'lose_500', count: 10 },
  { id: 'pun5', type: 'punishment', name: '强制拍卖最高级地皮', effect: 'auction_max', count: 10 },
  { id: 'pun6', type: 'punishment', name: '后退10格', effect: 'back_10', count: 10 },
  { id: 'pun7', type: 'punishment', name: '失去1000', effect: 'lose_1000', count: 5 },
  { id: 'pun8', type: 'punishment', name: '失去5000', effect: 'lose_5000', count: 5 },
  { id: 'pun9', type: 'punishment', name: '回到起始格', effect: 'back_start', count: 5 },
  { id: 'pun10', type: 'punishment', name: '失去所有道具卡片', effect: 'lose_all_items', count: 5 },
  { id: 'pun11', type: 'punishment', name: '接下来3回合过路费x2', effect: 'toll_x2_3', count: 5 },
  { id: 'pun12', type: 'punishment', name: '给所有其他玩家1000', effect: 'give_all_1000', count: 5 },
  { id: 'pun13', type: 'punishment', name: '赠与上一位玩家500', effect: 'give_prev_500', count: 5 },
  { id: 'pun14', type: 'punishment', name: '随意赠与自己一个地皮给任意玩家', effect: 'give_property', count: 2 },
]

/**
 * 随机获取一张问答卡
 */
export function drawQuizCard(): QuizCard {
  const index = Math.floor(Math.random() * QUIZ_CARDS.length)
  return QUIZ_CARDS[index]
}

/**
 * 随机获取一张诗词卡
 */
export function drawPoetryCard(): PoetryCard {
  const index = Math.floor(Math.random() * POETRY_CARDS.length)
  return POETRY_CARDS[index]
}

/**
 * 随机获取一张道具卡
 */
export function drawItemCard(): ItemCard {
  const available = ITEM_CARDS.filter(c => c.count > 0)
  if (available.length === 0) return null
  const index = Math.floor(Math.random() * available.length)
  return available[index]
}

/**
 * 随机获取一张惩罚卡
 */
export function drawPunishmentCard(): PunishmentCard {
  const index = Math.floor(Math.random() * PUNISHMENT_CARDS.length)
  return PUNISHMENT_CARDS[index]
}

/**
 * 检查答案是否正确（问答卡）
 */
export function checkQuizAnswer(card: QuizCard, userAnswer: string): boolean {
  const normalized = userAnswer.trim().replace(/[，。？！、；：""''（）]/g, '')
  return card.answers.some(answer => {
    const normalizedAnswer = answer.replace(/[，。？！、；：""''（）]/g, '')
    return normalized.includes(normalizedAnswer) || normalizedAnswer.includes(normalized)
  })
}

/**
 * 检查诗词背诵（诗词卡）
 * 返回: 'full' | 'half' | 'wrong'
 *
 * 判断优先级：
 * 1. 匹配任一完整诗句（断句）→ 'half' → +100
 * 2. 匹配全诗（忽略标点，允许3字误差）→ 'full' → +halfReward
 * 3. 其他 → 'wrong' → -200
 */
export function checkPoetryAnswer(card: PoetryCard, userInput: string): 'full' | 'half' | 'wrong' {
  const normalized = userInput.trim().replace(/[，。？！、；：""''（）]/g, '')

  // 1. 先检查是否匹配任一完整诗句（断句）
  const sentences = card.fullText.split(/[。！？]/).filter(s => s.trim())
  for (const sentence of sentences) {
    const normalizedSentence = sentence.replace(/[，。？！、；：""''（）]/g, '').trim()
    if (normalizedSentence && (normalized.includes(normalizedSentence) || normalizedSentence.includes(normalized))) {
      return 'half'
    }
  }

  // 2. 检查是否匹配全诗（允许3个字符误差）
  const fullTextNormalized = card.fullText.replace(/[，。？！、；：""''（）]/g, '')
  if (isFullMatch(normalized, fullTextNormalized)) {
    return 'full'
  }

  // 3. 否则判定为错误
  return 'wrong'
}

/**
 * 全诗匹配：忽略标点，允许3个字符误差
 */
function isFullMatch(input: string, full: string): boolean {
  if (input === full) return true

  // 计算编辑距离（简单实现）
  const errors = countErrors(input, full)
  return errors <= 3
}

/**
 * 计算两个字符串的字符误差数
 */
function countErrors(input: string, full: string): number {
  // 简单实现：计算不同字符的数量
  const maxLen = Math.max(input.length, full.length)
  if (maxLen === 0) return 0

  let errors = 0
  const minLen = Math.min(input.length, full.length)

  for (let i = 0; i < minLen; i++) {
    if (input[i] !== full[i]) {
      errors++
    }
  }

  // 加上长度差异
  errors += Math.abs(input.length - full.length)

  return errors
}
