import * as constants from './constants'
import { PieceType, Player, PlayerMove, PlayerAbility, coordinatesToBoardIndex } from './nichess'

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

/*
 * For each Piece type, for each square, generates legal moves as if there were no other
 * pieces on the board. Elsewhere, occupied squares will be discarded from the legal moves.
 */
export function generateLegalMovesOnAnEmptyBoard(): Array<Array<Array<PlayerMove>>> {
  let pieceTypeToSquareToLegalMoves = new Array<Array<Array<PlayerMove>>>(constants.NUM_PIECE_TYPE)

  // p1 king moves
  let squareToP1KingMoves = new Array<Array<PlayerMove>>(constants.NUM_SQUARES)
  for(let move_row = 0; move_row < constants.NUM_ROWS; move_row++) {
    for(let move_column = 0; move_column < constants.NUM_COLUMNS; move_column++) {
      let srcSquareIndex = coordinatesToBoardIndex(move_column, move_row);
      let playerMoves = new Array<PlayerMove>()
      for(let dx = -1; dx < 2; dx++) {
        for(let dy = -1; dy < 2; dy++) {
          if(dx == 0 && dy == 0) continue;
          let move_dst_x = move_column + dx;
          let move_dst_y = move_row + dy;
          if(isOffBoard(move_dst_x, move_dst_y)) continue;
          let pm = new PlayerMove(srcSquareIndex, coordinatesToBoardIndex(move_dst_x, move_dst_y));
          playerMoves.push(pm);
        }
      }
      squareToP1KingMoves[srcSquareIndex] = playerMoves;
    }
  }
  pieceTypeToSquareToLegalMoves[PieceType.P1_KING] = squareToP1KingMoves;

  // p1 mage moves
  let squareToP1MageMoves = new Array<Array<PlayerMove>>(constants.NUM_SQUARES)
  for(let move_row = 0; move_row < constants.NUM_ROWS; move_row++) {
    for(let move_column = 0; move_column < constants.NUM_COLUMNS; move_column++) {
      let srcSquareIndex = coordinatesToBoardIndex(move_column, move_row);
      let playerMoves = new Array<PlayerMove>()
      for(let dx = -1; dx < 2; dx++) {
        for(let dy = -1; dy < 2; dy++) {
          if(dx == 0 && dy == 0) continue;
          let move_dst_x = move_column + dx;
          let move_dst_y = move_row + dy;
          if(isOffBoard(move_dst_x, move_dst_y)) continue;
          let pm = new PlayerMove(srcSquareIndex, coordinatesToBoardIndex(move_dst_x, move_dst_y));
          playerMoves.push(pm);
        }
      }
      squareToP1MageMoves[srcSquareIndex] = playerMoves;
    }
  }
  pieceTypeToSquareToLegalMoves[PieceType.P1_MAGE] = squareToP1MageMoves;

  // p1 pawn moves
  let squareToP1PawnMoves = new Array<Array<PlayerMove>>(constants.NUM_SQUARES)
  for(let move_row = 0; move_row < constants.NUM_ROWS; move_row++) {
    for(let move_column = 0; move_column < constants.NUM_COLUMNS; move_column++) {
      let srcSquareIndex = coordinatesToBoardIndex(move_column, move_row);
      let playerMoves = new Array<PlayerMove>()
      for(let dx = -1; dx < 2; dx++) {
        for(let dy = -1; dy < 2; dy++) {
          if(dx == 0 && dy == 0) continue;
          let move_dst_x = move_column + dx;
          let move_dst_y = move_row + dy;
          if(isOffBoard(move_dst_x, move_dst_y)) continue;
          let pm = new PlayerMove(srcSquareIndex, coordinatesToBoardIndex(move_dst_x, move_dst_y));
          playerMoves.push(pm);
        }
      }
      // pawn can also go 2 squares forward
      let move_dst_x = move_column;
      let move_dst_y = move_row + 2;
      if(!isOffBoard(move_dst_x, move_dst_y)){
        let pm = new PlayerMove(srcSquareIndex, coordinatesToBoardIndex(move_dst_x, move_dst_y));
        playerMoves.push(pm);
      }
      squareToP1PawnMoves[srcSquareIndex] = playerMoves;
    }
  }
  pieceTypeToSquareToLegalMoves[PieceType.P1_PAWN] = squareToP1PawnMoves;

  // p1 warrior moves
  let squareToP1WarriorMoves = new Array<Array<PlayerMove>>(constants.NUM_SQUARES)
  for(let move_row = 0; move_row < constants.NUM_ROWS; move_row++) {
    for(let move_column = 0; move_column < constants.NUM_COLUMNS; move_column++) {
      let srcSquareIndex = coordinatesToBoardIndex(move_column, move_row);
      let playerMoves = new Array<PlayerMove>()
      for(let dx = -1; dx < 2; dx++) {
        for(let dy = -1; dy < 2; dy++) {
          if(dx == 0 && dy == 0) continue;
          let move_dst_x = move_column + dx;
          let move_dst_y = move_row + dy;
          if(isOffBoard(move_dst_x, move_dst_y)) continue;
          let pm = new PlayerMove(srcSquareIndex, coordinatesToBoardIndex(move_dst_x, move_dst_y));
          playerMoves.push(pm);
        }
      }
      squareToP1WarriorMoves[srcSquareIndex] = playerMoves;
    }
  }
  pieceTypeToSquareToLegalMoves[PieceType.P1_WARRIOR] = squareToP1WarriorMoves;

  // p1 assassin moves
  let squareToP1AssassinMoves = new Array<Array<PlayerMove>>(constants.NUM_SQUARES)
  for(let move_row = 0; move_row < constants.NUM_ROWS; move_row++) {
    for(let move_column = 0; move_column < constants.NUM_COLUMNS; move_column++) {
      let srcSquareIndex = coordinatesToBoardIndex(move_column, move_row);
      let playerMoves = new Array<PlayerMove>();
      for(let dx = -2; dx < 3; dx++) {
        for(let dy = -2; dy < 3; dy++) {
          if(dx == 0 && dy == 0) continue;
          let move_dst_x = move_column + dx;
          let move_dst_y = move_row + dy;
          if(isOffBoard(move_dst_x, move_dst_y)) continue;
          let pm = new PlayerMove(srcSquareIndex, coordinatesToBoardIndex(move_dst_x, move_dst_y));
          playerMoves.push(pm);
        }
      }
      // 4 extra moves:
      let move_dst_x1 = move_column + 3;
      let move_dst_y1 = move_row + 3;
      let move_dst_x2 = move_column + 3;
      let move_dst_y2 = move_row - 3;
      let move_dst_x3 = move_column - 3;
      let move_dst_y3 = move_row + 3;
      let move_dst_x4 = move_column - 3;
      let move_dst_y4 = move_row - 3;
      if(!isOffBoard(move_dst_x1, move_dst_y1)){
        let pm = new PlayerMove(srcSquareIndex, coordinatesToBoardIndex(move_dst_x1, move_dst_y1));
        playerMoves.push(pm);
      }
      if(!isOffBoard(move_dst_x2, move_dst_y2)){
        let pm = new PlayerMove(srcSquareIndex, coordinatesToBoardIndex(move_dst_x2, move_dst_y2));
        playerMoves.push(pm);
      }
      if(!isOffBoard(move_dst_x3, move_dst_y3)){
        let pm = new PlayerMove(srcSquareIndex, coordinatesToBoardIndex(move_dst_x3, move_dst_y3));
        playerMoves.push(pm);
      }
      if(!isOffBoard(move_dst_x4, move_dst_y4)){
        let pm = new PlayerMove(srcSquareIndex, coordinatesToBoardIndex(move_dst_x4, move_dst_y4));
        playerMoves.push(pm);
      }

      squareToP1AssassinMoves[srcSquareIndex] = playerMoves;
    }
  }
  pieceTypeToSquareToLegalMoves[PieceType.P1_ASSASSIN] = squareToP1AssassinMoves;

  // p2 king moves
  let squareToP2KingMoves = new Array<Array<PlayerMove>>(constants.NUM_SQUARES)
  for(let move_row = 0; move_row < constants.NUM_ROWS; move_row++) {
    for(let move_column = 0; move_column < constants.NUM_COLUMNS; move_column++) {
      let srcSquareIndex = coordinatesToBoardIndex(move_column, move_row);
      let playerMoves = new Array<PlayerMove>()
      for(let dx = -1; dx < 2; dx++) {
        for(let dy = -1; dy < 2; dy++) {
          if(dx == 0 && dy == 0) continue;
          let move_dst_x = move_column + dx;
          let move_dst_y = move_row + dy;
          if(isOffBoard(move_dst_x, move_dst_y)) continue;
          let pm = new PlayerMove(srcSquareIndex, coordinatesToBoardIndex(move_dst_x, move_dst_y));
          playerMoves.push(pm);
        }
      }
      squareToP2KingMoves[srcSquareIndex] = playerMoves;
    }
  }
  pieceTypeToSquareToLegalMoves[PieceType.P2_KING] = squareToP2KingMoves;

  // p2 mage moves
  let squareToP2MageMoves = new Array<Array<PlayerMove>>(constants.NUM_SQUARES)
  for(let move_row = 0; move_row < constants.NUM_ROWS; move_row++) {
    for(let move_column = 0; move_column < constants.NUM_COLUMNS; move_column++) {
      let srcSquareIndex = coordinatesToBoardIndex(move_column, move_row);
      let playerMoves = new Array<PlayerMove>()
      for(let dx = -1; dx < 2; dx++) {
        for(let dy = -1; dy < 2; dy++) {
          if(dx == 0 && dy == 0) continue;
          let move_dst_x = move_column + dx;
          let move_dst_y = move_row + dy;
          if(isOffBoard(move_dst_x, move_dst_y)) continue;
          let pm = new PlayerMove(srcSquareIndex, coordinatesToBoardIndex(move_dst_x, move_dst_y));
          playerMoves.push(pm);
        }
      }
      squareToP2MageMoves[srcSquareIndex] = playerMoves;
    }
  }
  pieceTypeToSquareToLegalMoves[PieceType.P2_MAGE] = squareToP2MageMoves;

  // p2 pawn moves
  let squareToP2PawnMoves = new Array<Array<PlayerMove>>(constants.NUM_SQUARES)
  for(let move_row = 0; move_row < constants.NUM_ROWS; move_row++) {
    for(let move_column = 0; move_column < constants.NUM_COLUMNS; move_column++) {
      let srcSquareIndex = coordinatesToBoardIndex(move_column, move_row);
      let playerMoves = new Array<PlayerMove>()
      for(let dx = -1; dx < 2; dx++) {
        for(let dy = -1; dy < 2; dy++) {
          if(dx == 0 && dy == 0) continue;
          let move_dst_x = move_column + dx;
          let move_dst_y = move_row + dy;
          if(isOffBoard(move_dst_x, move_dst_y)) continue;
          let pm = new PlayerMove(srcSquareIndex, coordinatesToBoardIndex(move_dst_x, move_dst_y));
          playerMoves.push(pm);
        }
      }
      // pawn can also go 2 squares forward(for p2 this means -2 on y axis)
      let move_dst_x = move_column;
      let move_dst_y = move_row - 2;
      if(!isOffBoard(move_dst_x, move_dst_y)){
        let pm = new PlayerMove(srcSquareIndex, coordinatesToBoardIndex(move_dst_x, move_dst_y));
        playerMoves.push(pm);
      }
      squareToP2PawnMoves[srcSquareIndex] = playerMoves;
    }
  }
  pieceTypeToSquareToLegalMoves[PieceType.P2_PAWN] = squareToP2PawnMoves;

  // p2 warrior moves
  let squareToP2WarriorMoves = new Array<Array<PlayerMove>>(constants.NUM_SQUARES)
  for(let move_row = 0; move_row < constants.NUM_ROWS; move_row++) {
    for(let move_column = 0; move_column < constants.NUM_COLUMNS; move_column++) {
      let srcSquareIndex = coordinatesToBoardIndex(move_column, move_row);
      let playerMoves = new Array<PlayerMove>()
      for(let dx = -1; dx < 2; dx++) {
        for(let dy = -1; dy < 2; dy++) {
          if(dx == 0 && dy == 0) continue;
          let move_dst_x = move_column + dx;
          let move_dst_y = move_row + dy;
          if(isOffBoard(move_dst_x, move_dst_y)) continue;
          let pm = new PlayerMove(srcSquareIndex, coordinatesToBoardIndex(move_dst_x, move_dst_y));
          playerMoves.push(pm);
        }
      }
      squareToP2WarriorMoves[srcSquareIndex] = playerMoves;
    }
  }
  pieceTypeToSquareToLegalMoves[PieceType.P2_WARRIOR] = squareToP2WarriorMoves;

  // p2 assassin moves
  let squareToP2AssassinMoves = new Array<Array<PlayerMove>>(constants.NUM_SQUARES)
  for(let move_row = 0; move_row < constants.NUM_ROWS; move_row++) {
    for(let move_column = 0; move_column < constants.NUM_COLUMNS; move_column++) {
      let srcSquareIndex = coordinatesToBoardIndex(move_column, move_row);
      let playerMoves = new Array<PlayerMove>()
      for(let dx = -2; dx < 3; dx++) {
        for(let dy = -2; dy < 3; dy++) {
          if(dx == 0 && dy == 0) continue;
          let move_dst_x = move_column + dx;
          let move_dst_y = move_row + dy;
          if(isOffBoard(move_dst_x, move_dst_y)) continue;
          let pm = new PlayerMove(srcSquareIndex, coordinatesToBoardIndex(move_dst_x, move_dst_y));
          playerMoves.push(pm);
        }
      }
      // 4 extra moves:
      let move_dst_x1 = move_column + 3;
      let move_dst_y1 = move_row + 3;
      let move_dst_x2 = move_column + 3;
      let move_dst_y2 = move_row - 3;
      let move_dst_x3 = move_column - 3;
      let move_dst_y3 = move_row + 3;
      let move_dst_x4 = move_column - 3;
      let move_dst_y4 = move_row - 3;
      if(!isOffBoard(move_dst_x1, move_dst_y1)){
        let pm = new PlayerMove(srcSquareIndex, coordinatesToBoardIndex(move_dst_x1, move_dst_y1));
        playerMoves.push(pm);
      }
      if(!isOffBoard(move_dst_x2, move_dst_y2)){
        let pm = new PlayerMove(srcSquareIndex, coordinatesToBoardIndex(move_dst_x2, move_dst_y2));
        playerMoves.push(pm);
      }
      if(!isOffBoard(move_dst_x3, move_dst_y3)){
        let pm = new PlayerMove(srcSquareIndex, coordinatesToBoardIndex(move_dst_x3, move_dst_y3));
        playerMoves.push(pm);
      }
      if(!isOffBoard(move_dst_x4, move_dst_y4)){
        let pm = new PlayerMove(srcSquareIndex, coordinatesToBoardIndex(move_dst_x4, move_dst_y4));
        playerMoves.push(pm);
      }

      squareToP2AssassinMoves[srcSquareIndex] = playerMoves;
    }
  }
  pieceTypeToSquareToLegalMoves[PieceType.P2_ASSASSIN] = squareToP2AssassinMoves;

  // NO_PIECE moves (shouldn't be used, added for completeness)
  let squareToNoPieceMoves = new Array<Array<PlayerMove>>(constants.NUM_SQUARES)
  for(let move_row = 0; move_row < constants.NUM_ROWS; move_row++) {
    for(let move_column = 0; move_column < constants.NUM_COLUMNS; move_column++) {
      let srcSquareIndex = coordinatesToBoardIndex(move_column, move_row);
      let playerMoves = new Array<PlayerMove>()
      squareToNoPieceMoves[srcSquareIndex] = playerMoves;
    }
  }
  pieceTypeToSquareToLegalMoves[PieceType.NO_PIECE] = squareToNoPieceMoves;

  return pieceTypeToSquareToLegalMoves;
}

