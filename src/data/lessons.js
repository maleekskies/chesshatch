// Tier 1 (Complete Beginner) lesson content. Every FEN and solution
// move below was hand-verified with an independent move checker
// before shipping (see the verification script used during
// development). A wrong puzzle actively mis-teaches a beginner, which
// matters more here than almost anywhere else in the app.

export const TIER1_LESSONS = [
  {
    id: "how-pieces-move-pawn",
    title: "How the Pawn Moves",
    tier: 1,
    category: "Rules & Movement",
    explanation:
      "The pawn moves straight forward, one square at a time. On its very first move only, it can move two squares forward instead of one. The pawn is the only piece that captures differently than it moves: it captures one square diagonally forward, never straight ahead. Try moving the white pawn forward, then try capturing the black pawn diagonally.",
    fen: "7k/8/8/8/8/5p2/4P3/K7 w - - 0 1",
    freePlay: true,
  },
  {
    id: "how-pieces-move-knight",
    title: "How the Knight Moves",
    tier: 1,
    category: "Rules & Movement",
    explanation:
      "The knight moves in an L-shape: two squares in one direction, then one square to the side. It's the only piece that can jump over other pieces. Try moving the knight below to different legal squares.",
    fen: "7k/8/8/3N4/8/8/8/K7 w - - 0 1",
    freePlay: true,
  },
  {
    id: "how-pieces-move-bishop",
    title: "How the Bishop Moves",
    tier: 1,
    category: "Rules & Movement",
    explanation:
      "The bishop moves diagonally, any number of squares, but always stays on the same color square it started on. Try moving it around. Notice it can never reach the light squares if it started on a dark one.",
    fen: "7k/8/8/3B4/8/8/8/K7 w - - 0 1",
    freePlay: true,
  },
  {
    id: "how-pieces-move-rook",
    title: "How the Rook Moves",
    tier: 1,
    category: "Rules & Movement",
    explanation:
      "The rook moves in a straight line, forward, backward, left, or right, any number of squares. It cannot move diagonally and cannot jump over other pieces. Try moving the rook along its rank and file.",
    fen: "7k/8/8/3R4/8/8/8/K7 w - - 0 1",
    freePlay: true,
  },
  {
    id: "how-pieces-move-queen",
    title: "How the Queen Moves",
    tier: 1,
    category: "Rules & Movement",
    explanation:
      "The queen combines the rook's movement and the bishop's movement into one piece. She can move in a straight line like a rook, or diagonally like a bishop, any number of squares, in any direction. This makes her the most powerful piece on the board. Try moving the queen in as many different directions as you can find.",
    fen: "7k/8/8/3Q4/8/8/8/K7 w - - 0 1",
    freePlay: true,
  },
  {
    id: "how-pieces-move-king",
    title: "How the King Moves",
    tier: 1,
    category: "Rules & Movement",
    explanation:
      "The king moves one square in any direction: forward, backward, sideways, or diagonally. It's the weakest piece in terms of movement, but it's also the piece the whole game revolves around, since losing it means losing the game. The king can never move onto a square that an enemy piece attacks, and it can never move right next to the other king. Try moving the king around and notice how much smaller its range is compared to the other pieces.",
    fen: "7k/8/8/8/3K4/8/8/8 w - - 0 1",
    freePlay: true,
  },
  {
    id: "piece-values",
    title: "How Much Is Each Piece Worth",
    tier: 1,
    category: "Piece Values",
    explanation:
      "Every piece except the king has a rough point value, which is how players compare pieces when deciding whether a trade is worth it. A pawn is worth 1 point. A knight or a bishop is worth about 3 points each, close enough that most players treat them as equal. A rook is worth about 5 points. A queen is worth about 9 points, more than a rook and a minor piece combined. The king has no point value at all, since it can never be captured or traded away: losing it ends the game. These numbers are a guide, not a strict rule. A knight planted on a perfect square can matter more than its number suggests, and a queen stuck in a bad spot can matter less. Look at the row of pieces below and get a feel for how their value relates to how far and how freely each one can move.",
    fen: "7k/8/8/8/8/8/PNBRQ3/K7 w - - 0 1",
    freePlay: true,
  },
  {
    id: "trading-pieces",
    title: "Should You Make This Trade",
    tier: 1,
    category: "Piece Values",
    explanation:
      "Now that you know the point values, here's how to use them. A trade is worth making when you gain more value than you give up, or at least break even. Trading your knight (3 points) for an opponent's rook (5 points) is a clear win. Trading your queen (9 points) for a pawn (1 point) is a disaster, even if it feels exciting in the moment. Equal trades, like knight for knight or rook for rook, are usually fine and often just simplify the position. Value isn't the only thing that matters though: sometimes giving up a small amount of material is worth it for a strong attack, and sometimes keeping an actively placed piece is worth more than the points on paper suggest. As a starting habit though, always count the points before you capture something. In the position below, the black queen on c6 is completely undefended. Capture it with your knight and think about just how good a trade that is: a 3 point piece winning a 9 point piece for free.",
    fen: "7k/8/2q5/8/3N4/8/8/K7 w - - 0 1",
    freePlay: true,
  },
  {
    id: "qa-en-passant",
    title: "What Is En Passant",
    tier: 1,
    category: "Chess Rules Q&A",
    qa: true,
    question:
      "A white pawn just moved two squares forward, landing right beside a black pawn on the same rank. On the very next move, can the black pawn capture it diagonally, even though the white pawn never landed on the square it captures on?",
    answer:
      "Yes, and this special rule is called en passant, French for in passing. If a pawn moves two squares forward from its starting position and lands beside an enemy pawn, that enemy pawn may capture it exactly as if it had only moved one square forward instead of two. The catch is timing: this capture is only legal on the very next move. If you don't take it immediately, you lose the right to take it at all. In the position shown, White just played the pawn to e4. Black's pawn on d4 can capture it by moving to e3, exactly as if the white pawn had only moved to e3 in the first place.",
    fen: "7k/8/8/8/3pP3/8/8/K7 b - e3 0 1",
  },
  {
    id: "qa-promotion",
    title: "What Happens When a Pawn Reaches the End",
    tier: 1,
    category: "Chess Rules Q&A",
    qa: true,
    question:
      "If a pawn manages to reach the very last rank of the board, all the way across, what happens to it? Does it just stop there?",
    answer:
      "No, it promotes. When a pawn reaches the last rank (the 8th rank for White, the 1st rank for Black), it must immediately turn into a different piece: a queen, rook, bishop, or knight, your choice. Almost every promotion is to a queen, since it's the most powerful piece, but there are rare situations where promoting to a knight or rook is actually the stronger choice. There's no limit on how many of a piece you can have this way. You could end up with two queens, or even more, if you promote several pawns in the same game. In the position shown, White's pawn on a7 can push straight to a8 to promote, or capture the rook on b8 while promoting at the same time, both are legal.",
    fen: "1r5k/P7/8/8/8/8/8/4K3 w - - 0 1",
  },
  {
    id: "qa-castling",
    title: "What Are the Rules for Castling",
    tier: 1,
    category: "Chess Rules Q&A",
    qa: true,
    question:
      "Castling looks like the king breaking its own one square movement rule, moving two squares at once while a rook jumps to the other side of it. What actually has to be true for this move to be legal?",
    answer:
      "Several conditions all have to be true at once. Neither the king nor the rook you're castling with has moved yet at any earlier point in the game, even if they're back on their original squares now. There must be no pieces at all between the king and that rook. The king cannot currently be in check. And the king cannot pass through, or land on, any square that an enemy piece attacks, even if it isn't in check right now. If all of that holds, the king moves two squares toward the rook, and the rook jumps to the square right next to the king on the other side. In the position shown, White can castle kingside: the king moves from e1 to g1, and the rook jumps from h1 to f1.",
    fen: "4k3/8/8/8/8/8/8/4K2R w K - 0 1",
  },
  {
    id: "qa-threefold-repetition",
    title: "What Is Threefold Repetition",
    tier: 1,
    category: "Chess Rules Q&A",
    qa: true,
    question:
      "Sometimes a game ends in a draw even though neither side is out of moves and neither king is in danger. One way this happens is called threefold repetition. What does that actually mean?",
    answer:
      "If the exact same position occurs three separate times during a game, with the same player to move each time and the same castling and en passant rights available, either player can claim a draw. It doesn't need to happen on three moves in a row, the three occurrences just need to happen at some point in the game. This rule exists so that a player who's stuck, or who wants to force a draw from a worse position, has a fair way to do it: simply repeat moves back and forth, and if the opponent goes along with it three times, the game is a draw.",
  },
  {
    id: "qa-fifty-move-rule",
    title: "What Is the Fifty Move Rule",
    tier: 1,
    category: "Chess Rules Q&A",
    qa: true,
    question:
      "Some endgames can theoretically go on forever if neither side captures anything or moves a pawn, since there's no natural way for the position to force progress. Is there a rule that stops this?",
    answer:
      "Yes, it's called the fifty move rule. If fifty moves pass in a row, for both players, without a single pawn move or a single capture, either player can claim a draw. This exists so that endgames where one side simply cannot make progress, no matter how they try, don't drag on indefinitely. Fifty moves is normally more than enough time to either make progress toward checkmate or prove that no progress is possible.",
  },
  {
    id: "qa-insufficient-material",
    title: "What Is a Draw by Insufficient Material",
    tier: 1,
    category: "Chess Rules Q&A",
    qa: true,
    question:
      "If one player captures almost everything, leaving both sides with barely any pieces, can the game still be won, or does it automatically end?",
    answer:
      "If neither side has enough material left on the board to ever deliver checkmate, no matter how the remaining pieces are played, the game is an automatic draw. The clearest example is king versus king, with nothing else left at all: it's simply impossible for either side to checkmate the other, so the game ends immediately as a draw. King and a single bishop versus a lone king, or king and a single knight versus a lone king, are also automatic draws for the same reason. Two bishops, or a bishop and a knight, together with a king, usually can force checkmate, so those situations are not automatic draws.",
  },
  {
    id: "check-and-checkmate",
    title: "Check, Checkmate & Stalemate",
    tier: 1,
    category: "Checkmate Patterns",
    explanation:
      "Check means the king is under attack and must move out of danger, block the attack, or capture the attacker. Checkmate means there's no way to escape, so the game ends. Stalemate means the player to move has no legal moves at all but isn't in check, which is a draw, not a win. In this position, Black's king is boxed in by its own pawns. Find White's move that delivers checkmate.",
    fen: "6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1",
    goal: "checkmate",
    solutionSquares: ["e1e8"],
    hint: "The black king has no escape square along the back rank. Which of your pieces controls that whole rank?",
  },
  {
    id: "back-rank-mate",
    title: "Back-Rank Mate Pattern",
    tier: 1,
    category: "Checkmate Patterns",
    explanation:
      "One of the four basic checkmate patterns: when a king is trapped behind its own pawns with no escape square, a rook or queen on the back rank delivers mate. This is one of the most common ways beginners get checkmated, and one of the easiest to deliver once you recognize it.",
    fen: "6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1",
    goal: "checkmate",
    solutionSquares: ["d1d8"],
    hint: "Same idea as before. Where can your rook land on the back rank?",
  },
  {
    id: "motif-pin",
    title: "Tactic: The Pin",
    tier: 1,
    category: "Tactics",
    explanation:
      "A pin happens when a piece can't safely move because doing so would expose a more valuable piece behind it on the same line, often the king. Here, the black knight and king share a diagonal. Find the bishop move that pins the knight in place.",
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
      "A fork is a single move that attacks two enemy pieces at once. The knight is especially dangerous here because of its unusual jumping movement. Find the knight move that attacks both the black king and the black rook at the same time.",
    fen: "8/2r1k3/8/8/1N6/8/8/7K w - - 0 1",
    goal: "bestMove",
    solutionSquares: ["b4d5"],
    hint: "Look for a knight move that gives check while also lining up with the rook.",
  },
];

