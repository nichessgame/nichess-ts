import * as constants from './constants'
import { pieceTypeToString } from './util'

export enum Player {
  PLAYER_1 = 0,
  PLAYER_2 = 1
}

export enum PieceType {
  P1_KING = 0, P1_MAGE, P1_WARRIOR, P1_ASSASSIN, P1_PAWN,
  P2_KING, P2_MAGE, P2_WARRIOR, P2_ASSASSIN, P2_PAWN,
  NO_PIECE
}

export enum AbilityType {
  KING_DAMAGE = 0, MAGE_DAMAGE, WARRIOR_DAMAGE, ASSASSIN_DAMAGE, PAWN_DAMAGE, NO_ABILITY
}

export class Piece {
  public type: PieceType
  public healthPoints: number
  public squareIndex: number
  constructor(type: PieceType, healthPoints: number, squareIndex: number) {
    this.type = type
    this.healthPoints = healthPoints
    this.squareIndex = squareIndex 
  }
}

export class PlayerMove {
  public moveSrcIdx: number
  public moveDstIdx: number
  constructor(moveSrcIdx: number, moveDstIdx: number) {
    this.moveSrcIdx = moveSrcIdx
    this.moveDstIdx = moveDstIdx
  }
}

export class PlayerAbility {
  public abilitySrcIdx: number
  public abilityDstIdx: number
  constructor(abilitySrcIdx: number, abilityDstIdx: number) {
    this.abilitySrcIdx = abilitySrcIdx
    this.abilityDstIdx = abilityDstIdx
  }
}

export class PlayerAction {
  public moveSrcIdx: number
  public moveDstIdx: number
  public abilitySrcIdx: number
  public abilityDstIdx: number
  constructor(moveSrcIdx: number, moveDstIdx: number, abilitySrcIdx: number, abilityDstIdx: number) {
    this.moveSrcIdx = moveSrcIdx
    this.moveDstIdx = moveDstIdx
    this.abilitySrcIdx = abilitySrcIdx
    this.abilityDstIdx = abilityDstIdx
  }
}

export class UndoInfo {
  public affectedPieces: Piece[]
  public moveSrcIdx: number
  public moveDstIdx: number
  public abilityType: AbilityType
  constructor() {}
}

export class GameCache {
  public pieceTypeToSquareIndexToLegalMoves: Array<Array<Array<PlayerMove>>>
  public pieceTypeToSquareIndexToLegalAbilities: Array<Array<Array<PlayerAbility>>>
  public squareToNeighboringSquares: Array<Array<number>>
  constructor() {
    // TODO
  }
}

export class Game {
  public board: Piece[]
  public p1King: Piece
  public p2King: Piece
  public playerToPieces: Array<Piece[]> = new Array()
  public currentPlayer: Player
  public moveNumber: number
  public gameCache: GameCache

  constructor(gameCache: GameCache, encodedBoard?: string) {
    this.gameCache = gameCache
    if(typeof encodedBoard !== 'undefined') {
      this.boardFromString(encodedBoard)
    } else {
      this.reset()
    }
  }

  makeMove(moveSrcIdx: number, moveDstIdx: number): void {
    this.board[moveDstIdx] = this.board[moveSrcIdx]
    this.board[moveDstIdx].squareIndex = moveDstIdx
    this.board[moveSrcIdx] = new Piece(PieceType.NO_PIECE, 0, moveSrcIdx)
  }

  /*
  * Since move is being reverted, goal here is to move from "destination" to "source".
  */
  undoMove(moveSrcIdx: number, moveDstIdx: number): void {
    this.board[moveSrcIdx] = this.board[moveDstIdx]
    this.board[moveSrcIdx].squareIndex = moveSrcIdx
    this.board[moveDstIdx] = new Piece(PieceType.NO_PIECE, 0, moveDstIdx)
  }

