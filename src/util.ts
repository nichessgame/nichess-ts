import * as constants from './constants'
import { Direction } from './constants'
import { PieceType, Player, PlayerAction, coordinatesToBoardIndex, ActionType } from './nichess'

export function playerToString(p: Player): string {
  switch(p) {
    case Player.PLAYER_1:
      return "PLAYER_1"
    case Player.PLAYER_2:
      return "PLAYER_2"
    default:
      return "default"
  }
}

export function pieceTypeToString(pt: PieceType): string {
  switch(pt) {
    case PieceType.P1_KING:
      return "K"
    case PieceType.P1_MAGE:
      return "M"
    case PieceType.P1_PAWN:
      return "P"
    case PieceType.P1_WARRIOR:
      return "W"
    case PieceType.P1_ASSASSIN:
      return "A"
    case PieceType.P1_KNIGHT:
      return "N"
    case PieceType.P2_KING:
      return "k"
    case PieceType.P2_MAGE:
      return "m"
    case PieceType.P2_PAWN:
      return "p"
    case PieceType.P2_WARRIOR:
      return "w"
    case PieceType.P2_ASSASSIN:
      return "a"
    case PieceType.P2_KNIGHT:
      return "n"
    case PieceType.NO_PIECE:
      return "."
    default:
      return "default"
  }
}

export function player1OrEmpty(pt: PieceType): boolean {
  switch(pt) {
    case PieceType.P1_KING:
      return true
    case PieceType.P1_MAGE:
      return true
    case PieceType.P1_PAWN:
      return true
    case PieceType.P1_WARRIOR:
      return true
    case PieceType.P1_ASSASSIN:
      return true
    case PieceType.P1_KNIGHT:
      return true
    case PieceType.P2_KING:
      return false
    case PieceType.P2_MAGE:
      return false
    case PieceType.P2_PAWN:
      return false
    case PieceType.P2_WARRIOR:
      return false
    case PieceType.P2_ASSASSIN:
      return false
    case PieceType.P2_KNIGHT:
      return false
    case PieceType.NO_PIECE:
      return true
    default:
      return false
  }
}

export function player2OrEmpty(pt: PieceType): boolean {
  switch(pt) {
    case PieceType.P1_KING:
      return false
    case PieceType.P1_MAGE:
      return false
    case PieceType.P1_PAWN:
      return false
    case PieceType.P1_WARRIOR:
      return false
    case PieceType.P1_ASSASSIN:
      return false
    case PieceType.P1_KNIGHT:
      return false
    case PieceType.P2_KING:
      return true
    case PieceType.P2_MAGE:
      return true
    case PieceType.P2_PAWN:
      return true
    case PieceType.P2_WARRIOR:
      return true
    case PieceType.P2_ASSASSIN:
      return true
    case PieceType.P2_KNIGHT:
      return true
    case PieceType.NO_PIECE:
      return true
    default:
      return false
  }
}

export function pieceBelongsToPlayer(pt: PieceType, player: Player): boolean {
  switch(pt) {
    case PieceType.P1_KING:
      return player === Player.PLAYER_1
    case PieceType.P1_MAGE:
      return player === Player.PLAYER_1
    case PieceType.P1_PAWN:
      return player === Player.PLAYER_1
    case PieceType.P1_WARRIOR:
      return player === Player.PLAYER_1
    case PieceType.P1_ASSASSIN:
      return player === Player.PLAYER_1
    case PieceType.P1_KNIGHT:
      return player === Player.PLAYER_1
    case PieceType.P2_KING:
      return player === Player.PLAYER_2
    case PieceType.P2_MAGE:
      return player === Player.PLAYER_2
    case PieceType.P2_PAWN:
      return player === Player.PLAYER_2
    case PieceType.P2_WARRIOR:
      return player === Player.PLAYER_2
    case PieceType.P2_ASSASSIN:
      return player === Player.PLAYER_2
    case PieceType.P2_KNIGHT:
      return player === Player.PLAYER_2
    case PieceType.NO_PIECE:
      return false
    default:
      return false
  }
}

