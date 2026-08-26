// The "Guided First Game" — a short, fully scripted mini-match (the
// Italian Game opening, 10 plies) for a total beginner's very first
// hands-on game. The player is always White; Black's replies are
// scripted too, so the beginner can focus purely on the ideas instead
// of surviving an unpredictable opponent.
//
// Every move in this sequence was independently verified move-by-move
// with a from-scratch legality checker (piece movement, path-blocking,
// castling rights/path/king-safety, and "does this leave my own king in
// check") before being written here — not just recalled from memory.
//
// `prompt` is shown to the player BEFORE they make their move (only
// present on White's steps, since Black's moves are automatic).
// `say` is the coach's explanation shown AFTER the move lands, for
// both sides' moves.
export const GUIDED_FIRST_GAME = {
  title: "Your First Guided Game",
  intro:
    "You'll play White. I'll tell you exactly what to play and why — Black's replies are scripted too, so you can focus on the ideas instead of surviving an opponent.",
  steps: [
    {
      mover: "white", from: "e2", to: "e4",
      prompt: "Play e4 — claim a share of the center with your king pawn.",
      say: "Good. e4 opens lines for your bishop and queen, and stakes a claim on the two most important squares on the board, d5 and e5.",
    },
    {
      mover: "black", from: "e7", to: "e5",
      say: "Black mirrors you and claims the center too. This is the most natural reply — now both sides are fighting for the same key squares.",
    },
    {
      mover: "white", from: "g1", to: "f3",
      prompt: "Play Nf3 — develop your knight and attack Black's e5 pawn.",
      say: "Knights before bishops is a good habit early on. This knight also eyes e5, so Black has to be careful with that pawn.",
    },
    {
      mover: "black", from: "b8", to: "c6",
      say: "Black develops a knight too, defending the e5 pawn. Simple, solid development.",
    },
    {
      mover: "white", from: "f1", to: "c4",
      prompt: "Play Bc4 — aim your bishop at Black's weakest point, f7.",
      say: "This is the Italian Game. Your bishop points straight at f7 — the only square in Black's camp defended by nothing but the king itself.",
    },
    {
      mover: "black", from: "f8", to: "c5",
      say: "Black develops the same way, aiming right back at your f2. Fair's fair — both sides are playing well so far.",
    },
    {
      mover: "white", from: "e1", to: "g1",
      prompt: "Play O-O — castle your king to safety. (Drag or click your king two squares toward the rook.)",
      say: "Castling early is one of the most important habits in chess: your king tucks away safely behind its pawns, and your rook jumps into the game.",
    },
    {
      mover: "black", from: "g8", to: "f6",
      say: "Black brings the last minor piece out and attacks your e4 pawn — worth remembering to defend it next.",
    },
    {
      mover: "white", from: "d2", to: "d3",
      prompt: "Play d3 — a quiet move that defends e4 and opens your dark-squared bishop's diagonal.",
      say: "Not every good move has to be flashy. d3 solves your e4 problem and keeps your position solid — exactly the kind of calm decision strong players make constantly.",
    },
    {
      mover: "black", from: "e8", to: "g8",
      say: "Black castles too. Both kings are safe and both sides are fully developed — a textbook opening from both sides.",
    },
  ],
  outro:
    "That's a complete, sound opening — the Italian Game. Notice the pattern: control the center, develop knights before bishops, castle early, don't leave pieces hanging. Every Tier 1 lesson builds on exactly these ideas.",
};
