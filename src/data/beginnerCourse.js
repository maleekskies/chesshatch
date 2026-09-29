// The beginner course: the "Start from zero." path for someone who has
// never played. Twelve short lessons, each one a real position the learner
// moves pieces on, not a slide to read.
//
// Step shapes used by src/lib/lessonEngine.js and src/screens/BeginnerCourse.jsx:
//
//   { fen, say, task, kind: "tap", answer, hint, success, note }
//     A square-naming step. `answer` is the only square accepted.
//
//   { fen, say, task, accept: {...}, hint, success, note, reveal }
//     A move step. `accept` is judged against the real position by chess.js
//     (see judgeMove), never by comparing raw coordinates to a script.
//     `fen` is optional, omitting it continues from the previous step.
//
//   { auto: { from, to }, say }
//     The opponent's scripted reply, played for the learner by the screen.
//
// Every position and every expected move in this file is checked with
// chess.js by `node scripts/verify-beginner-course.mjs`, which fails the
// build if a FEN is illegal, if an expected move isn't legal in its
// position, or if an "accept" spec can't actually be satisfied.
import { GUIDED_FIRST_GAME } from "./guidedGame.js";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

// The scripted Italian Game from data/guidedGame.js, reshaped into course
// steps: the learner plays every White move and Black's replies play
// themselves. Each step's explanation is the coach's line for the move that
// has just happened, so the panel always reads as a coach talking you
// through the game rather than a list of instructions.
function buildFirstGameSteps() {
  const steps = [];
  GUIDED_FIRST_GAME.steps.forEach((s, i) => {
    if (s.mover === "white") {
      steps.push({
        ...(i === 0 ? { fen: START_FEN } : {}),
        say: i === 0 ? GUIDED_FIRST_GAME.intro : GUIDED_FIRST_GAME.steps[i - 1].say,
        task: s.prompt,
        accept: { from: s.from, to: s.to },
        hint: `Play the piece on ${s.from} to ${s.to}.`,
        success: s.say,
      });
    } else {
      steps.push({ auto: { from: s.from, to: s.to }, say: s.say });
    }
  });
  return steps;
}


