"""
Monopoly-Sushi Backend - 游戏核心模型
"""
from enum import Enum
from dataclasses import dataclass, field
from typing import List, Optional
import random

class Character(Enum):
    苏轼 = "苏轼"
    苏辙 = "苏辙"
    王安石 = "王安石"
    张怀民 = "张怀民"

class TileType(Enum):
    START = "start"
    PROPERTY = "property"
    SPECIAL = "special"
    POETRY = "poetry"
    QUIZ = "quiz"
    REWARD = "reward"
    PUNISHMENT = "punishment"
    RANDOM = "random"

@dataclass
class Player:
    id: str
    name: str
    character_id: str
    position: int = 0
    money: int = 15000
    properties: List[int] = field(default_factory=list)
    items: List[str] = field(default_factory=list)
    is_ai: bool = False
    is_bankrupt: bool = False
    stay_turns: int = 0

    def can_afford(self, amount: int) -> bool:
        return self.money >= amount

    def pay(self, amount: int) -> bool:
        if self.can_afford(amount):
            self.money -= amount
            return True
        return False

    def receive(self, amount: int):
        self.money += amount

@dataclass
class Property:
    id: int
    name: str
    base_price: int = 1000
    house_level: int = 0
    owner_id: Optional[str] = None

    @property
    def upgrade_price(self) -> int:
        if self.house_level >= 3:
            return 0
        return 800

    @property
    def toll(self) -> int:
        tolls = {0: 0, 1: 500, 2: 800, 3: 1000}
        return tolls.get(self.house_level, 0)

    @property
    def bonus(self) -> int:
        bonuses = {1: 100, 2: 150, 3: 200}
        return bonuses.get(self.house_level, 0)

@dataclass
class Tile:
    id: int
    type: TileType
    name: str
    description: Optional[str] = None

@dataclass
class GameState:
    players: List[Player]
    properties: List[Property]
    current_player_index: int = 0
    phase: str = "waiting"
    winner: Optional[str] = None
    turn_number: int = 0

    @property
    def current_player(self) -> Player:
        return self.players[self.current_player_index]

def create_board() -> List[Tile]:
    """创建72格棋盘"""
    tiles = [
        Tile(0, TileType.START, "眉州", "起点"),
    ]
    return tiles

def create_properties() -> List[Property]:
    """创建32个可购地皮"""
    property_names = [
        "南轩书房", "眉山私塾", "纱縠行", "来凤轩", "嘉州驿馆", "成都官驿", "茅厕", "贡院",
        "宜秋门宅", "南园会客厅", "怀远驿", "都亭驿", "钱塘官舍", "徐州黄楼", "逍遥堂", "彭城官舍",
        "东坡雪堂", "登州官厅", "杭州安乐坊", "扬州平山堂", "定州阅古堂", "合江楼", "惠州白鹤峰", "桄榔庵",
        "小峨眉山", "常州孙氏馆", "藤花旧馆", "二苏坟", "地府", "苏公祠", "三苏坟", "教室"
    ]
    return [Property(id=i, name=name) for i, name in enumerate(property_names)]

def roll_dice() -> int:
    """投骰子，返回1-6"""
    return random.randint(1, 6)

def can_upgrade(property: Property) -> bool:
    """检查是否可以升级房屋"""
    return property.owner_id is not None and property.house_level < 3
