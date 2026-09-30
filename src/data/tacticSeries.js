// Intermediate tactics.
//
// The Intermediate tier used to be a single move ("here is a tactic, solve
// it"). This file turns each tactic into a mini lesson series instead, so a
// player who has finished the beginner course actually learns the pattern
// and can recognise it in a real game.
//
// Five lessons per tactic, in the same order every time:
//   1. Identify the pattern
//   2. Understand the attacking pattern
//   3. Find the correct move
//   4. Apply it in a different position
//   5. Final practical challenge (the whole sequence, not just move one)
//
// Step shapes are the ones src/lib/lessonEngine.js already judges for the
// beginner course, so nothing here is checked by comparing raw coordinates
// to a script:
//
//   { fen, say, task, kind: "tap", answer, hint, success, note }
//   { fen, say, task, accept: {...}, hint, success, note }
//   { fen, say, task, kind: "read", note }      just read, then continue
//   { auto: { from, to }, say }                 the opponent's scripted reply
//
// `fen` is optional; omitting it continues from the position the previous
// step produced. Every FEN, every expected move, every scripted reply and
// every `accept` spec is checked against chess.js by
//   node scripts/verify-tactic-series.mjs
// so a lesson can never quietly teach a move that is illegal, or that isn't
// actually the tactic it claims to be.

const SKEWER_A = "q7/8/8/k7/8/8/7K/1R6 w - - 0 1";
const SKEWER_B = "8/8/8/5r2/8/3k4/B7/6K1 w - - 0 1";
const FORK_A = "8/2r1k3/8/8/1N6/8/8/7K w - - 0 1";
const FORK_B = "5k2/2r5/8/8/3N4/8/8/6K1 w - - 0 1";
const PIN_A = "r3k3/8/2n5/8/8/8/4B3/7K w - - 0 1";
const PIN_B = "3r3k/8/5n2/8/8/8/8/2B3K1 w - - 0 1";
const XRAY_A = "3r3k/8/8/8/3p4/8/8/3R3K w - - 0 1";
const XRAY_B = "3q4/1k6/8/2n5/3P4/8/8/3R2K1 w - - 0 1";
const DISC_A = "k7/8/8/8/N7/8/8/R3K3 w - - 0 1";
const DISC_B = "3q3k/8/6r1/8/8/3N4/8/1K1R4 w - - 0 1";
const DCHK_A = "k7/8/8/8/N7/8/8/R6K w - - 0 1";
const DCHK_B = "3k4/8/2r5/8/8/3N4/8/1K1R4 w - - 0 1";
const DBL_A = "6kn/r7/8/8/8/8/8/3Q2K1 w - - 0 1";
const DBL_B = "4n2k/1r6/8/8/8/8/8/4Q2K w - - 0 1";
const REM_A = "3q2k1/5n2/4B3/8/8/8/8/K2R4 w - - 0 1";
const REM_B = "6k1/8/5n2/3q3N/8/8/8/K2R4 w - - 0 1";
const OVL_A = "b2r3k/8/8/3n4/8/1B6/8/R6K w - - 0 1";
const OVL_B = "k2r3b/8/8/3n4/8/1B6/8/1K5R w - - 0 1";
const TRAP_A = "n6k/8/8/B7/8/8/8/7K w - - 0 1";
const TRAP_B = "7k/8/8/8/n2B4/8/8/R6K w - - 0 1";
const TRAP_C = "k6n/8/8/4N3/8/8/8/1K5R w - - 0 1";

