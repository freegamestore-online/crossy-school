import k from "@freegamestore/games/kaplay";
import { AVATARS } from "./avatars";
import { getHighScore, setHighScore } from "./hooks/useHighScore";

interface GameState {
  score: number;
  level: number;
  coins: number;
  avatarIdx: number;
  avatarsUnlocked: number[];
  isMuted: boolean;
}

const AVATAR_UNLOCK_LEVELS = [1, 2, 4, 6];

export function startGame(canvas: HTMLCanvasElement, onScore: (score: number) => void) {
  k.setCanvas(canvas);
  let state: GameState = {
    score: 0,
    level: 1,
    coins: 0,
    avatarIdx: 0,
    avatarsUnlocked: [0],
    isMuted: true,
  };

  // Placeholder for music (actual playback needs asset)
  let musicInst: ReturnType<typeof k.play> | undefined;

  function unlockAvatars(level: number) {
    AVATAR_UNLOCK_LEVELS.forEach((lvl, i) => {
      if (level >= lvl && !state.avatarsUnlocked.includes(i)) {
        state.avatarsUnlocked.push(i);
      }
    });
  }

  function startLevel(level: number) {
    k.scene("play", () => {
      unlockAvatars(level);
      const avatar = AVATARS[state.avatarIdx];
      const player = k.add([
        k.pos(100, 400),
        k.rect(32, 32),
        k.color(avatar.color),
        k.area(),
        k.body(),
        "player"
      ]);

      // Add car obstacle
      const car = k.add([
        k.pos(0, 200),
        k.rect(64, 32),
        k.color("#ef4444"),
        k.area(),
        "car"
      ]);
      k.onUpdate(() => {
        car.move(120, 0);
        if (car.pos.x > 320) car.pos.x = -64;
      });

      // Add coin
      const coin = k.add([
        k.pos(200, 300),
        k.circle(16),
        k.color("#facc15"),
        k.area(),
        "coin"
      ]);

      // School finish
      const school = k.add([
        k.pos(100, 50),
        k.rect(64, 32),
        k.color("#38bdf8"),
        k.area(),
        "school"
      ]);

      // Controls
      k.onKeyPress("left", () => player.move(-32, 0));
      k.onKeyPress("right", () => player.move(32, 0));
      k.onKeyPress("up", () => player.move(0, -32));
      k.onKeyPress("down", () => player.move(0, 32));

      // Touch controls (simple, for demo)
      k.onTouchStart(() => player.move(0, -32));

      player.onCollide("car", () => {
        k.add([
          k.pos(player.pos.x, player.pos.y),
          k.rect(32, 32),
          k.color("#d1d5db"),
          k.area(),
          "squash"
        ]);
        k.destroy(player);
        k.wait(0.8, () => k.go("over", state.score));
      });
      player.onCollide("coin", (c) => {
        state.coins += 1;
        state.score += 1;
        onScore(state.score);
        k.destroy(c);
      });
      player.onCollide("school", () => {
        state.level += 1;
        state.score += 5;
        onScore(state.score);
        startLevel(state.level);
      });
    });
    k.go("play");
  }

  k.scene("over", (score: number) => {
    if (score > getHighScore()) {
      setHighScore(score);
    }
    k.add([
      k.text("Game Over!", { size: 32 }),
      k.pos(120, 100),
    ]);
    k.add([
      k.text(`Score: ${score}", { size: 24 }),
      k.pos(120, 140),
    ]);
    k.add([
      k.text("Press Space to Restart", { size: 18 }),
      k.pos(120, 180),
    ]);
    k.onKeyPress("space", () => {
      state = {
        ...state,
        score: 0,
        level: 1,
        coins: 0,
        avatarIdx: 0,
        avatarsUnlocked: [0],
      };
      startLevel(1);
    });
  });

  startLevel(1);

  // Music controls (placeholder)
  k.onMousePress(() => {
    if (state.isMuted) {
      // Uncomment below if you have an asset:
      // musicInst = k.play("music", { loop: true, volume: 0.5 });
      state.isMuted = false;
    }
  });

  return () => {
    if (musicInst) musicInst.stop();
  };
}