// Puzzle set shown after a lesson (the "lesson-to-play loop" from the
// blueprint). In the real build these come tagged by motif and rating
// from the Lichess open puzzle database (CC0). This is a small
// hand-verified starter set standing in for that until the full
// import is wired up.
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
    explanation: "The black queen on d5 is completely undefended, so the rook simply takes it.",
  },
];

export const TIER2_LESSONS = [
  {
    id: "motif-discovered-attack",
    title: "Tactic: Discovered Attack",
    tier: 2,
    category: "Tactics",
    explanation:
      "A discovered attack happens when moving one piece out of the way reveals an attack from a different piece behind it. The moving piece doesn't even need to do anything special itself. Here, your knight is blocking your own rook's view of the black king. Move the knight anywhere legal and watch what happens.",
    fen: "k7/8/8/8/N7/8/8/R3K3 w - - 0 1",
    goal: "bestMove",
    solutionSquares: ["a4b2", "a4b6", "a4c3", "a4c5"],
    hint: "Your rook on a1 is aimed straight at the black king. What's in the way?",
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
      "An outpost is a square, usually in enemy territory, where your piece (often a knight) can sit safely because no enemy pawn can ever kick it away. Pieces on a strong outpost are hard to dislodge and can dominate the game from one square. Move the knight to d5 and notice: no black pawn on the c-file or e-file can ever attack it there.",
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