export const TACTIC_SERIES = [
  // ------------------------------------------------------------------ skewer --
  {
    id: "skewer",
    name: "Skewer",
    tagline: "The pin in reverse: the valuable piece is forced to move, and whatever stood behind it is left hanging.",
    lessons: [
      {
        id: "skewer-1",
        title: "Identify the skewer",
        blurb: "Two pieces on one line, the expensive one in front.",
        steps: [
          {
            fen: SKEWER_A,
            say: "A skewer is a pin turned around. In a pin a cheap piece shields an expensive one. In a skewer the expensive piece is the one in the way, and it is forced to move first, exposing whatever sits behind it on the same line.",
            task: "The black king on a5 and the black queen on a8 share the a-file. Tap the square where your rook delivers the skewer.",
            kind: "tap",
            answer: "a1",
            hint: "It is the only a-file square your rook can reach in one move.",
            success: "a1. The rook checks the king and lines up on the queen behind it in the same move.",
            note: "Read the whole line before you move: the piece you actually win is the one at the far end.",
          },
          {
            fen: SKEWER_A,
            say: "The king cannot stay on the a-file, cannot block the rook's line, and cannot capture the rook from a5. Every escape square takes it off the file, which is exactly what the skewer is counting on.",
            task: "Good. Now the queen is the only piece left on that file.",
            kind: "read",
          },
        ],
      },
      {
        id: "skewer-2",
        title: "Understand the attacking pattern",
        blurb: "A check that does two jobs at once.",
        steps: [
          {
            fen: SKEWER_A,
            say: "Play it once slowly and watch the two halves of the pattern: the check forces the king away, and the move that revealed the second piece was already made.",
            task: "Play the skewer: rook to a1, check.",
            accept: { from: "b1", to: "a1", check: true },
            hint: "Slide the rook all the way down the b-file to the corner.",
            success: "Check. The king must answer that before anything else.",
          },
          {
            auto: { from: "a5", to: "b5" },
            say: "The king steps off the file. That was the whole point of the check.",
            note: "Now the rook attacks the queen down the a-file and nothing defends it.",
          },
        ],
      },
      {
        id: "skewer-3",
        title: "Find the correct move",
        blurb: "Find it on your own, then take what it wins.",
        steps: [
          {
            fen: SKEWER_A,
            say: "No square named this time. Which piece is the valuable one, and which line is it standing on?",
            task: "Play the move that skewers the king and the queen.",
            accept: { from: "b1", to: "a1", check: true },
            hint: "The rook does not have to stay on the b-file to be useful.",
            success: "Rook to a1. Check, and the queen behind the king is already lost.",
          },
        ],
      },
      {
        id: "skewer-4",
        title: "Apply it in a different position",
        blurb: "Same idea, a bishop and a diagonal.",
        steps: [
          {
            fen: SKEWER_B,
            say: "Different pieces, exactly the same geometry: the black king on d3 and the black rook on f5 sit on one diagonal, and the king is the nearer of the two.",
            task: "Play the bishop move that skewers the king and wins the rook.",
            accept: { from: "a2", to: "b1", check: true },
            hint: "Which diagonal do the king on d3 and the rook on f5 share, and which square on it can your bishop reach in one move?",
            success: "Bishop to b1: check, and the rook behind the king is attacked. The king cannot capture the bishop from two squares away.",
          },
        ],
      },
      {
        id: "skewer-5",
        title: "Final practical challenge",
        blurb: "The whole sequence: check, escape, capture.",
        steps: [
          {
            fen: SKEWER_B,
            say: "Play the full pattern in this position: give the check, then follow through once the king has moved.",
            task: "Step one: deliver the skewer.",
            accept: { from: "a2", to: "b1", check: true },
            hint: "The bishop's diagonal runs b1, c2, d3, e4, f5.",
            success: "Check. The king has to leave the diagonal.",
          },
          {
            auto: { from: "d3", to: "d4" },
            say: "The king steps off the line.",
          },
          {
            task: "Step two: take the rook that was hiding behind the king.",
            accept: { from: "b1", to: "f5", capture: true },
            hint: "Back along the diagonal the bishop just opened.",
            success: "Skewer complete: a rook won for nothing.",
          },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------- fork --
  {
    id: "fork",
    name: "Fork",
    tagline: "One move, two attacks. The opponent only gets one reply.",
    lessons: [
      {
        id: "fork-1",
        title: "Identify the fork",
        blurb: "One piece, two targets, one move.",
        steps: [
          {
            fen: FORK_A,
            say: "A fork is a single move that attacks two enemy pieces at once. The opponent only gets one reply, so whichever piece they save, the other one is taken next.",
            task: "Your knight on b4 can attack the black king and the black rook in one move. Tap that square.",
            kind: "tap",
            answer: "d5",
            hint: "Count two squares one way and one square across: the knight's L.",
            success: "d5. Check to the king and an attack on the rook, in one move.",
            note: "Knights fork more than any other piece, because nothing can block their L-shaped reach.",
          },
          {
            fen: FORK_A,
            say: "Notice the knight is not attacked on d5, and the rook on c7 has nothing defending it. A fork only pays when the second target is genuinely loose.",
            task: "That is the shape to look for in your own games.",
            kind: "read",
          },
        ],
      },
      {
        id: "fork-2",
        title: "Understand the attacking pattern",
        blurb: "Check first, collection second.",
        steps: [
          {
            fen: FORK_A,
            say: "The order matters. Forcing the king to answer first is what makes the fork work: the opponent never gets a free move to save the other piece.",
            task: "Play the fork: knight to d5 with check.",
            accept: { from: "b4", to: "d5", check: true },
            hint: "Two up, one across from b4.",
            success: "The king is in check and the rook is attacked. Black has to deal with the check.",
            note: "Then the rook simply falls.",
          },
        ],
      },
      {
        id: "fork-3",
        title: "Find the correct move",
        blurb: "Name the two targets, then find the square.",
        steps: [
          {
            fen: FORK_A,
            say: "Do it the way you would in a game: name the two pieces you are attacking, then find the single square that reaches both.",
            task: "Play the knight fork.",
            accept: { from: "b4", to: "d5", check: true },
            hint: "Which square is a knight's move from b4 and touches both the king's and the rook's square?",
            success: "Ne6... no: Nd5. The king is checked and the rook cannot be saved.",
            note: "When the fork comes with check, the opponent never gets a move to rescue the second piece.",
          },
        ],
      },
      {
        id: "fork-4",
        title: "Apply it in a different position",
        blurb: "A fork that hits a king and a rook again, from further away.",
        steps: [
          {
            fen: FORK_B,
            say: "The black king on f8 and the black rook on c7 are both a knight's move from one single square.",
            task: "Play the fork.",
            accept: { from: "d4", to: "e6", check: true },
            hint: "From d4, which square reaches both f8 and c7?",
            success: "Ne6. King checked, rook attacked, and the rook has no defender.",
          },
        ],
      },
      {
        id: "fork-5",
        title: "Final practical challenge",
        blurb: "Check, escape, capture: the whole fork.",
        steps: [
          {
            fen: FORK_A,
            say: "No square names this time. Work out what you are attacking, then play the whole thing through.",
            task: "Step one: fork the king and the rook.",
            accept: { from: "b4", to: "d5", check: true },
            hint: "One square that touches both targets.",
            success: "Check. Black must respond to that first.",
          },
          {
            auto: { from: "e7", to: "e8" },
            say: "The king retreats along the file.",
          },
          {
            task: "Step two: take the rook the knight was attacking.",
            accept: { from: "d5", to: "c7", capture: true },
            hint: "Your knight is already aimed at it.",
            success: "Fork played and converted. That is a rook won with one idea.",
          },
        ],
      },
    ],
  },

  // --------------------------------------------------------------------- pin --
  {
    id: "pin",
    name: "Pin",
    tagline: "A piece that cannot move, because something more valuable is standing behind it.",
    lessons: [
      {
        id: "pin-1",
        title: "Identify the pin",
        blurb: "The knight is frozen: move it and the king is exposed.",
        steps: [
          {
            fen: PIN_A,
            say: "A pin freezes a piece. The pinned piece stands on a line between your attacker and something more valuable, here the king itself, so moving it is not allowed at all.",
            task: "The black knight on c6 and the black king on e8 share a diagonal. Tap the square where your bishop pins the knight.",
            kind: "tap",
            answer: "b5",
            hint: "Follow the diagonal the knight and the king already share back towards your own side.",
            success: "b5. The knight is pinned to the king and cannot legally move.",
            note: "An absolute pin is one where the piece behind is the king. That piece cannot move, not even to capture.",
          },
          {
            fen: PIN_A,
            say: "Because the knight cannot step aside, it can also be attacked freely: whatever it would normally run from, it now has to sit and take.",
            task: "That is what makes a pin worth more than it looks.",
            kind: "read",
          },
        ],
      },
      {
        id: "pin-2",
        title: "Understand the attacking pattern",
        blurb: "Attack the pinned piece and it cannot run.",
        steps: [
          {
            fen: PIN_A,
            say: "The black knight is defended by the rook on a8, but a piece that cannot move is a piece that cannot escape either. Attack it again and Black has no way to add a defender.",
            task: "Play the pinning move.",
            accept: { from: "e2", to: "b5" },
            hint: "Two squares up the diagonal from e2.",
            success: "The knight is pinned to the king: it cannot move, and it is under attack.",
            note: "Pile on a pinned piece rather than taking it at once. Every extra attacker is one more problem the pinned side cannot answer.",
          },
        ],
      },
      {
        id: "pin-3",
        title: "Find the correct move",
        blurb: "A relative pin: the piece behind is a rook, not the king.",
        steps: [
          {
            fen: PIN_B,
            say: "The black knight on f6 is defended by nobody, and the black rook on d8 sits behind it on the same diagonal. That makes this a relative pin: the knight could move, but only by giving up the rook.",
            task: "Play the bishop move that pins the knight to the rook.",
            accept: { from: "c1", to: "g5" },
            hint: "Follow the diagonal that already holds the knight and the rook.",
            success: "Bg5. The knight is pinned, and the bishop is already attacking it.",
            note: "Relative pins are often stronger than absolute ones, because the pinned piece can still be attacked, and it still cannot run.",
          },
        ],
      },
      {
        id: "pin-4",
        title: "Apply it in a different position",
        blurb: "Same idea, a knight pinned against a rook.",
        steps: [
          {
            fen: PIN_B,
            say: "Read the line first, then find the square on it your bishop can reach in one move.",
            task: "Play the pin.",
            accept: { from: "c1", to: "g5" },
            hint: "The bishop travels up its own diagonal from c1.",
            success: "Pinned. Now the knight is both attacked and unable to save itself.",
          },
        ],
      },
      {
        id: "pin-5",
        title: "Final practical challenge",
        blurb: "Pin it, wait for the reply, then take it.",
        steps: [
          {
            fen: PIN_A,
            say: "Play the whole pattern on the first position: pin the knight, let Black answer, then take the piece that could not run.",
            task: "Step one: pin the knight to the king.",
            accept: { from: "e2", to: "b5" },
            hint: "Which diagonal holds the knight and the king together?",
            success: "Pinned. The knight cannot move without exposing the king.",
          },
          {
            auto: { from: "e8", to: "f8" },
            say: "Black moves the king to break the pin, which is the only kind of move that does not lose the knight immediately.",
          },
          {
            task: "Step two: take the knight.",
            accept: { from: "b5", to: "c6", capture: true },
            hint: "The pinned piece is still standing exactly where it was.",
            success: "A whole knight for nothing. Pins win material slowly, and this is why.",
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------------- x-ray --
  {
    id: "x-ray",
    name: "X-Ray",
    tagline: "A piece that looks blocked is still attacking right through the piece in front of it.",
    lessons: [
      {
        id: "x-ray-1",
        title: "Identify the x-ray",
        blurb: "The rook's real reach goes straight through the pawn.",
        steps: [
          {
            fen: XRAY_A,
            say: "An x-ray is when a piece's influence continues through something standing in its way. Your rook looks blocked by the pawn on d4, but it is really on the same d-file as the black rook on d8, waiting.",
            task: "Tap the square of the piece whose influence reaches through the pawn.",
            kind: "tap",
            answer: "d1",
            hint: "The piece on the d-file on your side of the board.",
            success: "d1. The pawn blocks the move, not the idea.",
            note: "Strong players count x-ray pressure as real control long before anything is captured.",
          },
          {
            fen: XRAY_A,
            say: "Anything that clears the square in front, a capture, a push, even a trade, turns that x-ray into a direct attack on the rook behind it.",
            task: "That is why the file is worth more than it looks.",
            kind: "read",
          },
        ],
      },
      {
        id: "x-ray-2",
        title: "Understand the attacking pattern",
        blurb: "The front piece is the trigger, not the obstacle.",
        steps: [
          {
            fen: XRAY_A,
            say: "The pawn on d4 is the front piece of the x-ray, but it is a black pawn sitting in your own rook's way. As soon as it moves, the file belongs to your rook.",
            task: "Slide your rook anywhere along the d-file and see where it is really pointing.",
            accept: { from: "d1" },
            hint: "Try d3, or double down to d4.",
            success: "Same file, one piece between it and the black rook: the x-ray is already doing work.",
            note: "In practice the x-ray pays best when the front piece can also capture something, gaining a tempo while the file opens.",
          },
        ],
      },
      {
        id: "x-ray-3",
        title: "Find the correct move",
        blurb: "Capture with the front piece and the file opens behind it.",
        steps: [
          {
            fen: XRAY_B,
            say: "The white pawn on d4 is the front piece of the x-ray this time, and there is a black knight on c5 it can take. Capture there and the pawn leaves the d-file, uncovering the rook's attack on the black queen behind it.",
            task: "Play the pawn capture that wins material through the x-ray.",
            accept: { from: "d4", to: "c5", capture: true },
            hint: "The pawn takes diagonally, and there is a knight on the diagonal.",
            success: "Pawn takes knight, and the rook is now looking straight at the queen. Two problems from one move.",
            note: "That is the x-ray doing real work: a capture in front, a threat behind.",
          },
        ],
      },
      {
        id: "x-ray-4",
        title: "Apply it in a different position",
        blurb: "The same file, the same idea, a bigger prize.",
        steps: [
          {
            fen: XRAY_B,
            say: "The black queen on d8 is the piece behind the front pawn, and Black cannot keep both the knight and the queen once the pawn leaves the file.",
            task: "Open the d-file with the pawn capture.",
            accept: { from: "d4", to: "c5", capture: true },
            hint: "There is only one capture for that pawn.",
            success: "The x-ray becomes a direct attack the moment the file is clear.",
          },
        ],
      },
      {
        id: "x-ray-5",
        title: "Final practical challenge",
        blurb: "Win the piece in front, then take what it was hiding.",
        steps: [
          {
            fen: XRAY_B,
            say: "Play the whole thing through: take with the pawn, let the queen step aside, then take the piece the rook was really aiming at.",
            task: "Step one: open the file with the pawn capture.",
            accept: { from: "d4", to: "c5", capture: true },
            hint: "The pawn takes towards the queenside.",
            success: "The rook is now looking straight at the queen.",
          },
          {
            auto: { from: "d8", to: "d7" },
            say: "The queen runs, but it stays on the same file, and that file belongs to your rook.",
          },
          {
            task: "Step two: take the queen.",
            accept: { from: "d1", to: "d7", capture: true },
            hint: "Straight up the file the pawn has just cleared.",
            success: "Queen won. A blocked file turned into material.",
          },
        ],
      },
    ],
  },

  // -------------------------------------------------------- discovered attack --
  {
    id: "discovered-attack",
    name: "Discovered Attack",
    tagline: "Move one piece out of the way and the piece behind it attacks something new.",
    lessons: [
      {
        id: "discovered-attack-1",
        title: "Identify the discovered attack",
        blurb: "The piece that moves is not the piece that attacks.",
        steps: [
          {
            fen: DISC_A,
            say: "A discovered attack happens when one piece steps out of the way and uncovers an attack from a different piece behind it. The piece that moves does not even have to threaten anything itself.",
            task: "Tap the square of the piece standing in your rook's way on the a-file.",
            kind: "tap",
            answer: "a4",
            hint: "Your rook is on a1 and there is exactly one thing between it and the top of the board.",
            success: "a4. Move that knight and your rook owns the whole file.",
            note: "The moving piece is the switch; the piece behind it is the weapon.",
          },
          {
            fen: DISC_A,
            say: "The real force of this pattern is that the moving piece can create a second threat while the revealed piece creates the first. Two problems from one move is more than most positions can absorb.",
            task: "Keep asking both questions: what does the revealed piece attack, and where does the moving piece land?",
            kind: "read",
          },
        ],
      },
      {
        id: "discovered-attack-2",
        title: "Understand the attacking pattern",
        blurb: "One move, two threats.",
        steps: [
          {
            fen: DISC_B,
            say: "Your knight on d3 is blocking the rook's view of the black queen on d8, and the black rook on g6 is exactly where the knight can land next. The knight is the switch, the rook is the weapon.",
            task: "Play the knight move that uncovers the rook and attacks the rook on g6.",
            accept: { from: "d3", to: "e5" },
            hint: "Which knight move from d3 also attacks g6?",
            success: "Ne5. The queen is attacked down the d-file and the rook on g6 is attacked by the knight: Black can only save one.",
            note: "That two-sided threat is the discovered attack at its best.",
          },
        ],
      },
      {
        id: "discovered-attack-3",
        title: "Find the correct move",
        blurb: "Find the blocker, then find the square it should go to.",
        steps: [
          {
            fen: DISC_B,
            say: "Same position, no hints named. Find the piece doing the blocking, work out what is behind it, and pick the knight jump that does the most damage.",
            task: "Play the discovered attack.",
            accept: { from: "d3", to: "e5" },
            hint: "Uncovering the d-file is only half of it: the moving piece has to attack something too.",
            success: "Uncovered queen, attacked rook, and no single move answers both.",
          },
        ],
      },
      {
        id: "discovered-attack-4",
        title: "Apply it in a different position",
        blurb: "Play it under pressure: discovery first, capture second.",
        steps: [
          {
            fen: DISC_B,
            say: "Now play the whole sequence, the way it would actually happen in a game.",
            task: "Step one: uncover the rook and attack the rook on g6.",
            accept: { from: "d3", to: "e5" },
            hint: "The knight has one square that hits g6.",
            success: "Queen attacked, rook attacked. Black has to choose.",
          },
          {
            auto: { from: "d8", to: "e8" },
            say: "Black saves the queen, because losing a queen is worse.",
          },
          {
            task: "Step two: take the rook the knight was attacking.",
            accept: { from: "e5", to: "g6", capture: true },
            hint: "Your knight is already on the right diagonal of squares.",
            success: "Rook won, and the knight gives check from g6. A discovered attack converted into material.",
          },
        ],
      },
      {
        id: "discovered-attack-5",
        title: "Final practical challenge",
        blurb: "Same pattern, no hints at all.",
        steps: [
          {
            fen: DISC_A,
            say: "Back to the first position. Any legal knight move uncovers the rook, so choose the one that also does something useful.",
            task: "Play a knight move that uncovers the rook's attack on the black king.",
            accept: { from: "a4" },
            acceptMultiple: true,
            hint: "Any square the knight can reach takes it off the a-file.",
            success: "The rook now attacks the king down the open file. That is a discovered check, the most forcing version of the idea.",
            note: "Practice asking both questions every time, and discovered attacks start appearing in your own games.",
          },
        ],
      },
    ],
  },

  // --------------------------------------------------------- discovered check --
  {
    id: "discovered-check",
    name: "Discovered Check",
    tagline: "A discovered attack where the revealed piece gives check, which makes it practically free.",
    lessons: [
      {
        id: "discovered-check-1",
        title: "Identify the discovered check",
        blurb: "A free move, because the check must be answered first.",
        steps: [
          {
            fen: DCHK_A,
            say: "A discovered check is a discovered attack where the revealed piece gives check. That is worth even more, because the opponent must deal with the check before they can do anything else at all.",
            task: "Tap the square of the piece blocking your rook's path to the black king.",
            kind: "tap",
            answer: "a4",
            hint: "The rook is on a1 and the black king is on a8.",
            success: "a4. Move that knight and the rook checks the king.",
            note: "Because a check has to be answered immediately, the moving piece usually gets a free hit on something.",
          },
          {
            fen: DCHK_A,
            say: "Any legal knight move uncovers the check, which means you get to choose the knight's destination freely. The opponent has to spend their move on the king instead of capturing it.",
            task: "Now look at how much that is worth in a real game.",
            kind: "read",
          },
        ],
      },
      {
        id: "discovered-check-2",
        title: "Understand the attacking pattern",
        blurb: "Uncover the check and pick the knight's landing square.",
        steps: [
          {
            fen: DCHK_A,
            say: "Move the knight anywhere legal and watch the check appear. Then think about where a knight would want to land anyway.",
            task: "Move the knight off the a-file.",
            accept: { from: "a4" },
            acceptMultiple: true,
            hint: "Any knight jump will do.",
            success: "Check. Now imagine that knight landing on a square where it also attacks something.",
            note: "The strongest version of this is a discovered check that also forks something with the moving piece.",
          },
        ],
      },
      {
        id: "discovered-check-3",
        title: "Find the correct move",
        blurb: "Uncover the check and hit the rook on the way out.",
        steps: [
          {
            fen: DCHK_B,
            say: "Your knight on d3 blocks the rook's line to the black king on d8, and the black rook on c6 is exactly where the knight can land next. One move does both jobs.",
            task: "Play the knight move that gives discovered check and attacks the rook on c6.",
            accept: { from: "d3", to: "e5", check: true },
            hint: "Which square does the knight reach that also attacks c6?",
            success: "Ne5+. Check from the rook, rook attacked by the knight, and Black cannot answer both.",
            note: "The check buys the tempo. That is what makes the second threat unstoppable.",
          },
        ],
      },
      {
        id: "discovered-check-4",
        title: "Apply it in a different position",
        blurb: "Check, forced reply, capture.",
        steps: [
          {
            fen: DCHK_B,
            say: "Play the whole pattern this time, all the way to the material.",
            task: "Step one: uncover the check and hit the rook.",
            accept: { from: "d3", to: "e5", check: true },
            hint: "The d-file opens the moment the knight leaves it.",
            success: "That is a discovered check. Black has no time to move the rook.",
          },
          {
            auto: { from: "d8", to: "c8" },
            say: "The king steps off the open file.",
          },
          {
            task: "Step two: take the rook.",
            accept: { from: "e5", to: "c6", capture: true },
            hint: "The knight is already attacking it.",
            success: "Rook won. Discovered check is one of the most reliable ways to win material in chess.",
          },
        ],
      },
      {
        id: "discovered-check-5",
        title: "Final practical challenge",
        blurb: "The same pattern on the first position, with nothing named.",
        steps: [
          {
            fen: DCHK_A,
            say: "Work out which piece is in the way, where it can go, and what the rook is aiming at the whole time.",
            task: "Play a move that uncovers check on the black king.",
            accept: { from: "a4" },
            acceptMultiple: true,
            hint: "Any legal knight move uncovers the rook.",
            success: "Discovered check. The rook did the work, the knight only had to step aside.",
            note: "Look for this shape whenever a rook and a bishop are lined up on the enemy king with one of your pieces in the way.",
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ double attack --
  {
    id: "double-attack",
    name: "Double Attack",
    tagline: "One piece, two targets. The queen is the specialist at this.",
    lessons: [
      {
        id: "double-attack-1",
        title: "Identify the double attack",
        blurb: "The queen reaches two pieces from one square.",
        steps: [
          {
            fen: DBL_A,
            say: "A double attack is the queen's version of a fork: one move that attacks two pieces from a single square. Unlike a knight, the queen can often do it from a distance, so the two targets do not have to be close together.",
            task: "The black rook on a7 and the black knight on h8 are both loose. Tap the square where your queen attacks both at once.",
            kind: "tap",
            answer: "d4",
            hint: "It sits on the same diagonal as the rook and on the same diagonal as the knight.",
            success: "d4. The queen attacks the rook up one diagonal and the knight up the other.",
            note: "Before every queen move, look for two enemy pieces that sit on lines crossing one square.",
          },
          {
            fen: DBL_A,
            say: "The queen on d4 is not defended by anything, and it does not need to be: Black has two pieces under attack and only one move to spend.",
            task: "Two threats mean the opponent only gets one answer.",
            kind: "read",
          },
        ],
      },
      {
        id: "double-attack-2",
        title: "Understand the attacking pattern",
        blurb: "Attack two things, then take the one they leave.",
        steps: [
          {
            fen: DBL_A,
            say: "Play the double attack and watch Black scramble to save one of the two pieces.",
            task: "Play the queen move that attacks the rook and the knight at the same time.",
            accept: { from: "d1", to: "d4" },
            hint: "Where do the two lines from the rook and the knight cross?",
            success: "Both pieces are attacked. There is no single move that saves both.",
          },
          {
            auto: { from: "h8", to: "g6" },
            say: "Black moves the knight to safety, which is all it can do about the position.",
          },
          {
            task: "Take the piece that stayed put.",
            accept: { from: "d4", to: "a7", capture: true },
            hint: "Up the diagonal the queen was already pointing along.",
            success: "Rook won. The double attack did the work in one move.",
          },
        ],
      },
      {
        id: "double-attack-3",
        title: "Find the correct move",
        blurb: "The same idea on a different set of lines.",
        steps: [
          {
            fen: DBL_B,
            say: "The black rook on b7 and the black knight on e8 are both loose, and their lines cross on one square.",
            task: "Play the queen move that attacks both pieces.",
            accept: { from: "e1", to: "e4" },
            hint: "The crossing square is on the same file as the knight and the same diagonal as the rook.",
            success: "One move, two attacks. Black saves one piece and loses the other.",
            note: "Distance does not matter to a queen. Only lines.",
          },
        ],
      },
      {
        id: "double-attack-4",
        title: "Apply it in a different position",
        blurb: "Double attack, then collect.",
        steps: [
          {
            fen: DBL_B,
            say: "Play the whole thing through, including the capture after Black replies.",
            task: "Step one: attack the rook and the knight at the same time.",
            accept: { from: "e1", to: "e4" },
            hint: "Where do the file and the diagonal cross?",
            success: "Both pieces are hanging now.",
          },
          {
            auto: { from: "b7", to: "c7" },
            say: "Black saves the rook.",
          },
          {
            task: "Step two: take the knight.",
            accept: { from: "e4", to: "e8", capture: true },
            hint: "It is still sitting on the same file, and the capture comes with check.",
            success: "Knight won, with check, so Black gets no chance to hit back.",
          },
        ],
      },
      {
        id: "double-attack-5",
        title: "Final practical challenge",
        blurb: "Find the crossing square with nothing named.",
        steps: [
          {
            fen: DBL_A,
            say: "Name the two targets first, then ask which single square sees both of them. That question is the whole tactic.",
            task: "Play the double attack.",
            accept: { from: "d1", to: "d4" },
            hint: "One target is up a diagonal, the other is up the other diagonal.",
            success: "Correct. Two attacks, one move, one answer from Black.",
            note: "This is the pattern behind a huge share of queen tactics, including most royal forks.",
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------- removing the defender --
  {
    id: "removing-the-defender",
    name: "Removing the Defender",
    tagline: "Take away the piece doing the defending and the piece it protected falls on its own.",
    lessons: [
      {
        id: "removing-the-defender-1",
        title: "Identify the defender",
        blurb: "Every defended piece has a defender, and defenders can be attacked too.",
        steps: [
          {
            fen: REM_A,
            say: "A piece is only safe while something is defending it. The black queen on d8 is defended by the knight on f7 and by nothing else, so the knight is the piece that has to go first.",
            task: "Tap the square of the only black piece defending the queen.",
            kind: "tap",
            answer: "f7",
            hint: "It is the piece standing between the queen and the corner.",
            success: "f7. Remove that knight and the queen is simply hanging.",
            note: "When you see a piece defended exactly once, ask what happens if the defender disappears.",
          },
          {
            fen: REM_A,
            say: "The other half of the idea is the tempo. If you can take the defender with check, the opponent never gets a move to save what it was defending.",
            task: "That combination of ideas is what makes this tactic work.",
            kind: "read",
          },
        ],
      },
      {
        id: "removing-the-defender-2",
        title: "Understand the attacking pattern",
        blurb: "Take the defender with tempo, then collect.",
        steps: [
          {
            fen: REM_A,
            say: "Your bishop on e6 can take that knight, and because the black king is on g8 the capture comes with check, so Black has no time to move the queen to safety.",
            task: "Play the capture that removes the defender with check.",
            accept: { from: "e6", to: "f7", check: true, capture: true },
            hint: "The bishop takes the knight on the diagonal, right in front of the king.",
            success: "Bxf7+. The defender is gone and the check forces the king to spend its move on itself.",
          },
          {
            auto: { from: "g8", to: "f7" },
            say: "The king recaptures, because it has to get out of check somehow. The bishop was never the point.",
          },
          {
            say: "The queen on d8 has nothing defending it now, and your rook has been aiming at it since the game began.",
            task: "Take the queen.",
            accept: { from: "d1", to: "d8", capture: true },
            hint: "Straight down the d-file.",
            success: "Queen won. The defender was worth more than it looked.",
          },
        ],
      },
      {
        id: "removing-the-defender-3",
        title: "Find the correct move",
        blurb: "This time the defender is a knight guarding a queen on a file.",
        steps: [
          {
            fen: REM_B,
            say: "The black queen on d5 is defended by the knight on f6, and your rook on d1 is already staring at it. Take the defender first and the queen cannot be held.",
            task: "Play the capture that removes the defender.",
            accept: { from: "h5", to: "f6", check: true, capture: true },
            hint: "Your knight can take the defender, and the capture comes with check.",
            success: "Nxf6+. The defender is gone, and Black has to deal with the check before touching the queen.",
            note: "Always check that the capture is forcing. Without the check, the defender's piece simply walks away.",
          },
        ],
      },
      {
        id: "removing-the-defender-4",
        title: "Apply it in a different position",
        blurb: "Remove the defender, survive the recapture, take the prize.",
        steps: [
          {
            fen: REM_B,
            say: "Play the whole combination, including what happens after Black answers.",
            task: "Step one: take the defender with check.",
            accept: { from: "h5", to: "f6", check: true, capture: true },
            hint: "The knight on f6 is the only defender of the queen on d5.",
            success: "The defender is gone and Black is in check.",
          },
          {
            auto: { from: "g8", to: "h8" },
            say: "The king steps out of check.",
          },
          {
            task: "Step two: take the queen that has just lost its only defender.",
            accept: { from: "d1", to: "d5", capture: true },
            hint: "Down the open d-file.",
            success: "Queen won. That is removing the defender, start to finish.",
          },
        ],
      },
      {
        id: "removing-the-defender-5",
        title: "Final practical challenge",
        blurb: "The same pattern in the first position, with nothing named.",
        steps: [
          {
            fen: REM_A,
            say: "Decide which piece is doing the defending, work out how to take it with tempo, and only then take the reward.",
            task: "Play the capture that removes the defender with check.",
            accept: { from: "e6", to: "f7", check: true, capture: true },
            hint: "The capture has to be forcing, or Black simply moves the queen.",
            success: "Bxf7+. The queen was only ever as safe as its defender.",
            note: "Two ideas working together: remove the guard, and do it in a way the opponent must answer.",
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------- overloaded piece ---
  {
    id: "overloaded-piece",
    name: "The Overloaded Piece",
    tagline: "One defender, two jobs: it can only ever do one of them.",
    lessons: [
      {
        id: "overloaded-piece-1",
        title: "Identify the overloaded piece",
        blurb: "Defending two things at once is really defending one.",
        steps: [
          {
            fen: OVL_A,
            say: "A piece is overloaded when it is the only defender of two different things. The black rook on d8 is guarding the knight on d5 along the file and the bishop on a8 along the back rank, and it cannot do both.",
            task: "Tap the square of the black piece defending two pieces at once.",
            kind: "tap",
            answer: "d8",
            hint: "It is the only black piece other than the king.",
            success: "d8. Take one of the pieces it guards and it has to choose which one to lose.",
            note: "Overloads are usually created, not spotted: every capture forces a defender to make a decision.",
          },
          {
            fen: OVL_A,
            say: "Your bishop on b3 attacks the knight on d5. If Black recaptures with the rook, the rook leaves the back rank, and the bishop on a8 is left with nobody guarding it.",
            task: "Follow the defender, not the piece you captured.",
            kind: "read",
          },
        ],
      },
      {
        id: "overloaded-piece-2",
        title: "Understand the attacking pattern",
        blurb: "Force the defender to pick a job.",
        steps: [
          {
            fen: OVL_A,
            say: "Play the capture and watch the rook decide which of its two jobs to keep.",
            task: "Take the knight with your bishop.",
            accept: { from: "b3", to: "d5", capture: true },
            hint: "The bishop's diagonal runs through c4.",
            success: "Bxd5. Now the rook has a decision it cannot get right.",
          },
          {
            auto: { from: "d8", to: "d5" },
            say: "The rook recaptures, as it has to, and steps off the back rank.",
          },
          {
            say: "The bishop on a8 was relying on that rook. Your rook on a1 has been aimed up the a-file the whole time.",
            task: "Take the bishop, with check.",
            accept: { from: "a1", to: "a8", capture: true },
            hint: "Straight up the a-file.",
            success: "Bishop won: one defender, two jobs, no way to do both.",
          },
        ],
      },
      {
        id: "overloaded-piece-3",
        title: "Find the correct move",
        blurb: "The same overload, from the other side of the board.",
        steps: [
          {
            fen: OVL_B,
            say: "Here the black rook on d8 defends the knight on d5 along the file and the bishop on h8 along the back rank. Your bishop can attack the knight immediately.",
            task: "Play the capture that overloads the rook.",
            accept: { from: "b3", to: "d5", capture: true },
            hint: "The bishop takes the knight in the middle of the board.",
            success: "Bxd5. Whatever Black does next, something is left undefended.",
            note: "Any capture that a single defender has to answer creates an overload.",
          },
        ],
      },
      {
        id: "overloaded-piece-4",
        title: "Apply it in a different position",
        blurb: "Force the defender off its post, then take what it left behind.",
        steps: [
          {
            fen: OVL_B,
            say: "Play the whole combination here, all the way to the material.",
            task: "Step one: take the knight the rook is guarding.",
            accept: { from: "b3", to: "d5", capture: true },
            hint: "The bishop's diagonal through c4.",
            success: "Now the rook has to choose.",
          },
          {
            auto: { from: "d8", to: "d5" },
            say: "The rook recaptures and abandons the back rank.",
          },
          {
            task: "Step two: take the piece that was left undefended, with check.",
            accept: { from: "h1", to: "h8", capture: true },
            hint: "The h-file has been open from the start.",
            success: "Bishop won, with check. One defender cannot cover two pieces.",
          },
        ],
      },
      {
        id: "overloaded-piece-5",
        title: "Final practical challenge",
        blurb: "Same idea on the first position, nothing named.",
        steps: [
          {
            fen: OVL_A,
            say: "Find the black piece with two jobs, then find the capture that forces it to pick one.",
            task: "Play the move that overloads the defender.",
            accept: { from: "b3", to: "d5", capture: true },
            hint: "Which black piece is defending more than one thing?",
            success: "Correct. The defender cannot answer everything, and it is your turn to prove it.",
            note: "Look for this whenever one enemy piece is the only guard on two of its own.",
          },
        ],
      },
    ],
  },

  // --------------------------------------------------------- trapped piece ----
  {
    id: "trapped-piece",
    name: "The Trapped Piece",
    tagline: "A piece with legal moves can still be a piece with no safe moves.",
    lessons: [
      {
        id: "trapped-piece-1",
        title: "Identify the trapped piece",
        blurb: "The knight in the corner has almost nowhere to go.",
        steps: [
          {
            fen: TRAP_A,
            say: "A trapped piece is one that technically still has legal moves but every one of them is covered. The black knight on a8 has only two squares it can ever reach from the corner.",
            task: "Tap the corner square where the black knight is trapped.",
            kind: "tap",
            answer: "a8",
            hint: "Top left corner.",
            success: "a8. From the corner a knight can only ever reach b6 or c7, and your bishop covers both.",
            note: "Knights on the rim are the easiest pieces in chess to trap.",
          },
          {
            fen: TRAP_A,
            say: "Your bishop on a5 covers b6 and c7, so the knight's only two escape squares are the squares it would be captured on. That is what turns an active piece into a lost one.",
            task: "Count the escape squares before you commit to anything.",
            kind: "read",
          },
        ],
      },
      {
        id: "trapped-piece-2",
        title: "Understand the attacking pattern",
        blurb: "Name the two squares the knight can reach.",
        steps: [
          {
            fen: TRAP_A,
            say: "A knight in the corner can reach exactly two squares. Cover those and it has nothing left.",
            task: "Tap the first square the black knight could jump to from a8.",
            kind: "tap",
            answer: "b6",
            hint: "Two files across, one rank down.",
            success: "b6, and your bishop already covers it.",
          },
          {
            fen: TRAP_A,
            say: "That is one escape square gone. The other one is still worth naming.",
            task: "Tap the second square the knight could reach.",
            kind: "tap",
            answer: "c7",
            hint: "Three files across, two ranks down.",
            success: "c7 as well, also covered by the bishop. The knight is going nowhere.",
            note: "Trapping is a two-part job: close the escape squares, then bring a piece to take the prisoner.",
          },
        ],
      },
      {
        id: "trapped-piece-3",
        title: "Find the correct move",
        blurb: "A knight cut off in the open, not just in a corner.",
        steps: [
          {
            fen: TRAP_B,
            say: "The knight on a4 has four squares it could jump to: b6, c5, c3 and b2. Your bishop on d4 already covers all four, and your rook on a1 is attacking it along the a-file.",
            task: "Play the capture, now that the knight has nowhere safe to run.",
            accept: { from: "a1", to: "a4", capture: true },
            hint: "The rook takes up the a-file.",
            success: "Knight won for free. Nothing could come to its rescue.",
            note: "A knight away from the centre is often one bad square away from being lost.",
          },
        ],
      },
      {
        id: "trapped-piece-4",
        title: "Apply it in a different position",
        blurb: "A knight trapped by a knight.",
        steps: [
          {
            fen: TRAP_C,
            say: "The black knight on h8 has two squares: g6 and f7. Both of them are covered by your knight on e5, so the knight in the corner is already lost. Your rook is on the h-file.",
            task: "Take the trapped knight.",
            accept: { from: "h1", to: "h8", capture: true },
            hint: "Down the h-file, and it comes with check.",
            success: "Knight won with check. A piece with no escape square is a piece you can simply take.",
          },
        ],
      },
      {
        id: "trapped-piece-5",
        title: "Final practical challenge",
        blurb: "Check every escape square before you take.",
        steps: [
          {
            fen: TRAP_B,
            say: "Before you capture, convince yourself the knight cannot run: name each square it could jump to and see that your bishop covers it.",
            task: "Take the trapped knight.",
            accept: { from: "a1", to: "a4", capture: true },
            hint: "Four escape squares, all covered.",
            success: "Taken, and there was never an escape square to find.",
            note: "This is why a knight should never be left on the edge of the board without support.",
          },
        ],
      },
    ],
  },
];

export const TACTIC_TOTAL_LESSONS = TACTIC_SERIES.reduce((n, s) => n + s.lessons.length, 0);
