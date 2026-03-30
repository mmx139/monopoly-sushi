// 棋盘数据 - 基于 002_map_details.md

import { Tile, TileType, Property } from './types'

// 辅助函数：创建地皮
function createProperty(id: number, name: string): Property {
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
function createTile(id: number, tileType: TileType, name: string, description?: string): Tile {
  return { id, type: tileType, name, description }
}

// 72格棋盘完整定义
export const BOARD: Tile[] = [
  // 【左下角 - 眉州】起点 (0)
  createTile(0, 'start', '眉州', '1037年苏轼出生。经过获得1000，踩中获得1500'),

  // 左下边 - 眉州区域 (1-17)
  createProperty(1, '南轩书房'),
  createProperty(2, '眉山私塾'),
  createTile(3, 'reward', '出川赴京', '随机获得1张道具卡'),
  createTile(4, 'quiz', '考中进士', '回答正确获得奖励'),
  createProperty(5, '纱縠行'),
  createProperty(6, '来凤轩'),
  createTile(7, 'special', '丧母之痛', '1057年母亲病逝，守孝三年，原地停留3回合'),
  createProperty(8, '嘉州驿馆'),
  createProperty(9, '成都官驿'),
  createTile(10, 'random', '出川赴京'),
  createTile(11, 'reward', '出川赴京', '随机获得1张道具卡'),
  createProperty(12, '茅厕'),
  createProperty(13, '贡院'),
  createTile(14, 'poetry', '《南行集》', '抽诗词题卡'),
  createTile(15, 'quiz', '京城备考'),
  createTile(16, 'random', '随机事件'),
  createTile(17, 'special', '边角-汴京', '1061年科举考入第三等，问答事件，正确+5000'),

  // 【左上角 - 汴京】(18)
  createTile(18, 'start', '汴京', '1061年科举考入第三等，问答事件，正确+5000'),
  createProperty(19, '宜秋门宅'),
  createTile(20, 'special', '丧父之痛', '1066年父亲去世，守孝三年，原地停留3回合'),
  createProperty(21, '南园会客厅'),
  createProperty(22, '怀远驿'),
  createTile(23, 'special', '王安石变法', '1069年变法，失去1000'),
  createTile(24, 'quiz', '上万言书'),
  createTile(25, 'punishment', '遭受弹劾'),
  createProperty(26, '都亭驿'),
  createTile(27, 'special', '通判杭州', '1071年赴任杭州三年，原地停留3回合'),
  createTile(28, 'poetry', '《饮湖上初晴后雨其二》', '水光潋滟晴方好...'),
  createProperty(29, '钱塘官舍'),
  createTile(30, 'quiz', '西湖救灾'),
  createTile(31, 'quiz', '徐州治水'),
  createProperty(32, '徐州黄楼'),
  createTile(33, 'reward', '抗灾授奖', '随机获得1张道具卡'),
  createProperty(34, '逍遥堂'),
  createProperty(35, '彭城官舍'),
  createTile(36, 'special', '边角-湖州', '1079年乌台诗案，当前资产扣除到1000'),

  // 【右上角 - 湖州】(36)
  createTile(36, 'start', '湖州', '1079年乌台诗案，当前资产扣除到1000，破产则被贬黄州'),
  createTile(37, 'punishment', '被贬黄州'),
  createProperty(38, '东坡雪堂'),
  createTile(39, 'poetry', '《题西林壁》', '横看成岭侧成峰...'),
  createProperty(40, '登州官厅'),
  createTile(41, 'poetry', '《惠崇春江晚景二首其一》', '竹外桃花三两枝...'),
  createTile(42, 'quiz', '元祐更化', '1086年司马光废新法'),
  createProperty(43, '杭州安乐坊'),
  createTile(44, 'quiz', '苏提春晓', '1090年疏浚西湖'),
  createTile(45, 'punishment', '被贬颍州'),
  createProperty(46, '扬州平山堂'),
  createTile(47, 'reward', '职业巅峰', '随机获得1张道具卡'),
  createProperty(48, '定州阅古堂'),
  createTile(49, 'special', '连续五贬', '1094年接连被贬汝/英/袁/筠/惠，抽5张惩罚卡'),
  createProperty(50, '合江楼'),
  createProperty(51, '惠州白鹤峰'),
  createTile(52, 'punishment', '被贬儋州'),
  createProperty(53, '桄榔庵'),
  createTile(54, 'special', '边角-常州', '1101年苏轼病逝，原地停留1回合'),

  // 【右下角 - 常州】(54)
  createTile(54, 'start', '常州', '1101年苏轼病逝，原地停留1回合'),
  createTile(55, 'special', '入土为安', '1102年安葬于汝州，获得墓碑卡'),
  createProperty(56, '小峨眉山'),
  createTile(57, 'punishment', '元佑旧党', '1102年被列元佑旧党，子孙受阻'),
  createProperty(58, '常州孙氏馆'),
  createProperty(59, '藤花旧馆'),
  createTile(60, 'random', '随机事件'),
  createTile(61, 'special', '兄弟团聚', '1112年苏辙去世，获得花束卡'),
  createProperty(62, '二苏坟'),
  createTile(63, 'random', '随机事件'),
  createTile(64, 'special', '追赠太师', '1128年封太师，抽2张道具卡'),
  createTile(65, 'special', '谥号"文忠"', '1170年追谥，抽2张道具卡'),
  createProperty(66, '地府'),
  createProperty(67, '苏公祠'),
  createTile(68, 'random', '随机事件'),
  createTile(69, 'poetry', '后世传颂'),
  createProperty(70, '三苏坟'),
  createProperty(71, '教室'),
]

// 获取可购地皮列表
export function getProperties(): Property[] {
  return BOARD.filter((tile): tile is Property => tile.type === 'property')
}

// 获取地皮By ID
export function getPropertyById(id: number): Property | undefined {
  const tile = BOARD[id]
  return tile?.type === 'property' ? tile : undefined
}
