// Glicko-2 rating system, the same underlying algorithm Lichess uses.
// Implemented as a single-opponent update (each game treated as its own
// "rating period" with one result), which is the standard simplification
// for real-time/incremental rating systems rather than batched periods.
// this is a well-documented approach, not a shortcut specific to
// ChessLoop. Reference: Glickman, "Example of the Glicko-2 system".

const SCALE = 173.7178;
const TAU = 0.5; // system volatility constraint, Glickman's recommended default range is 0.3-1.2
const EPSILON = 0.000001;

function toGlicko2Scale(rating, rd) {
  return { mu: (rating - 1500) / SCALE, phi: rd / SCALE };
}
function fromGlicko2Scale(mu, phi) {
  return { rating: mu * SCALE + 1500, rd: phi * SCALE };
}

function g(phi) {
  return 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI));
}
function E(mu, muOpp, phiOpp) {
  return 1 / (1 + Math.exp(-g(phiOpp) * (mu - muOpp)));
}

/**
 * Compute a player's updated rating after one game.
 * @param {number} rating - player's current rating
 * @param {number} rd - player's current rating deviation
 * @param {number} volatility - player's current volatility
 * @param {number} oppRating - opponent's rating
 * @param {number} oppRd - opponent's rating deviation
 * @param {number} score - 1 for win, 0.5 for draw, 0 for loss
 */
export function updateRating(rating, rd, volatility, oppRating, oppRd, score) {
  const player = toGlicko2Scale(rating, rd);
  const opp = toGlicko2Scale(oppRating, oppRd);

  const gPhiJ = g(opp.phi);
  const EVal = E(player.mu, opp.mu, opp.phi);
  const v = 1 / (gPhiJ * gPhiJ * EVal * (1 - EVal));
  const delta = v * gPhiJ * (score - EVal);

  // Solve for new volatility via the Illinois algorithm (standard Glicko-2 step 5)
  const a = Math.log(volatility * volatility);
  function f(x) {
    const eX = Math.exp(x);
    const num = eX * (delta * delta - player.phi * player.phi - v - eX);
    const den = 2 * Math.pow(player.phi * player.phi + v + eX, 2);
    return num / den - (x - a) / (TAU * TAU);
  }

  let A = a;
  let B;
  if (delta * delta > player.phi * player.phi + v) {
    B = Math.log(delta * delta - player.phi * player.phi - v);
  } else {
    let k = 1;
    while (f(a - k * TAU) < 0) k++;
    B = a - k * TAU;
  }

  let fA = f(A);
  let fB = f(B);
  while (Math.abs(B - A) > EPSILON) {
    const C = A + ((A - B) * fA) / (fB - fA);
    const fC = f(C);
    if (fC * fB < 0) {
      A = B;
      fA = fB;
    } else {
      fA = fA / 2;
    }
    B = C;
    fB = fC;
  }
  const newVolatility = Math.exp(A / 2);

  const phiStar = Math.sqrt(player.phi * player.phi + newVolatility * newVolatility);
  const newPhi = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v);
  const newMu = player.mu + newPhi * newPhi * gPhiJ * (score - EVal);

  const result = fromGlicko2Scale(newMu, newPhi);
  return {
    rating: Math.round(result.rating),
    rd: Math.round(result.rd * 100) / 100,
    volatility: newVolatility,
  };
}

// Convenience for a completed game between two rated players, returns
// both players' updated ratings in one call.
export function updateBothPlayers(white, black, result) {
  // result: 'white' | 'black' | 'draw'
  const whiteScore = result === "white" ? 1 : result === "draw" ? 0.5 : 0;
  const blackScore = 1 - whiteScore;
  const newWhite = updateRating(white.rating, white.rd, white.volatility, black.rating, black.rd, whiteScore);
  const newBlack = updateRating(black.rating, black.rd, black.volatility, white.rating, white.rd, blackScore);
  return { white: newWhite, black: newBlack };
}

export const DEFAULT_RATING = { rating: 1500, rd: 350, volatility: 0.06 };
export const TIME_CONTROLS = [
  { key: "bullet", label: "Bullet", options: [{ label: "1+0", minutes: 1, incrementSec: 0 }, { label: "2+1", minutes: 2, incrementSec: 1 }] },
  { key: "blitz", label: "Blitz", options: [{ label: "3+0", minutes: 3, incrementSec: 0 }, { label: "5+0", minutes: 5, incrementSec: 0 }, { label: "5+3", minutes: 5, incrementSec: 3 }] },
  { key: "rapid", label: "Rapid", options: [{ label: "10+0", minutes: 10, incrementSec: 0 }, { label: "10+5", minutes: 10, incrementSec: 5 }, { label: "15+10", minutes: 15, incrementSec: 10 }] },
  { key: "classical", label: "Classical", options: [{ label: "30+0", minutes: 30, incrementSec: 0 }] },
];
