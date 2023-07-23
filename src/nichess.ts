import * as constants from './constants'
import { 
  pieceTypeToString, 
  generateLegalMovesOnAnEmptyBoard,
  generateLegalAbilitiesOnAnEmptyBoard,
  generateSquareToNeighboringSquares,
  player1OrEmpty,
  player2OrEmpty,
  isSquareIndexOffBoard,
  } from './util'

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
  public affectedPieces: Array<Piece>
  public moveSrcIdx: number
  public moveDstIdx: number
  public abilityType: AbilityType
  constructor() {
    this.affectedPieces = new Array<Piece>() 
  }
}

export class GameCache {
  public pieceTypeToSquareIndexToLegalMoves: Array<Array<Array<PlayerMove>>>
  public pieceTypeToSquareIndexToLegalAbilities: Array<Array<Array<PlayerAbility>>>
  public squareToNeighboringSquares: Array<Array<number>>
  constructor() {
    this.pieceTypeToSquareIndexToLegalMoves = generateLegalMovesOnAnEmptyBoard()
    this.pieceTypeToSquareIndexToLegalAbilities = generateLegalAbilitiesOnAnEmptyBoard()
    this.squareToNeighboringSquares = generateSquareToNeighboringSquares()
  }
}

export class Game {
  public board: Array<Piece> = new Array()
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
    this.board[coordinatesToBoardIndex(3,0)] = new Piece(PieceType.NO_PIECE, 0, coordinatesToBoardIndex(3,0));
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