export function isOffBoard(x: number, y: number): boolean {
  if(x >= constants.NUM_COLUMNS || x < 0 || y >= constants.NUM_ROWS || y < 0)
    return true
  else
    return false
}

export function isSquareIndexOffBoard(squareIndex: number): boolean {
  if(squareIndex < 0 || squareIndex > constants.NUM_SQUARES - 1)
    return true
  else
    return false
}

export function generateSquareToNeighboringDiagonalSquares(): Array<Array<number>> {
  let squareToNeighboringDiagonalSquares = new Array<Array<number>>(constants.NUM_SQUARES)
  for(let srcY = 0; srcY < constants.NUM_ROWS; srcY++) {
    for(let srcX = 0; srcX < constants.NUM_COLUMNS; srcX++) {
      let neighboringDiagonalSquares = new Array<number>()
      let srcIndex = coordinatesToBoardIndex(srcX, srcY);
      for(let k = -1; k < 2; k++) {
        for(let l = -1; l < 2; l++) {
          if(k == 0 || l == 0) continue;
          let newX = srcX + k;
          let newY = srcY + l;
          if(isOffBoard(newX, newY)) continue;
          let newIndex = coordinatesToBoardIndex(newX, newY);
          neighboringDiagonalSquares.push(newIndex);
        }
      }
      squareToNeighboringDiagonalSquares[srcIndex] = neighboringDiagonalSquares;  
    }
  }
  return squareToNeighboringDiagonalSquares;
}

export function generateSquareToNeighboringNonDiagonalSquares(): Array<Array<number>> {
  let squareToNeighboringNonDiagonalSquares = new Array<Array<number>>(constants.NUM_SQUARES)
  for(let srcY = 0; srcY < constants.NUM_ROWS; srcY++) {
    for(let srcX = 0; srcX < constants.NUM_COLUMNS; srcX++) {
      let neighboringNonDiagonalSquares = new Array<number>()
      let srcIndex = coordinatesToBoardIndex(srcX, srcY);
      for(let k = -1; k < 2; k++) {
        for(let l = -1; l < 2; l++) {
          if(k == 0 && l == 0) continue;
          if(Math.abs(k) == 1 && Math.abs(l) == 1) continue;
          let newX = srcX + k;
          let newY = srcY + l;
          if(isOffBoard(newX, newY)) continue;
          let newIndex = coordinatesToBoardIndex(newX, newY);
          neighboringNonDiagonalSquares.push(newIndex);
        }
      }
      squareToNeighboringNonDiagonalSquares[srcIndex] = neighboringNonDiagonalSquares;  
    }
  }
  return squareToNeighboringNonDiagonalSquares;
}

export function generateSquareToNeighboringSquares(): Array<Array<number>> {
  let squareToNeighboringSquares = new Array<Array<number>>(constants.NUM_SQUARES)
  for(let srcY = 0; srcY < constants.NUM_ROWS; srcY++) {
    for(let srcX = 0; srcX < constants.NUM_COLUMNS; srcX++) {
      let neighboringSquares = new Array<number>()
      let srcIndex = coordinatesToBoardIndex(srcX, srcY);
      for(let k = -1; k < 2; k++) {
        for(let l = -1; l < 2; l++) {
          if(k == 0 && l == 0) continue;
          let newX = srcX + k;
          let newY = srcY + l;
          if(isOffBoard(newX, newY)) continue;
          let newIndex = coordinatesToBoardIndex(newX, newY);
          neighboringSquares.push(newIndex);
        }
      }
      squareToNeighboringSquares[srcIndex] = neighboringSquares;  
    }
  }
  return squareToNeighboringSquares;
}

