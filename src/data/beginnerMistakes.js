// Reference content for the "Common Beginner Mistakes" page. These are
// well-established, general opening/strategic principles (not specific
// move sequences), so unlike the guided game or lesson FEN positions,
// there's no board position here that needs independent legality
// verification, the claims are about patterns of play, not moves.
export const BEGINNER_MISTAKES = [
  {
    title: "Moving the same piece twice in the opening",
    mistake: "Shuffling one piece around for several moves in a row, say, a knight hopping from square to square chasing small threats, while the rest of your army stays at home.",
    why: "Every extra move with a piece you've already developed is a move you didn't spend bringing a new piece into the game. Chess openings are a race to get everyone ready for the middlegame; falling behind in development leaves you outnumbered in the fight when it actually starts.",
    instead: "Ask before every early move: \"is this developing a new piece, or moving one I've already developed?\" Prefer the new piece unless there's a concrete tactical reason not to.",
  },
  {
    title: "Bringing your queen out too early",
    mistake: "Rushing your queen into the center or toward the opponent's king in the first few moves, hoping to create quick threats.",
    why: "The queen is your most valuable piece, so it can be chased around the board by pawns and minor pieces for free, your opponent develops naturally while attacking your queen, and you end up losing time instead of gaining it.",
    instead: "Develop knights and bishops first, castle, and bring the queen out once your other pieces support it.",
  },
  {
    title: "Forgetting to castle",
    mistake: "Playing on for many moves with the king still in the center, especially once queens and rooks are still on the board.",
    why: "A king in the center is exposed to checks and attacks along open central files and diagonals. Most beginner games are decided by an attack on an uncastled king.",
    instead: "Treat castling as part of development, not an afterthought, aim to castle within your first 6-10 moves whenever it's safe to do so.",
  },
  {
    title: "Chasing pawns instead of finishing development",
    mistake: "Spending several moves trying to win a single pawn early in the game while pieces stay undeveloped.",
    why: "A pawn is the smallest unit of material in chess. If winning it costs you several tempi, your opponent gets a large lead in development in exchange, usually a much better deal for them than the pawn was worth.",
    instead: "Unless a pawn can be won for free, in one move, finish developing first. Material won later, with all your pieces active, is much safer to hold onto.",
  },
  {
    title: "Leaving pieces hanging",
    mistake: "Moving a piece to a square without checking whether anything can capture it for free.",
    why: "This is, by a wide margin, the single most common way beginner games are decided, not brilliant combinations, just a piece left undefended.",
    instead: "Before every move, glance at the destination square and ask \"if I put my piece here, can anything take it, and would I be able to take back?\" Make this a habit until it's automatic.",
  },
  {
    title: "Not checking your opponent's last move",
    mistake: "Planning your own move without first asking what your opponent's last move actually threatens.",
    why: "Every move changes the position, it might open a new attack, create a threat to capture something, or set up a check. Ignoring it means walking into whatever your opponent just prepared.",
    instead: "Before you look for your own move, spend a few seconds asking \"why did they play that? What does it threaten?\" This one habit alone prevents a large share of beginner blunders.",
  },
  {
    title: "Trading pieces without a reason",
    mistake: "Capturing or offering trades just because a trade is available, without asking whether it actually helps your position.",
    why: "Trades change the character of the position, sometimes for the better, sometimes for the worse. Trading your active, well-placed piece for your opponent's passive one usually helps them, not you.",
    instead: "Before a trade, ask: \"after this exchange, are my remaining pieces better placed than theirs?\" If you're not sure, it's often fine to leave the tension and develop something else instead.",
  },
  {
    title: "Weakening pawn moves in front of your own king",
    mistake: "Pushing the pawns in front of a castled king (for example the pawns just in front of it) without a clear reason, just to \"do something.\"",
    why: "Those pawns are your king's shelter. Each one you push creates a permanent hole behind it that can never be undone, and holes near your king are exactly what an attacker looks for.",
    instead: "Leave your king's pawn shield alone unless you have a specific, concrete reason to move it. When in doubt, develop a piece or improve your position elsewhere instead.",
  },
];
