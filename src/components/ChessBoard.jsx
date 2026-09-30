import { useState, useMemo, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { giveMoveFeedback } from "../lib/moveFeedback.js";

const GOLD = "#E2694B";
const CHECK_RED = "224,91,91";

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
//   - Check and checkmate feedback: the king in check gets a red square,
//     and a checkmated board gets a subtle pulse plus a "Checkmate"
//     label. Both are read straight from the position, so they are purely
//     presentational and can never disagree with chess.js's own rules.
//   - Optional premoves: with `premoveEnabled` and an `onPremove`
//     handler, the player can queue one move while the opponent is
//     thinking. The board itself never queues anything: it only allows
//     picking up the player's own pieces when it isn't their turn, and
//     hands the (from, to) pair to the screen that owns the game.
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

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

// Where a square sits on the rendered board, as a percentage of the board.
// Accounts for orientation, because the overlay effects are positioned by
// hand rather than by react-chessboard itself.
function squareToPercent(square, boardOrientation) {
  if (!square || square.length !== 2) return null;
  const file = FILES.indexOf(square[0]);
  const rank = Number(square[1]) - 1;
  if (file < 0 || rank < 0 || rank > 7) return null;
  const col = boardOrientation === "black" ? 7 - file : file;
  const row = boardOrientation === "black" ? rank : 7 - rank;
  return { left: col * 12.5, top: row * 12.5 };
}

// A position with the side to move flipped. Used only to decide whether a
// queued premove would be legal once it becomes the player's turn; nothing
// from this instance is ever played on the real board.
function flippedPosition(fen) {
  if (!fen) return null;
  const parts = fen.trim().split(/\s+/);
  if (parts.length < 2) return null;
  const next = [...parts];
  next[1] = parts[1] === "w" ? "b" : "w";
  if (next[3] !== undefined) next[3] = "-"; // en passant right does not carry over
  try {
    return new Chess(next.join(" "));
  } catch {
    return null;
  }
}

export default function ChessBoard({
  fen, onPieceDrop, boardOrientation = "white", theme, boardWidth = DEFAULT_BOARD_WIDTH,
  arePiecesDraggable = true, onSquareTap, squareHighlights, animationDuration = 300,
  playerColor = "w", premoveEnabled = false, premove = null, onPremove,
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

  // While the opponent is thinking (or moving), premove mode generates the
  // player's legal destinations from the same position with the side to
  // move flipped, which is what lets a premove be picked up at all.
  const premoveRef = useMemo(() => (premoveEnabled ? flippedPosition(fen) : null), [fen, premoveEnabled]);

  const opponentToMove = !!chessRef && chessRef.turn() !== playerColor;
  const gen = premoveEnabled && opponentToMove && premoveRef ? premoveRef : chessRef;

  const isCheck = !!chessRef && chessRef.isCheck() && !chessRef.isCheckmate();
  const isCheckmate = !!chessRef && chessRef.isCheckmate();
  const matedKingSquare = useMemo(() => {
    if (!chessRef || (!isCheck && !isCheckmate)) return null;
    const turn = chessRef.turn();
    for (const row of chessRef.board()) {
      for (const sq of row) {
        if (sq && sq.type === "k" && sq.color === turn) return sq.square;
      }
    }
    return null;
  }, [chessRef, isCheck, isCheckmate]);

  // Any position change (our own move, the opponent's move, engine reply,
  // undo, reset, etc.) means whatever was selected no longer applies.
  useEffect(() => {
    setSelectedSquare(null);
  }, [fen]);

  function legalTargets(square) {
    if (!gen || !square) return [];
    try {
      return [...new Set(gen.moves({ square, verbose: true }).map((m) => m.to))];
    } catch {
      return [];
    }
  }

  const selectedTargets = useMemo(() => legalTargets(selectedSquare), [selectedSquare, gen]); // eslint-disable-line react-hooks/exhaustive-deps

  function isOwnMovablePiece(square) {
    if (!gen) return false;
    const piece = gen.get(square);
    return !!piece && piece.color === gen.turn();
  }

  const canMovePieces = arePiecesDraggable && typeof onPieceDrop === "function" && !!gen;

  function handlePieceDrop(source, target) {
    setSelectedSquare(null);
    if (!canMovePieces) return false;
    // Reject anything that isn't a legal destination for that piece before
    // it ever reaches the screen's handler, this is what guarantees the
    // piece snaps back on a wrong drop instead of hanging in place.
    if (!legalTargets(source).includes(target)) return false;
    if (premoveEnabled && opponentToMove && typeof onPremove === "function") {
      onPremove(source, target);
      return true;
    }
    const accepted = onPieceDrop(source, target);
    if (accepted) giveMoveFeedback();
    return accepted;
  }

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
      handlePieceDrop(from, square);
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
        const isCapture = gen && !!gen.get(sq);
        styles[sq] = isCapture
          ? { boxShadow: `inset 0 0 0 4px rgba(226,105,75,0.75)` }
          : { boxShadow: `inset 0 0 0 0px transparent`, backgroundImage: "radial-gradient(circle, rgba(226,105,75,0.55) 18%, transparent 20%)" };
      }
    }
    if (premove?.from) {
      styles[premove.from] = { boxShadow: `inset 0 0 0 3px rgba(74,99,194,0.85)` };
      if (premove.to) {
        styles[premove.to] = {
          boxShadow: `inset 0 0 0 3px rgba(74,99,194,0.55)`,
          backgroundImage: "radial-gradient(circle, rgba(74,99,194,0.4) 16%, transparent 19%)",
        };
      }
    }
    if (matedKingSquare && isCheckmate) {
      styles[matedKingSquare] = {
        boxShadow: `inset 0 0 0 4px rgba(${CHECK_RED},0.95)`,
        backgroundImage: `radial-gradient(circle, rgba(${CHECK_RED},0.5) 26%, rgba(${CHECK_RED},0.12) 62%)`,
      };
    } else if (matedKingSquare && isCheck) {
      styles[matedKingSquare] = {
        boxShadow: `inset 0 0 0 3px rgba(${CHECK_RED},0.9)`,
        backgroundImage: `radial-gradient(circle, rgba(${CHECK_RED},0.35) 30%, transparent 68%)`,
      };
    }
    return squareHighlights ? { ...styles, ...squareHighlights } : styles;
  }, [selectedSquare, selectedTargets, gen, squareHighlights, premove, matedKingSquare, isCheck, isCheckmate]);

  const matePos = isCheckmate ? squareToPercent(matedKingSquare, boardOrientation) : null;
  const checkPos = !isCheckmate && isCheck ? squareToPercent(matedKingSquare, boardOrientation) : null;

  return (
    <div style={{ position: "relative", width: safeWidth, height: safeWidth }}>
      <Chessboard
        position={fen}
        onPieceDrop={handlePieceDrop}
        onSquareClick={handleSquareClick}
        boardOrientation={boardOrientation}
        boardWidth={safeWidth}
        animationDuration={animationDuration}
        arePiecesDraggable={arePiecesDraggable}
        customSquareStyles={customSquareStyles}
        customBoardStyle={{
          borderRadius: 4,
          boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
        }}
        customDarkSquareStyle={{ backgroundColor: theme?.dark || "#8B5E3C" }}
        customLightSquareStyle={{ backgroundColor: theme?.light || "#EDE6D6" }}
      />

      {(checkPos || matePos) && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: `${(checkPos || matePos).left}%`,
            top: `${(checkPos || matePos).top}%`,
            width: "12.5%",
            height: "12.5%",
            pointerEvents: "none",
            borderRadius: 4,
            animation: matePos ? "chk-mate-pulse 1.5s ease-out 2" : "chk-check-pulse 1.6s ease-in-out infinite",
            boxShadow: matePos
              ? `inset 0 0 0 3px rgba(${CHECK_RED},0.95)`
              : `inset 0 0 0 2px rgba(${CHECK_RED},0.85)`,
          }}
        />
      )}

      {isCheckmate && (
        <>
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              borderRadius: 4,
              background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0) 30%, rgba(224,91,91,0.16) 100%)",
              animation: "chk-mate-veil 700ms ease-out 1",
            }}
          />
          <div
            role="status"
            aria-live="assertive"
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              padding: "10px 22px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.94)",
              border: `1px solid rgba(${CHECK_RED},0.55)`,
              boxShadow: "0 10px 30px rgba(43,38,32,0.22)",
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 700,
              fontSize: 17,
              letterSpacing: "0.01em",
              color: "#B23B3B",
              animation: "chk-mate-label 620ms cubic-bezier(0.2, 0.9, 0.3, 1.15) 1",
            }}
          >
            Checkmate
          </div>
        </>
      )}
    </div>
  );
}
