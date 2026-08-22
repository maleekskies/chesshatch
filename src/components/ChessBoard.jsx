import { Chessboard } from "react-chessboard";

// Thin wrapper around react-chessboard so every screen in the app uses
// the same clean, standard Staunton piece set (the library's default —
// the same visual family as Lichess/Chess.com) and the same theme-color
// wiring, instead of each screen reinventing board styling.
export default function ChessBoard({ fen, onPieceDrop, boardOrientation = "white", theme, boardWidth = 420, arePiecesDraggable = true }) {
  return (
    <Chessboard
      position={fen}
      onPieceDrop={onPieceDrop}
      boardOrientation={boardOrientation}
      boardWidth={boardWidth}
      arePiecesDraggable={arePiecesDraggable}
      customBoardStyle={{
        borderRadius: 4,
        boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
      }}
      customDarkSquareStyle={{ backgroundColor: theme?.dark || "#8B5E3C" }}
      customLightSquareStyle={{ backgroundColor: theme?.light || "#EDE6D6" }}
    />
  );
}
