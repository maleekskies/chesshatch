// Tier 1 (Complete Beginner) lesson content. Every FEN + solution move
// below was hand-verified with an independent move checker before
// shipping (see the verification script used during development) —
// a wrong puzzle actively mis-teaches a beginner, which matters more
// here than almost anywhere else in the app.

export const TIER1_LESSONS = [
  {
    id: "how-pieces-move-knight",
    title: "How the Knight Moves",
    tier: 1,
    category: "Rules & Movement",
    explanation:
      "The knight moves in an L-shape: two squares in one direction, then one square to the side. It's the only piece that can jump over other pieces. Try moving the knight below to different legal squares.",
    fen: "8/8/8/3N4/8/8/8/8 w - - 0 1",
    freePlay: true,
  },
  {
    id: "how-pieces-move-bishop",
    title: "How the Bishop Moves",
    tier: 1,
    category: "Rules & Movement",
    explanation:
      "The bishop moves diagonally, any number of squares, but always stays on the same color square it started on. Try moving it around — notice it can never reach the light squares if it started on a dark one.",
    fen: "8/8/8/3B4/8/8/8/8 w - - 0 1",
    freePlay: true,
  },
  {
    id: "check-and-checkmate",
    title: "Check, Checkmate & Stalemate",
    tier: 1,
    category: "Checkmate Patterns",
    explanation:
      "Check means the king is under attack and must move out of danger, block the attack, or capture the attacker. Checkmate means there's no way to escape — the game ends. Stalemate means the player to move has no legal moves at all but isn't in check — that's a draw, not a win. In this position, Black's king is boxed in by its own pawns. Find White's move that delivers checkmate.",
    fen: "6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1",
    goal: "checkmate",
    solutionSquares: ["e1e8"],
    hint: "The black king has no escape square along the back rank — which of your pieces controls that whole rank?",
  },
  {
    id: "back-rank-mate",
    title: "Back-Rank Mate Pattern",
    tier: 1,
    category: "Checkmate Patterns",
    explanation:
      "One of the four basic checkmate patterns: when a king is trapped behind its own pawns with no escape square, a rook or queen on the back rank delivers mate. This is one of the most common ways beginners get checkmated — and one of the easiest to deliver once you recognize it.",
    fen: "6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1",
    goal: "checkmate",
    solutionSquares: ["d1d8"],
    hint: "Same idea as before — where can your rook land on the back rank?",
  },
  {
    id: "motif-pin",
    title: "Tactic: The Pin",
    tier: 1,
    category: "Tactics",
    explanation:
      "A pin happens when a piece can't safely move because doing so would expose a more valuable piece behind it on the same line — often the king. Here, the black knight and king share a diagonal. Find the bishop move that pins the knight in place.",
    fen: "r3k3/8/2n5/8/8/8/4B3/7K w - - 0 1",
    goal: "bestMove",
    solutionSquares: ["e2b5"],
    hint: "Which diagonal does the black knight share with the black king?",
  },
  {
    id: "motif-fork",
    title: "Tactic: The Fork",
    tier: 1,
    category: "Tactics",
    explanation:
      "A fork is a single move that attacks two enemy pieces at once — the knight is especially dangerous here because of its unusual jumping movement. Find the knight move that attacks both the black king and the black rook at the same time.",
    fen: "8/2r1k3/8/8/1N6/8/8/7K w - - 0 1",
    goal: "bestMove",
    solutionSquares: ["b4d5"],
    hint: "Look for a knight move that gives check while also lining up with the rook.",
  },
];

// Puzzle set shown after a lesson (the "lesson-to-play loop" from the
// blueprint). In the real build these come tagged by motif/rating from
// the Lichess open puzzle database (CC0) — this is a small hand-verified
// starter set standing in for that until the full import is wired up.
export const SAMPLE_PUZZLES = [
  {
    id: "puzzle-fork-1",
    motif: "fork",
    fen: "4k3/3r4/8/8/6N1/8/8/7K w - - 0 1",
    solutionSquares: ["g4f6"],
    explanation: "The knight jumps to f6, forking the king (check) and the rook on d7.",
  },
  {
    id: "puzzle-hanging-1",
    motif: "hanging piece",
    fen: "4k3/8/8/3q4/8/8/3R4/4K3 w - - 0 1",
    solutionSquares: ["d2d5"],
    explanation: "The black queen on d5 is completely undefended — the rook simply takes it.",
  },
];

export const TIER2_LESSONS = [
  {
    id: "motif-discovered-attack",
    title: "Tactic: Discovered Attack",
    tier: 2,
    category: "Tactics",
    explanation:
      "A discovered attack happens when moving one piece out of the way reveals an attack from a different piece behind it — the moving piece doesn't even need to do anything special itself. Here, your knight is blocking your own rook's view of the black king. Move the knight anywhere legal and watch what happens.",
    fen: "k7/8/8/8/N7/8/8/R3K3 w - - 0 1",
    goal: "bestMove",
    solutionSquares: ["a4b2", "a4b6", "a4c3", "a4c5"],
    hint: "Your rook on a1 is aimed straight at the black king — what's in the way?",
  },
  {
    id: "motif-double-attack-queen",
    title: "Tactic: Double Attack with the Queen",
    tier: 2,
    category: "Tactics",
    explanation:
      "The queen combines the rook's and bishop's movement, which makes her especially good at attacking two things at once from a single central square. Find the queen move that attacks both the black rook and the black bishop at the same time.",
    fen: "6k1/3b4/8/r7/8/8/8/3QK3 w - - 0 1",
    goal: "bestMove",
    solutionSquares: ["d1d4"],
    hint: "Look for a central square that shares a file with one enemy piece and a rank with the other.",
  },
  {
    id: "positional-outposts",
    title: "Positional Idea: Outposts",
    tier: 2,
    category: "Positional Ideas",
    explanation:
      "An outpost is a square — usually in enemy territory — where your piece (often a knight) can sit safely because no enemy pawn can ever kick it away. Pieces on a strong outpost are hard to dislodge and can dominate the game from one square. Move the knight to d5 and notice: no black pawn on c-file or e-file can ever attack it there.",
    fen: "4k3/1p3p2/8/3N4/8/8/1P3P2/4K3 w - - 0 1",
    freePlay: true,
  },
  {
    id: "positional-weak-squares",
    title: "Positional Idea: Weak Squares",
    tier: 2,
    category: "Positional Ideas",
    explanation:
      "A weak square is one that can never be defended by a pawn, usually because the pawns that would guard it have already moved or been traded off. Weak squares right next to the enemy king are especially dangerous, since a piece parked there can support an attack for the rest of the game. Look at this position and notice the holes in front of Black's king.",
    fen: "5k2/4p3/8/8/8/8/4P3/5K2 w - - 0 1",
    freePlay: true,
  },
];