export function generateSquareToDirectionToLine(): Array<Array<Array<number>>> {
  let squareToDirectionToLine = new Array<Array<Array<number>>>(constants.NUM_SQUARES)
  for(let srcY = 0; srcY < constants.NUM_ROWS; srcY++) {
    for(let srcX = 0; srcX < constants.NUM_COLUMNS; srcX++) {
      let squareIndex = coordinatesToBoardIndex(srcX, srcY);
      let directionToLine = new Array<Array<number>>(constants.NUM_DIRECTIONS);

      let north = new Array<number>();
      for(let d = 1; d < constants.NUM_ROWS; d++) {
        let newX = srcX;
        let newY = srcY + d;
        if(isOffBoard(newX, newY)) break;
        let newIndex = coordinatesToBoardIndex(newX, newY);
        north.push(newIndex);
      }

      let northeast = new Array<number>();
      for(let d = 1; d < constants.NUM_COLUMNS; d++) {
        let newX = srcX + d;
        let newY = srcY + d;
        if(isOffBoard(newX, newY)) break;
        let newIndex = coordinatesToBoardIndex(newX, newY);
        northeast.push(newIndex);
      }

      let east = new Array<number>();
      for(let d = 1; d < constants.NUM_COLUMNS; d++) {
        let newX = srcX + d;
        let newY = srcY;
        if(isOffBoard(newX, newY)) break;
        let newIndex = coordinatesToBoardIndex(newX, newY);
        east.push(newIndex);
      }

      let southeast = new Array<number>();
      for(let d = 1; d < constants.NUM_COLUMNS; d++) {
        let newX = srcX + d;
        let newY = srcY - d;
        if(isOffBoard(newX, newY)) break;
        let newIndex = coordinatesToBoardIndex(newX, newY);
        southeast.push(newIndex);
      }

      let south = new Array<number>();
      for(let d = 1; d < constants.NUM_ROWS; d++) {
        let newX = srcX;
        let newY = srcY - d;
        if(isOffBoard(newX, newY)) break;
        let newIndex = coordinatesToBoardIndex(newX, newY);
        south.push(newIndex);
      }

      let southwest = new Array<number>();
      for(let d = 1; d < constants.NUM_COLUMNS; d++) {
        let newX = srcX - d;
        let newY = srcY - d;
        if(isOffBoard(newX, newY)) break;
        let newIndex = coordinatesToBoardIndex(newX, newY);
        southwest.push(newIndex);
      }

      let west = new Array<number>();
      for(let d = 1; d < constants.NUM_COLUMNS; d++) {
        let newX = srcX - d;
        let newY = srcY;
        if(isOffBoard(newX, newY)) break;
        let newIndex = coordinatesToBoardIndex(newX, newY);
        west.push(newIndex);
      }

      let northwest = new Array<number>();
      for(let d = 1; d < constants.NUM_COLUMNS; d++) {
        let newX = srcX - d;
        let newY = srcY + d;
        if(isOffBoard(newX, newY)) break;
        let newIndex = coordinatesToBoardIndex(newX, newY);
        northwest.push(newIndex);
      }

      let invalid = new Array<number>();

      directionToLine[Direction.NORTH] = north;
      directionToLine[Direction.NORTHEAST] = northeast;
      directionToLine[Direction.EAST] = east;
      directionToLine[Direction.SOUTHEAST] = southeast;
      directionToLine[Direction.SOUTH] = south;
      directionToLine[Direction.SOUTHWEST] = southwest;
      directionToLine[Direction.WEST] = west;
      directionToLine[Direction.NORTHWEST] = northwest;
      directionToLine[Direction.INVALID] = invalid;

      squareToDirectionToLine[squareIndex] = directionToLine;
    }
  }
  return squareToDirectionToLine;
}

