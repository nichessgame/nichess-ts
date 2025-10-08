import * as constants from './constants'
import { Direction } from './constants'
import {
  pieceTypeToString, 
  generateSquareToDirectionToLine,
  generateSrcSquareToDstSquareToDirection,
  generateSquareToNeighboringSquares,
  generateSquareToNeighboringNonDiagonalSquares,
  generateSquareToKnightActionSquares,
  generateSquareToP1PawnMoveSquares,
  generateSquareToP2PawnMoveSquares,
  generateSquareToP1PawnAbilitySquares,
  generateSquareToP2PawnAbilitySquares,
  player1OrEmpty,
  player2OrEmpty,
  pieceBelongsToPlayer,
  isSquareIndexOffBoard,
  } from './util'
import { GameCache } from './game_cache'
import { Zobrist } from './zobrist'


export enum Player {
  PLAYER_1 = 0,
  PLAYER_2 = 1
}

export enum PieceType {
  P1_KING = 0, P1_MAGE, P1_WARRIOR, P1_ASSASSIN, P1_KNIGHT, P1_PAWN,
  P2_KING, P2_MAGE, P2_WARRIOR, P2_ASSASSIN, P2_KNIGHT, P2_PAWN,
  NO_PIECE
}

export enum ActionType {
  MOVE_REGULAR = 0, MOVE_CASTLE, MOVE_PROMOTE_P1_PAWN, MOVE_PROMOTE_P2_PAWN, ABILITY_KING_DAMAGE, ABILITY_MAGE_DAMAGE,
  ABILITY_P1_PAWN_DAMAGE_AND_PROMOTION, ABILITY_P2_PAWN_DAMAGE_AND_PROMOTION,
  ABILITY_MAGE_THROW_ASSASSIN, ABILITY_WARRIOR_DAMAGE, ABILITY_ASSASSIN_DAMAGE, 
  ABILITY_KNIGHT_DAMAGE, ABILITY_PAWN_DAMAGE, ABILITY_WARRIOR_THROW_WARRIOR, SKIP
}

export class Piece {
  public type: PieceType
  public healthPoints: number
  public squareIndex: number
  constructor(params: {type?: PieceType, healthPoints?: number, squareIndex?: number, other?: Piece}) {
    if(params.other === undefined) {
      this.type = params.type
      this.healthPoints = params.healthPoints
      this.squareIndex = params.squareIndex
    } else {
      this.type = params.other.type
      this.healthPoints = params.other.healthPoints
      this.squareIndex = params.other.squareIndex
    }
  }
}

export class PlayerAction {
  public srcIdx: number
  public dstIdx: number
  public actionType: ActionType
  constructor(srcIdx: number, dstIdx: number, actionType: ActionType) {
    this.srcIdx = srcIdx;
    this.dstIdx = dstIdx;
    this.actionType = actionType;
  }
}

export class UndoInfo {
  public affectedPieces: Array<Piece>
  public action: PlayerAction
  // Some actions require saving extra values, like previous position of an affected piece or its
  // health points. t1 and t2 are used for that.
  public t1: number
  public t2: number

  constructor() {
    this.affectedPieces = new Array<Piece>() 
  }
}

export class Game {
  public board: Array<Piece> = new Array()
  public playerToPieces: Array<Piece[]> = new Array()
  public playerToKing: Array<Piece> = new Array(constants.NUM_PLAYERS)
  public currentPlayer: Player
  public moveNumber: number
  public repetitions: Map<number, number>
  public repetitionsDraw: boolean

  // 3 possible constructors:
  // 1) constructor()
  // 2) constructor(encodedBoard)
  // 3) constructor(other)
  constructor(params: {encodedBoard?: string, other?: Game}) {
    if(params.encodedBoard !== undefined) { // 2)
      this.boardFromString(params.encodedBoard)
      this.repetitions = new Map(); // history not encoded
      let zh = this.zobristHash();
      this.repetitions.set(zh, 1);
      this.repetitionsDraw = false; // history not encoded
    } else if(params.other !== undefined) { // 3)
      this.moveNumber = params.other.moveNumber;
      this.currentPlayer = params.other.currentPlayer;
      for(let i = 0; i < constants.NUM_SQUARES; i++) {
        this.board[i] = new Piece({other: params.other.board[i]});
      }

      let otherP1Pieces: Array<Piece> = params.other.playerToPieces[Player.PLAYER_1];
      let p1Pieces: Array<Piece> = new Array<Piece>();
      for(let i = 0; i < otherP1Pieces.length; i++) {
        let currentPiece: Piece = otherP1Pieces[i];
        if(currentPiece.healthPoints > 0) {
          p1Pieces.push(this.board[currentPiece.squareIndex])
        } else {
          // TODO: is this even needed?
          p1Pieces.push(new Piece({type: currentPiece.type, healthPoints: currentPiece.healthPoints, squareIndex: currentPiece.squareIndex}))
        }
      }
      let otherP1King: Piece = params.other.playerToKing[Player.PLAYER_1];
      this.playerToKing[Player.PLAYER_1] = this.board[otherP1King.squareIndex];
      this.playerToPieces[Player.PLAYER_1] = p1Pieces;

      let otherP2Pieces: Array<Piece> = params.other.playerToPieces[Player.PLAYER_2];
      let p2Pieces: Array<Piece> = new Array<Piece>();
      for(let i = 0; i < otherP2Pieces.length; i++) {
        let currentPiece: Piece = otherP2Pieces[i];
        if(currentPiece.healthPoints > 0) {
          p2Pieces.push(this.board[currentPiece.squareIndex])
        } else {
          // TODO: is this even needed?
          p2Pieces.push(new Piece({type: currentPiece.type, healthPoints: currentPiece.healthPoints, squareIndex: currentPiece.squareIndex}))
        }
      }
      let otherP2King: Piece = params.other.playerToKing[Player.PLAYER_2];
      this.playerToKing[Player.PLAYER_2] = this.board[otherP2King.squareIndex];
      this.playerToPieces[Player.PLAYER_2] = p2Pieces;
      this.repetitions = new Map(params.other.repetitions);
      this.repetitionsDraw = params.other.repetitionsDraw; // should always be false
    } else { // 1)
      this.reset()
    }
  }

