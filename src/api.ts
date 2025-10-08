import { PlayerAction, Piece, PieceType, ActionType,
  Game, UndoInfo, Player, isActionValid
} from './nichess'

import { GameCache } from './game_cache'
import { pieceBelongsToPlayer } from './util'
import { ACTION_SKIP, NUM_SQUARES, NUM_COLUMNS, NUM_ROWS, Direction, PAWN_ABILITY_POINTS } from './constants'

export class Api {
  private game: Game

  constructor() {
    this.game = new Game({})
  }

  makeAction(
    srcIdx: number,
    dstIdx: number,
  ): UndoInfo {
    // TODO: validate input
    let action: PlayerAction;
    let direction: Direction;
    let directionLine: Array<number>;
        // Ability:
        // 0) Move
        // 1) Default damage ability
        // 2) MAGE_THROW_ASSASSIN
        // 3) WARRIOR_THROW_WARRIOR
        // 4) PAWN_DAMAGE_AND_PROMOTION

    if(srcIdx == ACTION_SKIP && dstIdx == ACTION_SKIP) {
      action = new PlayerAction(ACTION_SKIP, ACTION_SKIP, ActionType.SKIP);
    } else {
      let srcPiece: Piece = this.game.board[srcIdx];
      let dstPiece: Piece = this.game.board[dstIdx];

      if(dstPiece.type == PieceType.NO_PIECE) {
        // 0)
        if(
        (srcIdx == 4 && dstIdx == 6 && srcPiece.type == PieceType.P1_KING) ||
        (srcIdx == 4 && dstIdx == 2 && srcPiece.type == PieceType.P1_KING)
        ) {
          // p1 castle
          action = new PlayerAction(srcIdx, dstIdx, ActionType.MOVE_CASTLE)
        } else if(
        (srcIdx == 60 && dstIdx == 62 && srcPiece.type == PieceType.P2_KING) ||
        (srcIdx == 60 && dstIdx == 58 && srcPiece.type == PieceType.P2_KING)
        ) {
          // p2 castle
          action = new PlayerAction(srcIdx, dstIdx, ActionType.MOVE_CASTLE)
        } else if(srcPiece.type == PieceType.P1_PAWN && dstIdx > 55) {
          action = new PlayerAction(srcIdx, dstIdx, ActionType.MOVE_PROMOTE_P1_PAWN)
        } else if(srcPiece.type == PieceType.P2_PAWN && dstIdx < 8) {
          action = new PlayerAction(srcIdx, dstIdx, ActionType.MOVE_PROMOTE_P2_PAWN)
        } else {
          action = new PlayerAction(srcIdx, dstIdx, ActionType.MOVE_REGULAR)
        }
      } else {
        if(srcPiece.type == PieceType.P1_MAGE) {
          direction = GameCache.srcSquareToDstSquareToDirection[srcPiece.squareIndex][dstPiece.squareIndex]
          if(direction != Direction.INVALID) {
            directionLine = GameCache.squareToDirectionToLine[srcPiece.squareIndex][direction];
            let p: Piece = this.game.board[directionLine[0]];
            if(p.type == PieceType.P1_ASSASSIN) {
              // 2)
              action = new PlayerAction(srcIdx, dstIdx, ActionType.ABILITY_MAGE_THROW_ASSASSIN);
            } else {
              // 1)
              action = new PlayerAction(srcIdx, dstIdx, pieceToAbilityActionType(srcPiece));
            }
          } else {
            // 1)
            action = new PlayerAction(srcIdx, dstIdx, pieceToAbilityActionType(srcPiece));
          }
        } else if(srcPiece.type == PieceType.P2_MAGE) {
          direction = GameCache.srcSquareToDstSquareToDirection[srcPiece.squareIndex][dstPiece.squareIndex]
          if(direction != Direction.INVALID) {
            directionLine = GameCache.squareToDirectionToLine[srcPiece.squareIndex][direction];
            let p: Piece = this.game.board[directionLine[0]];
            if(p.type == PieceType.P2_ASSASSIN) {
              // 2)
              action = new PlayerAction(srcIdx, dstIdx, ActionType.ABILITY_MAGE_THROW_ASSASSIN);
            } else {
              // 1)
              action = new PlayerAction(srcIdx, dstIdx, pieceToAbilityActionType(srcPiece));
            }
          } else {
            // 1)
            action = new PlayerAction(srcIdx, dstIdx, pieceToAbilityActionType(srcPiece));
          }
        } else if(srcPiece.type == PieceType.P1_WARRIOR) {
          direction = GameCache.srcSquareToDstSquareToDirection[srcPiece.squareIndex][dstPiece.squareIndex]
          if(direction != Direction.INVALID) {
            directionLine = GameCache.squareToDirectionToLine[srcPiece.squareIndex][direction];
            let p: Piece = this.game.board[directionLine[0]];
            if(p.type == PieceType.P1_WARRIOR) {
              // 3)
              action = new PlayerAction(srcIdx, dstIdx, ActionType.ABILITY_WARRIOR_THROW_WARRIOR);
            } else {
              // 1)
              action = new PlayerAction(srcIdx, dstIdx, pieceToAbilityActionType(srcPiece));
            }
          } else {
            // 1)
            action = new PlayerAction(srcIdx, dstIdx, pieceToAbilityActionType(srcPiece));
          }
        } else if(srcPiece.type == PieceType.P2_WARRIOR) {
          direction = GameCache.srcSquareToDstSquareToDirection[srcPiece.squareIndex][dstPiece.squareIndex]
          if(direction != Direction.INVALID) {
            directionLine = GameCache.squareToDirectionToLine[srcPiece.squareIndex][direction];
            let p: Piece = this.game.board[directionLine[0]];
            if(p.type == PieceType.P2_WARRIOR) {
              // 3)
              action = new PlayerAction(srcIdx, dstIdx, ActionType.ABILITY_WARRIOR_THROW_WARRIOR);
            } else {
              // 1)
              action = new PlayerAction(srcIdx, dstIdx, pieceToAbilityActionType(srcPiece));
            }
          } else {
            // 1)
            action = new PlayerAction(srcIdx, dstIdx, pieceToAbilityActionType(srcPiece));
          }
        } else if(srcPiece.type == PieceType.P1_PAWN) {
          if(dstIdx > 55 && PAWN_ABILITY_POINTS >= dstPiece.healthPoints) {
            // 4)
            action = new PlayerAction(srcIdx, dstIdx, ActionType.ABILITY_P1_PAWN_DAMAGE_AND_PROMOTION);
          } else {
            // 1)
            action = new PlayerAction(srcIdx, dstIdx, pieceToAbilityActionType(srcPiece));
          }
        } else if(srcPiece.type == PieceType.P2_PAWN) {
          if(dstIdx < 8 && PAWN_ABILITY_POINTS >= dstPiece.healthPoints) {
            // 4)
            action = new PlayerAction(srcIdx, dstIdx, ActionType.ABILITY_P2_PAWN_DAMAGE_AND_PROMOTION);
          } else {
            // 1)
            action = new PlayerAction(srcIdx, dstIdx, pieceToAbilityActionType(srcPiece));
          }
        } else {
          // 1)
          action = new PlayerAction(srcIdx, dstIdx, pieceToAbilityActionType(srcPiece));
        }
      }
    }

    return this.game.makeAction(action);
  }

