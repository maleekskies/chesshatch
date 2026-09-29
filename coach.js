// Chess Hatch live coach, rule-based move feedback for beginners.
// Deliberately independent of chess.js's turn-based legal-move generator,
// because "is this square attacked/defended" needs to be checked for
// EITHER color regardless of whose turn it is. Works directly off the
// board array chess.board() returns.

const PIECE_NAMES = { p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" };
const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

function inBounds(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

function slideAttacks(board, r, c, dirs, targetR, targetC) {
  for (const [dr, dc] of dirs) {
    let nr = r + dr, nc = c + dc;
    while (inBounds(nr, nc)) {
      if (nr === targetR && nc === targetC) return true;
      if (board[nr][nc]) break; // blocked, ray stops here either way
      nr += dr; nc += dc;
    }
  }
  return false;
}

// Does the piece at (r,c) attack (targetR,targetC)? Attack, not "legal move".
// pawns count diagonals even onto empty squares, since that's what "defended" means.
function pieceAttacks(board, r, c, targetR, targetC) {
  const piece = board[r][c];
  if (!piece) return false;
  const { type, color } = piece;

  if (type === "p") {
    const dir = color === "w" ? -1 : 1;
    return (r + dir === targetR) && (Math.abs(c - targetC) === 1);
  }
  if (type === "n") {
    const dr = Math.abs(r - targetR), dc = Math.abs(c - targetC);
    return (dr === 1 && dc === 2) || (dr === 2 && dc === 1);
  }
  if (type === "b") return slideAttacks(board, r, c, [[-1,-1],[-1,1],[1,-1],[1,1]], targetR, targetC);
  if (type === "r") return slideAttacks(board, r, c, [[-1,0],[1,0],[0,-1],[0,1]], targetR, targetC);
  if (type === "q") return slideAttacks(board, r, c, [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]], targetR, targetC);
  if (type === "k") return Math.abs(r - targetR) <= 1 && Math.abs(c - targetC) <= 1 && !(r === targetR && c === targetC);
  return false;
}

export function squareAttackedBy(board, targetR, targetC, byColor) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.color === byColor && pieceAttacks(board, r, c, targetR, targetC)) return { r, c, piece: p };
    }
  }
  return null;
}

export function squareToRC(square) {
  const file = square[0], rank = parseInt(square[1], 10);
  return [8 - rank, FILES.indexOf(file)];
}
export function rcToSquare(r, c) { return `${FILES[c]}${8 - r}`; }

// Piece "value", used only to decide if a hanging piece is worth flagging
// loudly (losing a queen matters more than a pawn push into a defended pawn).
const VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

/**
 * Analyze the move that was just made and return a coach message, or null
 * if nothing worth flagging. `board` is chess.board() AFTER the move.
 * `moverColor` is the color that just moved. `toSquare` is where their
 * piece landed, e.g. "e5".
 */
export function analyzeMove({ board, moverColor, toSquare, isCheck, isCheckmate, isStalemate }) {
  if (isCheckmate) return { tone: "result", text: "Checkmate, the game is over." };
  if (isStalemate) return { tone: "result", text: "Stalemate, the game is drawn." };

  const [tr, tc] = squareToRC(toSquare);
  const movedPiece = board[tr][tc];
  if (!movedPiece) return null;

  const opponentColor = moverColor === "w" ? "b" : "w";
  const attacker = squareAttackedBy(board, tr, tc, opponentColor);
  const defender = squareAttackedBy(board, tr, tc, moverColor);

  if (attacker && !defender && VALUE[movedPiece.type] > 0) {
    const attackerName = PIECE_NAMES[attacker.piece.type];
    const attackerSquare = rcToSquare(attacker.r, attacker.c);
    return {
      tone: "warning",
      text: `Careful, your ${PIECE_NAMES[movedPiece.type]} on ${toSquare} is undefended, and their ${attackerName} on ${attackerSquare} can take it for free.`,
    };
  }

  if (attacker && defender && VALUE[attacker.piece.type] < VALUE[movedPiece.type]) {
    return {
      tone: "notice",
      text: `Watch that trade, your ${PIECE_NAMES[movedPiece.type]} on ${toSquare} is defended, but their ${PIECE_NAMES[attacker.piece.type]} is worth less, so trading there favors them.`,
    };
  }

  if (isCheck) {
    return { tone: "good", text: "Check! Make sure this actually improves your position and isn't just a free tempo for them." };
  }

  return null;
}
