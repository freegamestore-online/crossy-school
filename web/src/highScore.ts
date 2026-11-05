const HIGH_SCORE_KEY = "crossy_school_highscore";

export function getHighScore(): number {
  return parseInt(localStorage.getItem(HIGH_SCORE_KEY) ?? "", 10) || 0;
}

export function setHighScore(score: number): void {
  localStorage.setItem(HIGH_SCORE_KEY, score.toString());
}