  undoAction(undoInfo: UndoInfo): void {
    // TODO: validate input
    this.game.undoAction(undoInfo)
  }

  reset(): void {
    this.game.reset();
  }

  legalActions() {
    return this.game.generateLegalActions();
  }

  legalActionsBySquare(squareIdx: number): Array<PlayerAction> {
    if(!isSquareValid(squareIdx)) {
      throw new Error("Invalid square")
    }
    if(this.isGameOver()) {
      return [];
    }

    let p: Piece = this.game.getPieceBySquareIndex(squareIdx);
    if(
      (!pieceBelongsToPlayer(p.type, this.game.currentPlayer)) ||
      p.healthPoints <= 0
    ) {
      return new Array<PlayerAction>();
    } else {
      return this.game.legalActionsByPiece(p);
    }
  }

  currentPlayer(): Player {
    return this.game.getCurrentPlayer();
  }

  pieceByCoordinates(x: number, y: number): Piece {
    if(x < 0 || x > NUM_COLUMNS || y < 0 || y > NUM_ROWS) {
      throw new Error("Invalid coordinates");
    }
    return this.game.getPieceByCoordinates(x, y);
  }

  pieceBySquare(squareIdx: number): Piece {
    if(!isSquareValid(squareIdx)) {
      throw new Error("Invalid square");
    }   
    return this.game.getPieceBySquareIndex(squareIdx);
  }

  allPiecesByPlayer(player: Player): Array<Piece> {
    return this.game.getAllPiecesByPlayer(player);
  }

  playerToKing(player: Player): Piece {
    return this.game.playerToKing[player];
  }

  isGameOver(): boolean {
    return this.game.isGameOver();
  }

  draw(): boolean {
    return this.game.repetitionsDraw;
  }

  winner(): Player | undefined {
    return this.game.winner();
  }

  boardFromString(encodedBoard: string): void {
  // TODO: validate input
    this.game.boardFromString(encodedBoard);
  }

  boardToString(): string {
    return this.game.boardToString();
  }

  board2D() {
    return this.game.board2D();
  }

  dump(): string {
    return this.game.dump()
  }

  moveNumber(): number {
    return this.game.getMoveNumber();
  }
}

function pieceToAbilityActionType(piece: Piece): ActionType {
  switch(piece.type) {
    case PieceType.P1_KING:
      return ActionType.ABILITY_KING_DAMAGE
    case PieceType.P1_MAGE:
      return ActionType.ABILITY_MAGE_DAMAGE
    case PieceType.P1_WARRIOR:
      return ActionType.ABILITY_WARRIOR_DAMAGE
    case PieceType.P1_ASSASSIN:
      return ActionType.ABILITY_ASSASSIN_DAMAGE
    case PieceType.P1_KNIGHT:
      return ActionType.ABILITY_KNIGHT_DAMAGE
    case PieceType.P1_PAWN:
      return ActionType.ABILITY_PAWN_DAMAGE
    case PieceType.P2_KING:
      return ActionType.ABILITY_KING_DAMAGE
    case PieceType.P2_MAGE:
      return ActionType.ABILITY_MAGE_DAMAGE
    case PieceType.P2_WARRIOR:
      return ActionType.ABILITY_WARRIOR_DAMAGE
    case PieceType.P2_ASSASSIN:
      return ActionType.ABILITY_ASSASSIN_DAMAGE
    case PieceType.P2_KNIGHT:
      return ActionType.ABILITY_KNIGHT_DAMAGE
    case PieceType.P2_PAWN:
      return ActionType.ABILITY_PAWN_DAMAGE
    default:
      return ActionType.ABILITY_P1_PAWN_DAMAGE_AND_PROMOTION // should never happen
  }
}

function isSquareValid(squareIdx: number): boolean {
  if(squareIdx < 0 || squareIdx >= NUM_SQUARES) {
    return false;
  } else {
    return true;
  }
}
