// 棋盘数据 - 基于 sushi.xlsx

import { Tile, TileType, Property } from './types'

// 辅助函数：创建地皮
function createPropertyTile(id: number, name: string): Property {
  return {
    id,
    type: 'property',
    name,
    basePrice: 1000,
    houseLevel: 0,
    ownerId: null
  }
}

// 辅助函数：创建事件格
function createTile(id: number, tileType: TileType, name: string, description?: string, effect?: string): Tile {
  return { id, type: tileType, name, description, effect }
}

// 72格棋盘定义（基于 sushi.xlsx）
export const BOARD_TEMPLATES: Tile[] = [
  // 位置0: 眉州（起点）
  createTile(0, 'special', '眉州', '1037年苏轼出生', '经过获得1000，踩中获得1500'),

  // 位置1-2: 眉山区域
  createPropertyTile(1, '南轩书房'),
  createPropertyTile(2, '眉山私塾'),

  // 位置3-8: 事件格
  createTile(3, 'reward', '出川赴京', '出川赴京'),
  createTile(4, 'quiz', '考中进士', '1057年苏轼被录取为进士', '回答正确：2500'),
  createTile(5, 'quiz', '殿试第六', null, null),  // 注意：这是问答事件，不是地皮
  createPropertyTile(6, '纱縠行'),
  createPropertyTile(7, '来凤轩'),
  createTile(8, 'special', '丧母之痛', '1057年母亲病逝，守孝三年', '原地停留3回合'),

  // 位置9-10
  createPropertyTile(9, '嘉州驿馆'),
  createPropertyTile(10, '成都官驿'),

  // 位置11-17: 继续眉山区域
  createTile(11, 'random', '随机事件', null, null),
  createTile(12, 'reward', '出川赴京', '出川赴京'),
  createPropertyTile(13, '茅厕'),
  createPropertyTile(14, '贡院'),
  createTile(15, 'poetry', '《南行集》', null, '抽一张诗词题卡'),
  createTile(16, 'quiz', '京城备考', null, null),
  createTile(17, 'random', '随机事件', null, null),

  // 位置18: 汴京（边角）
  createTile(18, 'quiz', '汴京', '1061年科举考入第三等', '回答正确+5000'),

  // 位置19-22
  createPropertyTile(19, '宜秋门宅'),
  createTile(20, 'special', '丧父之痛', '1066年父亲去世，守孝三年', '原地停留3回合'),
  createPropertyTile(21, '南园会客厅'),
  createPropertyTile(22, '怀远驿'),

  // 位置23-27
  createTile(23, 'special', '王安石变法', '1069年王安石变法', '失去1000'),
  createTile(24, 'quiz', '上万言书', null, null),
  createTile(25, 'punishment', '遭受弹劾', null, null),
  createPropertyTile(26, '都亭驿'),
  createTile(27, 'special', '通判杭州', '1071年赴任杭州三年', '原地停留3回合'),

  // 位置28-35
  createTile(28, 'poetry', '《饮湖上初晴后雨》', null, null),
  createPropertyTile(29, '钱塘官舍'),
  createTile(30, 'quiz', '西湖救灾', null, null),
  createTile(31, 'quiz', '徐州治水', null, null),
  createPropertyTile(32, '徐州黄楼'),
  createTile(33, 'reward', '抗灾授奖', null, null),
  createPropertyTile(34, '逍遥堂'),
  createPropertyTile(35, '彭城官舍'),

  // 位置36: 湖州（边角）
  createTile(36, 'special', '湖州', '1079年乌台诗案', '当前资产扣除到1000，若当前资产不足1000，直接破产'),

  // 位置37-44
  createTile(37, 'punishment', '被贬黄州', null, null),
  createPropertyTile(38, '东坡雪堂'),
  createTile(39, 'poetry', '《题西林壁》', null, null),
  createPropertyTile(40, '登州官厅'),
  createTile(41, 'poetry', '《惠崇春江晚景》', null, null),
  createTile(42, 'quiz', '元祐更化', '1086年司马光废新法，苏轼任翰林学士', null),
  createPropertyTile(43, '杭州安乐坊'),
  createTile(44, 'quiz', '苏提春晓', '1090年疏浚西湖', null),

  // 位置45-53
  createTile(45, 'punishment', '被贬颍州', null, null),
  createPropertyTile(46, '扬州平山堂'),
  createTile(47, 'reward', '职业巅峰', null, null),
  createPropertyTile(48, '定州阅古堂'),
  createTile(49, 'special', '连续五贬', '1094年苏轼接连被贬汝州，英州，袁州，筠州，惠州', '抽5张惩罚卡'),
  createPropertyTile(50, '合江楼'),
  createPropertyTile(51, '惠州白鹤峰'),
  createTile(52, 'punishment', '被贬儋州', null, null),
  createPropertyTile(53, '桄榔庵'),

  // 位置54: 常州（边角）
  createTile(54, 'special', '常州', '1101年苏轼病逝，享年66岁', '原地停留1回合'),

  // 位置55-65
  createTile(55, 'special', '入土为安', '1102年安葬于汝州', '获得墓碑卡'),
  createPropertyTile(56, '小峨眉山'),
  createTile(57, 'punishment', '元佑旧党', '1102年被列元佑旧党，子孙受阻', null),
  createPropertyTile(58, '常州孙氏馆'),
  createPropertyTile(59, '藤花旧馆'),
  createTile(60, 'random', '随机事件', null, null),
  createTile(61, 'special', '兄弟团聚', '1112年苏辙去世', '获得花束卡'),
  createPropertyTile(62, '二苏坟'),
  createTile(63, 'random', '随机事件', null, null),
  createTile(64, 'special', '追赠太师', '1128年宋高宗封苏轼为太师', '抽2张道具卡'),
  createTile(65, 'special', '谥号"文忠"', '1170年宋孝宗追谥苏轼号"文忠"', '抽2张道具卡'),

  // 位置66-71
  createPropertyTile(66, '地府'),
  createPropertyTile(67, '苏公祠'),
  createTile(68, 'random', '随机事件', null, null),
  createTile(69, 'poetry', '后世传颂', null, '抽一张诗词题卡'),
  createPropertyTile(70, '三苏坟'),
  createPropertyTile(71, '教室'),
]

// 获取可购地皮模板列表
export function getPropertyTemplates(): Property[] {
  return BOARD_TEMPLATES.filter((tile): tile is Property => tile.type === 'property')
}

// 深拷贝棋盘（用于新游戏）
export function createBoard(): Tile[] {
  return BOARD_TEMPLATES.map(tile => ({ ...tile }))
}

// 获取可购地皮列表（从游戏棋盘）
export function getProperties(board: Tile[]): Property[] {
  return board.filter((tile): tile is Property => tile.type === 'property')
}

// 获取地皮By ID
export function getPropertyById(board: Tile[], id: number): Property | undefined {
  const tile = board[id]
  return tile?.type === 'property' ? tile : undefined
}