  usefulLegalActions(): Array<PlayerAction> {
    let retval = new Array<PlayerAction>()
    // If King is dead, game is over and there are no legal actions
    if(this.playerToPieces[this.currentPlayer][constants.KING_PIECE_INDEX].healthPoints <= 0) {
      return retval;
    }
    for(let i = 0; i < constants.NUM_STARTING_PIECES; i++) {
      let currentPiece: Piece = this.playerToPieces[this.currentPlayer][i];
      if(currentPiece.healthPoints <= 0) continue; // dead pieces don't move

      let legalMoves: Array<PlayerMove> = this.gameCache.pieceTypeToSquareIndexToLegalMoves[currentPiece.type][currentPiece.squareIndex];
      for(let j = 0; j < legalMoves.length; j++) {
        let currentMove: PlayerMove = legalMoves[j];
        // Is p1 pawn trying to jump over another piece?
        if(currentPiece.type == PieceType.P1_PAWN &&
            currentPiece.squareIndex - currentMove.moveDstIdx == -2 * constants.NUM_COLUMNS 
            ) {
          // checks whether square in front of the p1 pawn is empty
          if(this.board[currentPiece.squareIndex + constants.NUM_COLUMNS].type != PieceType.NO_PIECE) continue;
        }
        // Is p2 pawn trying to jump over another piece?
        if(currentPiece.type == PieceType.P2_PAWN &&
            currentPiece.squareIndex - currentMove.moveDstIdx == 2 * constants.NUM_COLUMNS 
            ) {
          // checks whether square in front of the p2 pawn is empty
          if(this.board[currentPiece.squareIndex - constants.NUM_COLUMNS].type != PieceType.NO_PIECE) continue;
        }

        if(this.board[currentMove.moveDstIdx].type != PieceType.NO_PIECE) continue;
        this.makeMove(currentMove.moveSrcIdx, currentMove.moveDstIdx);
        for(let k = 0; k < constants.NUM_STARTING_PIECES; k++) {
          let cp2: Piece = this.playerToPieces[this.currentPlayer][k];
          if(cp2.healthPoints <= 0) continue; // no abilities for dead pieces
          let legalAbilities: Array<PlayerAbility> = this.gameCache.pieceTypeToSquareIndexToLegalAbilities[cp2.type][cp2.squareIndex];
          for(let l = 0; l < legalAbilities.length; l++) {
            let currentAbility: PlayerAbility = legalAbilities[l];
            let destinationSquarePiece: Piece = this.board[currentAbility.abilityDstIdx];
            // exclude useless abilities, e.g. warrior attacking empty square
            switch(cp2.type) {
              // king can only use abilities on enemy pieces
              case PieceType.P1_KING:
                switch(destinationSquarePiece.type) {
                  case PieceType.P1_KING:
                    continue;
                  case PieceType.P1_MAGE:
                    continue;
                  case PieceType.P1_PAWN:
                    continue;
                  case PieceType.P1_WARRIOR:
                    continue;
                  case PieceType.P1_ASSASSIN:
                    continue;
                  case PieceType.P2_KING:
                    break;
                  case PieceType.P2_MAGE:
                    break;
                  case PieceType.P2_PAWN:
                    break;
                  case PieceType.P2_WARRIOR:
                    break;
                  case PieceType.P2_ASSASSIN:
                    break;
                  case PieceType.NO_PIECE:
                    continue;
                  default:
                    break;
                }
              // mage can only use abilities on enemy pieces
              case PieceType.P1_MAGE:
                switch(destinationSquarePiece.type) {
                  case PieceType.P1_KING:
                    continue;
                  case PieceType.P1_MAGE:
                    continue;
                  case PieceType.P1_PAWN:
                    continue;
                  case PieceType.P1_WARRIOR:
                    continue;
                  case PieceType.P1_ASSASSIN:
                    continue;
                  case PieceType.P2_KING:
                    break;
                  case PieceType.P2_MAGE:
                    break;
                  case PieceType.P2_PAWN:
                    break;
                  case PieceType.P2_WARRIOR:
                    break;
                  case PieceType.P2_ASSASSIN:
                    break;
                  case PieceType.NO_PIECE:
                    continue;
                  default:
                    break;
                }
                break;
              // pawn can only use abilities on enemy pieces
              case PieceType.P1_PAWN:
                switch(destinationSquarePiece.type) {
                  case PieceType.P1_KING:
                    continue;
                  case PieceType.P1_MAGE:
                    continue;
                  case PieceType.P1_PAWN:
                    continue;
                  case PieceType.P1_WARRIOR:
                    continue;
                  case PieceType.P1_ASSASSIN:
                    continue;
                  case PieceType.P2_KING:
                    break;
                  case PieceType.P2_MAGE:
                    break;
                  case PieceType.P2_PAWN:
                    break;
                  case PieceType.P2_WARRIOR:
                    break;
                  case PieceType.P2_ASSASSIN:
                    break;
                  case PieceType.NO_PIECE:
                    continue;
                  default:
                    break;
                }
                break;
              // warrior can only use abilities on enemy pieces
              case PieceType.P1_WARRIOR:
                switch(destinationSquarePiece.type) {
                  case PieceType.P1_KING:
                    continue;
                  case PieceType.P1_MAGE:
                    continue;
                  case PieceType.P1_PAWN:
                    continue;
                  case PieceType.P1_WARRIOR:
                    continue;
                  case PieceType.P1_ASSASSIN:
                    continue;
                  case PieceType.P2_KING:
                    break;
                  case PieceType.P2_MAGE:
                    break;
                  case PieceType.P2_PAWN:
                    break;
                  case PieceType.P2_WARRIOR:
                    break;
                  case PieceType.P2_ASSASSIN:
                    break;
                  case PieceType.NO_PIECE:
                    continue;
                  default:
                    break;
                }
                break;
              // assassin can only use abilities on enemy pieces
              case PieceType.P1_ASSASSIN:
                switch(destinationSquarePiece.type) {
                  case PieceType.P1_KING:
                    continue;
                  case PieceType.P1_MAGE:
                    continue;
                  case PieceType.P1_PAWN:
                    continue;
                  case PieceType.P1_WARRIOR:
                    continue;
                  case PieceType.P1_ASSASSIN:
                    continue;
                  case PieceType.P2_KING:
                    break;
                  case PieceType.P2_MAGE:
                    break;
                  case PieceType.P2_PAWN:
                    break;
                  case PieceType.P2_WARRIOR:
                    break;
                  case PieceType.P2_ASSASSIN:
                    break;
                  case PieceType.NO_PIECE:
                    continue;
                  default:
                    break;
                }
                break;

              // king can only use abilities on enemy pieces
              case PieceType.P2_KING:
                switch(destinationSquarePiece.type) {
                  case PieceType.P1_KING:
                    break;
                  case PieceType.P1_MAGE:
                    break;
                  case PieceType.P1_PAWN:
                    break;
                  case PieceType.P1_WARRIOR:
                    break;
                  case PieceType.P1_ASSASSIN:
                    break;
                  case PieceType.P2_KING:
                    continue;
                  case PieceType.P2_MAGE:
                    continue;
                  case PieceType.P2_PAWN:
                    continue;
                  case PieceType.P2_WARRIOR:
                    continue;
                  case PieceType.P2_ASSASSIN:
                    continue;
                  case PieceType.NO_PIECE:
                    continue;
                  default:
                    break;
                }
              // mage can only use abilities on enemy pieces
              case PieceType.P2_MAGE:
                switch(destinationSquarePiece.type) {
                  case PieceType.P1_KING:
                    break;
                  case PieceType.P1_MAGE:
                    break;
                  case PieceType.P1_PAWN:
                    break;
                  case PieceType.P1_WARRIOR:
                    break;
                  case PieceType.P1_ASSASSIN:
                    break;
                  case PieceType.P2_KING:
                    continue;
                  case PieceType.P2_MAGE:
                    continue;
                  case PieceType.P2_PAWN:
                    continue;
                  case PieceType.P2_WARRIOR:
                    continue;
                  case PieceType.P2_ASSASSIN:
                    continue;
                  case PieceType.NO_PIECE:
                    continue;
                  default:
                    break;
                }
                break;
              // pawn can only use abilities on enemy pieces
              case PieceType.P2_PAWN:
                switch(destinationSquarePiece.type) {
                  case PieceType.P1_KING:
                    break;
                  case PieceType.P1_MAGE:
                    break;
                  case PieceType.P1_PAWN:
                    break;
                  case PieceType.P1_WARRIOR:
                    break;
                  case PieceType.P1_ASSASSIN:
                    break;
                  case PieceType.P2_KING:
                    continue;
                  case PieceType.P2_MAGE:
                    continue;
                  case PieceType.P2_PAWN:
                    continue;
                  case PieceType.P2_WARRIOR:
                    continue;
                  case PieceType.P2_ASSASSIN:
                    continue;
                  case PieceType.NO_PIECE:
                    continue;
                  default:
                    break;
                }
                break;
              // warrior can only use abilities on enemy pieces
              case PieceType.P2_WARRIOR:
                switch(destinationSquarePiece.type) {
                  case PieceType.P1_KING:
                    break;
                  case PieceType.P1_MAGE:
                    break;
                  case PieceType.P1_PAWN:
                    break;
                  case PieceType.P1_WARRIOR:
                    break;
                  case PieceType.P1_ASSASSIN:
                    break;
                  case PieceType.P2_KING:
                    continue;
                  case PieceType.P2_MAGE:
                    continue;
                  case PieceType.P2_PAWN:
                    continue;
                  case PieceType.P2_WARRIOR:
                    continue;
                  case PieceType.P2_ASSASSIN:
                    continue;
                  case PieceType.NO_PIECE:
                    continue;
                  default:
                    break;
                }
                break;
              // assassin can only use abilities on enemy pieces
              case PieceType.P2_ASSASSIN:
                switch(destinationSquarePiece.type) {
                  case PieceType.P1_KING:
                    break;
                  case PieceType.P1_MAGE:
                    break;
                  case PieceType.P1_PAWN:
                    break;
                  case PieceType.P1_WARRIOR:
                    break;
                  case PieceType.P1_ASSASSIN:
                    break;
                  case PieceType.P2_KING:
                    continue;
                  case PieceType.P2_MAGE:
                    continue;
                  case PieceType.P2_PAWN:
                    continue;
                  case PieceType.P2_WARRIOR:
                    continue;
                  case PieceType.P2_ASSASSIN:
                    continue;
                  case PieceType.NO_PIECE:
                    continue;
                  default:
                    break;
                }
                break;
              case PieceType.NO_PIECE:
                break;
              default:
                break;
            }
            let p = new PlayerAction(currentMove.moveSrcIdx, currentMove.moveDstIdx, currentAbility.abilitySrcIdx, currentAbility.abilityDstIdx);
            retval.push(p);
          }
        }
        // player can skip the ability
        let p = new PlayerAction(currentMove.moveSrcIdx, currentMove.moveDstIdx, constants.ABILITY_SKIP, constants.ABILITY_SKIP);
        retval.push(p);

        this.undoMove(currentMove.moveSrcIdx, currentMove.moveDstIdx);
      }
    }
    // player can skip the move
    for(let k = 0; k < constants.NUM_STARTING_PIECES; k++) {
      let cp2: Piece = this.playerToPieces[this.currentPlayer][k];
      if(cp2.healthPoints <= 0) continue; // no abilities for dead pieces
      let legalAbilities: Array<PlayerAbility> = this.gameCache.pieceTypeToSquareIndexToLegalAbilities[cp2.type][cp2.squareIndex];
      for(let l = 0; l < legalAbilities.length; l++) {
        let currentAbility: PlayerAbility = legalAbilities[l];
        let destinationSquarePiece: Piece = this.board[currentAbility.abilityDstIdx];
        // exclude useless abilities
        switch(cp2.type) {
          // king can only use abilities on enemy pieces
          case PieceType.P1_KING:
            switch(destinationSquarePiece.type) {
              case PieceType.P1_KING:
                continue;
              case PieceType.P1_MAGE:
                continue;
              case PieceType.P1_PAWN:
                continue;
              case PieceType.P1_WARRIOR:
                continue;
              case PieceType.P1_ASSASSIN:
                continue;
              case PieceType.P2_KING:
                break;
              case PieceType.P2_MAGE:
                break;
              case PieceType.P2_PAWN:
                break;
              case PieceType.P2_WARRIOR:
                break;
              case PieceType.P2_ASSASSIN:
                break;
              case PieceType.NO_PIECE:
                continue;
              default:
                break;
            }
          // mage can only use abilities on enemy pieces
          case PieceType.P1_MAGE:
            switch(destinationSquarePiece.type) {
              case PieceType.P1_KING:
                continue;
              case PieceType.P1_MAGE:
                continue;
              case PieceType.P1_PAWN:
                continue;
              case PieceType.P1_WARRIOR:
                continue;
              case PieceType.P1_ASSASSIN:
                continue;
              case PieceType.P2_KING:
                break;
              case PieceType.P2_MAGE:
                break;
              case PieceType.P2_PAWN:
                break;
              case PieceType.P2_WARRIOR:
                break;
              case PieceType.P2_ASSASSIN:
                break;
              case PieceType.NO_PIECE:
                continue;
              default:
                break;
            }
            break;
          // pawn can only use abilities on enemy pieces
          case PieceType.P1_PAWN:
            switch(destinationSquarePiece.type) {
              case PieceType.P1_KING:
                continue;
              case PieceType.P1_MAGE:
                continue;
              case PieceType.P1_PAWN:
                continue;
              case PieceType.P1_WARRIOR:
                continue;
              case PieceType.P1_ASSASSIN:
                continue;
              case PieceType.P2_KING:
                break;
              case PieceType.P2_MAGE:
                break;
              case PieceType.P2_PAWN:
                break;
              case PieceType.P2_WARRIOR:
                break;
              case PieceType.P2_ASSASSIN:
                break;
              case PieceType.NO_PIECE:
                continue;
              default:
                break;
            }
            break;
          // warrior can only use abilities on enemy pieces
          case PieceType.P1_WARRIOR:
            switch(destinationSquarePiece.type) {
              case PieceType.P1_KING:
                continue;
              case PieceType.P1_MAGE:
                continue;
              case PieceType.P1_PAWN:
                continue;
              case PieceType.P1_WARRIOR:
                continue;
              case PieceType.P1_ASSASSIN:
                continue;
              case PieceType.P2_KING:
                break;
              case PieceType.P2_MAGE:
                break;
              case PieceType.P2_PAWN:
                break;
              case PieceType.P2_WARRIOR:
                break;
              case PieceType.P2_ASSASSIN:
                break;
              case PieceType.NO_PIECE:
                continue;
              default:
                break;
            }
            break;
          // assassin can only use abilities on enemy pieces
          case PieceType.P1_ASSASSIN:
            switch(destinationSquarePiece.type) {
              case PieceType.P1_KING:
                continue;
              case PieceType.P1_MAGE:
                continue;
              case PieceType.P1_PAWN:
                continue;
              case PieceType.P1_WARRIOR:
                continue;
              case PieceType.P1_ASSASSIN:
                continue;
              case PieceType.P2_KING:
                break;
              case PieceType.P2_MAGE:
                break;
              case PieceType.P2_PAWN:
                break;
              case PieceType.P2_WARRIOR:
                break;
              case PieceType.P2_ASSASSIN:
                break;
              case PieceType.NO_PIECE:
                continue;
              default:
                break;
            }
            break;

          // king can only use abilities on enemy pieces
          case PieceType.P2_KING:
            switch(destinationSquarePiece.type) {
              case PieceType.P1_KING:
                break;
              case PieceType.P1_MAGE:
                break;
              case PieceType.P1_PAWN:
                break;
              case PieceType.P1_WARRIOR:
                break;
              case PieceType.P1_ASSASSIN:
                break;
              case PieceType.P2_KING:
                continue;
              case PieceType.P2_MAGE:
                continue;
              case PieceType.P2_PAWN:
                continue;
              case PieceType.P2_WARRIOR:
                continue;
              case PieceType.P2_ASSASSIN:
                continue;
              case PieceType.NO_PIECE:
                continue;
              default:
                break;
            }
          // mage can only use abilities on enemy pieces
          case PieceType.P2_MAGE:
            switch(destinationSquarePiece.type) {
              case PieceType.P1_KING:
                break;
              case PieceType.P1_MAGE:
                break;
              case PieceType.P1_PAWN:
                break;
              case PieceType.P1_WARRIOR:
                break;
              case PieceType.P1_ASSASSIN:
                break;
              case PieceType.P2_KING:
                continue;
              case PieceType.P2_MAGE:
                continue;
              case PieceType.P2_PAWN:
                continue;
              case PieceType.P2_WARRIOR:
                continue;
              case PieceType.P2_ASSASSIN:
                continue;
              case PieceType.NO_PIECE:
                continue;
              default:
                break;
            }
            break;
          // pawn can only use abilities on enemy pieces
          case PieceType.P2_PAWN:
            switch(destinationSquarePiece.type) {
              case PieceType.P1_KING:
                break;
              case PieceType.P1_MAGE:
                break;
              case PieceType.P1_PAWN:
                break;
              case PieceType.P1_WARRIOR:
                break;
              case PieceType.P1_ASSASSIN:
                break;
              case PieceType.P2_KING:
                continue;
              case PieceType.P2_MAGE:
                continue;
              case PieceType.P2_PAWN:
                continue;
              case PieceType.P2_WARRIOR:
                continue;
              case PieceType.P2_ASSASSIN:
                continue;
              case PieceType.NO_PIECE:
                continue;
              default:
                break;
            }
            break;
          // warrior can only use abilities on enemy pieces
          case PieceType.P2_WARRIOR:
            switch(destinationSquarePiece.type) {
              case PieceType.P1_KING:
                break;
              case PieceType.P1_MAGE:
                break;
              case PieceType.P1_PAWN:
                break;
              case PieceType.P1_WARRIOR:
                break;
              case PieceType.P1_ASSASSIN:
                break;
              case PieceType.P2_KING:
                continue;
              case PieceType.P2_MAGE:
                continue;
              case PieceType.P2_PAWN:
                continue;
              case PieceType.P2_WARRIOR:
                continue;
              case PieceType.P2_ASSASSIN:
                continue;
              case PieceType.NO_PIECE:
                continue;
              default:
                break;
            }
            break;
          // assassin can only use abilities on enemy pieces
          case PieceType.P2_ASSASSIN:
            switch(destinationSquarePiece.type) {
              case PieceType.P1_KING:
                break;
              case PieceType.P1_MAGE:
                break;
              case PieceType.P1_PAWN:
                break;
              case PieceType.P1_WARRIOR:
                break;
              case PieceType.P1_ASSASSIN:
                break;
              case PieceType.P2_KING:
                continue;
              case PieceType.P2_MAGE:
                continue;
              case PieceType.P2_PAWN:
                continue;
              case PieceType.P2_WARRIOR:
                continue;
              case PieceType.P2_ASSASSIN:
                continue;
              case PieceType.NO_PIECE:
                continue;
              default:
                break;
            }
            break;
          case PieceType.NO_PIECE:
            break;
          default:
            break;
        }

        let p = new PlayerAction(constants.MOVE_SKIP, constants.MOVE_SKIP, currentAbility.abilitySrcIdx, currentAbility.abilityDstIdx);
        retval.push(p);
      }
    }
    // player can skip both move and ability
    let p = new PlayerAction(constants.MOVE_SKIP, constants.MOVE_SKIP, constants.ABILITY_SKIP, constants.ABILITY_SKIP);
    retval.push(p);
    return retval;
  }