export function generateSrcSquareToDstSquareToDirection(): Array<Array<Direction>> {
  let srcSquareToDstSquareToDirection = new Array<Array<Direction>>(constants.NUM_SQUARES)
  for(let srcY = 0; srcY < constants.NUM_ROWS; srcY++) {
    for(let srcX = 0; srcX < constants.NUM_COLUMNS; srcX++) {
      let srcIndex = coordinatesToBoardIndex(srcX, srcY);
      let dstSquareToDirection = new Array<Direction>(constants.NUM_SQUARES);
      for(let dstY = 0; dstY < constants.NUM_ROWS; dstY++) {
        for(let dstX = 0; dstX < constants.NUM_COLUMNS; dstX++) {
          let dstIndex = coordinatesToBoardIndex(dstX, dstY);
          let dx = dstX - srcX;
          let dy = dstY - srcY;
          if(dx == 0 && dy > 0) {
            dstSquareToDirection[dstIndex] = Direction.NORTH;
          } else if(dx == dy && dx > 0) {
            dstSquareToDirection[dstIndex] = Direction.NORTHEAST;
          } else if(dx > 0 && dy == 0) {
            dstSquareToDirection[dstIndex] = Direction.EAST;
          } else if(dx == (-dy) && dx > 0) {
            dstSquareToDirection[dstIndex] = Direction.SOUTHEAST;
          } else if(dx == 0 && dy < 0) {
            dstSquareToDirection[dstIndex] = Direction.SOUTH;
          } else if(dx == dy && dx < 0) {
            dstSquareToDirection[dstIndex] = Direction.SOUTHWEST;
          } else if(dx < 0 && dy == 0) {
            dstSquareToDirection[dstIndex] = Direction.WEST;
          } else if(dx == -(dy) && dx < 0) {
            dstSquareToDirection[dstIndex] = Direction.NORTHWEST;
          } else {
            dstSquareToDirection[dstIndex] = Direction.INVALID;
          }
        }
      }
      srcSquareToDstSquareToDirection[srcIndex] = dstSquareToDirection;
    }
  }
  return srcSquareToDstSquareToDirection;
}

export function generateSquareToP1PawnMoveSquares(): Array<Array<number>> {
  let squareToP1PawnMoves = new Array<Array<number>>(constants.NUM_SQUARES)
  for(let srcY = 0; srcY < constants.NUM_ROWS; srcY++) {
    for(let srcX = 0; srcX < constants.NUM_COLUMNS; srcX++) {
      let srcIndex = coordinatesToBoardIndex(srcX, srcY);
      let p1PawnSquares = new Array<number>()
      let newX = srcX;
      let newY = srcY + 1;
      if(!isOffBoard(newX, newY)) {
        let newIndex = coordinatesToBoardIndex(newX, newY)
        p1PawnSquares.push(newIndex);
      }

      if(srcY == 1) {
        // p1 pawn can also go 2 squares north
        newX = srcX;
        newY = srcY + 2;
        if(!isOffBoard(newX, newY)){
          let newIndex = coordinatesToBoardIndex(newX, newY)
          p1PawnSquares.push(newIndex);
        }
      }
      squareToP1PawnMoves[srcIndex] = p1PawnSquares;
    }
  }
  return squareToP1PawnMoves;
}

export function generateSquareToP2PawnMoveSquares(): Array<Array<number>> {
  let squareToP2PawnMoves = new Array<Array<number>>(constants.NUM_SQUARES)
  for(let srcY = 0; srcY < constants.NUM_ROWS; srcY++) {
    for(let srcX = 0; srcX < constants.NUM_COLUMNS; srcX++) {
      let srcIndex = coordinatesToBoardIndex(srcX, srcY);
      let p2PawnSquares = new Array<number>()
      let newX = srcX;
      let newY = srcY - 1;
      if(!isOffBoard(newX, newY)) {
        let newIndex = coordinatesToBoardIndex(newX, newY)
        p2PawnSquares.push(newIndex);
      }

      if(srcY == 6) {
        // p2 pawn can also go 2 squares south
        newX = srcX;
        newY = srcY - 2;
        if(!isOffBoard(newX, newY)){
          let newIndex = coordinatesToBoardIndex(newX, newY)
          p2PawnSquares.push(newIndex);
        }
      }
      squareToP2PawnMoves[srcIndex] = p2PawnSquares;
    }
  }
  return squareToP2PawnMoves;
}

export function generateSquareToP1PawnAbilitySquares(): Array<Array<number>> {
  let squareToP1PawnAbilities = new Array<Array<number>>(constants.NUM_SQUARES)
  for(let srcY = 0; srcY < constants.NUM_ROWS; srcY++) {
    for(let srcX = 0; srcX < constants.NUM_COLUMNS; srcX++) {
      let srcIndex = coordinatesToBoardIndex(srcX, srcY);
      let p1PawnSquares = new Array<number>()
      let newX = srcX - 1;
      let newY = srcY + 1;
      if(!isOffBoard(newX, newY)) {
        let newIndex = coordinatesToBoardIndex(newX, newY)
        p1PawnSquares.push(newIndex);
      }
      newX = srcX + 1;
      newY = srcY + 1;
      if(!isOffBoard(newX, newY)){
        let newIndex = coordinatesToBoardIndex(newX, newY)
        p1PawnSquares.push(newIndex);
      }

      squareToP1PawnAbilities[srcIndex] = p1PawnSquares;
    }
  }
  return squareToP1PawnAbilities;
}