export const BEGINNER_COURSE = [
  {
    id: "board",
    title: "The board",
    blurb: "64 squares, files and ranks, and the name of every square.",
    intro: "One idea at a time. You do not need to know anything yet.",
    steps: [
      {
        kind: "tap",
        fen: "7k/8/8/8/8/8/8/K7 w - - 0 1",
        say: "This is the board: 64 squares, 8 across and 8 down. The letters along the bottom are files, a to h. The numbers up the side are ranks, 1 to 8. Put them together and every square has a name.",
        task: "Tap the square called e4.",
        answer: "e4",
        hint: "e4 is the 5th file across and the 4th rank up.",
        success: "That's e4: file e, rank 4.",
        note: "Squares always name file first, then rank. From White's side, a1 is the bottom-left corner.",
      },
      {
        kind: "tap",
        fen: "7k/8/8/8/8/8/8/K7 w - - 0 1",
        say: "The two corners have the whole board built around them. a1 is the bottom-left from White's point of view, and h8 is the far corner.",
        task: "Tap a1, the bottom-left corner.",
        answer: "a1",
        hint: "The bottom rank is rank 1, and a is the leftmost file.",
        success: "Correct. a1.",
      },
      {
        kind: "tap",
        fen: "7k/8/8/8/8/8/8/K7 w - - 0 1",
        say: "Now the opposite corner.",
        task: "Tap h8, the top-right corner.",
        answer: "h8",
        hint: "The top rank is rank 8, and h is the rightmost file.",
        success: "That's h8. You can name any square on the board now.",
      },
      {
        kind: "tap",
        fen: "7k/8/8/8/8/8/8/K7 w - - 0 1",
        say: "Every square is either light or dark, and they always alternate. a1 is a dark square, so d4 is dark too.",
        task: "Tap d4, a dark square.",
        answer: "d4",
        hint: "Count across to file d, then up 4 ranks.",
        success: "Dark square, well spotted.",
        note: "Chessboards are drawn light-square on the right, so h1 is always light.",
      },
    ],
  },
  {
    id: "pawn",
    title: "The pawn",
    blurb: "It walks straight ahead, and captures on the diagonal.",
    steps: [
      {
        fen: "7k/8/8/8/8/8/4P3/K7 w - - 0 1",
        say: "This is a pawn. It walks straight ahead, one square at a time. On its first move only, it may walk two squares instead of one.",
        task: "Drag the pawn forward, one square or two.",
        accept: { from: "e2" },
        hint: "Move the pawn up the e-file: e3 or e4.",
        success: "Right. Forward only, one square at a time, or two from its starting square.",
        note: "Pawns never move backwards.",
      },
      {
        fen: "7k/8/8/3p4/4P3/8/8/K7 w - - 0 1",
        say: "A pawn captures differently than it moves. It moves straight ahead, but it captures one square diagonally.",
        task: "Take the black pawn on d5.",
        accept: { from: "e4", to: "d5" },
        hint: "The black pawn is one square up and one square to the left of your pawn.",
        success: "Exactly. Straight to move, diagonal to take.",
      },
      {
        fen: "7k/8/3pp3/4P3/8/8/8/K7 w - - 0 1",
        say: "A pawn cannot capture straight ahead, and it cannot move forward into a piece. Here both pawns ahead of you are blocked.",
        task: "Find the one capture your pawn does have.",
        accept: { from: "e5", to: "d6" },
        hint: "Look diagonally: the pawn on d6 is undefended.",
        success: "Yes. Blocked in front, but still able to take on the diagonal.",
      },
    ],
  },
  {
    id: "rook",
    title: "The rook",
    blurb: "Straight lines, any distance, but it can't jump.",
    steps: [
      {
        fen: "7k/8/8/8/8/8/8/K6R w - - 0 1",
        say: "This is a rook. It moves in straight lines: forward, backward, or sideways, as far as it likes, until something gets in the way.",
        task: "Move the rook anywhere it can legally go.",
        accept: { from: "h1" },
        hint: "Click or drag the rook along the first rank, or up the h-file.",
        success: "Straight lines only, never diagonally.",
      },
      {
        fen: "7k/8/8/r7/8/8/8/R6K w - - 0 1",
        say: "Rooks capture whatever they can reach along those straight lines.",
        task: "Take the black rook on a5.",
        accept: { from: "a1", to: "a5" },
        hint: "The a-file is clear all the way up.",
        success: "Clean capture.",
      },
      {
        fen: "7k/8/8/8/8/8/P7/R6K w - - 0 1",
        say: "Rooks cannot jump over anything, not even your own pawn.",
        task: "Move the rook. Notice it slides sideways, and cannot get past the pawn in front of it.",
        accept: { from: "a1" },
        hint: "Try the first rank: b1, c1, right along to g1.",
        success: "That is the rook's one weakness: something always has to be out of the way.",
      },
    ],
  },
  {
    id: "bishop",
    title: "The bishop",
    blurb: "Diagonals only, which means one colour forever.",
    steps: [
      {
        fen: "7k/8/8/8/8/8/8/K5B1 w - - 0 1",
        say: "This is a bishop. It moves diagonally, as far as it likes, and never in a straight line.",
        task: "Move the bishop anywhere it can legally go.",
        accept: { from: "g1" },
        hint: "Follow the diagonals running out of g1: f2, e3, d4, and so on.",
        success: "Diagonals only.",
      },
      {
        fen: "7k/8/8/8/3p4/8/8/K5B1 w - - 0 1",
        say: "A bishop captures on the same diagonal it travels along.",
        task: "Take the black pawn on d4.",
        accept: { from: "g1", to: "d4" },
        hint: "The diagonal runs g1, f2, e3, d4.",
        success: "Taken.",
      },
      {
        fen: "7k/8/8/8/8/8/8/K1B3B1 w - - 0 1",
        say: "Because it only moves diagonally, a bishop can never leave the colour it starts on. Two bishops on different colours can never meet.",
        task: "Move either bishop.",
        accept: { piece: "b" },
        acceptMultiple: true, // either bishop is a correct answer here

        hint: "Try the bishop on c1, or the one on g1.",
        success: "Every square that bishop can ever reach is the same colour as the square it stands on now.",
      },
    ],
  },
  {
    id: "knight",
    title: "The knight",
    blurb: "The L-shape that jumps over everything.",
    steps: [
      {
        fen: "7k/8/8/8/8/8/8/KN6 w - - 0 1",
        say: "This is a knight. It moves in an L: two squares one way, then one square across. That makes it the strangest mover on the board.",
        task: "Move the knight.",
        accept: { piece: "n" },
        hint: "From b1 the knight can reach a3, c3, and d2.",
        success: "Two then one. Every knight move is the same shape.",
      },
      {
        fen: "7k/8/8/8/8/8/PPP5/KN6 w - - 0 1",
        say: "The knight has one special power: it is the only piece that jumps. Pieces in the way do not matter to it at all.",
        task: "Move the knight, even though its own pawns are crowding it.",
        accept: { piece: "n" },
        hint: "a3, c3, or d2, straight over the pawns.",
        success: "Over the top. Nothing can block a knight.",
      },
      {
        fen: "7k/8/8/3p4/8/2N5/8/K7 w - - 0 1",
        say: "Knights capture on the square they land on, the same as every other piece.",
        task: "Take the black pawn on d5.",
        accept: { from: "c3", to: "d5" },
        hint: "From c3, the L-shape reaches d5.",
        success: "Nice. That jump is why knights are so good at catching pieces out.",
      },
    ],
  },
  {
    id: "queen-and-king",
    title: "The queen and king",
    blurb: "The strongest piece, and the one you must protect.",
    steps: [
      {
        fen: "7k/8/8/8/8/8/8/K5Q1 w - - 0 1",
        say: "This is the queen. She combines the rook and the bishop: straight lines and diagonals, any distance. She is the strongest piece on the board.",
        task: "Move the queen.",
        accept: { from: "g1" },
        hint: "Any direction works: up, across, or along a diagonal.",
        success: "Straight or diagonal, as far as she likes.",
      },
      {
        fen: "7k/8/8/8/3p4/8/8/K5Q1 w - - 0 1",
        say: "Because she moves like both the rook and the bishop, the queen can reach a huge number of squares.",
        task: "Take the black pawn on d4 with the queen.",
        accept: { from: "g1", to: "d4" },
        hint: "Take the diagonal: f2, e3, d4.",
        success: "That is why you protect your queen, and why losing her hurts so much.",
      },
      {
        fen: "7k/8/8/8/8/8/8/K7 w - - 0 1",
        say: "This is the king. He is not strong like the queen: one square at a time, in any direction. But if he is ever trapped, the game is over.",
        task: "Move your king one square.",
        accept: { from: "a1" },
        hint: "a2, b1, and b2 are all one square away.",
        success: "One square at a time. Keep him safe, he is the whole game.",
        note: "Kings can never stand on a square next to the enemy king.",
      },
    ],
  },
  {
    id: "taking-pieces",
    title: "Taking pieces",
    blurb: "How captures work, and when not to take.",
    steps: [
      {
        fen: "7k/8/8/3b4/8/8/8/K2R4 w - - 0 1",
        say: "You capture an enemy piece by moving onto the square it stands on. Your piece takes its place, and it is gone from the board.",
        task: "Take the black bishop on d5.",
        accept: { from: "d1", to: "d5" },
        hint: "The d-file is clear all the way up.",
        success: "Captured. That bishop is off the board.",
      },
      {
        fen: "7k/8/8/3p4/8/8/8/K2R4 w - - 0 1",
        say: "Not every capture is a good one. Before you take, check whether anything can take you back. This pawn has nothing defending it.",
        task: "Take the free pawn on d5.",
        accept: { from: "d1", to: "d5" },
        hint: "Nothing on the board can hit d5 after you take.",
        success: "Free material. You are a rook up now.",
      },
      {
        fen: "7k/8/2p5/3p4/8/8/8/K2R4 w - - 0 1",
        say: "This pawn looks just as free, but it is defended by the pawn on c6. If you take it, the c6 pawn takes you straight back, and you lose a rook for a pawn.",
        task: "Leave it alone. Move the rook somewhere safe instead.",
        accept: { from: "d1", noCapture: true },
        hint: "Any rook square except d5: d2, d3, b1, e1.",
        success: "Good discipline. Counting before you take is a habit that wins games.",
      },
    ],
  },
  {
    id: "check",
    title: "Check",
    blurb: "Attacking the king, and getting out of the way.",
    steps: [
      {
        fen: "7k/8/8/8/8/8/8/K2R4 w - - 0 1",
        say: "When a piece attacks the enemy king, that is check. It is the most urgent thing on the board: the king has to be safe before anything else happens.",
        task: "Move the rook so it attacks the black king.",
        accept: { from: "d1", to: "d8", check: true },
        hint: "Line the rook up with the king along the 8th rank: d8.",
        success: "Check. The black king is under attack and must deal with it.",
        note: "A rook attacks along the whole rank or file it stands on.",
      },
      {
        fen: "4k3/8/8/8/8/8/8/r3K3 w - - 0 1",
        say: "Now you are on the other end of it. Your king is in check. There are three ways out: move the king, block the attack, or capture the attacker.",
        task: "Move your king to a safe square.",
        accept: { from: "e1" },
        hint: "d2, e2, and f2 all step off the first rank and out of the rook's line.",
        success: "Safe. A king in check is never allowed to stay there.",
        note: "You can never make a move that leaves your own king in check.",
      },
      {
        fen: "4k3/8/8/8/1R6/8/8/r3K3 w - - 0 1",
        say: "Moving the king is not the only answer. If something else can get in the way, that works too.",
        task: "Block the attack: put your rook between the black rook and your king.",
        accept: { from: "b4", to: "b1" },
        hint: "The black rook attacks along the first rank. Step onto b1.",
        success: "Blocked. The check is over, and your king never had to move.",
      },
    ],
  },
  {
    id: "checkmate",
    title: "Checkmate",
    blurb: "When the king is attacked and has nowhere to go.",
    steps: [
      {
        fen: "6k1/5p1p/8/8/8/8/3Q4/6K1 w - - 0 1",
        say: "Check is not the end of the game. If the king can run away, block, or take the piece attacking it, it was only check.",
        task: "Give check with your queen.",
        accept: { from: "d2", to: "d8", check: true },
        hint: "Put the queen on the same rank as the king: d8.",
        success: "Check, but not mate. The king simply slips out through g7.",
        note: "If the king can run or take the queen, it is only check.",
      },
      {
        fen: "6k1/5ppp/8/8/8/8/3Q4/6K1 w - - 0 1",
        say: "Now the black king's own pawns are in his way. He is attacked, and he has nowhere safe to go.",
        task: "Mate the black king in one move.",
        accept: { mate: true },
        hint: "The same move as before: the queen to d8.",
        reveal: { from: "d2", to: "d8" },
        success: "Checkmate. Black's own pawns blocked the escape squares, and the game is over.",
        note: "The whole board is trapped by the pawns on f7, g7 and h7.",
      },
    ],
  },
  {
    id: "first-game",
    title: "Your first slow game",
    blurb: "A short complete game, move by move, with the coach explaining.",
    steps: buildFirstGameSteps(),
  },
  {
    id: "special-moves",
    title: "Castling and promotion",
    blurb: "The two moves that surprise new players the most.",
    steps: [
      {
        fen: "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1",
        say: "Castling is the only move where two of your pieces move at once. The king slides two squares toward a rook, and the rook hops over to the other side of him.",
        task: "Castle short: move your king two squares toward the rook on h1.",
        accept: { from: "e1", to: "g1" },
        hint: "Drag the king from e1 to g1. The rook comes along automatically.",
        success: "That is castling: the king is tucked away and the rook is out, in one move.",
        note: "You may only castle if neither piece has moved, nothing is in the way, and your king is not in check.",
      },
      {
        fen: "4r2k/8/8/8/8/8/8/R3K2R w KQ - 0 1",
        say: "One more castling rule: you cannot castle while your king is in check, or through a square that is attacked.",
        task: "Your king is in check, so castling is off the table. Deal with the check.",
        accept: { anyLegal: true },
        hint: "Move the king off the e-file, or take the rook that is giving check.",
        success: "And while that was happening, castling was not allowed at all.",
      },
      {
        fen: "7k/3P4/8/8/8/8/8/K7 w - - 0 1",
        say: "A pawn that reaches the last rank cannot stay a pawn. It becomes a new piece straight away, and almost always a queen.",
        task: "Push the pawn to the last rank and promote it.",
        accept: { from: "d7", to: "d8" },
        hint: "One square forward, onto d8.",
        success: "Your pawn became a queen. That is why a pawn near the end is so dangerous.",
      },
    ],
  },
  {
    id: "draws",
    title: "Stalemate and draws",
    blurb: "How you can be winning and still only draw.",
    steps: [
      {
        kind: "tap",
        fen: "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1",
        say: "This is stalemate. Black is not in check, but has no legal move left at all. That is a draw, even though White is a whole queen ahead.",
        task: "Tap the black king.",
        answer: "h8",
        hint: "It is the only black piece on the board.",
        success: "Trapped with no move and no check: a draw. Always make sure the enemy king has a square.",
        note: "Checkmate and stalemate look almost identical. The difference is whether the king is attacked.",
      },
      {
        fen: "7k/5Q2/6K1/8/8/8/8/8 w - - 0 1",
        say: "Same pieces, but now it is your move instead of Black's, and that changes everything.",
        task: "Mate the black king.",
        accept: { mate: true },
        hint: "Bring the queen next to the king on g7, where your own king protects her.",
        reveal: { from: "f7", to: "g7" },
        success: "Checkmate. One move earlier the same position was a draw.",
      },
    ],
  },
];

export const BEGINNER_COURSE_TOTAL = BEGINNER_COURSE.length;
