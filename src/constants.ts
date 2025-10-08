export const NUM_ROWS = 8;
export const NUM_COLUMNS = 8;
export const NUM_SQUARES = NUM_ROWS * NUM_COLUMNS;
export const NUM_STARTING_PIECES = 16;
export const ACTION_SKIP = -1;

export const KING_STARTING_HEALTH_POINTS = 10;
export const MAGE_STARTING_HEALTH_POINTS = 10;
export const PAWN_STARTING_HEALTH_POINTS = 30;
export const WARRIOR_STARTING_HEALTH_POINTS = 60;
export const ASSASSIN_STARTING_HEALTH_POINTS = 10;
export const KNIGHT_STARTING_HEALTH_POINTS = 60;

export const KING_ABILITY_POINTS = 100;
export const MAGE_ABILITY_POINTS = 30;
export const PAWN_ABILITY_POINTS = 100;
export const WARRIOR_ABILITY_POINTS = 30;
export const ASSASSIN_ABILITY_POINTS = 30;
export const KNIGHT_ABILITY_POINTS = 100;

export const MAGE_THROW_DAMAGE_1 = 100;
export const MAGE_THROW_DAMAGE_2 = 20;
export const WARRIOR_THROW_DAMAGE_1 = 100;
export const WARRIOR_THROW_DAMAGE_2 = 20;

export const NUM_PLAYERS = 2;
export const NUM_PIECE_TYPE = 13;

export enum Direction {
  NORTH = 0, NORTHEAST, EAST, SOUTHEAST,
  SOUTH, SOUTHWEST, WEST, NORTHWEST,
  INVALID
};

export const DIAGONAL_DIRECTIONS = [Direction.NORTHEAST, Direction.SOUTHEAST, Direction.SOUTHWEST, Direction.NORTHWEST];
export const NON_DIAGONAL_DIRECTIONS = [Direction.NORTH, Direction.EAST, Direction.SOUTH, Direction.WEST];

export const NUM_DIRECTIONS = 9;
export const NUM_DIRECTIONS_WITHOUT_INVALID = NUM_DIRECTIONS - 1;
export const NUM_DIAGONAL_DIRECTIONS = 4;

export const NUM_DISTINCT_HP_VALUES = 6; // { 10, 20, 30, 40, 50, 60 } - used for zobrist hashing
