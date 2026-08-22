// Beginner-facing glossary. Kept short and plain-language on purpose —
// this is for a first-time player looking up a word mid-lesson, not a
// reference manual.
export const GLOSSARY = {
  check: "The king is under direct attack and must move to safety, block the attack, or capture the attacking piece.",
  checkmate: "The king is under attack with no way to escape, block, or capture — the game ends immediately.",
  stalemate: "The player to move has no legal moves at all, but their king isn't in check. This ends the game as a draw.",
  pin: "A piece can't safely move because doing so would expose a more valuable piece behind it on the same line — often the king.",
  fork: "A single move that attacks two or more enemy pieces at the same time.",
  skewer: "Like a pin, but the more valuable piece is in front — attacking it forces it to move, exposing the piece behind.",
  "discovered attack": "Moving one piece out of the way reveals an attack from a different piece behind it.",
  opposition: "In a king-and-pawn endgame, when the two kings face each other with one square between them — controlling this fight often decides the endgame.",
  zugzwang: "A position where a player would prefer to pass, because any legal move they make makes their position worse.",
  prophylaxis: "A move made specifically to prevent an opponent's plan, rather than to advance your own.",
  "back-rank mate": "A checkmate delivered on the row a king started on, when its own pawns block every escape square.",
};

export function glossaryTerms() {
  return Object.keys(GLOSSARY);
}
