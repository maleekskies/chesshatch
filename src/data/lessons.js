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
    id: "pawn-move-blocked-and-capturing",
    title: "Pawn: Blocked Ahead, Free to Capture",
    tier: 1,
    category: "Rules & Movement",
    explanation:
      "A pawn that's blocked directly in front of it can't push forward at all, not even to capture, pawns never capture straight ahead. But diagonal captures work regardless of what's blocking the square in front. Here the white pawn can't advance, an enemy pawn sits right in its path, but it still has two enemy pieces it can capture diagonally. Try it and see which moves are actually available.",
    fen: "7k/8/8/3rpn2/4P3/8/8/K7 w - - 0 1",
    freePlay: true,
  },
  {
    id: "pawn-move-edge-file",
    title: "Pawn: Fewer Options on the Edge",
    tier: 1,
    category: "Rules & Movement",
    explanation:
      "A pawn on the a-file or h-file only has one diagonal capture available, not two, since there's no file beyond the edge of the board. Here the white pawn on the a-file can only ever capture toward the b-file. Try moving it and notice there's no capture available on the other side, because there is no other side.",
    fen: "7k/8/1p6/8/P7/8/8/7K w - - 0 1",
    freePlay: true,
  },
  {
    id: "pawn-move-near-promotion",
    title: "Pawn: Almost at the End of the Board",
    tier: 1,
    category: "Rules & Movement",
    explanation:
      "A pawn this close to the last rank still moves exactly the same way, one square forward. The double-step option only ever exists on a pawn's very first move from its starting square, never again after that, no matter how far it's traveled. Push this pawn forward and see what happens when it reaches the end.",
    fen: "7k/P7/8/8/8/8/8/7K w - - 0 1",
    freePlay: true,
  },
  {
    id: "pawn-move-already-advanced",
    title: "Pawn: Single Steps Only, After the First Move",
    tier: 1,
    category: "Rules & Movement",
    explanation:
      "This pawn already left its starting square earlier in the game. From here on, it can only ever move one square at a time, the two-square option was a one-time offer available only from its original rank. Try moving it and confirm there's no double-step available anymore.",
    fen: "7k/8/8/4P3/8/8/8/K7 w - - 0 1",
    freePlay: true,
  },
  {
    id: "knight-move-corner",
    title: "Knight: Boxed Into a Corner",
    tier: 1,
    category: "Rules & Movement",
    explanation:
      "A knight in the corner has far fewer legal squares than one in the center, this is exactly why experienced players avoid parking a knight on the rim of the board early in the game. Move it around and notice how cramped it feels compared to the open-center knight lesson earlier.",
    fen: "7k/8/8/8/8/8/8/N6K w - - 0 1",
    freePlay: true,
  },
  {
    id: "knight-move-near-edge",
    title: "Knight: Restricted Near the Edge",
    tier: 1,
    category: "Rules & Movement",
    explanation:
      "A knight doesn't need to be in the very corner to lose options, being anywhere near the edge of the board cuts down how many squares it can reach. This is a big part of why a centralized knight is considered strong and an edge knight is considered weak, even though it's the exact same piece.",
    fen: "7k/8/8/8/N7/8/8/7K w - - 0 1",
    freePlay: true,
  },
  {
    id: "knight-move-capture",
    title: "Knight: Spotting a Capture",
    tier: 1,
    category: "Rules & Movement",
    explanation:
      "A knight captures by landing on the enemy piece's square, exactly like any other move it makes, there's no special capturing motion. If an enemy piece happens to sit on one of the knight's L-shaped destination squares, the knight can take it. See if you can find the capture available here.",
    fen: "7k/2b5/8/3N4/8/8/8/K7 w - - 0 1",
    freePlay: true,
  },
  {
    id: "knight-move-blocked-by-own-piece",
    title: "Knight: One Square Taken By Its Own Side",
    tier: 1,
    category: "Rules & Movement",
    explanation:
      "The knight jumps over anything in its path, but it still can't land on a square occupied by its own piece. One of this knight's usual eight squares is currently held by a friendly pawn, so that particular jump isn't available right now. Try moving the knight and see which square is off-limits.",
    fen: "7k/8/1P6/3N4/8/8/8/K7 w - - 0 1",
    freePlay: true,
  },
  {
    id: "bishop-move-corner",
    title: "Bishop: Only One Diagonal From the Corner",
    tier: 1,
    category: "Rules & Movement",
    explanation:
      "A bishop in the center controls two full diagonals, but a bishop in the corner only has one available, there's no second diagonal to speak of from that square. Move it along the long diagonal and notice there's nowhere else for it to go.",
    fen: "6k1/8/8/8/8/8/8/B6K w - - 0 1",
    freePlay: true,
  },
  {
    id: "bishop-move-blocked-by-own-pawn",
    title: "Bishop: Cut Off by Its Own Pawn",
    tier: 1,
    category: "Rules & Movement",
    explanation:
      "A friendly pawn sitting along one of this bishop's diagonals blocks that entire direction, not just the one square the pawn occupies, everything past it becomes unreachable too. This is one reason beginners are told not to block in their own bishops with their pawns too early. Try moving the bishop and see how much of that diagonal is now cut off.",
    fen: "7k/5P2/8/3B4/8/8/8/K7 w - - 0 1",
    freePlay: true,
  },
  {
    id: "bishop-move-capture",
    title: "Bishop: Spotting a Diagonal Capture",
    tier: 1,
    category: "Rules & Movement",
    explanation:
      "Just like the knight, a bishop captures simply by landing on the enemy piece, as long as the path to it is clear and it's actually on one of the bishop's diagonals. See if you can find the capture available to this bishop.",
    fen: "7k/1n6/8/3B4/8/8/8/K7 w - - 0 1",
    freePlay: true,
  },
  {
    id: "bishop-move-zero-mobility",
    title: "Bishop: Completely Stuck",
    tier: 1,
    category: "Rules & Movement",
    explanation:
      "Sometimes a piece has no legal moves at all from where it stands. This bishop is boxed in by its own pawns on both sides right from the start, a very common situation in the opening moves of a real game, and exactly why developing your pawns and pieces in the right order matters. Try clicking the bishop and see for yourself, there's genuinely nowhere for it to go yet.",
    fen: "4k3/8/8/8/8/8/1P1P4/2B1K3 w - - 0 1",
    freePlay: true,
  },
  {
    id: "rook-move-blocked-both-ways",
    title: "Rook: Squeezed Between Its Own Pawns",
    tier: 1,
    category: "Rules & Movement",
    explanation:
      "This rook has a pawn from its own side blocking it in two different directions, one along its file and one along its rank. It still has plenty of open squares in the other two directions, but notice how much smaller its range has become compared to a rook with nothing in its way.",
    fen: "7k/8/8/3R1P2/8/3P4/8/K7 w - - 0 1",
    freePlay: true,
  },
  {
    id: "rook-move-capture",
    title: "Rook: Spotting a Capture Along the File",
    tier: 1,
    category: "Rules & Movement",
    explanation:
      "A rook can capture anything sitting on its rank or file, as long as nothing else is in the way first. Find the capture this rook has available.",
    fen: "7k/8/8/3R4/8/3b4/8/K7 w - - 0 1",
    freePlay: true,
  },
  {
    id: "rook-move-undeveloped",
    title: "Rook: Still Home, But Not Trapped",
    tier: 1,
    category: "Rules & Movement",
    explanation:
      "This rook hasn't moved from its starting square yet, and its own pawn still blocks it from moving up the file. But notice it isn't actually stuck, the entire rank in the other direction is wide open. Rooks often sit and wait like this early in a game until a file opens up for them.",
    fen: "k7/8/8/8/7K/8/P7/R7 w - - 0 1",
    freePlay: true,
  },
  {
    id: "rook-move-mixed-situation",
    title: "Rook: Open, Blocked, and a Capture, All at Once",
    tier: 1,
    category: "Rules & Movement",
    explanation:
      "Real positions are rarely as clean as a rook sitting alone on an empty board. Here, one direction is wide open, another is blocked by a friendly pawn, and a third has an enemy piece the rook can capture. Take a moment to work out, direction by direction, what this rook can and can't do.",
    fen: "7k/3n4/8/3R2P1/8/8/8/K7 w - - 0 1",
    freePlay: true,
  },
  {
    id: "queen-move-boxed-by-own-pawns",
    title: "Queen: Hemmed In by Her Own Side",
    tier: 1,
    category: "Rules & Movement",
    explanation:
      "Even the most powerful piece on the board can be crowded out by its own pawns. Three of this queen's eight directions are blocked immediately by friendly pawns, she still has plenty of squares available through the others, but nowhere near her full range from an open position.",
    fen: "7k/8/3P4/2PQP3/8/8/8/K7 w - - 0 1",
    freePlay: true,
  },
  {
    id: "queen-move-capture",
    title: "Queen: Spotting a Capture at a Distance",
    tier: 1,
    category: "Rules & Movement",
    explanation:
      "Because the queen combines the rook's and bishop's movement, she can often capture something from much farther away than either piece could alone. Find the capture available here.",
    fen: "3r3k/8/8/3Q4/8/8/8/K7 w - - 0 1",
    freePlay: true,
  },
  {
    id: "queen-move-corner",
    title: "Queen: Even the Queen Loses Options in the Corner",
    tier: 1,
    category: "Rules & Movement",
    explanation:
      "A queen in the corner keeps her full rank and file, but loses an entire diagonal, there's simply no second diagonal to use from that square. She's still extremely powerful here, just noticeably less so than from the center.",
    fen: "4k3/8/8/8/7K/8/8/Q7 w - - 0 1",
    freePlay: true,
  },
  {
    id: "queen-move-backrank-boxed",
    title: "Queen: Waiting for Her Pawns to Move",
    tier: 1,
    category: "Rules & Movement",
    explanation:
      "This is close to how a queen often looks at the very start of a real game, boxed in on her own back rank by a wall of her own pawns. She still has her full rank to move along, but almost nothing else, until those pawns clear out of the way. This is exactly why rushing the queen out too early usually doesn't work well, there's often nowhere useful for her to go yet anyway.",
    fen: "k7/8/8/8/7K/8/2PPP3/3Q4 w - - 0 1",
    freePlay: true,
  },
  {
    id: "king-move-corner",
    title: "King: As Few Options As It Gets",
    tier: 1,
    category: "Rules & Movement",
    explanation:
      "A king in the corner has the fewest legal squares it can possibly have. Move it around and notice how much smaller its world becomes compared to the open-center king lesson earlier.",
    fen: "7k/8/8/8/8/8/8/K7 w - - 0 1",
    freePlay: true,
  },
  {
    id: "king-move-capture",
    title: "King: The King Can Capture Too",
    tier: 1,
    category: "Rules & Movement",
    explanation:
      "It's easy to forget, but the king can capture just like any other piece, as long as the square it's capturing on isn't defended by anything else. Here, nothing is protecting the enemy piece next to this king. Try taking it.",
    fen: "7k/8/8/3n4/3K4/8/8/8 w - - 0 1",
    freePlay: true,
  },
  {
    id: "king-move-cant-enter-check",
    title: "King: One Square Off-Limits",
    tier: 1,
    category: "Rules & Movement",
    explanation:
      "The king can never move onto a square an enemy piece attacks, even if nothing is currently checking it. One of this king's usual squares is being watched by the enemy rook on the far side of the board, so that square simply isn't a legal option, even though it looks empty and safe. Try moving the king around and see which square it refuses to go to.",
    fen: "k3r3/8/8/8/3K4/8/8/8 w - - 0 1",
    freePlay: true,
  },
  {
    id: "king-move-crowded-by-own-pieces",
    title: "King: Crowded by Its Own Pawns",
    tier: 1,
    category: "Rules & Movement",
    explanation:
      "Three of this king's eight neighboring squares are occupied by its own pawns, so those simply aren't available, a king can't capture or move onto its own pieces any more than it can move onto an attacked square. It still has several legal squares left, just fewer than it would on an open board.",
    fen: "7k/8/8/3P4/2PKP3/8/8/8 w - - 0 1",
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
  {
    id: "motif-skewer",
    title: "Tactic: The Skewer",
    tier: 1,
    category: "Tactics",
    explanation:
      "A skewer is like a pin in reverse: instead of a less valuable piece shielding a more valuable one, a more valuable piece is forced to move out of an attack, exposing a less valuable piece behind it on the same line. Here, moving your rook onto the a-file gives check to the king. The king has to move out of the way, and your rook will then be attacking the queen sitting right behind it.",
    fen: "8/8/8/k7/8/8/8/1R5K w - - 0 1",
    goal: "bestMove",
    solutionSquares: ["b1a1"],
    hint: "Look for a rook move that lines up with both the king and the queen on the same file.",
  },
  {
    id: "motif-discovered-check",
    title: "Tactic: Discovered Check",
    tier: 1,
    category: "Tactics",
    explanation:
      "A discovered check is a discovered attack where the revealed piece delivers check instead of just attacking something. Your own knight is currently blocking your rook's view straight down the file toward the black king. Move the knight anywhere legal, and watch what happens to the king the moment it steps aside.",
    fen: "k7/8/8/8/N7/8/8/R6K w - - 0 1",
    goal: "bestMove",
    solutionSquares: ["a4b2", "a4b6", "a4c3", "a4c5"],
    hint: "Your rook is aimed straight down the a-file. What's currently in the way?",
  },
  {
    id: "tactic-removing-the-defender",
    title: "Tactic: Removing the Defender",
    tier: 1,
    category: "Tactics",
    explanation:
      "Sometimes a piece is only safe because something else is defending it. If you can capture or chase away that defender, whatever it was protecting suddenly becomes vulnerable too. Here, the black knight is the only thing standing between your rook and the black queen on the same file. Capture the knight, and your rook will be aiming straight at the queen next.",
    fen: "k3q3/8/8/4n3/8/8/8/K3R3 w - - 0 1",
    goal: "bestMove",
    solutionSquares: ["e1e5"],
    hint: "What's the only black piece standing between your rook and the queen?",
  },
  {
    id: "tactic-overloaded-piece",
    title: "Tactic: The Overloaded Piece",
    tier: 1,
    category: "Tactics",
    explanation:
      "A piece is overloaded when it's the only thing defending two different pieces at once. It can only ever save one of them. Here, the black rook is defending both the knight on its file and the bishop on its rank, at the same time. Capture the knight: if the rook recaptures, it has to leave the rank, and the bishop it was also guarding becomes free to win next.",
    fen: "b2r3k/8/8/3n4/8/1B6/8/7K w - - 0 1",
    goal: "bestMove",
    solutionSquares: ["b3d5"],
    hint: "The black rook is protecting two pieces at once. What happens to one of them if it recaptures on the other?",
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
  {
    id: "tactic-trapped-piece",
    title: "Tactic: The Trapped Piece",
    tier: 2,
    category: "Tactics",
    explanation:
      "A piece is trapped when it technically has legal moves, but every single one of them is covered by the opponent, so moving it just loses it somewhere else instead of where it stands right now. The black knight in the corner only ever has two possible squares to go to. Look at where the white bishop's diagonal reaches, and notice that both of those escape squares are already covered.",
    fen: "n6k/8/8/B7/8/8/8/7K w - - 0 1",
    freePlay: true,
  },
  {
    id: "tactic-xray-attack",
    title: "Tactic: The X-Ray",
    tier: 2,
    category: "Tactics",
    explanation:
      "An x-ray is when a piece's real influence continues right through another piece sitting in front of it, rather than stopping there. Your rook looks like it's aimed at a pawn, but it's actually contesting the entire file all the way to the black rook behind it. If that pawn is ever captured or pushed aside, the two rooks are immediately facing off directly. Strong players count x-ray pressure like this as real control of a file, even before anything is captured.",
    fen: "3r3k/8/8/8/3p4/8/8/3R3K w - - 0 1",
    freePlay: true,
  },
  {
    id: "endgame-opposition",
    title: "Endgame Idea: Opposition",
    tier: 2,
    category: "Endgame Ideas",
    qa: true,
    question:
      "In a king and pawn endgame, the two kings often end up facing each other with exactly one empty square between them. Does it matter whose turn it is to move in that situation?",
    answer:
      "Yes, quite a lot. When the kings face each other like this, whichever side is not forced to move first is said to have the opposition, and that's usually a real advantage. The side forced to move has to step aside, letting the other king advance into the key squares it needs to support its pawn or invade the position. Strong players in the endgame will sometimes deliberately lose a tempo, like shuffling a king back and forth, specifically to hand the obligation to move back to their opponent and keep the opposition for themselves.",
    fen: "8/8/8/8/4k3/8/4K3/8 w - - 0 1",
  },
  {
    id: "endgame-zugzwang",
    title: "Endgame Idea: Zugzwang",
    tier: 2,
    category: "Endgame Ideas",
    qa: true,
    question:
      "Is it always good to have a move available? Could having to move ever actually hurt you?",
    answer:
      "In most of the game, yes, having options is good. But in some endgame positions, every single legal move available actually makes things worse, and you'd genuinely prefer to just pass if you could. That situation is called zugzwang, a German word roughly meaning compulsion to move. It comes up constantly in king and pawn endgames, where a king that would be perfectly safe standing still is instead forced to step away from a square it needed to defend, simply because it has to move something.",
    fen: "8/4k3/8/4K3/8/8/8/8 w - - 0 1",
  },
  {
    id: "positional-prophylaxis",
    title: "Positional Idea: Prophylaxis",
    tier: 2,
    category: "Positional Ideas",
    qa: true,
    question:
      "Does every good move have to directly attack something or improve your own position? Could a move be good purely because of what it stops your opponent from doing?",
    answer:
      "Yes, and that idea has a name: prophylaxis, which just means taking a preventative move. Instead of asking only what your best move is, strong players regularly ask what their opponent's best move would be if it were their turn, and then consider playing a move that denies them exactly that. A prophylactic move might not look active at all, sometimes it just quietly closes off a square or a plan, but preventing your opponent's best idea can be worth just as much as building your own.",
  },
  {
    id: "positional-isolated-pawn",
    title: "Positional Idea: The Isolated Pawn",
    tier: 2,
    category: "Positional Ideas",
    explanation:
      "A pawn is isolated when there are no friendly pawns on either of the files right next to it, which means no other pawn can ever step up to defend it. Isolated pawns can still be strong, they often control useful central squares, but they need constant piece support since they'll never get pawn support. Look at the white pawn here and notice there's nothing on the files to either side of it.",
    fen: "k7/8/8/8/3P4/8/1P3P2/7K w - - 0 1",
    freePlay: true,
  },
  {
    id: "positional-doubled-pawns",
    title: "Positional Idea: Doubled Pawns",
    tier: 2,
    category: "Positional Ideas",
    explanation:
      "Doubled pawns happen when two of your own pawns end up on the same file, usually from a capture. They can't defend each other the normal way pawns do, since pawns only defend diagonally, and they cover fewer squares between them than two pawns on separate files would. They're not always bad, sometimes they open a useful file for a rook, but they're generally considered a small structural weakness. Notice both white pawns share the same file here.",
    fen: "k7/8/8/8/4P3/8/4P3/7K w - - 0 1",
    freePlay: true,
  },
  {
    id: "positional-passed-pawn",
    title: "Positional Idea: The Passed Pawn",
    tier: 2,
    category: "Positional Ideas",
    explanation:
      "A passed pawn has no enemy pawns left on its own file or on either file next to it, anywhere between it and the promotion square. That means no pawn can ever block it or capture it on the way to promoting, only pieces can stop it. A passed pawn tends to grow more dangerous as the game goes on and pieces get traded off, since there are fewer and fewer things left on the board that can actually deal with it. Look at the white pawn here and notice there's nothing standing between it and the end of the board.",
    fen: "7k/p7/8/3P4/8/8/8/K7 w - - 0 1",
    freePlay: true,
  },
  {
    id: "endgame-kq-vs-k",
    title: "Endgame Idea: King and Queen vs. King",
    tier: 2,
    category: "Endgame Ideas",
    explanation:
      "This is one of the most basic checkmates to actually deliver, and every player eventually needs to know it cold. The idea: use your queen to gradually shrink the space the enemy king can move in, keeping your own king close enough to support the queen, until the enemy king is pushed to the edge of the board and has nowhere left to go. Be careful not to bring the queen too close too early, a lone queen right next to the enemy king often just produces a stalemate instead of a checkmate, which is a draw, not a win. Move the pieces around and get a feel for how the queen restricts the king's space.",
    fen: "8/6k1/8/8/2Q5/2K5/8/8 w - - 0 1",
    freePlay: true,
  },
  {
    id: "endgame-kr-vs-k",
    title: "Endgame Idea: King and Rook vs. King",
    tier: 2,
    category: "Endgame Ideas",
    explanation:
      "The king and rook checkmate uses a different idea than the queen version: the rook cuts the enemy king off along an entire rank or file, like a wall it can never cross, while your own king walks up to help finish the job. The enemy king gets pushed to the edge of the board one cut-off line at a time, and delivering mate always happens with your own king right there supporting the rook. It's a slower process than the queen checkmate, but it's just as important to know, since a lone rook is exactly what many endgames come down to. Move the pieces around and notice how the rook controls an entire line the king can't cross.",
    fen: "R7/4k3/8/3K4/8/8/8/8 w - - 0 1",
    freePlay: true,
  },
];