  reset(): void {
    this.moveNumber = 0;
    this.currentPlayer = Player.PLAYER_1
    this.board = new Array<Piece>(constants.NUM_SQUARES)
    // Create starting position
    this.board[coordinatesToBoardIndex(0,0)] = new Piece(PieceType.P1_KING, constants.KING_STARTING_HEALTH_POINTS, coordinatesToBoardIndex(0,0));
    this.board[coordinatesToBoardIndex(0,1)] = new Piece(PieceType.P1_PAWN, constants.PAWN_STARTING_HEALTH_POINTS, coordinatesToBoardIndex(0,1));
    this.board[coordinatesToBoardIndex(1,1)] = new Piece(PieceType.P1_PAWN, constants.PAWN_STARTING_HEALTH_POINTS, coordinatesToBoardIndex(1,1));
    this.board[coordinatesToBoardIndex(7,0)] = new Piece(PieceType.P1_ASSASSIN, constants.ASSASSIN_STARTING_HEALTH_POINTS, coordinatesToBoardIndex(7,0));
    this.board[coordinatesToBoardIndex(3,1)] = new Piece(PieceType.P1_WARRIOR, constants.WARRIOR_STARTING_HEALTH_POINTS, coordinatesToBoardIndex(3,1));
    this.board[coordinatesToBoardIndex(4,1)] = new Piece(PieceType.P1_MAGE, constants.MAGE_STARTING_HEALTH_POINTS, coordinatesToBoardIndex(4,1));
    this.board[coordinatesToBoardIndex(5,1)] = new Piece(PieceType.P1_PAWN, constants.PAWN_STARTING_HEALTH_POINTS, coordinatesToBoardIndex(5,1));

    this.board[coordinatesToBoardIndex(7,7)] = new Piece(PieceType.P2_KING, constants.KING_STARTING_HEALTH_POINTS, coordinatesToBoardIndex(7,7));
    this.board[coordinatesToBoardIndex(7,6)] = new Piece(PieceType.P2_PAWN, constants.PAWN_STARTING_HEALTH_POINTS, coordinatesToBoardIndex(7,6));
    this.board[coordinatesToBoardIndex(6,6)] = new Piece(PieceType.P2_PAWN, constants.PAWN_STARTING_HEALTH_POINTS, coordinatesToBoardIndex(6,6));
    this.board[coordinatesToBoardIndex(0,7)] = new Piece(PieceType.P2_ASSASSIN, constants.ASSASSIN_STARTING_HEALTH_POINTS, coordinatesToBoardIndex(0,7));
    this.board[coordinatesToBoardIndex(4,6)] = new Piece(PieceType.P2_WARRIOR, constants.WARRIOR_STARTING_HEALTH_POINTS, coordinatesToBoardIndex(4,6));
    this.board[coordinatesToBoardIndex(3,6)] = new Piece(PieceType.P2_MAGE, constants.MAGE_STARTING_HEALTH_POINTS, coordinatesToBoardIndex(3,6));
    this.board[coordinatesToBoardIndex(2,6)] = new Piece(PieceType.P2_PAWN, constants.PAWN_STARTING_HEALTH_POINTS, coordinatesToBoardIndex(2,6));

    this.board[coordinatesToBoardIndex(0,2)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(0,2));
    this.board[coordinatesToBoardIndex(0,3)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(0,3));
    this.board[coordinatesToBoardIndex(0,4)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(0,4));
    this.board[coordinatesToBoardIndex(0,5)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(0,5));
    this.board[coordinatesToBoardIndex(0,6)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(0,6));
    this.board[coordinatesToBoardIndex(1,0)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(1,0));
    this.board[coordinatesToBoardIndex(1,2)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(1,2));
    this.board[coordinatesToBoardIndex(1,3)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(1,3));
    this.board[coordinatesToBoardIndex(1,4)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(1,4));
    this.board[coordinatesToBoardIndex(1,5)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(1,5));
    this.board[coordinatesToBoardIndex(1,6)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(1,6));
    this.board[coordinatesToBoardIndex(1,7)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(1,7));
    this.board[coordinatesToBoardIndex(2,0)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(2,0));
    this.board[coordinatesToBoardIndex(2,1)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(2,1));
    this.board[coordinatesToBoardIndex(2,2)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(2,2));
    this.board[coordinatesToBoardIndex(2,3)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(2,3));
    this.board[coordinatesToBoardIndex(2,4)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(2,4));
    this.board[coordinatesToBoardIndex(2,5)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(2,5));
    this.board[coordinatesToBoardIndex(2,7)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(2,7));
    this.board[coordinatesToBoardIndex(3,0)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(3,3));
    this.board[coordinatesToBoardIndex(3,2)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(3,2));
    this.board[coordinatesToBoardIndex(3,3)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(3,3));
    this.board[coordinatesToBoardIndex(3,4)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(3,4));
    this.board[coordinatesToBoardIndex(3,5)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(3,5));
    this.board[coordinatesToBoardIndex(3,7)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(3,7));
    this.board[coordinatesToBoardIndex(4,0)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(4,0));
    this.board[coordinatesToBoardIndex(4,2)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(4,2));
    this.board[coordinatesToBoardIndex(4,3)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(4,3));
    this.board[coordinatesToBoardIndex(4,4)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(4,4));
    this.board[coordinatesToBoardIndex(4,5)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(4,5));
    this.board[coordinatesToBoardIndex(4,7)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(4,7));
    this.board[coordinatesToBoardIndex(5,0)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(5,0));
    this.board[coordinatesToBoardIndex(5,2)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(5,2));
    this.board[coordinatesToBoardIndex(5,3)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(5,3));
    this.board[coordinatesToBoardIndex(5,4)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(5,4));
    this.board[coordinatesToBoardIndex(5,5)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(5,5));
    this.board[coordinatesToBoardIndex(5,6)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(5,6));
    this.board[coordinatesToBoardIndex(5,7)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(5,7));
    this.board[coordinatesToBoardIndex(6,0)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(6,0));
    this.board[coordinatesToBoardIndex(6,1)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(6,1));
    this.board[coordinatesToBoardIndex(6,2)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(6,2));
    this.board[coordinatesToBoardIndex(6,3)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(6,3));
    this.board[coordinatesToBoardIndex(6,4)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(6,4));
    this.board[coordinatesToBoardIndex(6,5)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(6,5));
    this.board[coordinatesToBoardIndex(6,7)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(6,7));
    this.board[coordinatesToBoardIndex(7,1)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(7,1));
    this.board[coordinatesToBoardIndex(7,2)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(7,2));
    this.board[coordinatesToBoardIndex(7,3)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(7,3));
    this.board[coordinatesToBoardIndex(7,4)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(7,4));
    this.board[coordinatesToBoardIndex(7,5)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(7,5));

    // Pieces are also kept in an array for faster access
    let p1Pieces = new Array<Piece>(constants.NUM_STARTING_PIECES);
    p1Pieces[constants.KING_PIECE_INDEX] = this.board[coordinatesToBoardIndex(0,0)];
    p1Pieces[constants.PAWN_1_PIECE_INDEX] = this.board[coordinatesToBoardIndex(0,1)];
    p1Pieces[constants.PAWN_2_PIECE_INDEX] = this.board[coordinatesToBoardIndex(1,1)];
    p1Pieces[constants.ASSASSIN_PIECE_INDEX] = this.board[coordinatesToBoardIndex(7,0)];
    p1Pieces[constants.WARRIOR_PIECE_INDEX] = this.board[coordinatesToBoardIndex(3,1)];
    p1Pieces[constants.MAGE_PIECE_INDEX] = this.board[coordinatesToBoardIndex(4,1)];
    p1Pieces[constants.PAWN_3_PIECE_INDEX] = this.board[coordinatesToBoardIndex(5,1)];
    this.playerToPieces.push(p1Pieces);

    let p2Pieces = new Array<Piece>(constants.NUM_STARTING_PIECES);
    p2Pieces[constants.KING_PIECE_INDEX] = this.board[coordinatesToBoardIndex(7,7)];
    p2Pieces[constants.PAWN_1_PIECE_INDEX] = this.board[coordinatesToBoardIndex(7,6)];
    p2Pieces[constants.PAWN_2_PIECE_INDEX] = this.board[coordinatesToBoardIndex(6,6)];
    p2Pieces[constants.ASSASSIN_PIECE_INDEX] = this.board[coordinatesToBoardIndex(0,7)];
    p2Pieces[constants.WARRIOR_PIECE_INDEX] = this.board[coordinatesToBoardIndex(4,6)];
    p2Pieces[constants.MAGE_PIECE_INDEX] = this.board[coordinatesToBoardIndex(3,6)];
    p2Pieces[constants.PAWN_3_PIECE_INDEX] = this.board[coordinatesToBoardIndex(2,6)];
    this.playerToPieces.push(p2Pieces);
  }

