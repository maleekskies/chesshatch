import { useState, useMemo, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { giveMoveFeedback } from "../lib/moveFeedback.js";

const GOLD = "#E2694B";

// Thin wrapper around react-chessboard so every screen in the app uses
// the same clean, standard Staunton piece set (the library's default,
// the same visual family as Lichess/Chess.com) and the same theme-color
// wiring, instead of each screen reinventing board styling.
//
// This is also the single place that owns move interaction, so every
// screen gets the same behavior for free:
//   - Drag-and-drop, same as before.
//   - Click-to-move: click a piece to select it (legal destinations get
//     highlighted), then click a destination to move there. Click the
//     selected piece again, or click elsewhere, to deselect.
//   - Guaranteed snap-back: a drag that ends on a square that isn't a
//     legal destination is rejected before it ever reaches the parent's
//     onPieceDrop, so the piece always animates back to its original
//     square instead of hanging on the drop square.
//
// `onPieceDrop(from, to)` is called for both a valid drag-drop AND a
// completed click-to-move sequence, every screen already implements
// that one handler, so no screen needs to change to get either feature.
//
// Two opt-in extras for the beginner course, both additive so no existing
// screen changes behavior:
//   - `onSquareTap(square)`: fires for any tap that isn't being used to
//     pick up or move a piece. That gives the square-naming lessons a way
//     to ask "tap e4" without inventing a second board component.
//   - `squareHighlights`: extra per-square styles (correct/incorrect
//     feedback) merged on top of the selection styles.
// Every board in the app is sized from window.innerWidth, and innerWidth can
// briefly read 0 or 1 (a hidden tab, a zero-width iframe, some screenshot and
// print paths). `innerWidth - 48` then goes negative, and react-chessboard
// renders that straight through as negative SVG width/height attributes and
// spams the console. Clamping here means no screen can ever hand the board a
// width that isn't a real size.
const MIN_BOARD_WIDTH = 200;
const DEFAULT_BOARD_WIDTH = 420;

export default function ChessBoard({
  fen, onPieceDrop, boardOrientation = "white", theme, boardWidth = DEFAULT_BOARD_WIDTH,
  arePiecesDraggable = true, onSquareTap, squareHighlights,
}) {
  const [selectedSquare, setSelectedSquare] = useState(null);
  const safeWidth = Number.isFinite(boardWidth) && boardWidth > 0
    ? Math.max(MIN_BOARD_WIDTH, Math.round(boardWidth))
    : DEFAULT_BOARD_WIDTH;

  // Rebuild the read-only validation instance whenever the position
  // changes, so legal-move highlighting and the snap-back check always
  // reflect the position actually on the board right now.
  const chessRef = useMemo(() => {
    try {
      return new Chess(fen);
    } catch {
      return null;
    }
  }, [fen]);

  // Any position change (our own move, the opponent's move, engine reply,
  // undo, reset, etc.) means whatever was selected no longer applies.
  useEffect(() => {
    setSelectedSquare(null);
  }, [fen]);

  function legalTargets(square) {
    if (!chessRef || !square) return [];
    try {
      return [...new Set(chessRef.moves({ square, verbose: true }).map((m) => m.to))];
    } catch {
      return [];
    }
  }

  const selectedTargets = useMemo(() => legalTargets(selectedSquare), [selectedSquare, chessRef]); // eslint-disable-line react-hooks/exhaustive-deps

  function isOwnMovablePiece(square) {
    if (!chessRef) return false;
    const piece = chessRef.get(square);
    return !!piece && piece.color === chessRef.turn();
  }

  function handlePieceDrop(source, target) {
    setSelectedSquare(null);
    if (!arePiecesDraggable || typeof onPieceDrop !== "function") return false;
    // Reject anything that isn't a legal destination for that piece before
    // it ever reaches the screen's handler, this is what guarantees the
    // piece snaps back on a wrong drop instead of hanging in place.
    if (!legalTargets(source).includes(target)) return false;
    const accepted = onPieceDrop(source, target);
    if (accepted) giveMoveFeedback();
    return accepted;
  }

  // Can this tap be used to pick up or move a piece at all? On a board
  // that isn't accepting moves (a lesson's "tap the square" step, or a
  // read-only preview board) every tap is just a tap.
  const canMovePieces = arePiecesDraggable && typeof onPieceDrop === "function" && !!chessRef;

  function handleSquareClick(square) {
    if (!canMovePieces) {
      onSquareTap?.(square);
      return;
    }

    if (!selectedSquare) {
      if (isOwnMovablePiece(square)) setSelectedSquare(square);
      else onSquareTap?.(square);
      return;
    }

    if (square === selectedSquare) {
      setSelectedSquare(null);
      return;
    }

    if (selectedTargets.includes(square)) {
      const from = selectedSquare;
      setSelectedSquare(null);
      const accepted = onPieceDrop(from, square);
      if (accepted) giveMoveFeedback();
      return;
    }

    // Clicked a different square that isn't a legal target: if it's
    // another of the mover's own pieces, switch the selection to it;
    // otherwise just deselect.
    const ownPiece = isOwnMovablePiece(square);
    setSelectedSquare(ownPiece ? square : null);
    if (!ownPiece) onSquareTap?.(square);
  }

  const customSquareStyles = useMemo(() => {
    const styles = {};
    if (selectedSquare) {
      styles[selectedSquare] = { boxShadow: `inset 0 0 0 3px ${GOLD}` };
      for (const sq of selectedTargets) {
        const isCapture = chessRef && !!chessRef.get(sq);
        styles[sq] = isCapture
          ? { boxShadow: `inset 0 0 0 4px rgba(226,105,75,0.75)` }
          : { boxShadow: `inset 0 0 0 0px transparent`, backgroundImage: "radial-gradient(circle, rgba(226,105,75,0.55) 18%, transparent 20%)" };
      }
    }
    return squareHighlights ? { ...styles, ...squareHighlights } : styles;
  }, [selectedSquare, selectedTargets, chessRef, squareHighlights]);

  return (
    <Chessboard
      position={fen}
      onPieceDrop={handlePieceDrop}
      onSquareClick={handleSquareClick}
      boardOrientation={boardOrientation}
      boardWidth={safeWidth}
      arePiecesDraggable={arePiecesDraggable}
      customSquareStyles={customSquareStyles}
      customBoardStyle={{
        borderRadius: 4,
        boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
      }}
      customDarkSquareStyle={{ backgroundColor: theme?.dark || "#8B5E3C" }}
      customLightSquareStyle={{ backgroundColor: theme?.light || "#EDE6D6" }}
    />
  );
}
