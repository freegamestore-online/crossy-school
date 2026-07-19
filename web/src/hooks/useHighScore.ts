import { useCallback } from "react";

const HIGH_SCORE_KEY = "crossy_school_highscore";

export function useHighScore() {
  const getHighScore = useCallback(() => {
    const raw = localStorage.getItem(HIGH_SCORE_KEY);
    return raw ? parseInt(raw, 10) : 0;
  }, []);

  const setHighScore = useCallback((score: number) => {
    localStorage.setItem(HIGH_SCORE_KEY, score.toString());
  }, []);

  return { getHighScore, setHighScore };
}

export function getHighScore(): number {
  const raw = localStorage.getItem(HIGH_SCORE_KEY);
  return raw ? parseInt(raw, 10) : 0;
}

export function setHighScore(score: number): void {
  localStorage.setItem(HIGH_SCORE_KEY, score.toString());
}