  allLegalActions(): Array<PlayerAction> {
    let retval = new Array<PlayerAction>()
    // If King is dead, game is over and there are no legal actions
    if(this.playerToPieces[this.currentPlayer][constants.KING_PIECE_INDEX].healthPoints <= 0) {
      return retval;
    }
    for(let i = 0; i < constants.NUM_STARTING_PIECES; i++) {
      let currentPiece: Piece = this.playerToPieces[this.currentPlayer][i];
      if(currentPiece.healthPoints <= 0) continue; // dead pieces don't move

      let legalMoves: Array<PlayerMove> = this.gameCache.pieceTypeToSquareIndexToLegalMoves[currentPiece.type][currentPiece.squareIndex];
      for(let j = 0; j < legalMoves.length; j++) {
        let currentMove: PlayerMove = legalMoves[j];
        // Is p1 pawn trying to jump over another piece?
        if(currentPiece.type == PieceType.P1_PAWN &&
            currentPiece.squareIndex - currentMove.moveDstIdx == -2 * constants.NUM_COLUMNS 
            ) {
          // checks whether square in front of the p1 pawn is empty
          if(this.board[currentPiece.squareIndex + constants.NUM_COLUMNS].type != PieceType.NO_PIECE) continue;
        }
        // Is p2 pawn trying to jump over another piece?
        if(currentPiece.type == PieceType.P2_PAWN &&
            currentPiece.squareIndex - currentMove.moveDstIdx == 2 * constants.NUM_COLUMNS 
            ) {
          // checks whether square in front of the p2 pawn is empty
          if(this.board[currentPiece.squareIndex - constants.NUM_COLUMNS].type != PieceType.NO_PIECE) continue;
        }

        if(this.board[currentMove.moveDstIdx].type != PieceType.NO_PIECE) continue;
        this.makeMove(currentMove.moveSrcIdx, currentMove.moveDstIdx);
        for(let k = 0; k < constants.NUM_STARTING_PIECES; k++) {
          let cp2: Piece = this.playerToPieces[this.currentPlayer][k];
          if(cp2.healthPoints <= 0) continue; // no abilities for dead pieces
          let legalAbilities: Array<PlayerAbility> = this.gameCache.pieceTypeToSquareIndexToLegalAbilities[cp2.type][cp2.squareIndex];
          for(let l = 0; l < legalAbilities.length; l++) {
            let currentAbility: PlayerAbility = legalAbilities[l];
            let destinationSquarePiece: Piece = this.board[currentAbility.abilityDstIdx];
            switch(cp2.type) {
              // king can use abilities on enemy pieces and empty squares
              case PieceType.P1_KING:
                switch(destinationSquarePiece.type) {
                  case PieceType.P1_KING:
                    continue;
                  case PieceType.P1_MAGE:
                    continue;
                  case PieceType.P1_PAWN:
                    continue;
                  case PieceType.P1_WARRIOR:
                    continue;
                  case PieceType.P1_ASSASSIN:
                    continue;
                  case PieceType.P2_KING:
                    break;
                  case PieceType.P2_MAGE:
                    break;
                  case PieceType.P2_PAWN:
                    break;
                  case PieceType.P2_WARRIOR:
                    break;
                  case PieceType.P2_ASSASSIN:
                    break;
                  case PieceType.NO_PIECE:
                    break;
                  default:
                    break;
                }
              // mage can use abilities on enemy pieces and empty squares
              case PieceType.P1_MAGE:
                switch(destinationSquarePiece.type) {
                  case PieceType.P1_KING:
                    continue;
                  case PieceType.P1_MAGE:
                    continue;
                  case PieceType.P1_PAWN:
                    continue;
                  case PieceType.P1_WARRIOR:
                    continue;
                  case PieceType.P1_ASSASSIN:
                    continue;
                  case PieceType.P2_KING:
                    break;
                  case PieceType.P2_MAGE:
                    break;
                  case PieceType.P2_PAWN:
                    break;
                  case PieceType.P2_WARRIOR:
                    break;
                  case PieceType.P2_ASSASSIN:
                    break;
                  case PieceType.NO_PIECE:
                    break;
                  default:
                    break;
                }
                break;
              // pawn can use abilities on enemy pieces and empty squares
              case PieceType.P1_PAWN:
                switch(destinationSquarePiece.type) {
                  case PieceType.P1_KING:
                    continue;
                  case PieceType.P1_MAGE:
                    continue;
                  case PieceType.P1_PAWN:
                    continue;
                  case PieceType.P1_WARRIOR:
                    continue;
                  case PieceType.P1_ASSASSIN:
                    continue;
                  case PieceType.P2_KING:
                    break;
                  case PieceType.P2_MAGE:
                    break;
                  case PieceType.P2_PAWN:
                    break;
                  case PieceType.P2_WARRIOR:
                    break;
                  case PieceType.P2_ASSASSIN:
                    break;
                  case PieceType.NO_PIECE:
                    break;
                  default:
                    break;
                }
                break;
              // warrior can use abilities on enemy pieces and empty squares
              case PieceType.P1_WARRIOR:
                switch(destinationSquarePiece.type) {
                  case PieceType.P1_KING:
                    continue;
                  case PieceType.P1_MAGE:
                    continue;
                  case PieceType.P1_PAWN:
                    continue;
                  case PieceType.P1_WARRIOR:
                    continue;
                  case PieceType.P1_ASSASSIN:
                    continue;
                  case PieceType.P2_KING:
                    break;
                  case PieceType.P2_MAGE:
                    break;
                  case PieceType.P2_PAWN:
                    break;
                  case PieceType.P2_WARRIOR:
                    break;
                  case PieceType.P2_ASSASSIN:
                    break;
                  case PieceType.NO_PIECE:
                    break;
                  default:
                    break;
                }
                break;
              // assassin can use abilities on enemy pieces and empty squares
              case PieceType.P1_ASSASSIN:
                switch(destinationSquarePiece.type) {
                  case PieceType.P1_KING:
                    continue;
                  case PieceType.P1_MAGE:
                    continue;
                  case PieceType.P1_PAWN:
                    continue;
                  case PieceType.P1_WARRIOR:
                    continue;
                  case PieceType.P1_ASSASSIN:
                    continue;
                  case PieceType.P2_KING:
                    break;
                  case PieceType.P2_MAGE:
                    break;
                  case PieceType.P2_PAWN:
                    break;
                  case PieceType.P2_WARRIOR:
                    break;
                  case PieceType.P2_ASSASSIN:
                    break;
                  case PieceType.NO_PIECE:
                    break;
                  default:
                    break;
                }
                break;

              // king can use abilities on enemy pieces and empty squares
              case PieceType.P2_KING:
                switch(destinationSquarePiece.type) {
                  case PieceType.P1_KING:
                    break;
                  case PieceType.P1_MAGE:
                    break;
                  case PieceType.P1_PAWN:
                    break;
                  case PieceType.P1_WARRIOR:
                    break;
                  case PieceType.P1_ASSASSIN:
                    break;
                  case PieceType.P2_KING:
                    continue;
                  case PieceType.P2_MAGE:
                    continue;
                  case PieceType.P2_PAWN:
                    continue;
                  case PieceType.P2_WARRIOR:
                    continue;
                  case PieceType.P2_ASSASSIN:
                    continue;
                  case PieceType.NO_PIECE:
                    break;
                  default:
                    break;
                }
              // mage can use abilities on enemy pieces and empty squares
              case PieceType.P2_MAGE:
                switch(destinationSquarePiece.type) {
                  case PieceType.P1_KING:
                    break;
                  case PieceType.P1_MAGE:
                    break;
                  case PieceType.P1_PAWN:
                    break;
                  case PieceType.P1_WARRIOR:
                    break;
                  case PieceType.P1_ASSASSIN:
                    break;
                  case PieceType.P2_KING:
                    continue;
                  case PieceType.P2_MAGE:
                    continue;
                  case PieceType.P2_PAWN:
                    continue;
                  case PieceType.P2_WARRIOR:
                    continue;
                  case PieceType.P2_ASSASSIN:
                    continue;
                  case PieceType.NO_PIECE:
                    break;
                  default:
                    break;
                }
                break;
              // pawn can use abilities on enemy pieces and empty squares
              case PieceType.P2_PAWN:
                switch(destinationSquarePiece.type) {
                  case PieceType.P1_KING:
                    break;
                  case PieceType.P1_MAGE:
                    break;
                  case PieceType.P1_PAWN:
                    break;
                  case PieceType.P1_WARRIOR:
                    break;
                  case PieceType.P1_ASSASSIN:
                    break;
                  case PieceType.P2_KING:
                    continue;
                  case PieceType.P2_MAGE:
                    continue;
                  case PieceType.P2_PAWN:
                    continue;
                  case PieceType.P2_WARRIOR:
                    continue;
                  case PieceType.P2_ASSASSIN:
                    continue;
                  case PieceType.NO_PIECE:
                    break;
                  default:
                    break;
                }
                break;
              // warrior can use abilities on enemy pieces and empty squares
              case PieceType.P2_WARRIOR:
                switch(destinationSquarePiece.type) {
                  case PieceType.P1_KING:
                    break;
                  case PieceType.P1_MAGE:
                    break;
                  case PieceType.P1_PAWN:
                    break;
                  case PieceType.P1_WARRIOR:
                    break;
                  case PieceType.P1_ASSASSIN:
                    break;
                  case PieceType.P2_KING:
                    continue;
                  case PieceType.P2_MAGE:
                    continue;
                  case PieceType.P2_PAWN:
                    continue;
                  case PieceType.P2_WARRIOR:
                    continue;
                  case PieceType.P2_ASSASSIN:
                    continue;
                  case PieceType.NO_PIECE:
                    continue;
                  default:
                    break;
                }
                break;
              // assassin can only use abilities on enemy pieces
              case PieceType.P2_ASSASSIN:
                switch(destinationSquarePiece.type) {
                  case PieceType.P1_KING:
                    break;
                  case PieceType.P1_MAGE:
                    break;
                  case PieceType.P1_PAWN:
                    break;
                  case PieceType.P1_WARRIOR:
                    break;
                  case PieceType.P1_ASSASSIN:
                    break;
                  case PieceType.P2_KING:
                    continue;
                  case PieceType.P2_MAGE:
                    continue;
                  case PieceType.P2_PAWN:
                    continue;
                  case PieceType.P2_WARRIOR:
                    continue;
                  case PieceType.P2_ASSASSIN:
                    continue;
                  case PieceType.NO_PIECE:
                    break;
                  default:
                    break;
                }
                break;
              case PieceType.NO_PIECE:
                break;
              default:
                break;
            }
            let p = new PlayerAction(currentMove.moveSrcIdx, currentMove.moveDstIdx, currentAbility.abilitySrcIdx, currentAbility.abilityDstIdx);
            retval.push(p);
          }
        }
        // player can skip the ability
        let p = new PlayerAction(currentMove.moveSrcIdx, currentMove.moveDstIdx, constants.ABILITY_SKIP, constants.ABILITY_SKIP);
        retval.push(p);

        this.undoMove(currentMove.moveSrcIdx, currentMove.moveDstIdx);
      }
    }
    // player can skip the move
    for(let k = 0; k < constants.NUM_STARTING_PIECES; k++) {
      let cp2: Piece = this.playerToPieces[this.currentPlayer][k];
      if(cp2.healthPoints <= 0) continue; // no abilities for dead pieces
      let legalAbilities: Array<PlayerAbility> = this.gameCache.pieceTypeToSquareIndexToLegalAbilities[cp2.type][cp2.squareIndex];
      for(let l = 0; l < legalAbilities.length; l++) {
        let currentAbility: PlayerAbility = legalAbilities[l];
        let destinationSquarePiece: Piece = this.board[currentAbility.abilityDstIdx];
        // exclude useless abilities
        switch(cp2.type) {
          // king can use abilities on enemy pieces and empty squares
          case PieceType.P1_KING:
            switch(destinationSquarePiece.type) {
              case PieceType.P1_KING:
                continue;
              case PieceType.P1_MAGE:
                continue;
              case PieceType.P1_PAWN:
                continue;
              case PieceType.P1_WARRIOR:
                continue;
              case PieceType.P1_ASSASSIN:
                continue;
              case PieceType.P2_KING:
                break;
              case PieceType.P2_MAGE:
                break;
              case PieceType.P2_PAWN:
                break;
              case PieceType.P2_WARRIOR:
                break;
              case PieceType.P2_ASSASSIN:
                break;
              case PieceType.NO_PIECE:
                break;
              default:
                break;
            }
          // mage can use abilities on enemy pieces and empty squares
          case PieceType.P1_MAGE:
            switch(destinationSquarePiece.type) {
              case PieceType.P1_KING:
                continue;
              case PieceType.P1_MAGE:
                continue;
              case PieceType.P1_PAWN:
                continue;
              case PieceType.P1_WARRIOR:
                continue;
              case PieceType.P1_ASSASSIN:
                continue;
              case PieceType.P2_KING:
                break;
              case PieceType.P2_MAGE:
                break;
              case PieceType.P2_PAWN:
                break;
              case PieceType.P2_WARRIOR:
                break;
              case PieceType.P2_ASSASSIN:
                break;
              case PieceType.NO_PIECE:
                break;
              default:
                break;
            }
            break;
          // pawn can use abilities on enemy pieces and empty squares
          case PieceType.P1_PAWN:
            switch(destinationSquarePiece.type) {
              case PieceType.P1_KING:
                continue;
              case PieceType.P1_MAGE:
                continue;
              case PieceType.P1_PAWN:
                continue;
              case PieceType.P1_WARRIOR:
                continue;
              case PieceType.P1_ASSASSIN:
                continue;
              case PieceType.P2_KING:
                break;
              case PieceType.P2_MAGE:
                break;
              case PieceType.P2_PAWN:
                break;
              case PieceType.P2_WARRIOR:
                break;
              case PieceType.P2_ASSASSIN:
                break;
              case PieceType.NO_PIECE:
                break;
              default:
                break;
            }
            break;
          // warrior can use abilities on enemy pieces and empty squares
          case PieceType.P1_WARRIOR:
            switch(destinationSquarePiece.type) {
              case PieceType.P1_KING:
                continue;
              case PieceType.P1_MAGE:
                continue;
              case PieceType.P1_PAWN:
                continue;
              case PieceType.P1_WARRIOR:
                continue;
              case PieceType.P1_ASSASSIN:
                continue;
              case PieceType.P2_KING:
                break;
              case PieceType.P2_MAGE:
                break;
              case PieceType.P2_PAWN:
                break;
              case PieceType.P2_WARRIOR:
                break;
              case PieceType.P2_ASSASSIN:
                break;
              case PieceType.NO_PIECE:
                break;
              default:
                break;
            }
            break;
          // assassin can use abilities on enemy pieces and empty squares
          case PieceType.P1_ASSASSIN:
            switch(destinationSquarePiece.type) {
              case PieceType.P1_KING:
                continue;
              case PieceType.P1_MAGE:
                continue;
              case PieceType.P1_PAWN:
                continue;
              case PieceType.P1_WARRIOR:
                continue;
              case PieceType.P1_ASSASSIN:
                continue;
              case PieceType.P2_KING:
                break;
              case PieceType.P2_MAGE:
                break;
              case PieceType.P2_PAWN:
                break;
              case PieceType.P2_WARRIOR:
                break;
              case PieceType.P2_ASSASSIN:
                break;
              case PieceType.NO_PIECE:
                break;
              default:
                break;
            }
            break;

          // king can use abilities on enemy pieces and empty squares
          case PieceType.P2_KING:
            switch(destinationSquarePiece.type) {
              case PieceType.P1_KING:
                break;
              case PieceType.P1_MAGE:
                break;
              case PieceType.P1_PAWN:
                break;
              case PieceType.P1_WARRIOR:
                break;
              case PieceType.P1_ASSASSIN:
                break;
              case PieceType.P2_KING:
                continue;
              case PieceType.P2_MAGE:
                continue;
              case PieceType.P2_PAWN:
                continue;
              case PieceType.P2_WARRIOR:
                continue;
              case PieceType.P2_ASSASSIN:
                continue;
              case PieceType.NO_PIECE:
                break;
              default:
                break;
            }
          // mage can use abilities on enemy pieces and empty squares
          case PieceType.P2_MAGE:
            switch(destinationSquarePiece.type) {
              case PieceType.P1_KING:
                break;
              case PieceType.P1_MAGE:
                break;
              case PieceType.P1_PAWN:
                break;
              case PieceType.P1_WARRIOR:
                break;
              case PieceType.P1_ASSASSIN:
                break;
              case PieceType.P2_KING:
                continue;
              case PieceType.P2_MAGE:
                continue;
              case PieceType.P2_PAWN:
                continue;
              case PieceType.P2_WARRIOR:
                continue;
              case PieceType.P2_ASSASSIN:
                continue;
              case PieceType.NO_PIECE:
                break;
              default:
                break;
            }
            break;
          // pawn can use abilities on enemy pieces and empty squares
          case PieceType.P2_PAWN:
            switch(destinationSquarePiece.type) {
              case PieceType.P1_KING:
                break;
              case PieceType.P1_MAGE:
                break;
              case PieceType.P1_PAWN:
                break;
              case PieceType.P1_WARRIOR:
                break;
              case PieceType.P1_ASSASSIN:
                break;
              case PieceType.P2_KING:
                continue;
              case PieceType.P2_MAGE:
                continue;
              case PieceType.P2_PAWN:
                continue;
              case PieceType.P2_WARRIOR:
                continue;
              case PieceType.P2_ASSASSIN:
                continue;
              case PieceType.NO_PIECE:
                break;
              default:
                break;
            }
            break;
          // warrior can use abilities on enemy pieces and empty squares
          case PieceType.P2_WARRIOR:
            switch(destinationSquarePiece.type) {
              case PieceType.P1_KING:
                break;
              case PieceType.P1_MAGE:
                break;
              case PieceType.P1_PAWN:
                break;
              case PieceType.P1_WARRIOR:
                break;
              case PieceType.P1_ASSASSIN:
                break;
              case PieceType.P2_KING:
                continue;
              case PieceType.P2_MAGE:
                continue;
              case PieceType.P2_PAWN:
                continue;
              case PieceType.P2_WARRIOR:
                continue;
              case PieceType.P2_ASSASSIN:
                continue;
              case PieceType.NO_PIECE:
                break;
              default:
                break;
            }
            break;
          // assassin can use abilities on enemy pieces and empty squares
          case PieceType.P2_ASSASSIN:
            switch(destinationSquarePiece.type) {
              case PieceType.P1_KING:
                break;
              case PieceType.P1_MAGE:
                break;
              case PieceType.P1_PAWN:
                break;
              case PieceType.P1_WARRIOR:
                break;
              case PieceType.P1_ASSASSIN:
                break;
              case PieceType.P2_KING:
                continue;
              case PieceType.P2_MAGE:
                continue;
              case PieceType.P2_PAWN:
                continue;
              case PieceType.P2_WARRIOR:
                continue;
              case PieceType.P2_ASSASSIN:
                continue;
              case PieceType.NO_PIECE:
                break;
              default:
                break;
            }
            break;
          case PieceType.NO_PIECE:
            break;
          default:
            break;
        }

        let p = new PlayerAction(constants.MOVE_SKIP, constants.MOVE_SKIP, currentAbility.abilitySrcIdx, currentAbility.abilityDstIdx);
        retval.push(p);
      }
    }
    // player can skip both move and ability
    let p = new PlayerAction(constants.MOVE_SKIP, constants.MOVE_SKIP, constants.ABILITY_SKIP, constants.ABILITY_SKIP);
    retval.push(p);
    return retval;
  }
  
/*
 * Assumes that the move and ability are legal.
 * If the ability is not useful (i.e. does not alter the game state), it's converted to
 * AbilityType.NO_ABILITY.
 * Checking whether ability is useful makes the function ~1.5% slower.
 */
  makeAction(moveSrcIdx: number, moveDstIdx: number, abilitySrcIdx: number, abilityDstIdx: number): UndoInfo {
    let undoInfo = new UndoInfo();
    undoInfo.moveSrcIdx = moveSrcIdx;
    undoInfo.moveDstIdx = moveDstIdx;
    if(moveSrcIdx != constants.MOVE_SKIP) {
      this.makeMove(moveSrcIdx, moveDstIdx);
    }
    if(abilitySrcIdx != constants.ABILITY_SKIP) {
      let abilitySrcPiece: Piece = this.board[abilitySrcIdx];
      let abilityDstPiece: Piece = this.board[abilityDstIdx];
      let neighboringPiece: Piece;
      let neighboringSquare: number;
      switch(abilitySrcPiece.type) {
        // king does single target damage
        case PieceType.P1_KING:
          if(player1OrEmpty(abilityDstPiece.type)) {
            undoInfo.abilityType = AbilityType.NO_ABILITY;
            break;
          }
          abilityDstPiece.healthPoints -= constants.KING_ABILITY_POINTS;
          undoInfo.abilityType = AbilityType.KING_DAMAGE;
          undoInfo.affectedPieces.push(abilityDstPiece);
          if(abilityDstPiece.healthPoints <= 0) {
            this.board[abilityDstIdx] = new Piece(PieceType.NO_PIECE, 0, abilityDstIdx);
          }
          break;
        // mage damages attacked piece and all enemy pieces that are touching it
        case PieceType.P1_MAGE:
          if(player1OrEmpty(abilityDstPiece.type)) {
            undoInfo.abilityType = AbilityType.NO_ABILITY;
            break;
          }
          abilityDstPiece.healthPoints -= constants.MAGE_ABILITY_POINTS;
          undoInfo.abilityType = AbilityType.MAGE_DAMAGE;
          undoInfo.affectedPieces.push(abilityDstPiece);
          if(abilityDstPiece.healthPoints <= 0) {
            this.board[abilityDstIdx] = new Piece(PieceType.NO_PIECE, 0, abilityDstIdx);
          }
          for(let i = 0; i < this.gameCache.squareToNeighboringSquares[abilityDstIdx].length; i++) {
            neighboringSquare = this.gameCache.squareToNeighboringSquares[abilityDstIdx][i];
            neighboringPiece = this.board[neighboringSquare];
            if(player1OrEmpty(neighboringPiece.type)) continue;  // don't damage your own pieces
            neighboringPiece.healthPoints -= constants.MAGE_ABILITY_POINTS;
            undoInfo.affectedPieces.push(neighboringPiece);
            if(neighboringPiece.healthPoints <= 0) {
              this.board[neighboringSquare] = new Piece(PieceType.NO_PIECE, 0, neighboringSquare);
            }
          }
          break;
        case PieceType.P1_PAWN:
          if(player1OrEmpty(abilityDstPiece.type)) {
            undoInfo.abilityType = AbilityType.NO_ABILITY;
            break;
          }
          abilityDstPiece.healthPoints -= constants.PAWN_ABILITY_POINTS;
          undoInfo.abilityType = AbilityType.PAWN_DAMAGE;
          undoInfo.affectedPieces.push(abilityDstPiece);
          if(abilityDstPiece.healthPoints <= 0) {
            this.board[abilityDstIdx] = new Piece(PieceType.NO_PIECE, 0, abilityDstIdx);
          }
          break;
        case PieceType.P1_WARRIOR:
          if(player1OrEmpty(abilityDstPiece.type)) {
            undoInfo.abilityType = AbilityType.NO_ABILITY;
            break;
          }
          abilityDstPiece.healthPoints -= constants.WARRIOR_ABILITY_POINTS;
          undoInfo.abilityType = AbilityType.WARRIOR_DAMAGE;
          undoInfo.affectedPieces.push(abilityDstPiece);
          if(abilityDstPiece.healthPoints <= 0) {
            this.board[abilityDstIdx] = new Piece(PieceType.NO_PIECE, 0, abilityDstIdx);
          }
          break;
        case PieceType.P1_ASSASSIN:
          if(player1OrEmpty(abilityDstPiece.type)) {
            undoInfo.abilityType = AbilityType.NO_ABILITY;
            break;
          }
          abilityDstPiece.healthPoints -= constants.ASSASSIN_ABILITY_POINTS;
          undoInfo.abilityType = AbilityType.ASSASSIN_DAMAGE;
          undoInfo.affectedPieces[0] = abilityDstPiece;
          if(abilityDstPiece.healthPoints <= 0) {
            this.board[abilityDstIdx] = new Piece(PieceType.NO_PIECE, 0, abilityDstIdx);
          }
          break;
        case PieceType.P2_KING:
          if(player2OrEmpty(abilityDstPiece.type)) {
            undoInfo.abilityType = AbilityType.NO_ABILITY;
            break;
          }
          abilityDstPiece.healthPoints -= constants.KING_ABILITY_POINTS;
          undoInfo.abilityType = AbilityType.KING_DAMAGE;
          undoInfo.affectedPieces.push(abilityDstPiece);
          if(abilityDstPiece.healthPoints <= 0) {
            this.board[abilityDstIdx] = new Piece(PieceType.NO_PIECE, 0, abilityDstIdx);
          }
          break;
        case PieceType.P2_MAGE:
          if(player2OrEmpty(abilityDstPiece.type)) {
            undoInfo.abilityType = AbilityType.NO_ABILITY;
            break;
          }
          abilityDstPiece.healthPoints -= constants.MAGE_ABILITY_POINTS;
          undoInfo.abilityType = AbilityType.MAGE_DAMAGE;
          undoInfo.affectedPieces.push(abilityDstPiece);
          if(abilityDstPiece.healthPoints <= 0) {
            this.board[abilityDstIdx] = new Piece(PieceType.NO_PIECE, 0, abilityDstIdx);
          }
          for(let i = 0; i < this.gameCache.squareToNeighboringSquares[abilityDstIdx].length; i++) {
            neighboringSquare = this.gameCache.squareToNeighboringSquares[abilityDstIdx][i];
            neighboringPiece = this.board[neighboringSquare];
            if(player2OrEmpty(neighboringPiece.type)) continue;  // don't damage your own pieces
            neighboringPiece.healthPoints -= constants.MAGE_ABILITY_POINTS;
            // i+1 because 0 is for abilityDstPiece
            undoInfo.affectedPieces.push(neighboringPiece);
            if(neighboringPiece.healthPoints <= 0) {
              this.board[neighboringSquare] = new Piece(PieceType.NO_PIECE, 0, neighboringSquare);
            }
          }
          break;
        case PieceType.P2_PAWN:
          if(player2OrEmpty(abilityDstPiece.type)) {
            undoInfo.abilityType = AbilityType.NO_ABILITY;
            break;
          }
          abilityDstPiece.healthPoints -= constants.PAWN_ABILITY_POINTS;
          undoInfo.abilityType = AbilityType.PAWN_DAMAGE;
          undoInfo.affectedPieces.push(abilityDstPiece);
          if(abilityDstPiece.healthPoints <= 0) {
            this.board[abilityDstIdx] = new Piece(PieceType.NO_PIECE, 0, abilityDstIdx);
          }
          break;
        case PieceType.P2_WARRIOR:
          if(player2OrEmpty(abilityDstPiece.type)) {
            undoInfo.abilityType = AbilityType.NO_ABILITY;
            break;
          }
          abilityDstPiece.healthPoints -= constants.WARRIOR_ABILITY_POINTS;
          undoInfo.abilityType = AbilityType.WARRIOR_DAMAGE;
          undoInfo.affectedPieces.push(abilityDstPiece);
          if(abilityDstPiece.healthPoints <= 0) {
            this.board[abilityDstIdx] = new Piece(PieceType.NO_PIECE, 0, abilityDstIdx);
          }
          break;
        case PieceType.P2_ASSASSIN:
          if(player2OrEmpty(abilityDstPiece.type)) {
            undoInfo.abilityType = AbilityType.NO_ABILITY;
            break;
          }
          abilityDstPiece.healthPoints -= constants.ASSASSIN_ABILITY_POINTS;
          undoInfo.abilityType = AbilityType.ASSASSIN_DAMAGE;
          undoInfo.affectedPieces.push(abilityDstPiece);
          if(abilityDstPiece.healthPoints <= 0) {
            this.board[abilityDstIdx] = new Piece(PieceType.NO_PIECE, 0, abilityDstIdx);
          }
          break;
      }
    } else {
      undoInfo.abilityType = AbilityType.NO_ABILITY;
    } 
    this.moveNumber += 1;
    this.currentPlayer = 1 - this.currentPlayer;
    return undoInfo;
  }

