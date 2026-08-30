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
export default function ChessBoard({ fen, onPieceDrop, boardOrientation = "white", theme, boardWidth = 420, arePiecesDraggable = true }) {
  const [selectedSquare, setSelectedSquare] = useState(null);

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

  function handleSquareClick(square) {
    if (!arePiecesDraggable || typeof onPieceDrop !== "function" || !chessRef) return;

    if (!selectedSquare) {
      if (isOwnMovablePiece(square)) setSelectedSquare(square);
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
    setSelectedSquare(isOwnMovablePiece(square) ? square : null);
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
    return styles;
  }, [selectedSquare, selectedTargets, chessRef]);

  return (
    <Chessboard
      position={fen}
      onPieceDrop={handlePieceDrop}
      onSquareClick={handleSquareClick}
      boardOrientation={boardOrientation}
      boardWidth={boardWidth}
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