export function generateSquareToP2PawnAbilitySquares(): Array<Array<number>> {
  let squareToP2PawnAbilities = new Array<Array<number>>(constants.NUM_SQUARES)
  for(let srcY = 0; srcY < constants.NUM_ROWS; srcY++) {
    for(let srcX = 0; srcX < constants.NUM_COLUMNS; srcX++) {
      let srcIndex = coordinatesToBoardIndex(srcX, srcY);
      let p2PawnSquares = new Array<number>()
      let newX = srcX - 1;
      let newY = srcY - 1;
      if(!isOffBoard(newX, newY)) {
        let newIndex = coordinatesToBoardIndex(newX, newY)
        p2PawnSquares.push(newIndex);
      }
      newX = srcX + 1;
      newY = srcY - 1;
      if(!isOffBoard(newX, newY)){
        let newIndex = coordinatesToBoardIndex(newX, newY)
        p2PawnSquares.push(newIndex);
      }

      squareToP2PawnAbilities[srcIndex] = p2PawnSquares;
    }
  }
  return squareToP2PawnAbilities;
}

export function generateSquareToKnightActionSquares(): Array<Array<number>> {
  let squareToKnightSquares = new Array<Array<number>>(constants.NUM_SQUARES)
  for(let row = 0; row < constants.NUM_ROWS; row++) {
    for(let column = 0; column < constants.NUM_COLUMNS; column++) {
      let srcSquareIndex = coordinatesToBoardIndex(column, row);
      let squares = new Array<number>();

      let move_dst_x1 = column + 2;
      let move_dst_y1 = row + 1;
      let move_dst_x2 = column + 2;
      let move_dst_y2 = row - 1;
      let move_dst_x3 = column + 1;
      let move_dst_y3 = row - 2;
      let move_dst_x4 = column - 1;
      let move_dst_y4 = row - 2;
      let move_dst_x5 = column - 2;
      let move_dst_y5 = row - 1;
      let move_dst_x6 = column - 2;
      let move_dst_y6 = row + 1;
      let move_dst_x7 = column - 1;
      let move_dst_y7 = row + 2;
      let move_dst_x8 = column + 1;
      let move_dst_y8 = row + 2;

      if(!isOffBoard(move_dst_x1, move_dst_y1)){
        squares.push(coordinatesToBoardIndex(move_dst_x1, move_dst_y1));
      }
      if(!isOffBoard(move_dst_x2, move_dst_y2)){
        squares.push(coordinatesToBoardIndex(move_dst_x2, move_dst_y2));
      }
      if(!isOffBoard(move_dst_x3, move_dst_y3)){
        squares.push(coordinatesToBoardIndex(move_dst_x3, move_dst_y3));
      }
      if(!isOffBoard(move_dst_x4, move_dst_y4)){
        squares.push(coordinatesToBoardIndex(move_dst_x4, move_dst_y4));
      }
      if(!isOffBoard(move_dst_x5, move_dst_y5)){
        squares.push(coordinatesToBoardIndex(move_dst_x5, move_dst_y5));
      }
      if(!isOffBoard(move_dst_x6, move_dst_y6)){
        squares.push(coordinatesToBoardIndex(move_dst_x6, move_dst_y6));
      }
      if(!isOffBoard(move_dst_x7, move_dst_y7)){
        squares.push(coordinatesToBoardIndex(move_dst_x7, move_dst_y7));
      }
      if(!isOffBoard(move_dst_x8, move_dst_y8)){
        squares.push(coordinatesToBoardIndex(move_dst_x8, move_dst_y8));
      }

      squareToKnightSquares[srcSquareIndex] = squares;
    }
  }
  return squareToKnightSquares;
}