  /*
  * Since move is being reverted, goal here is to move from "destination" to "source".
  */
  undoMove(action: PlayerAction): void {
    if(action.actionType == ActionType.MOVE_REGULAR) {
      this.board[action.srcIdx] = this.board[action.dstIdx]
      this.board[action.srcIdx].squareIndex = action.srcIdx
      this.board[action.dstIdx] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: action.dstIdx})
    } else if(action.actionType == ActionType.SKIP) {
      return
    } else { // castle
      // move king back
      this.board[action.srcIdx] = this.board[action.dstIdx]
      this.board[action.srcIdx].squareIndex = action.srcIdx
      this.board[action.dstIdx] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: action.dstIdx})
      // move warrior back
      if(action.dstIdx == 6) {
        // p1 short castle
        this.board[7] = this.board[5]
        this.board[7].squareIndex = 7
        this.board[5] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: 5})
      } else if(action.dstIdx == 2) {
        // p1 long castle
        this.board[0] = this.board[3]
        this.board[0].squareIndex = 0
        this.board[3] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: 3})
       } else if(action.dstIdx == 62) {
        // p2 short castle
        this.board[63] = this.board[61]
        this.board[63].squareIndex = 63
        this.board[61] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: 61})
       } else if(action.dstIdx == 58) {
        // p2 long castle
        this.board[56] = this.board[59]
        this.board[56].squareIndex = 56
        this.board[59] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: 59})
      }
    }
  }

  reset(): void {
    this.moveNumber = 0;
    this.currentPlayer = Player.PLAYER_1
    this.board = new Array<Piece>(constants.NUM_SQUARES)
    // Create starting position
    this.board[coordinatesToBoardIndex(0,0)] = new Piece({type: PieceType.P1_WARRIOR, healthPoints: constants.WARRIOR_STARTING_HEALTH_POINTS, squareIndex: coordinatesToBoardIndex(0,0)});
    this.board[coordinatesToBoardIndex(1,0)] = new Piece({type: PieceType.P1_KNIGHT, healthPoints: constants.KNIGHT_STARTING_HEALTH_POINTS, squareIndex: coordinatesToBoardIndex(1,0)});
    this.board[coordinatesToBoardIndex(2,0)] = new Piece({type: PieceType.P1_ASSASSIN, healthPoints: constants.ASSASSIN_STARTING_HEALTH_POINTS, squareIndex: coordinatesToBoardIndex(2,0)});
    this.board[coordinatesToBoardIndex(3,0)] = new Piece({type: PieceType.P1_MAGE, healthPoints: constants.MAGE_STARTING_HEALTH_POINTS, squareIndex: coordinatesToBoardIndex(3,0)});
    this.board[coordinatesToBoardIndex(4,0)] = new Piece({type: PieceType.P1_KING, healthPoints: constants.KING_STARTING_HEALTH_POINTS, squareIndex: coordinatesToBoardIndex(4,0)});
    this.board[coordinatesToBoardIndex(5,0)] = new Piece({type: PieceType.P1_ASSASSIN, healthPoints: constants.ASSASSIN_STARTING_HEALTH_POINTS, squareIndex: coordinatesToBoardIndex(5,0)});
    this.board[coordinatesToBoardIndex(6,0)] = new Piece({type: PieceType.P1_KNIGHT, healthPoints: constants.KNIGHT_STARTING_HEALTH_POINTS, squareIndex: coordinatesToBoardIndex(6,0)});
    this.board[coordinatesToBoardIndex(7,0)] = new Piece({type: PieceType.P1_WARRIOR, healthPoints: constants.WARRIOR_STARTING_HEALTH_POINTS, squareIndex: coordinatesToBoardIndex(7,0)});

    this.board[coordinatesToBoardIndex(0,1)] = new Piece({type: PieceType.P1_PAWN, healthPoints: constants.PAWN_STARTING_HEALTH_POINTS, squareIndex: coordinatesToBoardIndex(0,1)});
    this.board[coordinatesToBoardIndex(1,1)] = new Piece({type: PieceType.P1_PAWN, healthPoints: constants.PAWN_STARTING_HEALTH_POINTS, squareIndex: coordinatesToBoardIndex(1,1)});
    this.board[coordinatesToBoardIndex(2,1)] = new Piece({type: PieceType.P1_PAWN, healthPoints: constants.PAWN_STARTING_HEALTH_POINTS, squareIndex: coordinatesToBoardIndex(2,1)});
    this.board[coordinatesToBoardIndex(3,1)] = new Piece({type: PieceType.P1_PAWN, healthPoints: constants.PAWN_STARTING_HEALTH_POINTS, squareIndex: coordinatesToBoardIndex(3,1)});
    this.board[coordinatesToBoardIndex(4,1)] = new Piece({type: PieceType.P1_PAWN, healthPoints: constants.PAWN_STARTING_HEALTH_POINTS, squareIndex: coordinatesToBoardIndex(4,1)});
    this.board[coordinatesToBoardIndex(5,1)] = new Piece({type: PieceType.P1_PAWN, healthPoints: constants.PAWN_STARTING_HEALTH_POINTS, squareIndex: coordinatesToBoardIndex(5,1)});
    this.board[coordinatesToBoardIndex(6,1)] = new Piece({type: PieceType.P1_PAWN, healthPoints: constants.PAWN_STARTING_HEALTH_POINTS, squareIndex: coordinatesToBoardIndex(6,1)});
    this.board[coordinatesToBoardIndex(7,1)] = new Piece({type: PieceType.P1_PAWN, healthPoints: constants.PAWN_STARTING_HEALTH_POINTS, squareIndex: coordinatesToBoardIndex(7,1)});

    this.board[coordinatesToBoardIndex(0,7)] = new Piece({type: PieceType.P2_WARRIOR, healthPoints: constants.WARRIOR_STARTING_HEALTH_POINTS, squareIndex: coordinatesToBoardIndex(0,7)});
    this.board[coordinatesToBoardIndex(1,7)] = new Piece({type: PieceType.P2_KNIGHT, healthPoints: constants.KNIGHT_STARTING_HEALTH_POINTS, squareIndex: coordinatesToBoardIndex(1,7)});
    this.board[coordinatesToBoardIndex(2,7)] = new Piece({type: PieceType.P2_ASSASSIN, healthPoints: constants.ASSASSIN_STARTING_HEALTH_POINTS, squareIndex: coordinatesToBoardIndex(2,7)});
    this.board[coordinatesToBoardIndex(3,7)] = new Piece({type: PieceType.P2_MAGE, healthPoints: constants.MAGE_STARTING_HEALTH_POINTS, squareIndex: coordinatesToBoardIndex(3,7)});
    this.board[coordinatesToBoardIndex(4,7)] = new Piece({type: PieceType.P2_KING, healthPoints: constants.KING_STARTING_HEALTH_POINTS, squareIndex: coordinatesToBoardIndex(4,7)});
    this.board[coordinatesToBoardIndex(5,7)] = new Piece({type: PieceType.P2_ASSASSIN, healthPoints: constants.ASSASSIN_STARTING_HEALTH_POINTS, squareIndex: coordinatesToBoardIndex(5,7)});
    this.board[coordinatesToBoardIndex(6,7)] = new Piece({type: PieceType.P2_KNIGHT, healthPoints: constants.KNIGHT_STARTING_HEALTH_POINTS, squareIndex: coordinatesToBoardIndex(6,7)});
    this.board[coordinatesToBoardIndex(7,7)] = new Piece({type: PieceType.P2_WARRIOR, healthPoints: constants.WARRIOR_STARTING_HEALTH_POINTS, squareIndex: coordinatesToBoardIndex(7,7)});

    this.board[coordinatesToBoardIndex(0,6)] = new Piece({type: PieceType.P2_PAWN, healthPoints: constants.PAWN_STARTING_HEALTH_POINTS, squareIndex: coordinatesToBoardIndex(0,6)});
    this.board[coordinatesToBoardIndex(1,6)] = new Piece({type: PieceType.P2_PAWN, healthPoints: constants.PAWN_STARTING_HEALTH_POINTS, squareIndex: coordinatesToBoardIndex(1,6)});
    this.board[coordinatesToBoardIndex(2,6)] = new Piece({type: PieceType.P2_PAWN, healthPoints: constants.PAWN_STARTING_HEALTH_POINTS, squareIndex: coordinatesToBoardIndex(2,6)});
    this.board[coordinatesToBoardIndex(3,6)] = new Piece({type: PieceType.P2_PAWN, healthPoints: constants.PAWN_STARTING_HEALTH_POINTS, squareIndex: coordinatesToBoardIndex(3,6)});
    this.board[coordinatesToBoardIndex(4,6)] = new Piece({type: PieceType.P2_PAWN, healthPoints: constants.PAWN_STARTING_HEALTH_POINTS, squareIndex: coordinatesToBoardIndex(4,6)});
    this.board[coordinatesToBoardIndex(5,6)] = new Piece({type: PieceType.P2_PAWN, healthPoints: constants.PAWN_STARTING_HEALTH_POINTS, squareIndex: coordinatesToBoardIndex(5,6)});
    this.board[coordinatesToBoardIndex(6,6)] = new Piece({type: PieceType.P2_PAWN, healthPoints: constants.PAWN_STARTING_HEALTH_POINTS, squareIndex: coordinatesToBoardIndex(6,6)});
    this.board[coordinatesToBoardIndex(7,6)] = new Piece({type: PieceType.P2_PAWN, healthPoints: constants.PAWN_STARTING_HEALTH_POINTS, squareIndex: coordinatesToBoardIndex(7,6)});

    this.board[coordinatesToBoardIndex(0,2)] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: coordinatesToBoardIndex(0,2)});
    this.board[coordinatesToBoardIndex(0,3)] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: coordinatesToBoardIndex(0,3)});
    this.board[coordinatesToBoardIndex(0,4)] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: coordinatesToBoardIndex(0,4)});
    this.board[coordinatesToBoardIndex(0,5)] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: coordinatesToBoardIndex(0,5)});
    this.board[coordinatesToBoardIndex(1,2)] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: coordinatesToBoardIndex(1,2)});
    this.board[coordinatesToBoardIndex(1,3)] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: coordinatesToBoardIndex(1,3)});
    this.board[coordinatesToBoardIndex(1,4)] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: coordinatesToBoardIndex(1,4)});
    this.board[coordinatesToBoardIndex(1,5)] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: coordinatesToBoardIndex(1,5)});
    this.board[coordinatesToBoardIndex(2,2)] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: coordinatesToBoardIndex(2,2)});
    this.board[coordinatesToBoardIndex(2,3)] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: coordinatesToBoardIndex(2,3)});
    this.board[coordinatesToBoardIndex(2,4)] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: coordinatesToBoardIndex(2,4)});
    this.board[coordinatesToBoardIndex(2,5)] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: coordinatesToBoardIndex(2,5)});
    this.board[coordinatesToBoardIndex(3,2)] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: coordinatesToBoardIndex(3,2)});
    this.board[coordinatesToBoardIndex(3,3)] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: coordinatesToBoardIndex(3,3)});
    this.board[coordinatesToBoardIndex(3,4)] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: coordinatesToBoardIndex(3,4)});
    this.board[coordinatesToBoardIndex(3,5)] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: coordinatesToBoardIndex(3,5)});
    this.board[coordinatesToBoardIndex(4,2)] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: coordinatesToBoardIndex(4,2)});
    this.board[coordinatesToBoardIndex(4,3)] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: coordinatesToBoardIndex(4,3)});
    this.board[coordinatesToBoardIndex(4,4)] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: coordinatesToBoardIndex(4,4)});
    this.board[coordinatesToBoardIndex(4,5)] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: coordinatesToBoardIndex(4,5)});
    this.board[coordinatesToBoardIndex(5,2)] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: coordinatesToBoardIndex(5,2)});
    this.board[coordinatesToBoardIndex(5,3)] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: coordinatesToBoardIndex(5,3)});
    this.board[coordinatesToBoardIndex(5,4)] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: coordinatesToBoardIndex(5,4)});
    this.board[coordinatesToBoardIndex(5,5)] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: coordinatesToBoardIndex(5,5)});
    this.board[coordinatesToBoardIndex(6,2)] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: coordinatesToBoardIndex(6,2)});
    this.board[coordinatesToBoardIndex(6,3)] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: coordinatesToBoardIndex(6,3)});
    this.board[coordinatesToBoardIndex(6,4)] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: coordinatesToBoardIndex(6,4)});
    this.board[coordinatesToBoardIndex(6,5)] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: coordinatesToBoardIndex(6,5)});
    this.board[coordinatesToBoardIndex(7,2)] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: coordinatesToBoardIndex(7,2)});
    this.board[coordinatesToBoardIndex(7,3)] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: coordinatesToBoardIndex(7,3)});
    this.board[coordinatesToBoardIndex(7,4)] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: coordinatesToBoardIndex(7,4)});
    this.board[coordinatesToBoardIndex(7,5)] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: coordinatesToBoardIndex(7,5)});

    let p1Pieces = new Array<Piece>(constants.NUM_STARTING_PIECES);

    p1Pieces[0] = this.board[coordinatesToBoardIndex(0,0)];
    p1Pieces[1] = this.board[coordinatesToBoardIndex(1,0)];
    p1Pieces[2] = this.board[coordinatesToBoardIndex(2,0)];
    p1Pieces[3] = this.board[coordinatesToBoardIndex(3,0)];
    p1Pieces[4] = this.board[coordinatesToBoardIndex(4,0)];
    p1Pieces[5] = this.board[coordinatesToBoardIndex(5,0)];
    p1Pieces[6] = this.board[coordinatesToBoardIndex(6,0)];
    p1Pieces[7] = this.board[coordinatesToBoardIndex(7,0)];

    p1Pieces[8] = this.board[coordinatesToBoardIndex(0,1)];
    p1Pieces[9] = this.board[coordinatesToBoardIndex(1,1)];
    p1Pieces[10] = this.board[coordinatesToBoardIndex(2,1)];
    p1Pieces[11] = this.board[coordinatesToBoardIndex(3,1)];
    p1Pieces[12] = this.board[coordinatesToBoardIndex(4,1)];
    p1Pieces[13] = this.board[coordinatesToBoardIndex(5,1)];
    p1Pieces[14] = this.board[coordinatesToBoardIndex(6,1)];
    p1Pieces[15] = this.board[coordinatesToBoardIndex(7,1)];

    this.playerToPieces = []
    this.playerToPieces.push(p1Pieces);
    this.playerToKing[Player.PLAYER_1] = p1Pieces[4];

    let p2Pieces = new Array<Piece>(constants.NUM_STARTING_PIECES);

    p2Pieces[0] = this.board[coordinatesToBoardIndex(0,7)];
    p2Pieces[1] = this.board[coordinatesToBoardIndex(1,7)];
    p2Pieces[2] = this.board[coordinatesToBoardIndex(2,7)];
    p2Pieces[3] = this.board[coordinatesToBoardIndex(3,7)];
    p2Pieces[4] = this.board[coordinatesToBoardIndex(4,7)];
    p2Pieces[5] = this.board[coordinatesToBoardIndex(5,7)];
    p2Pieces[6] = this.board[coordinatesToBoardIndex(6,7)];
    p2Pieces[7] = this.board[coordinatesToBoardIndex(7,7)];

    p2Pieces[8] = this.board[coordinatesToBoardIndex(0,6)];
    p2Pieces[9] = this.board[coordinatesToBoardIndex(1,6)];
    p2Pieces[10] = this.board[coordinatesToBoardIndex(2,6)];
    p2Pieces[11] = this.board[coordinatesToBoardIndex(3,6)];
    p2Pieces[12] = this.board[coordinatesToBoardIndex(4,6)];
    p2Pieces[13] = this.board[coordinatesToBoardIndex(5,6)];
    p2Pieces[14] = this.board[coordinatesToBoardIndex(6,6)];
    p2Pieces[15] = this.board[coordinatesToBoardIndex(7,6)];

    this.playerToPieces.push(p2Pieces);
    this.playerToKing[Player.PLAYER_2] = p2Pieces[4];

    this.repetitions = new Map();
    let zh = this.zobristHash();
    this.repetitions.set(zh, 1);
    this.repetitionsDraw = false;
  }

  _p1AssassinActions(piece: Piece): Array<PlayerAction> {
    let retval = new Array<PlayerAction>();
    let squareIdx: number;

    let squares: Array<number> = GameCache.squareToNeighboringNonDiagonalSquares[piece.squareIndex];
    for(let i = 0; i < squares.length; i++) {
      squareIdx = squares[i];
      let dstPiece: Piece = this.board[squareIdx];
      if(dstPiece.type == PieceType.NO_PIECE) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.MOVE_REGULAR));
      } else if(pieceBelongsToPlayer(dstPiece.type, Player.PLAYER_2)) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.ABILITY_ASSASSIN_DAMAGE));
        continue;
      }
    }

    let diagonal1: Array<number> = GameCache.squareToDirectionToLine[piece.squareIndex][Direction.NORTHEAST];
    for(let i = 0; i < diagonal1.length; i++) {
      squareIdx = diagonal1[i];
      let dstPiece: Piece = this.board[squareIdx];
      if(dstPiece.type == PieceType.NO_PIECE) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.MOVE_REGULAR));
      } else if(pieceBelongsToPlayer(dstPiece.type, Player.PLAYER_2)) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.ABILITY_ASSASSIN_DAMAGE));
        break;
      } else {
        break;
      }
    }

    let diagonal2: Array<number> = GameCache.squareToDirectionToLine[piece.squareIndex][Direction.SOUTHEAST];
    for(let i = 0; i < diagonal2.length; i++) {
      squareIdx = diagonal2[i];
      let dstPiece: Piece = this.board[squareIdx];
      if(dstPiece.type == PieceType.NO_PIECE) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.MOVE_REGULAR));
      } else if(pieceBelongsToPlayer(dstPiece.type, Player.PLAYER_2)) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.ABILITY_ASSASSIN_DAMAGE));
        break;
      } else {
        break;
      }
    }

    let diagonal3: Array<number> = GameCache.squareToDirectionToLine[piece.squareIndex][Direction.SOUTHWEST];
    for(let i = 0; i < diagonal3.length; i++) {
      squareIdx = diagonal3[i];
      let dstPiece: Piece = this.board[squareIdx];
      if(dstPiece.type == PieceType.NO_PIECE) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.MOVE_REGULAR));
      } else if(pieceBelongsToPlayer(dstPiece.type, Player.PLAYER_2)) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.ABILITY_ASSASSIN_DAMAGE));
        break;
      } else {
        break;
      }
    }

    let diagonal4: Array<number> = GameCache.squareToDirectionToLine[piece.squareIndex][Direction.NORTHWEST];
    for(let i = 0; i < diagonal4.length; i++) {
      squareIdx = diagonal4[i];
      let dstPiece: Piece = this.board[squareIdx];
      if(dstPiece.type == PieceType.NO_PIECE) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.MOVE_REGULAR));
      } else if(pieceBelongsToPlayer(dstPiece.type, Player.PLAYER_2)) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.ABILITY_ASSASSIN_DAMAGE));
        break;
      } else {
        break;
      }
    }

    return retval;
  }

  _p2AssassinActions(piece: Piece): Array<PlayerAction> {
    let retval = new Array<PlayerAction>();
    let squareIdx: number;

    let squares: Array<number> = GameCache.squareToNeighboringNonDiagonalSquares[piece.squareIndex];
    for(let i = 0; i < squares.length; i++) {
      squareIdx = squares[i];
      let dstPiece: Piece = this.board[squareIdx];
      if(dstPiece.type == PieceType.NO_PIECE) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.MOVE_REGULAR));
      } else if(pieceBelongsToPlayer(dstPiece.type, Player.PLAYER_1)) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.ABILITY_ASSASSIN_DAMAGE));
        continue;
      }
    }

    let diagonal1: Array<number> = GameCache.squareToDirectionToLine[piece.squareIndex][Direction.NORTHEAST];
    for(let i = 0; i < diagonal1.length; i++) {
      squareIdx = diagonal1[i];
      let dstPiece: Piece = this.board[squareIdx];
      if(dstPiece.type == PieceType.NO_PIECE) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.MOVE_REGULAR));
      } else if(pieceBelongsToPlayer(dstPiece.type, Player.PLAYER_1)) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.ABILITY_ASSASSIN_DAMAGE));
        break;
      } else {
        break;
      }
    }

    let diagonal2: Array<number> = GameCache.squareToDirectionToLine[piece.squareIndex][Direction.SOUTHEAST];
    for(let i = 0; i < diagonal2.length; i++) {
      squareIdx = diagonal2[i];
      let dstPiece: Piece = this.board[squareIdx];
      if(dstPiece.type == PieceType.NO_PIECE) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.MOVE_REGULAR));
      } else if(pieceBelongsToPlayer(dstPiece.type, Player.PLAYER_1)) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.ABILITY_ASSASSIN_DAMAGE));
        break;
      } else {
        break;
      }
    }

    let diagonal3: Array<number> = GameCache.squareToDirectionToLine[piece.squareIndex][Direction.SOUTHWEST];
    for(let i = 0; i < diagonal3.length; i++) {
      squareIdx = diagonal3[i];
      let dstPiece: Piece = this.board[squareIdx];
      if(dstPiece.type == PieceType.NO_PIECE) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.MOVE_REGULAR));
      } else if(pieceBelongsToPlayer(dstPiece.type, Player.PLAYER_1)) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.ABILITY_ASSASSIN_DAMAGE));
        break;
      } else {
        break;
      }
    }

    let diagonal4: Array<number> = GameCache.squareToDirectionToLine[piece.squareIndex][Direction.NORTHWEST];
    for(let i = 0; i < diagonal4.length; i++) {
      squareIdx = diagonal4[i];
      let dstPiece: Piece = this.board[squareIdx];
      if(dstPiece.type == PieceType.NO_PIECE) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.MOVE_REGULAR));
      } else if(pieceBelongsToPlayer(dstPiece.type, Player.PLAYER_1)) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.ABILITY_ASSASSIN_DAMAGE));
        break;
      } else {
        break;
      }
    }

    return retval;
  }

  _p1PawnActions(piece: Piece): Array<PlayerAction> {
    let retval = new Array<PlayerAction>();
    let squareIdx: number
    let moveSquares: Array<number> = GameCache.squareToP1PawnMoveSquares[piece.squareIndex];
    for(let i = 0; i < moveSquares.length; i++) {
      squareIdx = moveSquares[i];
      if(this.board[squareIdx].type != PieceType.NO_PIECE) continue;
      if(squareIdx > 55) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.MOVE_PROMOTE_P1_PAWN));
        continue;
      }
      // Is p1 pawn trying to jump over another piece?
      if(piece.squareIndex - squareIdx == -2 * constants.NUM_COLUMNS ) {
        // checks whether the square in front of the p1 pawn is empty
        if(this.board[piece.squareIndex + constants.NUM_COLUMNS].type != PieceType.NO_PIECE) continue;
      }
      retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.MOVE_REGULAR));
    }

    let abilitySquares = GameCache.squareToP1PawnAbilitySquares[piece.squareIndex];
    for(let i = 0; i < abilitySquares.length; i++) {
      squareIdx = abilitySquares[i];
      let destinationSquarePiece: Piece = this.board[squareIdx];
      if(pieceBelongsToPlayer(destinationSquarePiece.type, Player.PLAYER_2)) {
        if(squareIdx > 55 && constants.PAWN_ABILITY_POINTS >= destinationSquarePiece.healthPoints) {
          retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.ABILITY_P1_PAWN_DAMAGE_AND_PROMOTION));
        } else {
          retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.ABILITY_PAWN_DAMAGE));
        }
      }
    }

    return retval;
  }

  _p2PawnActions(piece: Piece): Array<PlayerAction> {
    let retval = new Array<PlayerAction>();
    let squareIdx: number
    let moveSquares: Array<number> = GameCache.squareToP2PawnMoveSquares[piece.squareIndex];
    for(let i = 0; i < moveSquares.length; i++) {
      squareIdx = moveSquares[i];
      if(this.board[squareIdx].type != PieceType.NO_PIECE) continue;
      if(squareIdx < 8) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.MOVE_PROMOTE_P2_PAWN));
        continue;
      }
      // Is p2 pawn trying to jump over another piece?
      if(piece.squareIndex - squareIdx == 2 * constants.NUM_COLUMNS ) {
        // checks whether the square in front of the p2 pawn is empty
        if(this.board[piece.squareIndex - constants.NUM_COLUMNS].type != PieceType.NO_PIECE) continue;
      }
      retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.MOVE_REGULAR));
    }

    let abilitySquares = GameCache.squareToP2PawnAbilitySquares[piece.squareIndex];
    for(let i = 0; i < abilitySquares.length; i++) {
      squareIdx = abilitySquares[i];
      let destinationSquarePiece: Piece = this.board[squareIdx];
      if(pieceBelongsToPlayer(destinationSquarePiece.type, Player.PLAYER_1)) {
        if(squareIdx < 8 && constants.PAWN_ABILITY_POINTS >= destinationSquarePiece.healthPoints) {
          retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.ABILITY_P2_PAWN_DAMAGE_AND_PROMOTION));
        } else {
          retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.ABILITY_PAWN_DAMAGE));
        }
      }
    }

    return retval;
  }

  _p1KingActions(piece: Piece): Array<PlayerAction> {
    let retval = new Array<PlayerAction>();
    let squares: Array<number> = GameCache.squareToNeighboringSquares[piece.squareIndex];
    for(let i = 0; i < squares.length; i++) {
      let squareIdx: number = squares[i];
      if(this.board[squareIdx].type == PieceType.NO_PIECE) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.MOVE_REGULAR));
      } else if(pieceBelongsToPlayer(this.board[squareIdx].type, Player.PLAYER_2)) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.ABILITY_KING_DAMAGE));
      }
    }
    if(piece.squareIndex == 4) {
      // short castle
      if(
        this.board[5].type == PieceType.NO_PIECE &&
        this.board[6].type == PieceType.NO_PIECE &&
        this.board[7].type == PieceType.P1_WARRIOR
        ) {
          retval.push(new PlayerAction(4, 6, ActionType.MOVE_CASTLE))
        }
      // long castle
      if(
        this.board[3].type == PieceType.NO_PIECE &&
        this.board[2].type == PieceType.NO_PIECE &&
        this.board[1].type == PieceType.NO_PIECE &&
        this.board[0].type == PieceType.P1_WARRIOR
        ) {
          retval.push(new PlayerAction(4, 2, ActionType.MOVE_CASTLE))
        }
    }

    return retval;
  }

  _p2KingActions(piece: Piece): Array<PlayerAction> {
    let retval = new Array<PlayerAction>();
    let squares: Array<number> = GameCache.squareToNeighboringSquares[piece.squareIndex];
    for(let i = 0; i < squares.length; i++) {
      let squareIdx: number = squares[i];
      if(this.board[squareIdx].type == PieceType.NO_PIECE) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.MOVE_REGULAR));
      } else if(pieceBelongsToPlayer(this.board[squareIdx].type, Player.PLAYER_1)) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.ABILITY_KING_DAMAGE));
      }
    }

    if(piece.squareIndex == 60) {
      // short castle
      if(
        this.board[61].type == PieceType.NO_PIECE &&
        this.board[62].type == PieceType.NO_PIECE &&
        this.board[63].type == PieceType.P2_WARRIOR
        ) {
          retval.push(new PlayerAction(60, 62, ActionType.MOVE_CASTLE))
        }
      // long castle
      if(
        this.board[59].type == PieceType.NO_PIECE &&
        this.board[58].type == PieceType.NO_PIECE &&
        this.board[57].type == PieceType.NO_PIECE &&
        this.board[56].type == PieceType.P2_WARRIOR
        ) {
          retval.push(new PlayerAction(60, 58, ActionType.MOVE_CASTLE))
        }
    }

    return retval;
  }

  _p1MageActions(piece: Piece): Array<PlayerAction> {
    let retval = new Array<PlayerAction>();
    let squareIdx: number;

    let vertical1: Array<number> = GameCache.squareToDirectionToLine[piece.squareIndex][Direction.NORTH];
    for(let i = 0; i < vertical1.length; i++) {
      squareIdx = vertical1[i];
      let dstPiece: Piece = this.board[squareIdx];
      if(dstPiece.type == PieceType.NO_PIECE) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.MOVE_REGULAR));
      } else if(pieceBelongsToPlayer(dstPiece.type, Player.PLAYER_2)) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.ABILITY_MAGE_DAMAGE));
        break;
      } else {
        break;
      }
    }

    let diagonal1: Array<number> = GameCache.squareToDirectionToLine[piece.squareIndex][Direction.NORTHEAST];
    for(let i = 0; i < diagonal1.length; i++) {
      squareIdx = diagonal1[i];
      let dstPiece: Piece = this.board[squareIdx];
      if(dstPiece.type == PieceType.NO_PIECE) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.MOVE_REGULAR));
      } else if(pieceBelongsToPlayer(dstPiece.type, Player.PLAYER_2)) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.ABILITY_MAGE_DAMAGE));
        break;
      } else {
        break;
      }
    }


    let horizontal1: Array<number> = GameCache.squareToDirectionToLine[piece.squareIndex][Direction.EAST];
    for(let i = 0; i < horizontal1.length; i++) {
      squareIdx = horizontal1[i];
      let dstPiece: Piece = this.board[squareIdx];
      if(dstPiece.type == PieceType.NO_PIECE) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.MOVE_REGULAR));
      } else if(pieceBelongsToPlayer(dstPiece.type, Player.PLAYER_2)) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.ABILITY_MAGE_DAMAGE));
        break;
      } else {
        break;
      }
    }

    let diagonal2: Array<number> = GameCache.squareToDirectionToLine[piece.squareIndex][Direction.SOUTHEAST];
    for(let i = 0; i < diagonal2.length; i++) {
      squareIdx = diagonal2[i];
      let dstPiece: Piece = this.board[squareIdx];
      if(dstPiece.type == PieceType.NO_PIECE) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.MOVE_REGULAR));
      } else if(pieceBelongsToPlayer(dstPiece.type, Player.PLAYER_2)) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.ABILITY_MAGE_DAMAGE));
        break;
      } else {
        break;
      }
    }

    let vertical2: Array<number> = GameCache.squareToDirectionToLine[piece.squareIndex][Direction.SOUTH];
    for(let i = 0; i < vertical2.length; i++) {
      squareIdx = vertical2[i];
      let dstPiece: Piece = this.board[squareIdx];
      if(dstPiece.type == PieceType.NO_PIECE) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.MOVE_REGULAR));
      } else if(pieceBelongsToPlayer(dstPiece.type, Player.PLAYER_2)) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.ABILITY_MAGE_DAMAGE));
        break;
      } else {
        break;
      }
    }

    let diagonal3: Array<number> = GameCache.squareToDirectionToLine[piece.squareIndex][Direction.SOUTHWEST];
    for(let i = 0; i < diagonal3.length; i++) {
      squareIdx = diagonal3[i];
      let dstPiece: Piece = this.board[squareIdx];
      if(dstPiece.type == PieceType.NO_PIECE) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.MOVE_REGULAR));
      } else if(pieceBelongsToPlayer(dstPiece.type, Player.PLAYER_2)) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.ABILITY_MAGE_DAMAGE));
        break;
      } else {
        break;
      }
    }

    let horizontal2: Array<number> = GameCache.squareToDirectionToLine[piece.squareIndex][Direction.WEST];
    for(let i = 0; i < horizontal2.length; i++) {
      squareIdx = horizontal2[i];
      let dstPiece: Piece = this.board[squareIdx];
      if(dstPiece.type == PieceType.NO_PIECE) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.MOVE_REGULAR));
      } else if(pieceBelongsToPlayer(dstPiece.type, Player.PLAYER_2)) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.ABILITY_MAGE_DAMAGE));
        break;
      } else {
        break;
      }
    }

    let diagonal4: Array<number> = GameCache.squareToDirectionToLine[piece.squareIndex][Direction.NORTHWEST];
    for(let i = 0; i < diagonal4.length; i++) {
      squareIdx = diagonal4[i];
      let dstPiece: Piece = this.board[squareIdx];
      if(dstPiece.type == PieceType.NO_PIECE) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.MOVE_REGULAR));
      } else if(pieceBelongsToPlayer(dstPiece.type, Player.PLAYER_2)) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.ABILITY_MAGE_DAMAGE));
        break;
      } else {
        break;
      }
    }

    // mage throw assassin
    for(let k = 0; k < constants.NUM_DIAGONAL_DIRECTIONS; k++) {
      let direction: Direction = constants.DIAGONAL_DIRECTIONS[k];
      let directionLine = GameCache.squareToDirectionToLine[piece.squareIndex][direction];
      for(let i = 0; i < directionLine.length; i++) {
        let p: Piece = this.board[directionLine[i]];
        if(p.type != PieceType.P1_ASSASSIN) {
          break;
        } else {
          // is there a valid target?
          for(let j = i+1; j < directionLine.length; j++) {
            let p2: Piece = this.board[directionLine[j]];
            if(pieceBelongsToPlayer(p2.type, Player.PLAYER_2)) {
              let actionType = ActionType.ABILITY_MAGE_THROW_ASSASSIN;
              let currentAbility = new PlayerAction(piece.squareIndex, p2.squareIndex, actionType);
              retval.push(currentAbility);
              break;
            } else if(pieceBelongsToPlayer(p2.type, Player.PLAYER_1)) {
              break;
            }
          }
        }
        break;
      }
    }

    return retval;
  }

  _p2MageActions(piece: Piece): Array<PlayerAction> {
    let retval = new Array<PlayerAction>();
    let squareIdx: number;

    let vertical1: Array<number> = GameCache.squareToDirectionToLine[piece.squareIndex][Direction.NORTH];
    for(let i = 0; i < vertical1.length; i++) {
      squareIdx = vertical1[i];
      let dstPiece: Piece = this.board[squareIdx];
      if(dstPiece.type == PieceType.NO_PIECE) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.MOVE_REGULAR));
      } else if(pieceBelongsToPlayer(dstPiece.type, Player.PLAYER_1)) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.ABILITY_MAGE_DAMAGE));
        break;
      } else {
        break;
      }
    }

    let diagonal1: Array<number> = GameCache.squareToDirectionToLine[piece.squareIndex][Direction.NORTHEAST];
    for(let i = 0; i < diagonal1.length; i++) {
      squareIdx = diagonal1[i];
      let dstPiece: Piece = this.board[squareIdx];
      if(dstPiece.type == PieceType.NO_PIECE) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.MOVE_REGULAR));
      } else if(pieceBelongsToPlayer(dstPiece.type, Player.PLAYER_1)) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.ABILITY_MAGE_DAMAGE));
        break;
      } else {
        break;
      }
    }


    let horizontal1: Array<number> = GameCache.squareToDirectionToLine[piece.squareIndex][Direction.EAST];
    for(let i = 0; i < horizontal1.length; i++) {
      squareIdx = horizontal1[i];
      let dstPiece: Piece = this.board[squareIdx];
      if(dstPiece.type == PieceType.NO_PIECE) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.MOVE_REGULAR));
      } else if(pieceBelongsToPlayer(dstPiece.type, Player.PLAYER_1)) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.ABILITY_MAGE_DAMAGE));
        break;
      } else {
        break;
      }
    }

    let diagonal2: Array<number> = GameCache.squareToDirectionToLine[piece.squareIndex][Direction.SOUTHEAST];
    for(let i = 0; i < diagonal2.length; i++) {
      squareIdx = diagonal2[i];
      let dstPiece: Piece = this.board[squareIdx];
      if(dstPiece.type == PieceType.NO_PIECE) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.MOVE_REGULAR));
      } else if(pieceBelongsToPlayer(dstPiece.type, Player.PLAYER_1)) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.ABILITY_MAGE_DAMAGE));
        break;
      } else {
        break;
      }
    }

    let vertical2: Array<number> = GameCache.squareToDirectionToLine[piece.squareIndex][Direction.SOUTH];
    for(let i = 0; i < vertical2.length; i++) {
      squareIdx = vertical2[i];
      let dstPiece: Piece = this.board[squareIdx];
      if(dstPiece.type == PieceType.NO_PIECE) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.MOVE_REGULAR));
      } else if(pieceBelongsToPlayer(dstPiece.type, Player.PLAYER_1)) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.ABILITY_MAGE_DAMAGE));
        break;
      } else {
        break;
      }
    }

    let diagonal3: Array<number> = GameCache.squareToDirectionToLine[piece.squareIndex][Direction.SOUTHWEST];
    for(let i = 0; i < diagonal3.length; i++) {
      squareIdx = diagonal3[i];
      let dstPiece: Piece = this.board[squareIdx];
      if(dstPiece.type == PieceType.NO_PIECE) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.MOVE_REGULAR));
      } else if(pieceBelongsToPlayer(dstPiece.type, Player.PLAYER_1)) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.ABILITY_MAGE_DAMAGE));
        break;
      } else {
        break;
      }
    }

    let horizontal2: Array<number> = GameCache.squareToDirectionToLine[piece.squareIndex][Direction.WEST];
    for(let i = 0; i < horizontal2.length; i++) {
      squareIdx = horizontal2[i];
      let dstPiece: Piece = this.board[squareIdx];
      if(dstPiece.type == PieceType.NO_PIECE) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.MOVE_REGULAR));
      } else if(pieceBelongsToPlayer(dstPiece.type, Player.PLAYER_1)) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.ABILITY_MAGE_DAMAGE));
        break;
      } else {
        break;
      }
    }

    let diagonal4: Array<number> = GameCache.squareToDirectionToLine[piece.squareIndex][Direction.NORTHWEST];
    for(let i = 0; i < diagonal4.length; i++) {
      squareIdx = diagonal4[i];
      let dstPiece: Piece = this.board[squareIdx];
      if(dstPiece.type == PieceType.NO_PIECE) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.MOVE_REGULAR));
      } else if(pieceBelongsToPlayer(dstPiece.type, Player.PLAYER_1)) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.ABILITY_MAGE_DAMAGE));
        break;
      } else {
        break;
      }
    }

    // mage throw assassin
    for(let k = 0; k < constants.NUM_DIAGONAL_DIRECTIONS; k++) {
      let direction: Direction = constants.DIAGONAL_DIRECTIONS[k];
      let directionLine = GameCache.squareToDirectionToLine[piece.squareIndex][direction];
      for(let i = 0; i < directionLine.length; i++) {
        let p: Piece = this.board[directionLine[i]];
        if(p.type != PieceType.P2_ASSASSIN) {
          break;
        } else {
          // is there a valid target?
          for(let j = i+1; j < directionLine.length; j++) {
            let p2: Piece = this.board[directionLine[j]];
            if(pieceBelongsToPlayer(p2.type, Player.PLAYER_1)) {
              let actionType = ActionType.ABILITY_MAGE_THROW_ASSASSIN;
              let currentAbility = new PlayerAction(piece.squareIndex, p2.squareIndex, actionType);
              retval.push(currentAbility);
              break;
            } else if(pieceBelongsToPlayer(p2.type, Player.PLAYER_2)) {
              break;
            }
          }
        }
        break;
      }
    }

    return retval;
  }

  _p1WarriorActions(piece: Piece): Array<PlayerAction> {
    let retval = new Array<PlayerAction>();
    let squareIdx: number;

    let vertical1: Array<number> = GameCache.squareToDirectionToLine[piece.squareIndex][Direction.NORTH];
    for(let i = 0; i < vertical1.length; i++) {
      squareIdx = vertical1[i];
      let dstPiece: Piece = this.board[squareIdx];
      if(dstPiece.type == PieceType.NO_PIECE) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.MOVE_REGULAR));
      } else if(pieceBelongsToPlayer(dstPiece.type, Player.PLAYER_2)) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.ABILITY_WARRIOR_DAMAGE));
        break;
      } else {
        break;
      }
    }

    let horizontal1: Array<number> = GameCache.squareToDirectionToLine[piece.squareIndex][Direction.EAST];
    for(let i = 0; i < horizontal1.length; i++) {
      squareIdx = horizontal1[i];
      let dstPiece: Piece = this.board[squareIdx];
      if(dstPiece.type == PieceType.NO_PIECE) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.MOVE_REGULAR));
      } else if(pieceBelongsToPlayer(dstPiece.type, Player.PLAYER_2)) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.ABILITY_WARRIOR_DAMAGE));
        break;
      } else {
        break;
      }
    }

    let vertical2: Array<number> = GameCache.squareToDirectionToLine[piece.squareIndex][Direction.SOUTH];
    for(let i = 0; i < vertical2.length; i++) {
      squareIdx = vertical2[i];
      let dstPiece: Piece = this.board[squareIdx];
      if(dstPiece.type == PieceType.NO_PIECE) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.MOVE_REGULAR));
      } else if(pieceBelongsToPlayer(dstPiece.type, Player.PLAYER_2)) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.ABILITY_WARRIOR_DAMAGE));
        break;
      } else {
        break;
      }
    }

    let horizontal2: Array<number> = GameCache.squareToDirectionToLine[piece.squareIndex][Direction.WEST];
    for(let i = 0; i < horizontal2.length; i++) {
      squareIdx = horizontal2[i];
      let dstPiece: Piece = this.board[squareIdx];
      if(dstPiece.type == PieceType.NO_PIECE) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.MOVE_REGULAR));
      } else if(pieceBelongsToPlayer(dstPiece.type, Player.PLAYER_2)) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.ABILITY_WARRIOR_DAMAGE));
        break;
      } else {
        break;
      }
    }

    for(let k = 0; k < 4; k++) {
      let directionLine = GameCache.squareToDirectionToLine[piece.squareIndex][constants.NON_DIAGONAL_DIRECTIONS[k]];
      for(let i = 0; i < directionLine.length; i++) {
        let p: Piece = this.board[directionLine[i]];
        if(p.type != PieceType.P1_WARRIOR) {
          break;
        } else {
          // is there a valid target?
          for(let j = i+1; j < directionLine.length; j++) {
            let p2: Piece = this.board[directionLine[j]];
            if(pieceBelongsToPlayer(p2.type, Player.PLAYER_2)) {
              let currentAbility = new PlayerAction(piece.squareIndex, p2.squareIndex, ActionType.ABILITY_WARRIOR_THROW_WARRIOR);
              retval.push(currentAbility);
              break;
            } else if(pieceBelongsToPlayer(p2.type, Player.PLAYER_1)) {
              break;
            }
          }
        }
        break;
      }
    }

    return retval;
  }

  _p2WarriorActions(piece: Piece): Array<PlayerAction> {
    let retval = new Array<PlayerAction>();
    let squareIdx: number;

    let vertical1: Array<number> = GameCache.squareToDirectionToLine[piece.squareIndex][Direction.NORTH];
    for(let i = 0; i < vertical1.length; i++) {
      squareIdx = vertical1[i];
      let dstPiece: Piece = this.board[squareIdx];
      if(dstPiece.type == PieceType.NO_PIECE) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.MOVE_REGULAR));
      } else if(pieceBelongsToPlayer(dstPiece.type, Player.PLAYER_1)) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.ABILITY_WARRIOR_DAMAGE));
        break;
      } else {
        break;
      }
    }

    let horizontal1: Array<number> = GameCache.squareToDirectionToLine[piece.squareIndex][Direction.EAST];
    for(let i = 0; i < horizontal1.length; i++) {
      squareIdx = horizontal1[i];
      let dstPiece: Piece = this.board[squareIdx];
      if(dstPiece.type == PieceType.NO_PIECE) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.MOVE_REGULAR));
      } else if(pieceBelongsToPlayer(dstPiece.type, Player.PLAYER_1)) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.ABILITY_WARRIOR_DAMAGE));
        break;
      } else {
        break;
      }
    }

    let vertical2: Array<number> = GameCache.squareToDirectionToLine[piece.squareIndex][Direction.SOUTH];
    for(let i = 0; i < vertical2.length; i++) {
      squareIdx = vertical2[i];
      let dstPiece: Piece = this.board[squareIdx];
      if(dstPiece.type == PieceType.NO_PIECE) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.MOVE_REGULAR));
      } else if(pieceBelongsToPlayer(dstPiece.type, Player.PLAYER_1)) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.ABILITY_WARRIOR_DAMAGE));
        break;
      } else {
        break;
      }
    }

    let horizontal2: Array<number> = GameCache.squareToDirectionToLine[piece.squareIndex][Direction.WEST];
    for(let i = 0; i < horizontal2.length; i++) {
      squareIdx = horizontal2[i];
      let dstPiece: Piece = this.board[squareIdx];
      if(dstPiece.type == PieceType.NO_PIECE) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.MOVE_REGULAR));
      } else if(pieceBelongsToPlayer(dstPiece.type, Player.PLAYER_1)) {
        retval.push(new PlayerAction(piece.squareIndex, squareIdx, ActionType.ABILITY_WARRIOR_DAMAGE));
        break;
      } else {
        break;
      }
    }

    for(let k = 0; k < 4; k++) {
      let directionLine = GameCache.squareToDirectionToLine[piece.squareIndex][constants.NON_DIAGONAL_DIRECTIONS[k]];
      for(let i = 0; i < directionLine.length; i++) {
        let p: Piece = this.board[directionLine[i]];
        if(p.type != PieceType.P2_WARRIOR) {
          break;
        } else {
          // is there a valid target?
          for(let j = i+1; j < directionLine.length; j++) {
            let p2: Piece = this.board[directionLine[j]];
            if(pieceBelongsToPlayer(p2.type, Player.PLAYER_1)) {
              let currentAbility = new PlayerAction(piece.squareIndex, p2.squareIndex, ActionType.ABILITY_WARRIOR_THROW_WARRIOR);
              retval.push(currentAbility);
              break;
            } else if(pieceBelongsToPlayer(p2.type, Player.PLAYER_2)) {
              break;
            }
          }
        }
        break;
      }
    }

    return retval;
  }

  _p1KnightActions(piece: Piece): Array<PlayerAction> {
    let retval = new Array<PlayerAction>();
    let squares: Array<number> = GameCache.squareToKnightActionSquares[piece.squareIndex];
    for(let i = 0; i < squares.length; i++) {
      let s: number = squares[i];  
      let currentPiece: Piece = this.board[s];
      if(currentPiece.type == PieceType.NO_PIECE) {
        retval.push(new PlayerAction(piece.squareIndex, s, ActionType.MOVE_REGULAR));
      } else if(pieceBelongsToPlayer(currentPiece.type, Player.PLAYER_2)) {
        retval.push(new PlayerAction(piece.squareIndex, s, ActionType.ABILITY_KNIGHT_DAMAGE));
      }
    }

    return retval;
  }

  _p2KnightActions(piece: Piece): Array<PlayerAction> {
    let retval = new Array<PlayerAction>();
    let squares: Array<number> = GameCache.squareToKnightActionSquares[piece.squareIndex];
    for(let i = 0; i < squares.length; i++) {
      let s: number = squares[i];  
      let currentPiece: Piece = this.board[s];
      if(currentPiece.type == PieceType.NO_PIECE) {
        retval.push(new PlayerAction(piece.squareIndex, s, ActionType.MOVE_REGULAR));
      } else if(pieceBelongsToPlayer(currentPiece.type, Player.PLAYER_1)) {
        retval.push(new PlayerAction(piece.squareIndex, s, ActionType.ABILITY_KNIGHT_DAMAGE));
      }
    }

    return retval;
  }

  legalActionsByPiece(piece: Piece): Array<PlayerAction> {
    switch(piece.type) {
      case PieceType.P1_KING:
        return this._p1KingActions(piece);
      case PieceType.P1_MAGE:
        return this._p1MageActions(piece);
      case PieceType.P1_PAWN:
        return this._p1PawnActions(piece);
      case PieceType.P1_WARRIOR:
        return this._p1WarriorActions(piece);
      case PieceType.P1_ASSASSIN:
        return this._p1AssassinActions(piece);
      case PieceType.P1_KNIGHT:
        return this._p1KnightActions(piece);
      case PieceType.P2_KING:
        return this._p2KingActions(piece);
      case PieceType.P2_MAGE:
        return this._p2MageActions(piece);
      case PieceType.P2_PAWN:
        return this._p2PawnActions(piece);
      case PieceType.P2_WARRIOR:
        return this._p2WarriorActions(piece);
      case PieceType.P2_ASSASSIN:
        return this._p2AssassinActions(piece);
      case PieceType.P2_KNIGHT:
        return this._p2KnightActions(piece);
      default:
        return new Array<PlayerAction>();
    }
  }

  generateLegalActions(): Array<PlayerAction> {
    let retval = new Array<PlayerAction>()
    if(this.playerToKing[this.currentPlayer].healthPoints <= 0) {
      return retval;
    }
    let currentPlayerPieces: Array<Piece> = this.playerToPieces[this.currentPlayer];
    for(let i = 0; i < currentPlayerPieces.length; i++) {
      let currentPiece: Piece = currentPlayerPieces[i];
      if(currentPiece.healthPoints <= 0) continue; // dead pieces don't move

      let legalActions: Array<PlayerAction> = this.legalActionsByPiece(currentPiece)
      retval = retval.concat(legalActions);
    }
    // TODO: No longer needed. Remove?
    // player can also skip the action
    //let p = new PlayerAction(constants.ACTION_SKIP, constants.ACTION_SKIP, ActionType.SKIP);
    //retval.push(p);
    return retval;
  }

  zobristHash(): number {
    let hash = 0;
    let p1Pieces: Array<Piece> = this.playerToPieces[Player.PLAYER_1]
    for(let i = 0; i < p1Pieces.length; i++) {
      let currentPiece: Piece = p1Pieces[i];
      if(currentPiece.healthPoints <= 0) continue;
      // dividing hp by 10 because health points are { 10, 20, 30, 40, 50, 60 } and 
      // indexes are { 1, 2, 3, 4, 5, 6 }
      hash ^= Zobrist.pieceTypeToSquareToHPToKey[currentPiece.type][currentPiece.squareIndex][currentPiece.healthPoints/10];
    }
    let p2Pieces: Array<Piece> = this.playerToPieces[Player.PLAYER_2]
    for(let i = 0; i < p2Pieces.length; i++) {
      let currentPiece: Piece = p2Pieces[i];
      if(currentPiece.healthPoints <= 0) continue;
      // dividing hp by 10 because health points are { 10, 20, 30, 40, 50, 60 } and 
      // indexes are { 1, 2, 3, 4, 5, 6 }
      hash ^= Zobrist.pieceTypeToSquareToHPToKey[currentPiece.type][currentPiece.squareIndex][currentPiece.healthPoints/10];
    }
    if(this.currentPlayer == Player.PLAYER_2) {
      hash ^= Zobrist.p2Key;
    }
    return hash;
  }


