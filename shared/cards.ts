// 问答卡和诗词卡数据
import { CARD_COUNTS } from './constants'

export interface QuizCard {
  id: string
  type: 'quiz'
  question: string
  answer: string
  reward: number
}

export interface PoetryCard {
  id: string
  type: 'poetry'
  title: string
  author: string
  content: string
  reward: number
  penalty: number
}

// 问答卡题库
export const QUIZ_CARDS: QuizCard[] = [
  { id: 'q1', type: 'quiz', question: '苏轼号什么？', answer: '东坡居士', reward: 100 },
  { id: 'q2', type: 'quiz', question: '《念奴娇·赤壁怀古》作者是谁？', answer: '苏轼', reward: 100 },
  { id: 'q3', type: 'quiz', question: '苏轼是哪个朝代的人？', answer: '宋', reward: 100 },
  { id: 'q4', type: 'quiz', question: '"明月几时有"的下一句是？', answer: '把酒问青天', reward: 150 },
  { id: 'q5', type: 'quiz', question: '苏轼的父亲是谁？', answer: '苏洵', reward: 150 },
  { id: 'q6', type: 'quiz', question: '"但愿人长久"的下一句是？', answer: '千里共婵娟', reward: 150 },
  { id: 'q7', type: 'quiz', question: '苏轼被贬到黄州时修建的建筑是？', answer: '雪堂', reward: 200 },
  { id: 'q8', type: 'quiz', question: '"大江东去"出自哪首词？', answer: '念奴娇·赤壁怀古', reward: 200 },
]

// 诗词卡题库
export const POETRY_CARDS: PoetryCard[] = [
  {
    id: 'p1',
    type: 'poetry',
    title: '《题西林壁》',
    author: '苏轼',
    content: '横看成岭侧成峰，远近高低各不同。不识庐山真面目，只缘身在此山中。',
    reward: 100,
    penalty: 50
  },
  {
    id: 'p2',
    type: 'poetry',
    title: '《饮湖上初晴后雨》',
    author: '苏轼',
    content: '水光潋滟晴方好，山色空蒙雨亦奇。欲把西湖比西子，淡妆浓抹总相宜。',
    reward: 100,
    penalty: 50
  },
  {
    id: 'p3',
    type: 'poetry',
    title: '《惠崇春江晚景》',
    author: '苏轼',
    content: '竹外桃花三两枝，春江水暖鸭先知。蒌蒿满地芦芽短，正是河豚欲上时。',
    reward: 100,
    penalty: 50
  },
  {
    id: 'p4',
    type: 'poetry',
    title: '《念奴娇·赤壁怀古》',
    author: '苏轼',
    content: '大江东去，浪淘尽，千古风流人物。故垒西边，人道是，三国周郎赤壁。',
    reward: 150,
    penalty: 75
  },
  {
    id: 'p5',
    type: 'poetry',
    title: '《水调歌头》',
    author: '苏轼',
    content: '明月几时有？把酒问青天。不知天上宫阙，今夕是何年？',
    reward: 150,
    penalty: 75
  },
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