/*
 * For each Piece type, for each square, generates legal abilities as if there were no other
 * pieces on the board. Elsewhere, abilities will be filtered by the actual board position.
 */
export function generateLegalAbilitiesOnAnEmptyBoard(): Array<Array<Array<PlayerAbility>>> {
  let pieceTypeToSquareToLegalAbilities = new Array<Array<Array<PlayerAbility>>>(constants.NUM_PIECE_TYPE)

  // p1 king abilities
  let squareToP1KingAbilities = new Array<Array<PlayerAbility>>(constants.NUM_SQUARES)
  for(let ability_row = 0; ability_row < constants.NUM_ROWS; ability_row++) {
    for(let ability_column = 0; ability_column < constants.NUM_COLUMNS; ability_column++) {
      let srcSquareIndex = coordinatesToBoardIndex(ability_column, ability_row);
      let playerAbilities = new Array<PlayerAbility>()
      for(let dx = -1; dx < 2; dx++) {
        for(let dy = -1; dy < 2; dy++) {
          if(dx == 0 && dy == 0) continue;
          let ability_dst_x = ability_column + dx;
          let ability_dst_y = ability_row + dy;
          if(isOffBoard(ability_dst_x, ability_dst_y)) continue;
          let pa = new PlayerAbility(srcSquareIndex, coordinatesToBoardIndex(ability_dst_x, ability_dst_y));
          playerAbilities.push(pa);
        }
      }
      squareToP1KingAbilities[srcSquareIndex] = playerAbilities;
    }
  }
  pieceTypeToSquareToLegalAbilities[PieceType.P1_KING] = squareToP1KingAbilities;

  // p1 mage abilities
  let squareToP1MageAbilities = new Array<Array<PlayerAbility>>(constants.NUM_SQUARES)
  for(let ability_row = 0; ability_row < constants.NUM_ROWS; ability_row++) {
    for(let ability_column = 0; ability_column < constants.NUM_COLUMNS; ability_column++) {
      let srcSquareIndex = coordinatesToBoardIndex(ability_column, ability_row);
      let playerAbilities = new Array<PlayerAbility>()
      for(let dx = -2; dx < 3; dx++) {
        for(let dy = -2; dy < 3; dy++) {
          if(dx == 0 && dy == 0) continue;
          let ability_dst_x = ability_column + dx;
          let ability_dst_y = ability_row + dy;
          if(isOffBoard(ability_dst_x, ability_dst_y)) continue;
          let pa = new PlayerAbility(srcSquareIndex, coordinatesToBoardIndex(ability_dst_x, ability_dst_y));
          playerAbilities.push(pa);
        }
      }
      squareToP1MageAbilities[srcSquareIndex] = playerAbilities;
    }
  }
  pieceTypeToSquareToLegalAbilities[PieceType.P1_MAGE] = squareToP1MageAbilities;

  // p1 pawn abilities
  let squareToP1PawnAbilities = new Array<Array<PlayerAbility>>(constants.NUM_SQUARES)
  for(let ability_row = 0; ability_row < constants.NUM_ROWS; ability_row++) {
    for(let ability_column = 0; ability_column < constants.NUM_COLUMNS; ability_column++) {
      let srcSquareIndex = coordinatesToBoardIndex(ability_column, ability_row);
      let playerAbilities = new Array<PlayerAbility>()
      for(let dx = -1; dx < 2; dx++) {
        for(let dy = -1; dy < 2; dy++) {
          if(dx == 0 && dy == 0) continue;
          let ability_dst_x = ability_column + dx;
          let ability_dst_y = ability_row + dy;
          if(isOffBoard(ability_dst_x, ability_dst_y)) continue;
          let pa = new PlayerAbility(srcSquareIndex, coordinatesToBoardIndex(ability_dst_x, ability_dst_y));
          playerAbilities.push(pa);
        }
      }
      squareToP1PawnAbilities[srcSquareIndex] = playerAbilities;
    }
  }
  pieceTypeToSquareToLegalAbilities[PieceType.P1_PAWN] = squareToP1PawnAbilities;

  // p1 warrior abilities
  let squareToP1WarriorAbilities = new Array<Array<PlayerAbility>>(constants.NUM_SQUARES)
  for(let ability_row = 0; ability_row < constants.NUM_ROWS; ability_row++) {
    for(let ability_column = 0; ability_column < constants.NUM_COLUMNS; ability_column++) {
      let srcSquareIndex = coordinatesToBoardIndex(ability_column, ability_row);
      let playerAbilities = new Array<PlayerAbility>()
      for(let dx = -1; dx < 2; dx++) {
        for(let dy = -1; dy < 2; dy++) {
          if(dx == 0 && dy == 0) continue;
          let ability_dst_x = ability_column + dx;
          let ability_dst_y = ability_row + dy;
          if(isOffBoard(ability_dst_x, ability_dst_y)) continue;
          let pa = new PlayerAbility(srcSquareIndex, coordinatesToBoardIndex(ability_dst_x, ability_dst_y));
          playerAbilities.push(pa);
        }
      }
      squareToP1WarriorAbilities[srcSquareIndex] = playerAbilities;
    }
  }
  pieceTypeToSquareToLegalAbilities[PieceType.P1_WARRIOR] = squareToP1WarriorAbilities;

  // p1 assassin abilities
  let squareToP1AssassinAbilities = new Array<Array<PlayerAbility>>(constants.NUM_SQUARES)
  for(let ability_row = 0; ability_row < constants.NUM_ROWS; ability_row++) {
    for(let ability_column = 0; ability_column < constants.NUM_COLUMNS; ability_column++) {
      let srcSquareIndex = coordinatesToBoardIndex(ability_column, ability_row);
      let playerAbilities = new Array<PlayerAbility>()
      for(let dx = -1; dx < 2; dx++) {
        for(let dy = -1; dy < 2; dy++) {
          if(dx == 0 && dy == 0) continue;
          let ability_dst_x = ability_column + dx;
          let ability_dst_y = ability_row + dy;
          if(isOffBoard(ability_dst_x, ability_dst_y)) continue;
          let pa = new PlayerAbility(srcSquareIndex, coordinatesToBoardIndex(ability_dst_x, ability_dst_y));
          playerAbilities.push(pa);
        }
      }
      squareToP1AssassinAbilities[srcSquareIndex] = playerAbilities;
    }
  }
  pieceTypeToSquareToLegalAbilities[PieceType.P1_ASSASSIN] = squareToP1AssassinAbilities;

  // p2 king abilities
  let squareToP2KingAbilities = new Array<Array<PlayerAbility>>(constants.NUM_SQUARES)
  for(let ability_row = 0; ability_row < constants.NUM_ROWS; ability_row++) {
    for(let ability_column = 0; ability_column < constants.NUM_COLUMNS; ability_column++) {
      let srcSquareIndex = coordinatesToBoardIndex(ability_column, ability_row);
      let playerAbilities = new Array<PlayerAbility>()
      for(let dx = -1; dx < 2; dx++) {
        for(let dy = -1; dy < 2; dy++) {
          if(dx == 0 && dy == 0) continue;
          let ability_dst_x = ability_column + dx;
          let ability_dst_y = ability_row + dy;
          if(isOffBoard(ability_dst_x, ability_dst_y)) continue;
          let pa = new PlayerAbility(srcSquareIndex, coordinatesToBoardIndex(ability_dst_x, ability_dst_y));
          playerAbilities.push(pa);
        }
      }
      squareToP2KingAbilities[srcSquareIndex] = playerAbilities;
    }
  }
  pieceTypeToSquareToLegalAbilities[PieceType.P2_KING] = squareToP2KingAbilities;

  // p2 mage abilities
  let squareToP2MageAbilities = new Array<Array<PlayerAbility>>(constants.NUM_SQUARES)
  for(let ability_row = 0; ability_row < constants.NUM_ROWS; ability_row++) {
    for(let ability_column = 0; ability_column < constants.NUM_COLUMNS; ability_column++) {
      let srcSquareIndex = coordinatesToBoardIndex(ability_column, ability_row);
      let playerAbilities = new Array<PlayerAbility>()
      for(let dx = -2; dx < 3; dx++) {
        for(let dy = -2; dy < 3; dy++) {
          if(dx == 0 && dy == 0) continue;
          let ability_dst_x = ability_column + dx;
          let ability_dst_y = ability_row + dy;
          if(isOffBoard(ability_dst_x, ability_dst_y)) continue;
          let pa = new PlayerAbility(srcSquareIndex, coordinatesToBoardIndex(ability_dst_x, ability_dst_y));
          playerAbilities.push(pa);
        }
      }
      squareToP2MageAbilities[srcSquareIndex] = playerAbilities;
    }
  }
  pieceTypeToSquareToLegalAbilities[PieceType.P2_MAGE] = squareToP2MageAbilities;

  // p2 pawn abilities
  let squareToP2PawnAbilities = new Array<Array<PlayerAbility>>(constants.NUM_SQUARES)
  for(let ability_row = 0; ability_row < constants.NUM_ROWS; ability_row++) {
    for(let ability_column = 0; ability_column < constants.NUM_COLUMNS; ability_column++) {
      let srcSquareIndex = coordinatesToBoardIndex(ability_column, ability_row);
      let playerAbilities = new Array<PlayerAbility>()
      for(let dx = -1; dx < 2; dx++) {
        for(let dy = -1; dy < 2; dy++) {
          if(dx == 0 && dy == 0) continue;
          let ability_dst_x = ability_column + dx;
          let ability_dst_y = ability_row + dy;
          if(isOffBoard(ability_dst_x, ability_dst_y)) continue;
          let pa = new PlayerAbility(srcSquareIndex, coordinatesToBoardIndex(ability_dst_x, ability_dst_y));
          playerAbilities.push(pa);
        }
      }
      squareToP2PawnAbilities[srcSquareIndex] = playerAbilities;
    }
  }
  pieceTypeToSquareToLegalAbilities[PieceType.P2_PAWN] = squareToP2PawnAbilities;

  // p2 warrior abilities
  let squareToP2WarriorAbilities = new Array<Array<PlayerAbility>>(constants.NUM_SQUARES)
  for(let ability_row = 0; ability_row < constants.NUM_ROWS; ability_row++) {
    for(let ability_column = 0; ability_column < constants.NUM_COLUMNS; ability_column++) {
      let srcSquareIndex = coordinatesToBoardIndex(ability_column, ability_row);
      let playerAbilities = new Array<PlayerAbility>()
      for(let dx = -1; dx < 2; dx++) {
        for(let dy = -1; dy < 2; dy++) {
          if(dx == 0 && dy == 0) continue;
          let ability_dst_x = ability_column + dx;
          let ability_dst_y = ability_row + dy;
          if(isOffBoard(ability_dst_x, ability_dst_y)) continue;
          let pa = new PlayerAbility(srcSquareIndex, coordinatesToBoardIndex(ability_dst_x, ability_dst_y));
          playerAbilities.push(pa);
        }
      }
      squareToP2WarriorAbilities[srcSquareIndex] = playerAbilities;
    }
  }
  pieceTypeToSquareToLegalAbilities[PieceType.P2_WARRIOR] = squareToP2WarriorAbilities;

  // p2 assassin abilities
  let squareToP2AssassinAbilities = new Array<Array<PlayerAbility>>(constants.NUM_SQUARES)
  for(let ability_row = 0; ability_row < constants.NUM_ROWS; ability_row++) {
    for(let ability_column = 0; ability_column < constants.NUM_COLUMNS; ability_column++) {
      let srcSquareIndex = coordinatesToBoardIndex(ability_column, ability_row);
      let playerAbilities = new Array<PlayerAbility>()
      for(let dx = -1; dx < 2; dx++) {
        for(let dy = -1; dy < 2; dy++) {
          if(dx == 0 && dy == 0) continue;
          let ability_dst_x = ability_column + dx;
          let ability_dst_y = ability_row + dy;
          if(isOffBoard(ability_dst_x, ability_dst_y)) continue;
          let pa = new PlayerAbility(srcSquareIndex, coordinatesToBoardIndex(ability_dst_x, ability_dst_y));
          playerAbilities.push(pa);
        }
      }
      squareToP2AssassinAbilities[srcSquareIndex] = playerAbilities;
    }
  }
  pieceTypeToSquareToLegalAbilities[PieceType.P2_ASSASSIN] = squareToP2AssassinAbilities;

  // NO_PIECE abilities
  let squareToNoPieceAbilities = new Array<Array<PlayerAbility>>(constants.NUM_SQUARES)
  for(let ability_row = 0; ability_row < constants.NUM_ROWS; ability_row++) {
    for(let ability_column = 0; ability_column < constants.NUM_COLUMNS; ability_column++) {
      let srcSquareIndex = coordinatesToBoardIndex(ability_column, ability_row);
      let playerAbilities = new Array<PlayerAbility>()
      squareToNoPieceAbilities[srcSquareIndex] = playerAbilities;
    }
  }
  pieceTypeToSquareToLegalAbilities[PieceType.NO_PIECE] = squareToNoPieceAbilities;

  return pieceTypeToSquareToLegalAbilities;
}

/*
 * For index of each square, generates indices of squares that are touching it.
 * Used for mage ability.
 */
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