  undoAction(undoInfo: UndoInfo): void {
    // undo ability
    let affectedPiece: Piece;
    switch(undoInfo.abilityType) {
      case AbilityType.KING_DAMAGE:
        affectedPiece = undoInfo.affectedPieces[0];
        affectedPiece.healthPoints += constants.KING_ABILITY_POINTS;
        if(this.board[affectedPiece.squareIndex].type == PieceType.NO_PIECE) {
          this.board[affectedPiece.squareIndex] = affectedPiece;
        }
        break;
      case AbilityType.MAGE_DAMAGE:
        for(let i = 0; i < undoInfo.affectedPieces.length; i++){
          affectedPiece = undoInfo.affectedPieces[i];
          affectedPiece.healthPoints += constants.MAGE_ABILITY_POINTS;
          if(this.board[affectedPiece.squareIndex].type == PieceType.NO_PIECE) {
            this.board[affectedPiece.squareIndex] = affectedPiece;
          }
        }
        break;
      case AbilityType.WARRIOR_DAMAGE:
        affectedPiece = undoInfo.affectedPieces[0];
        affectedPiece.healthPoints += constants.WARRIOR_ABILITY_POINTS;
        if(this.board[affectedPiece.squareIndex].type == PieceType.NO_PIECE) {
          this.board[affectedPiece.squareIndex] = affectedPiece;
        }
        break;
      case AbilityType.ASSASSIN_DAMAGE:
        affectedPiece = undoInfo.affectedPieces[0];
        affectedPiece.healthPoints += constants.ASSASSIN_ABILITY_POINTS;
        if(this.board[affectedPiece.squareIndex].type == PieceType.NO_PIECE) {
          this.board[affectedPiece.squareIndex] = affectedPiece;
        }
        break;
      case AbilityType.PAWN_DAMAGE:
        affectedPiece = undoInfo.affectedPieces[0];
        affectedPiece.healthPoints += constants.PAWN_ABILITY_POINTS;
        if(this.board[affectedPiece.squareIndex].type == PieceType.NO_PIECE) {
          this.board[affectedPiece.squareIndex] = affectedPiece;
        }
        break;
      case AbilityType.NO_ABILITY:
        break;
      default:
        break;
    }
    // undo move
    if(undoInfo.moveSrcIdx != constants.MOVE_SKIP) {
      this.undoMove(undoInfo.moveSrcIdx, undoInfo.moveDstIdx);
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
  
  isActionLegal(moveSrcIdx: number, moveDstIdx: number, abilitySrcIdx: number, abilityDstIdx: number): boolean {
    // It's important for this method to not have many exit points because it's altering the game
    // state. If a return statement is between makeMove and undoMove, game state will remain changed
    // which shouldn't happen in a method that checks action legality.
    let validInput: boolean = isActionValid(moveSrcIdx, moveDstIdx, abilitySrcIdx, abilityDstIdx);
    if(!validInput) return false;

    let moveLegal = false;
    let abilityLegal = false;
    let movePieceBelongsToCurrentPlayerOrMoveSkip = false;
    let abilityPieceBelongsToCurrentPlayerOrAbilitySkip = false;
    let movePieceIsAliveOrMoveSkip = false;
    let abilityPieceIsAliveOrAbilitySkip = false;
    let abilityDstPieceBelongsToCurrentPlayer = false; // are you trying to attack your own piece?
    let currentPlayersKingIsAlive = false;
    let movePiece: Piece;
    let abilityPiece: Piece;
    let abilityDstPiece: Piece;

    if(moveSrcIdx == constants.MOVE_SKIP && moveDstIdx == constants.MOVE_SKIP) {
      moveLegal = true;
      movePieceBelongsToCurrentPlayerOrMoveSkip = true;
      movePieceIsAliveOrMoveSkip = true;
    } else {
      movePiece = this.board[moveSrcIdx];
      if(pieceBelongsToPlayer(movePiece.type, this.currentPlayer)) {
        movePieceBelongsToCurrentPlayerOrMoveSkip = true;
      }
      if(movePiece.healthPoints > 0) {
        movePieceIsAliveOrMoveSkip = true;
      }
      let legalMovesOnEmptyBoard: Array<PlayerMove> = this.gameCache.pieceTypeToSquareIndexToLegalMoves[movePiece.type][movePiece.squareIndex];
      for(let i = 0; i < legalMovesOnEmptyBoard.length; i++) {
        let currentMove: PlayerMove = legalMovesOnEmptyBoard[i];
        // Is p1 pawn trying to jump over another piece?
        if(movePiece.type == PieceType.P1_PAWN &&
            movePiece.squareIndex - currentMove.moveDstIdx == -2 * constants.NUM_COLUMNS 
            ) {
          // checks whether square in front of the p1 pawn is empty
          if(this.board[movePiece.squareIndex + constants.NUM_COLUMNS].type !== PieceType.NO_PIECE) continue;
        }

        // Is p2 pawn trying to jump over another piece?
        if(movePiece.type == PieceType.P2_PAWN &&
            movePiece.squareIndex - currentMove.moveDstIdx == 2 * constants.NUM_COLUMNS 
            ) {
          // checks whether square in front of the p2 pawn is empty
          if(this.board[movePiece.squareIndex - constants.NUM_COLUMNS].type != PieceType.NO_PIECE) continue;
        }

        if(this.board[currentMove.moveDstIdx].type == PieceType.NO_PIECE && 
            currentMove.moveDstIdx == moveDstIdx) {
          moveLegal = true;
          this.makeMove(moveSrcIdx, moveDstIdx);
          break;
        }
      }
    }
    if(abilitySrcIdx == constants.ABILITY_SKIP && abilityDstIdx == constants.ABILITY_SKIP) {
      abilityLegal = true;
      abilityPieceBelongsToCurrentPlayerOrAbilitySkip = true;
      abilityPieceIsAliveOrAbilitySkip = true;
    } else {
      abilityPiece = this.board[abilitySrcIdx];
      abilityDstPiece = this.board[abilityDstIdx];
      if(pieceBelongsToPlayer(abilityPiece.type, this.currentPlayer)) {
        abilityPieceBelongsToCurrentPlayerOrAbilitySkip = true;
      }
      if(abilityPiece.healthPoints > 0) {
        abilityPieceIsAliveOrAbilitySkip = true;
      }
      if(pieceBelongsToPlayer(abilityDstPiece.type, this.currentPlayer)) {
        abilityDstPieceBelongsToCurrentPlayer = true;
      }
      let legalAbilitiesOnEmptyBoard: Array<PlayerAbility> = this.gameCache.pieceTypeToSquareIndexToLegalAbilities[abilityPiece.type][abilityPiece.squareIndex];
      for(let i = 0; i < legalAbilitiesOnEmptyBoard.length; i++) {
        let currentAbility: PlayerAbility = legalAbilitiesOnEmptyBoard[i];
        if(currentAbility.abilityDstIdx === abilityDstIdx) {
          abilityLegal = true;
          break;
        }
      }
    }

    if(moveSrcIdx != constants.MOVE_SKIP && moveLegal) {
      this.undoMove(moveSrcIdx, moveDstIdx);
    }

    currentPlayersKingIsAlive = this.playerToPieces[this.currentPlayer][constants.KING_PIECE_INDEX].healthPoints > 0;
    
    if(moveLegal && abilityLegal && movePieceBelongsToCurrentPlayerOrMoveSkip &&
        abilityPieceBelongsToCurrentPlayerOrAbilitySkip && movePieceIsAliveOrMoveSkip &&
        abilityPieceIsAliveOrAbilitySkip && currentPlayersKingIsAlive) {
      return true;
    } else {
      return false;
    }
  }

  /*
   * Assumes that the game is not over.
   */
  allLegalAbilitiesByPiece(srcSquareIdx: number): Array<PlayerAbility> {
    let retval = new Array<PlayerAbility>()
    let piece: Piece = this.board[srcSquareIdx];
    if((!pieceBelongsToPlayer(piece.type, this.currentPlayer)) ||
        piece.healthPoints <= 0) {
      return retval;
    }
    let legalAbilitiesOnAnEmptyBoard: Array<PlayerAbility> = this.gameCache.pieceTypeToSquareIndexToLegalAbilities[piece.type][piece.squareIndex];
    let abilityDstPiece: Piece;
    legalAbilitiesOnAnEmptyBoard.forEach(ability => {
      abilityDstPiece = this.board[ability.abilityDstIdx]
      if(!pieceBelongsToPlayer(abilityDstPiece.type, this.currentPlayer)) {
        retval.push(ability)
      }
    })
    return retval;
  }

  /*
   * Assumes that the game is not over.
   * Useful abilities are those that change the game state.
   * For example, warrior attacking an empty square is legal but doesn't change the game state.
   */
  usefulLegalAbilitiesByPiece(srcSquareIdx: number): Array<PlayerAbility> {
    let retval = new Array<PlayerAbility>()
    let piece: Piece = this.board[srcSquareIdx];
    if((!pieceBelongsToPlayer(piece.type, this.currentPlayer)) ||
        piece.healthPoints <= 0) {
      return retval;
    }
    let legalAbilitiesOnEmptyBoard: Array<PlayerAbility> = this.gameCache.pieceTypeToSquareIndexToLegalAbilities[piece.type][piece.squareIndex];
    for(let l = 0; l < legalAbilitiesOnEmptyBoard.length; l++) {
      let currentAbility: PlayerAbility = legalAbilitiesOnEmptyBoard[l];
      let destinationSquarePiece: Piece = this.board[currentAbility.abilityDstIdx];
      // exclude useless abilities, e.g. warrior attacking empty square
      switch(piece.type) {
        // king can only use abilities on enemy pieces
        case PieceType.P1_KING:
          switch(destinationSquarePiece.type) {
            case PieceType.P1_KING:
              continue;
            case PieceType.P1_MAGE:
              continue;
            case PieceType.P1_PAWN:
              continue;
            case PieceType.P1_WARRIOR:
              continue;
            case PieceType.P1_ASSASSIN:
              continue;
            case PieceType.P2_KING:
              break;
            case PieceType.P2_MAGE:
              break;
            case PieceType.P2_PAWN:
              break;
            case PieceType.P2_WARRIOR:
              break;
            case PieceType.P2_ASSASSIN:
              break;
            case PieceType.NO_PIECE:
              continue;
            default:
              break;
          }
        // mage can only use abilities on enemy pieces
        case PieceType.P1_MAGE:
          switch(destinationSquarePiece.type) {
            case PieceType.P1_KING:
              continue;
            case PieceType.P1_MAGE:
              continue;
            case PieceType.P1_PAWN:
              continue;
            case PieceType.P1_WARRIOR:
              continue;
            case PieceType.P1_ASSASSIN:
              continue;
            case PieceType.P2_KING:
              break;
            case PieceType.P2_MAGE:
              break;
            case PieceType.P2_PAWN:
              break;
            case PieceType.P2_WARRIOR:
              break;
            case PieceType.P2_ASSASSIN:
              break;
            case PieceType.NO_PIECE:
              continue;
            default:
              break;
          }
          break;
        // pawn can only use abilities on enemy pieces
        case PieceType.P1_PAWN:
          switch(destinationSquarePiece.type) {
            case PieceType.P1_KING:
              continue;
            case PieceType.P1_MAGE:
              continue;
            case PieceType.P1_PAWN:
              continue;
            case PieceType.P1_WARRIOR:
              continue;
            case PieceType.P1_ASSASSIN:
              continue;
            case PieceType.P2_KING:
              break;
            case PieceType.P2_MAGE:
              break;
            case PieceType.P2_PAWN:
              break;
            case PieceType.P2_WARRIOR:
              break;
            case PieceType.P2_ASSASSIN:
              break;
            case PieceType.NO_PIECE:
              continue;
            default:
              break;
          }
          break;
        // warrior can only use abilities on enemy pieces
        case PieceType.P1_WARRIOR:
          switch(destinationSquarePiece.type) {
            case PieceType.P1_KING:
              continue;
            case PieceType.P1_MAGE:
              continue;
            case PieceType.P1_PAWN:
              continue;
            case PieceType.P1_WARRIOR:
              continue;
            case PieceType.P1_ASSASSIN:
              continue;
            case PieceType.P2_KING:
              break;
            case PieceType.P2_MAGE:
              break;
            case PieceType.P2_PAWN:
              break;
            case PieceType.P2_WARRIOR:
              break;
            case PieceType.P2_ASSASSIN:
              break;
            case PieceType.NO_PIECE:
              continue;
            default:
              break;
          }
          break;
        // assassin can only use abilities on enemy pieces
        case PieceType.P1_ASSASSIN:
          switch(destinationSquarePiece.type) {
            case PieceType.P1_KING:
              continue;
            case PieceType.P1_MAGE:
              continue;
            case PieceType.P1_PAWN:
              continue;
            case PieceType.P1_WARRIOR:
              continue;
            case PieceType.P1_ASSASSIN:
              continue;
            case PieceType.P2_KING:
              break;
            case PieceType.P2_MAGE:
              break;
            case PieceType.P2_PAWN:
              break;
            case PieceType.P2_WARRIOR:
              break;
            case PieceType.P2_ASSASSIN:
              break;
            case PieceType.NO_PIECE:
              continue;
            default:
              break;
          }
          break;

        // king can only use abilities on enemy pieces
        case PieceType.P2_KING:
          switch(destinationSquarePiece.type) {
            case PieceType.P1_KING:
              break;
            case PieceType.P1_MAGE:
              break;
            case PieceType.P1_PAWN:
              break;
            case PieceType.P1_WARRIOR:
              break;
            case PieceType.P1_ASSASSIN:
              break;
            case PieceType.P2_KING:
              continue;
            case PieceType.P2_MAGE:
              continue;
            case PieceType.P2_PAWN:
              continue;
            case PieceType.P2_WARRIOR:
              continue;
            case PieceType.P2_ASSASSIN:
              continue;
            case PieceType.NO_PIECE:
              continue;
            default:
              break;
          }
        // mage can only use abilities on enemy pieces
        case PieceType.P2_MAGE:
          switch(destinationSquarePiece.type) {
            case PieceType.P1_KING:
              break;
            case PieceType.P1_MAGE:
              break;
            case PieceType.P1_PAWN:
              break;
            case PieceType.P1_WARRIOR:
              break;
            case PieceType.P1_ASSASSIN:
              break;
            case PieceType.P2_KING:
              continue;
            case PieceType.P2_MAGE:
              continue;
            case PieceType.P2_PAWN:
              continue;
            case PieceType.P2_WARRIOR:
              continue;
            case PieceType.P2_ASSASSIN:
              continue;
            case PieceType.NO_PIECE:
              continue;
            default:
              break;
          }
          break;
        // pawn can only use abilities on enemy pieces
        case PieceType.P2_PAWN:
          switch(destinationSquarePiece.type) {
            case PieceType.P1_KING:
              break;
            case PieceType.P1_MAGE:
              break;
            case PieceType.P1_PAWN:
              break;
            case PieceType.P1_WARRIOR:
              break;
            case PieceType.P1_ASSASSIN:
              break;
            case PieceType.P2_KING:
              continue;
            case PieceType.P2_MAGE:
              continue;
            case PieceType.P2_PAWN:
              continue;
            case PieceType.P2_WARRIOR:
              continue;
            case PieceType.P2_ASSASSIN:
              continue;
            case PieceType.NO_PIECE:
              continue;
            default:
              break;
          }
          break;
        // warrior can only use abilities on enemy pieces
        case PieceType.P2_WARRIOR:
          switch(destinationSquarePiece.type) {
            case PieceType.P1_KING:
              break;
            case PieceType.P1_MAGE:
              break;
            case PieceType.P1_PAWN:
              break;
            case PieceType.P1_WARRIOR:
              break;
            case PieceType.P1_ASSASSIN:
              break;
            case PieceType.P2_KING:
              continue;
            case PieceType.P2_MAGE:
              continue;
            case PieceType.P2_PAWN:
              continue;
            case PieceType.P2_WARRIOR:
              continue;
            case PieceType.P2_ASSASSIN:
              continue;
            case PieceType.NO_PIECE:
              continue;
            default:
              break;
          }
          break;
        // assassin can only use abilities on enemy pieces
        case PieceType.P2_ASSASSIN:
          switch(destinationSquarePiece.type) {
            case PieceType.P1_KING:
              break;
            case PieceType.P1_MAGE:
              break;
            case PieceType.P1_PAWN:
              break;
            case PieceType.P1_WARRIOR:
              break;
            case PieceType.P1_ASSASSIN:
              break;
            case PieceType.P2_KING:
              continue;
            case PieceType.P2_MAGE:
              continue;
            case PieceType.P2_PAWN:
              continue;
            case PieceType.P2_WARRIOR:
              continue;
            case PieceType.P2_ASSASSIN:
              continue;
            case PieceType.NO_PIECE:
              continue;
            default:
              break;
          }
          break;
        case PieceType.NO_PIECE:
          break;
        default:
          break;
      }
      retval.push(currentAbility);
    }
    return retval;
  }

  /*
   * Assumes that the game is not over.
   */
  legalMovesByPiece(srcSquareIdx: number): Array<PlayerMove> {
    let retval = new Array<PlayerMove>();
    let piece: Piece = this.board[srcSquareIdx];
    if((!pieceBelongsToPlayer(piece.type, this.currentPlayer)) ||
        piece.healthPoints <= 0) {
      return retval;
    }
    let legalMovesOnEmptyBoard: Array<PlayerMove> = this.gameCache.pieceTypeToSquareIndexToLegalMoves[piece.type][piece.squareIndex];
    for(let i = 0; i < legalMovesOnEmptyBoard.length; i++) {
      if(this.board[legalMovesOnEmptyBoard[i].moveDstIdx].type != PieceType.NO_PIECE) continue;
      retval.push(legalMovesOnEmptyBoard[i]);
    }
    return retval;
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

  gameOver(): boolean {
    if(this.p1King.healthPoints <= 0 || this.p2King.healthPoints <= 0) {
      return true
    } else {
      return false
    }
  }

  winner(): Player | undefined {
    if(this.p1King.healthPoints <= 0) {
      return Player.PLAYER_2
    } else if(this.p2King.healthPoints <= 0) {
      return Player.PLAYER_1
    }
  }

  boardFromString(encodedBoard: string): void {
    this.currentPlayer = Number(encodedBoard.charAt(0));
    this.moveNumber = 0;
    // pieces need to exist in the piece array even if they're dead
    // first all pieces are initialized as dead, then they're replaced if found in the encodedBoard
    let p1Pieces = new Array<Piece>(constants.NUM_STARTING_PIECES);
    p1Pieces[constants.KING_PIECE_INDEX] = new Piece(PieceType.P1_KING, 0, 0);
    p1Pieces[constants.PAWN_1_PIECE_INDEX] = new Piece(PieceType.P1_PAWN, 0, 0);
    p1Pieces[constants.PAWN_2_PIECE_INDEX] = new Piece(PieceType.P1_PAWN, 0, 0);
    p1Pieces[constants.PAWN_3_PIECE_INDEX] = new Piece(PieceType.P1_PAWN, 0, 0);
    p1Pieces[constants.ASSASSIN_PIECE_INDEX] = new Piece(PieceType.P1_ASSASSIN, 0, 0);
    p1Pieces[constants.MAGE_PIECE_INDEX] = new Piece(PieceType.P1_MAGE, 0, 0);
    p1Pieces[constants.WARRIOR_PIECE_INDEX] = new Piece(PieceType.P1_WARRIOR, 0, 0);

    let p2Pieces = new Array<Piece>(constants.NUM_STARTING_PIECES);
    p2Pieces[constants.KING_PIECE_INDEX] = new Piece(PieceType.P2_KING, 0, 0);
    p2Pieces[constants.PAWN_1_PIECE_INDEX] = new Piece(PieceType.P2_PAWN, 0, 0);
    p2Pieces[constants.PAWN_2_PIECE_INDEX] = new Piece(PieceType.P2_PAWN, 0, 0);
    p2Pieces[constants.PAWN_3_PIECE_INDEX] = new Piece(PieceType.P2_PAWN, 0, 0);
    p2Pieces[constants.ASSASSIN_PIECE_INDEX] = new Piece(PieceType.P2_ASSASSIN, 0, 0);
    p2Pieces[constants.MAGE_PIECE_INDEX] = new Piece(PieceType.P2_MAGE, 0, 0);
    p2Pieces[constants.WARRIOR_PIECE_INDEX] = new Piece(PieceType.P2_WARRIOR, 0, 0);


    let b1: string = encodedBoard.substring(2);
    let ar1: string[] = b1.split(",")
    ar1.pop() // last element is an empty string
    let boardIdx = 0;
    ar1.forEach(item => {
      let ar2 = item.split("-")
      if(ar2[0] === "empty") {
        this.board[boardIdx] = new Piece(PieceType.NO_PIECE, 0, boardIdx)
      } else {
        let healthPoints = Number(ar2[2])
        let pieceType: string = ar2[0] + ar2[1]
        if(pieceType == "0king") {
          this.board[boardIdx] = new Piece(PieceType.P1_KING, healthPoints, boardIdx);
          p1Pieces[constants.KING_PIECE_INDEX] = this.board[boardIdx];
        } else if(pieceType == "0pawn") {
          this.board[boardIdx] = new Piece(PieceType.P1_PAWN, healthPoints, boardIdx);
          if(p1Pieces[constants.PAWN_1_PIECE_INDEX].healthPoints <= 0) {
            p1Pieces[constants.PAWN_1_PIECE_INDEX] = this.board[boardIdx];
          } else if(p1Pieces[constants.PAWN_2_PIECE_INDEX].healthPoints <= 0) {
            p1Pieces[constants.PAWN_2_PIECE_INDEX] = this.board[boardIdx];
          } else if(p1Pieces[constants.PAWN_3_PIECE_INDEX].healthPoints <= 0) {
            p1Pieces[constants.PAWN_3_PIECE_INDEX] = this.board[boardIdx];
          } else {
            throw "Already found 3 living PLAYER_1 Pawns";
          }
        } else if(pieceType == "0mage") {
          this.board[boardIdx] = new Piece(PieceType.P1_MAGE, healthPoints, boardIdx);
          p1Pieces[constants.MAGE_PIECE_INDEX] = this.board[boardIdx];
        } else if(pieceType == "0assassin") {
          this.board[boardIdx] = new Piece(PieceType.P1_ASSASSIN, healthPoints, boardIdx);
          p1Pieces[constants.ASSASSIN_PIECE_INDEX] = this.board[boardIdx];
        } else if(pieceType == "0warrior") {
          this.board[boardIdx] = new Piece(PieceType.P1_WARRIOR, healthPoints, boardIdx);
          p1Pieces[constants.WARRIOR_PIECE_INDEX] = this.board[boardIdx];
        } else if(pieceType == "1king") {
          this.board[boardIdx] = new Piece(PieceType.P2_KING, healthPoints, boardIdx);
          p2Pieces[constants.KING_PIECE_INDEX] = this.board[boardIdx];
        } else if(pieceType == "1pawn") {
          this.board[boardIdx] = new Piece(PieceType.P2_PAWN, healthPoints, boardIdx);
          if(p2Pieces[constants.PAWN_1_PIECE_INDEX].healthPoints <= 0) {
            p2Pieces[constants.PAWN_1_PIECE_INDEX] = this.board[boardIdx];
          } else if(p2Pieces[constants.PAWN_2_PIECE_INDEX].healthPoints <= 0) {
            p2Pieces[constants.PAWN_2_PIECE_INDEX] = this.board[boardIdx];
          } else if(p2Pieces[constants.PAWN_3_PIECE_INDEX].healthPoints <= 0) {
            p2Pieces[constants.PAWN_3_PIECE_INDEX] = this.board[boardIdx];
          } else {
            throw "Already found 3 living PLAYER_2 Pawns";
          }
        } else if(pieceType == "1mage") {
          this.board[boardIdx] = new Piece(PieceType.P2_MAGE, healthPoints, boardIdx);
          p2Pieces[constants.MAGE_PIECE_INDEX] = this.board[boardIdx];
        } else if(pieceType == "1assassin") {
          this.board[boardIdx] = new Piece(PieceType.P2_ASSASSIN, healthPoints, boardIdx);
          p2Pieces[constants.ASSASSIN_PIECE_INDEX] = this.board[boardIdx];
        } else if(pieceType == "1warrior") {
          this.board[boardIdx] = new Piece(PieceType.P2_WARRIOR, healthPoints, boardIdx);
          p2Pieces[constants.WARRIOR_PIECE_INDEX] = this.board[boardIdx];
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
}

export function coordinatesToBoardIndex(column: number, row: number): number {
  return column + row * constants.NUM_COLUMNS
}

export function perft(game: Game, depth: number): number {
  let nodes = 0
  let legalActions: Array<PlayerAction> = game.usefulLegalActions()
  if(depth == 1) {
    return legalActions.length
  }
  let pa: PlayerAction
  let ui: UndoInfo
  for(let i = 0; i < legalActions.length; i++) {
    pa = legalActions[i]
    ui = game.makeAction(pa.moveSrcIdx, pa.moveDstIdx, pa.abilitySrcIdx, pa.abilityDstIdx)
    nodes += perft(game, depth - 1)
    game.undoAction(ui)
  }
  return nodes
}

function isActionValid(moveSrcIdx: number, moveDstIdx: number, abilitySrcIdx: number, abilityDstIdx: number): boolean {
  let moveValid = false
  let abilityValid = false
  if(moveSrcIdx === constants.MOVE_SKIP && moveDstIdx === constants.MOVE_SKIP) {
    moveValid = true
  } else if((!isSquareIndexOffBoard(moveSrcIdx)) && (!isSquareIndexOffBoard(moveDstIdx))) {
    moveValid = true
  }
  if(abilitySrcIdx === constants.ABILITY_SKIP && abilityDstIdx === constants.ABILITY_SKIP) {
    abilityValid = true
  } else if((!isSquareIndexOffBoard(abilitySrcIdx)) && (!isSquareIndexOffBoard(abilityDstIdx))) {
    abilityValid = true
  }
  return moveValid && abilityValid
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
    case PieceType.NO_PIECE:
      return false
    default:
      return false
  }
}