/*
 * Assumes the action is legal.
 */
  makeAction(playerAction: PlayerAction): UndoInfo {
    let undoInfo: UndoInfo = new UndoInfo();
    undoInfo.action = playerAction;
    if(playerAction.actionType != ActionType.SKIP) {
      let srcIdx: number = playerAction.srcIdx
      let dstIdx: number = playerAction.dstIdx
      let abilitySrcPiece: Piece = this.board[srcIdx];
      let abilityDstPiece: Piece = this.board[dstIdx];
      let currentPiece: Piece;
      let currentSquare: number;
      let direction: Direction;
      let directionLine: Array<number>;
      let squares: Array<number>;
      let idx: number;
      let opponentPlayer: Player
      switch(playerAction.actionType) {
        case ActionType.MOVE_REGULAR:
          this.board[playerAction.dstIdx] = this.board[playerAction.srcIdx]
          this.board[playerAction.dstIdx].squareIndex = playerAction.dstIdx
          this.board[playerAction.srcIdx] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: playerAction.srcIdx})
          break;
        case ActionType.MOVE_CASTLE:
          // move king
          this.board[playerAction.dstIdx] = this.board[playerAction.srcIdx]
          this.board[playerAction.dstIdx].squareIndex = playerAction.dstIdx
          this.board[playerAction.srcIdx] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: playerAction.srcIdx})

          // based on king's destination we can determine which castle it is
          if(playerAction.dstIdx == 6) {
            //p1 short castle
            this.board[5] = this.board[7]
            this.board[5].squareIndex = 5
            this.board[7] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: 7})
          } else if(playerAction.dstIdx == 2) {
            //p1 long castle
            this.board[3] = this.board[0]
            this.board[3].squareIndex = 3
            this.board[0] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: 0})
          } else if(playerAction.dstIdx == 62) {
            //p2 short castle
            this.board[61] = this.board[63]
            this.board[61].squareIndex = 61
            this.board[63] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: 63})
          } else { // p2 long castle
            this.board[59] = this.board[56]
            this.board[59].squareIndex = 59
            this.board[56] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: 56})
          }
          break;

        case ActionType.MOVE_PROMOTE_P1_PAWN:
          // save pawn's health points
          undoInfo.t1 = abilitySrcPiece.healthPoints;
          // remove pawn from piece array
          idx = this.playerToPieces[Player.PLAYER_1].indexOf(abilitySrcPiece);
          this.playerToPieces[Player.PLAYER_1].splice(idx, 1);
          this.board[playerAction.srcIdx] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: playerAction.srcIdx})

          // add new warrior
          this.board[playerAction.dstIdx] = new Piece({type: PieceType.P1_WARRIOR, healthPoints: constants.WARRIOR_STARTING_HEALTH_POINTS, squareIndex: playerAction.dstIdx})
          this.playerToPieces[Player.PLAYER_1].push(this.board[playerAction.dstIdx]);
          break;
        case ActionType.MOVE_PROMOTE_P2_PAWN:
          // save pawn's health points
          undoInfo.t1 = abilitySrcPiece.healthPoints;
          // remove pawn from the piece array
          idx = this.playerToPieces[Player.PLAYER_2].indexOf(abilitySrcPiece);
          this.playerToPieces[Player.PLAYER_2].splice(idx, 1);
          this.board[playerAction.srcIdx] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: playerAction.srcIdx})

          // add new warrior
          this.board[playerAction.dstIdx] = new Piece({type: PieceType.P2_WARRIOR, healthPoints: constants.WARRIOR_STARTING_HEALTH_POINTS, squareIndex: playerAction.dstIdx})
          this.playerToPieces[Player.PLAYER_2].push(this.board[playerAction.dstIdx]);

          break;

        // king does single target damage
        case ActionType.ABILITY_KING_DAMAGE:
          abilityDstPiece.healthPoints -= constants.KING_ABILITY_POINTS;
          undoInfo.affectedPieces[0] = abilityDstPiece;
          if(abilityDstPiece.healthPoints <= 0) {
            // move piece to the destroyed piece's location
            this.board[dstIdx] = abilitySrcPiece;
            this.board[srcIdx] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: srcIdx});
            abilitySrcPiece.squareIndex = dstIdx;
          }
          break;
        case ActionType.ABILITY_MAGE_DAMAGE:
          abilityDstPiece.healthPoints -= constants.MAGE_ABILITY_POINTS;
          undoInfo.affectedPieces[0] = abilityDstPiece;
          if(abilityDstPiece.healthPoints <= 0) {
            // move piece to the destroyed piece's location
            this.board[dstIdx] = abilitySrcPiece;
            this.board[srcIdx] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: srcIdx});
            abilitySrcPiece.squareIndex = dstIdx;
          } else {
            // find square to leap to (if possible)
            direction = GameCache.srcSquareToDstSquareToDirection[srcIdx][dstIdx]
            directionLine = GameCache.squareToDirectionToLine[srcIdx][direction];
            idx = 0;
            while(true) {
              currentPiece = this.board[directionLine[idx]];
              if(!(currentPiece.type == PieceType.NO_PIECE)) break;
              idx++;
            }
            if(idx != 0) {
              // leap
              currentSquare = directionLine[idx-1];
              undoInfo.t1 = currentSquare;
              
              this.board[currentSquare] = this.board[srcIdx];
              this.board[currentSquare].squareIndex = currentSquare;
              this.board[srcIdx] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: srcIdx})
            }
          }
          break;
        case ActionType.ABILITY_MAGE_THROW_ASSASSIN:
          if(abilitySrcPiece.type == PieceType.P1_MAGE) {
            opponentPlayer = Player.PLAYER_2;
          } else {
            opponentPlayer = Player.PLAYER_1;
          }

          direction = GameCache.srcSquareToDstSquareToDirection[srcIdx][dstIdx]
          directionLine = GameCache.squareToDirectionToLine[srcIdx][direction];
          idx = directionLine[0] // assassin to be thrown is at this index
          undoInfo.t1 = idx;
          undoInfo.affectedPieces.push(this.board[idx]);

          abilityDstPiece.healthPoints -= constants.MAGE_THROW_DAMAGE_1;
          undoInfo.affectedPieces.push(abilityDstPiece);

          // throw assassin
          this.board[dstIdx] = this.board[idx];
          this.board[dstIdx].squareIndex = dstIdx;
          this.board[idx] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: idx});

          // AOE damage
          squares = GameCache.squareToNeighboringSquares[dstIdx];
          for(let i = 0; i < squares.length; i++) {
            currentPiece = this.board[squares[i]]
            if(pieceBelongsToPlayer(currentPiece.type, opponentPlayer)) {
              currentPiece.healthPoints -= constants.MAGE_THROW_DAMAGE_2;
              undoInfo.affectedPieces.push(currentPiece);
              if(currentPiece.healthPoints <= 0) {
                this.board[currentPiece.squareIndex] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: currentPiece.squareIndex});
              }
            }
          }
          break;
        case ActionType.ABILITY_PAWN_DAMAGE:
          abilityDstPiece.healthPoints -= constants.PAWN_ABILITY_POINTS;
          undoInfo.affectedPieces[0] = abilityDstPiece;
          if(abilityDstPiece.healthPoints <= 0) {
            // move piece to the destroyed piece's location
            this.board[dstIdx] = abilitySrcPiece;
            this.board[srcIdx] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: srcIdx});
            abilitySrcPiece.squareIndex = dstIdx;
          }
          break;
        case ActionType.ABILITY_P1_PAWN_DAMAGE_AND_PROMOTION:
          // save pawn's health points
          undoInfo.t1 = abilitySrcPiece.healthPoints;
          // remove enemy piece
          abilityDstPiece.healthPoints -= constants.PAWN_ABILITY_POINTS;
          undoInfo.affectedPieces[0] = abilityDstPiece;
          //transform pawn into warrior
          this.board[dstIdx] = this.board[srcIdx];
          this.board[dstIdx].squareIndex = dstIdx;
          this.board[dstIdx].type = PieceType.P1_WARRIOR;
          this.board[dstIdx].healthPoints = constants.WARRIOR_STARTING_HEALTH_POINTS;
          this.board[srcIdx] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: srcIdx});
          break;
        case ActionType.ABILITY_P2_PAWN_DAMAGE_AND_PROMOTION:
          // save pawn's health points
          undoInfo.t1 = abilitySrcPiece.healthPoints;
          // remove enemy piece
          abilityDstPiece.healthPoints -= constants.PAWN_ABILITY_POINTS;
          undoInfo.affectedPieces[0] = abilityDstPiece;
          //transform pawn into warrior
          this.board[dstIdx] = this.board[srcIdx];
          this.board[dstIdx].squareIndex = dstIdx;
          this.board[dstIdx].type = PieceType.P2_WARRIOR;
          this.board[dstIdx].healthPoints = constants.WARRIOR_STARTING_HEALTH_POINTS;
          this.board[srcIdx] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: srcIdx});
          break;
        case ActionType.ABILITY_WARRIOR_DAMAGE:
          abilityDstPiece.healthPoints -= constants.WARRIOR_ABILITY_POINTS;
          undoInfo.affectedPieces[0] = abilityDstPiece;
          if(abilityDstPiece.healthPoints <= 0) {
            // move piece to the destroyed piece's location
            this.board[dstIdx] = abilitySrcPiece;
            this.board[srcIdx] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: srcIdx});
            abilitySrcPiece.squareIndex = dstIdx;
          } else {
            // find square to leap to (if possible)
            direction = GameCache.srcSquareToDstSquareToDirection[srcIdx][dstIdx]
            directionLine = GameCache.squareToDirectionToLine[srcIdx][direction];
            idx = 0;
            while(true) {
              currentPiece = this.board[directionLine[idx]];
              if(!(currentPiece.type == PieceType.NO_PIECE)) break;
              idx++;
            }
            if(idx != 0) {
              // leap
              currentSquare = directionLine[idx-1];
              undoInfo.t1 = currentSquare;
              
              this.board[currentSquare] = this.board[srcIdx];
              this.board[currentSquare].squareIndex = currentSquare;
              this.board[srcIdx] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: srcIdx})
            }
          }
          break;
        case ActionType.ABILITY_WARRIOR_THROW_WARRIOR:
          if(abilitySrcPiece.type == PieceType.P1_WARRIOR) {
            opponentPlayer = Player.PLAYER_2;
          } else {
            opponentPlayer = Player.PLAYER_1;
          }

          direction = GameCache.srcSquareToDstSquareToDirection[srcIdx][dstIdx]
          directionLine = GameCache.squareToDirectionToLine[srcIdx][direction];
          idx = directionLine[0] // warrior to be thrown is at this index
          undoInfo.t1 = idx;
          undoInfo.affectedPieces.push(this.board[idx]);

          abilityDstPiece.healthPoints -= constants.WARRIOR_THROW_DAMAGE_1;
          undoInfo.affectedPieces.push(abilityDstPiece);

          // throw warrior
          this.board[dstIdx] = this.board[idx];
          this.board[dstIdx].squareIndex = dstIdx;
          this.board[idx] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: idx});

          // AOE damage
          squares = GameCache.squareToNeighboringSquares[dstIdx];
          for(let i = 0; i < squares.length; i++) {
            currentPiece = this.board[squares[i]]
            if(pieceBelongsToPlayer(currentPiece.type, opponentPlayer)) {
              currentPiece.healthPoints -= constants.WARRIOR_THROW_DAMAGE_2;
              undoInfo.affectedPieces.push(currentPiece);
              if(currentPiece.healthPoints <= 0) {
                this.board[currentPiece.squareIndex] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: currentPiece.squareIndex});
              }
            }
          }
          break;
        case ActionType.ABILITY_ASSASSIN_DAMAGE:
          abilityDstPiece.healthPoints -= constants.ASSASSIN_ABILITY_POINTS;
          undoInfo.affectedPieces[0] = abilityDstPiece;
          if(abilityDstPiece.healthPoints <= 0) {
            // move piece to the destroyed piece's location
            this.board[dstIdx] = abilitySrcPiece;
            this.board[srcIdx] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: srcIdx});
            abilitySrcPiece.squareIndex = dstIdx;
          } else {
            // find square to leap to (if possible)
            direction = GameCache.srcSquareToDstSquareToDirection[srcIdx][dstIdx]
            directionLine = GameCache.squareToDirectionToLine[srcIdx][direction];
            idx = 0;
            while(true) {
              currentPiece = this.board[directionLine[idx]];
              if(!(currentPiece.type == PieceType.NO_PIECE)) break;
              idx++;
            }
            if(idx != 0) {
              // leap
              currentSquare = directionLine[idx-1];
              undoInfo.t1 = currentSquare;
              
              this.board[currentSquare] = this.board[srcIdx];
              this.board[currentSquare].squareIndex = currentSquare;
              this.board[srcIdx] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: srcIdx})
            }
          }
          break;
        case ActionType.ABILITY_KNIGHT_DAMAGE:
          abilityDstPiece.healthPoints -= constants.KNIGHT_ABILITY_POINTS;
          undoInfo.affectedPieces[0] = abilityDstPiece;
          if(abilityDstPiece.healthPoints <= 0) {
            // move piece to the destroyed piece's location
            this.board[dstIdx] = abilitySrcPiece;
            this.board[srcIdx] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: srcIdx});
            abilitySrcPiece.squareIndex = dstIdx;
          }
          break;
        default:
          break;
      }
    }
    this.moveNumber += 1;
    this.currentPlayer = 1 - this.currentPlayer;

    let zh = this.zobristHash();
    let v = this.repetitions.get(zh)
    if(v === undefined) {
      this.repetitions.set(zh, 1)
    } else {
      if(v == 2) {
        this.repetitionsDraw = true;
      }
      this.repetitions.set(zh, v + 1)
    }
    return undoInfo;
  }

  undoAction(undoInfo: UndoInfo): void {
    let zh = this.zobristHash();
    let v = this.repetitions.get(zh)
    if(v === undefined) {
      throw new Error(`Attempted to undo position that's not in the repetitions map,\n Zobrist hash: ${zh}\n Dump:\n ${this.dump()}`)
    } else {
      if(v == 3) {
        this.repetitionsDraw = false;
      }
      this.repetitions.set(zh, v - 1)
    }

    let affectedPiece: Piece;
    let currentPiece: Piece;
    let srcIdx: number = undoInfo.action.srcIdx;
    let dstIdx: number = undoInfo.action.dstIdx;
    let idx: number
    switch(undoInfo.action.actionType) {
      case ActionType.MOVE_REGULAR:
        this.undoMove(undoInfo.action);
        break;
      case ActionType.MOVE_CASTLE:
        this.undoMove(undoInfo.action);
        break;
      case ActionType.MOVE_PROMOTE_P1_PAWN:
        // remove warrior from piece array
        currentPiece = this.board[dstIdx];
        idx = this.playerToPieces[Player.PLAYER_1].indexOf(currentPiece);
        this.playerToPieces[Player.PLAYER_1].splice(idx, 1);
        // remove warrior from board
        this.board[dstIdx] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: dstIdx});
        // restore pawn
        this.board[srcIdx] = new Piece({type: PieceType.P1_PAWN, healthPoints: undoInfo.t1, squareIndex: srcIdx});
        this.playerToPieces[Player.PLAYER_1].push(this.board[srcIdx]);
        break;
      case ActionType.MOVE_PROMOTE_P2_PAWN:
        // remove warrior from piece array
        currentPiece = this.board[dstIdx];
        idx = this.playerToPieces[Player.PLAYER_2].indexOf(currentPiece);
        this.playerToPieces[Player.PLAYER_2].splice(idx, 1);
        // remove warrior from board
        this.board[dstIdx] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: dstIdx});
        // restore pawn
        this.board[srcIdx] = new Piece({type: PieceType.P2_PAWN, healthPoints: undoInfo.t1, squareIndex: srcIdx});
        this.playerToPieces[Player.PLAYER_2].push(this.board[srcIdx]);
        break;
      case ActionType.ABILITY_KING_DAMAGE:
        affectedPiece = undoInfo.affectedPieces[0];
        affectedPiece.healthPoints += constants.KING_ABILITY_POINTS;
        if(this.board[affectedPiece.squareIndex] != affectedPiece) {
          // Piece was destroyed. 
          // Move king to previous location
          this.board[srcIdx] = this.board[dstIdx];
          this.board[srcIdx].squareIndex = srcIdx;
          this.board[dstIdx] = affectedPiece;
        }
        break;
      case ActionType.ABILITY_MAGE_DAMAGE:
        affectedPiece = undoInfo.affectedPieces[0];
        affectedPiece.healthPoints += constants.MAGE_ABILITY_POINTS;
        if(this.board[affectedPiece.squareIndex] != affectedPiece) {
          // Piece was destroyed. 
          // Move mage to previous location
          this.board[srcIdx] = this.board[dstIdx];
          this.board[srcIdx].squareIndex = srcIdx;
          this.board[dstIdx] = affectedPiece;
        } else if(undoInfo.t1 !== undefined) {
          // undo leap
          this.board[srcIdx] = this.board[undoInfo.t1];
          this.board[srcIdx].squareIndex = srcIdx;
          this.board[undoInfo.t1] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: undoInfo.t1});
        }
        break;
      case ActionType.ABILITY_MAGE_THROW_ASSASSIN:
        this.board[undoInfo.t1] = undoInfo.affectedPieces[0]; // thrown assassin is always at 0th index.
        this.board[undoInfo.t1].squareIndex = undoInfo.t1;

        // destroyed piece is always at 1st index
        affectedPiece = undoInfo.affectedPieces[1];
        affectedPiece.healthPoints += constants.MAGE_THROW_DAMAGE_1;
        this.board[affectedPiece.squareIndex] = affectedPiece;

        // AOE
        for(let i = 2; i < undoInfo.affectedPieces.length; i++) {
          affectedPiece = undoInfo.affectedPieces[i];
          affectedPiece.healthPoints += constants.MAGE_THROW_DAMAGE_2;
          this.board[affectedPiece.squareIndex] = affectedPiece;
        }
        break;
      case ActionType.ABILITY_WARRIOR_THROW_WARRIOR:
        this.board[undoInfo.t1] = undoInfo.affectedPieces[0]; // thrown warrior is always at 0th index.
        this.board[undoInfo.t1].squareIndex = undoInfo.t1;

        // destroyed piece is always at 1st index
        affectedPiece = undoInfo.affectedPieces[1];
        affectedPiece.healthPoints += constants.WARRIOR_THROW_DAMAGE_1;
        this.board[affectedPiece.squareIndex] = affectedPiece;

        // AOE
        for(let i = 2; i < undoInfo.affectedPieces.length; i++) {
          affectedPiece = undoInfo.affectedPieces[i];
          affectedPiece.healthPoints += constants.WARRIOR_THROW_DAMAGE_2;
          this.board[affectedPiece.squareIndex] = affectedPiece;
        }
        break;
      case ActionType.ABILITY_WARRIOR_DAMAGE:
        affectedPiece = undoInfo.affectedPieces[0];
        affectedPiece.healthPoints += constants.WARRIOR_ABILITY_POINTS;
        if(this.board[affectedPiece.squareIndex] != affectedPiece) {
          // Piece was destroyed. 
          // Move warrior to previous location
          this.board[srcIdx] = this.board[dstIdx];
          this.board[srcIdx].squareIndex = srcIdx;
          this.board[dstIdx] = affectedPiece;
        } else if(undoInfo.t1 !== undefined) {
          // undo leap
          this.board[srcIdx] = this.board[undoInfo.t1];
          this.board[srcIdx].squareIndex = srcIdx;
          this.board[undoInfo.t1] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: undoInfo.t1});
        }
        break;
      case ActionType.ABILITY_ASSASSIN_DAMAGE:
        affectedPiece = undoInfo.affectedPieces[0];
        affectedPiece.healthPoints += constants.ASSASSIN_ABILITY_POINTS;
        if(this.board[affectedPiece.squareIndex] != affectedPiece) {
          // Piece was destroyed. 
          // Move assassin to previous location
          this.board[srcIdx] = this.board[dstIdx];
          this.board[srcIdx].squareIndex = srcIdx;
          this.board[dstIdx] = affectedPiece;
        } else if(undoInfo.t1 !== undefined) {
          // undo leap
          this.board[srcIdx] = this.board[undoInfo.t1];
          this.board[srcIdx].squareIndex = srcIdx;
          this.board[undoInfo.t1] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: undoInfo.t1});
        }
        break;
      case ActionType.ABILITY_KNIGHT_DAMAGE:
        affectedPiece = undoInfo.affectedPieces[0];
        affectedPiece.healthPoints += constants.KNIGHT_ABILITY_POINTS;
        if(this.board[affectedPiece.squareIndex] != affectedPiece) {
          // Piece was destroyed. 
          // Move knight to previous location
          this.board[srcIdx] = this.board[dstIdx];
          this.board[srcIdx].squareIndex = srcIdx;
          this.board[dstIdx] = affectedPiece;
        }
        break;
      case ActionType.ABILITY_PAWN_DAMAGE:
        affectedPiece = undoInfo.affectedPieces[0];
        affectedPiece.healthPoints += constants.PAWN_ABILITY_POINTS;
        if(this.board[affectedPiece.squareIndex] != affectedPiece) {
          // Piece was destroyed. 
          // Move pawn to previous location
          this.board[srcIdx] = this.board[dstIdx];
          this.board[srcIdx].squareIndex = srcIdx;
          this.board[dstIdx] = affectedPiece;
        }
        break;
      case ActionType.ABILITY_P1_PAWN_DAMAGE_AND_PROMOTION:
        // transform warrior -> pawn and move back
        this.board[srcIdx] = this.board[dstIdx];
        this.board[srcIdx].squareIndex = srcIdx;
        this.board[srcIdx].healthPoints = undoInfo.t1;
        this.board[srcIdx].type = PieceType.P1_PAWN;

        // restore captured piece
        affectedPiece = undoInfo.affectedPieces[0];
        affectedPiece.healthPoints += constants.PAWN_ABILITY_POINTS;
        this.board[dstIdx] = affectedPiece;
        break;
      case ActionType.ABILITY_P2_PAWN_DAMAGE_AND_PROMOTION:
        // transform warrior -> pawn and move back
        this.board[srcIdx] = this.board[dstIdx];
        this.board[srcIdx].squareIndex = srcIdx;
        this.board[srcIdx].healthPoints = undoInfo.t1;
        this.board[srcIdx].type = PieceType.P2_PAWN;

        // restore captured piece
        affectedPiece = undoInfo.affectedPieces[0];
        affectedPiece.healthPoints += constants.PAWN_ABILITY_POINTS;
        this.board[dstIdx] = affectedPiece;
        break;
      case ActionType.SKIP:
        break;
      default:
        break;
    }
    this.moveNumber -= 1;
    this.currentPlayer = 1 - this.currentPlayer;
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
  
  isActionLegal(srcIdx: number, dstIdx: number): boolean {
    // TODO
    return true;
  }

  getCurrentPlayer(): Player {
    return this.currentPlayer
  }

  getPieceByCoordinates(x: number, y: number): Piece {
    return this.board[coordinatesToBoardIndex(x, y)]
  }

  getPieceBySquareIndex(squareIndex: number): Piece {
    return this.board[squareIndex]
  }

  getAllPiecesByPlayer(player: Player): Array<Piece> {
    return this.playerToPieces[player]
  }

  isGameOver(): boolean {
    if(this.playerToKing[Player.PLAYER_1].healthPoints <= 0 || this.playerToKing[Player.PLAYER_2].healthPoints <= 0 || this.repetitionsDraw) {
      return true
    } else {
      return false
    }
  }

  winner(): Player | undefined {
    if(this.playerToKing[Player.PLAYER_1].healthPoints <= 0) {
      return Player.PLAYER_2
    } else if(this.playerToKing[Player.PLAYER_2].healthPoints <= 0) {
      return Player.PLAYER_1
    }
  }

  boardFromString(encodedBoard: string): void {
    this.currentPlayer = Number(encodedBoard.charAt(0)) as Player;
    this.moveNumber = 0;
    this.playerToKing[Player.PLAYER_1] = new Piece({type: PieceType.P1_KING, healthPoints: 0, squareIndex: 0});
    this.playerToKing[Player.PLAYER_2] = new Piece({type: PieceType.P2_KING, healthPoints: 0, squareIndex: 0});
    let p1Pieces = new Array<Piece>();
    let p2Pieces = new Array<Piece>();

    let b1: string = encodedBoard.substring(2);
    let ar1: string[] = b1.split(",")
    ar1.pop() // last element is an empty string
    let boardIdx = 0;
    ar1.forEach(item => {
      let ar2 = item.split("-")
      if(ar2[0] === "empty") {
        this.board[boardIdx] = new Piece({type: PieceType.NO_PIECE, healthPoints: 0, squareIndex: boardIdx})
      } else {
        let healthPoints = Number(ar2[2])
        let pieceType: string = ar2[0] + ar2[1]
        if(pieceType == "0king") {
          this.board[boardIdx] = new Piece({type: PieceType.P1_KING, healthPoints: healthPoints, squareIndex: boardIdx});
          p1Pieces.push(this.board[boardIdx]);
          this.playerToKing[Player.PLAYER_1] = this.board[boardIdx];
        } else if(pieceType == "0pawn") {
          this.board[boardIdx] = new Piece({type: PieceType.P1_PAWN, healthPoints: healthPoints, squareIndex: boardIdx});
          p1Pieces.push(this.board[boardIdx]);
        } else if(pieceType == "0mage") {
          this.board[boardIdx] = new Piece({type: PieceType.P1_MAGE, healthPoints: healthPoints, squareIndex: boardIdx});
          p1Pieces.push(this.board[boardIdx]);
        } else if(pieceType == "0assassin") {
          this.board[boardIdx] = new Piece({type: PieceType.P1_ASSASSIN, healthPoints: healthPoints, squareIndex: boardIdx});
          p1Pieces.push(this.board[boardIdx]);
        } else if(pieceType == "0knight") {
          this.board[boardIdx] = new Piece({type: PieceType.P1_KNIGHT, healthPoints: healthPoints, squareIndex: boardIdx});
          p1Pieces.push(this.board[boardIdx]);
        } else if(pieceType == "0warrior") {
          this.board[boardIdx] = new Piece({type: PieceType.P1_WARRIOR, healthPoints: healthPoints, squareIndex: boardIdx});
          p1Pieces.push(this.board[boardIdx]);
        } else if(pieceType == "1king") {
          this.board[boardIdx] = new Piece({type: PieceType.P2_KING, healthPoints: healthPoints, squareIndex: boardIdx});
          p2Pieces.push(this.board[boardIdx]);
          this.playerToKing[Player.PLAYER_2] = this.board[boardIdx];
        } else if(pieceType == "1pawn") {
          this.board[boardIdx] = new Piece({type: PieceType.P2_PAWN, healthPoints: healthPoints, squareIndex: boardIdx});
          p2Pieces.push(this.board[boardIdx]);
        } else if(pieceType == "1mage") {
          this.board[boardIdx] = new Piece({type: PieceType.P2_MAGE, healthPoints: healthPoints, squareIndex: boardIdx});
          p2Pieces.push(this.board[boardIdx]);
        } else if(pieceType == "1assassin") {
          this.board[boardIdx] = new Piece({type: PieceType.P2_ASSASSIN, healthPoints: healthPoints, squareIndex: boardIdx});
          p2Pieces.push(this.board[boardIdx]);
        } else if(pieceType == "1knight") {
          this.board[boardIdx] = new Piece({type: PieceType.P2_KNIGHT, healthPoints: healthPoints, squareIndex: boardIdx});
          p2Pieces.push(this.board[boardIdx]);
        } else if(pieceType == "1warrior") {
          this.board[boardIdx] = new Piece({type: PieceType.P2_WARRIOR, healthPoints: healthPoints, squareIndex: boardIdx});
          p2Pieces.push(this.board[boardIdx]);
        }
      }
      boardIdx += 1;
    })
    this.playerToPieces[Player.PLAYER_1] = p1Pieces;
    this.playerToPieces[Player.PLAYER_2] = p2Pieces;
  }

  boardToString(): string {
    let retval = "";
    retval += this.currentPlayer + "|";
    let currentPiece: Piece;
    for(let i = 0; i < constants.NUM_SQUARES; i++) {
      currentPiece = this.board[i];
      if(currentPiece.type == PieceType.NO_PIECE) {
        retval += "empty,";
      } else {
        switch(currentPiece.type) {
          case PieceType.P1_KING:
            retval += "0-king-";
            break;
          case PieceType.P1_MAGE:
            retval += "0-mage-";
            break;
          case PieceType.P1_PAWN:
            retval += "0-pawn-";
            break;
          case PieceType.P1_WARRIOR:
            retval += "0-warrior-";
            break;
          case PieceType.P1_ASSASSIN:
            retval += "0-assassin-";
            break;
          case PieceType.P1_KNIGHT:
            retval += "0-knight-";
            break;
          case PieceType.P2_KING:
            retval += "1-king-";
            break;
          case PieceType.P2_MAGE:
            retval += "1-mage-";
            break;
          case PieceType.P2_PAWN:
            retval += "1-pawn-";
            break;
          case PieceType.P2_WARRIOR:
            retval += "1-warrior-";
            break;
          case PieceType.P2_ASSASSIN:
            retval += "1-assassin-";
            break;
          case PieceType.P2_KNIGHT:
            retval += "1-knight-";
            break;
        }
        retval += currentPiece.healthPoints + ",";
      }
    }
    return retval;
  }

  board2D(): Array<Array<Piece>> {
    let retval = new Array<Array<Piece>>();
    let row = new Array<Piece>()
    for(let i = constants.NUM_ROWS-1; i >= 0; i--) {
      for(let j = 0; j < constants.NUM_COLUMNS; j++) {
        row.push(this.getPieceByCoordinates(j, i));
      }
      retval.push(row);
      row = [];
    }
    return retval;
  }

  getMoveNumber(): number {
    return this.moveNumber;
  }
}

export function coordinatesToBoardIndex(column: number, row: number): number {
  return column + row * constants.NUM_COLUMNS
}

export function perft(game: Game, depth: number): number {
  let nodes = 0
  let legalActions: Array<PlayerAction> = game.generateLegalActions()
  if(depth == 1) {
    return legalActions.length
  }
  let pa: PlayerAction
  let ui: UndoInfo
  for(let i = 0; i < legalActions.length; i++) {
    pa = legalActions[i]
    ui = game.makeAction(pa)
    nodes += perft(game, depth - 1)
    game.undoAction(ui)
  }
  return nodes
}

export function isActionValid(srcIdx: number, dstIdx: number): boolean {
  if(srcIdx === constants.ACTION_SKIP && dstIdx === constants.ACTION_SKIP) {
    return true;
  } else if((!isSquareIndexOffBoard(srcIdx)) && (!isSquareIndexOffBoard(dstIdx))) {
    return true;
  }
  return false;
}