  makeAction(moveSrcIdx: number, moveDstIdx: number, abilitySrcIdx: number, abilityDstIdx: number): UndoInfo {
    var undoInfo = new UndoInfo()
    undoInfo.moveSrcIdx = moveSrcIdx
    undoInfo.moveDstIdx = moveDstIdx
    if(moveSrcIdx !== constants.MOVE_SKIP) {
      this.makeMove(moveSrcIdx, moveDstIdx)
    }

    return undoInfo
  }

  dump(): string {
    var retval: string = ""
    retval += "------------------------------------------\n"
    for(let i = constants.NUM_ROWS - 1; i >= 0; i--) {
      retval += i + "   "
      for(let j = 0; j < constants.NUM_COLUMNS; j++) {
        if(this.board[coordinatesToBoardIndex(j, i)].type !== PieceType.NO_PIECE) {
          retval += pieceTypeToString(this.board[coordinatesToBoardIndex(j, i)].type) + this.board[coordinatesToBoardIndex(j, i)].healthPoints + " "
        } else {
          retval += pieceTypeToString(this.board[coordinatesToBoardIndex(j, i)].type) + "   " + " "
        }
      }
      retval += "\n"
    }
    retval += "\n"
    retval += "   "
    for(let i = 0; i < constants.NUM_COLUMNS; i++) {
      retval += " " + i + "   "
    }
    retval += "\n------------------------------------------\n"
    return retval
  }
  
  boardFromString(encodedBoard: string) {
    this.currentPlayer = parseInt(encodedBoard.charAt(0))
    this.moveNumber = 0
    // TODO
  }

}

export function coordinatesToBoardIndex(column: number, row: number) {
  return column + row * constants.NUM_COLUMNS
}
