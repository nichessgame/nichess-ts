import { PieceType } from './nichess'

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
