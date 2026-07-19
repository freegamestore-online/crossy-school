import k from "@freegamestore/games/kaplay";
import { Avatar, avatars } from "./avatars";
import { getHighScore, setHighScore } from "./hooks/useHighScore";

interface GameState {
  score: number;
  level: number;
  coins: number;
  avatar: Avatar;
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
    avatar: avatars[0],
    avatarsUnlocked: [0],
    isMuted: true,
  };

  const music = k.loadSound("music", "/music/crossy-school.mp3");
  let musicInst: ReturnType<typeof k.play>|undefined;

  function unlockAvatars(level: number) {
    AVATAR_UNLOCK_LEVELS.forEach((lvl, i) => {
      if (level >= lvl && !state.avatarsUnlocked.includes(i)) {
        state.avatarsUnlocked.push(i);
      }
    });
  }

  function showAvatarPicker() {
    // Simple picker UI overlay
    // (Implementation later)
  }

  function startLevel(level: number) {
    k.scene("play", () => {
      unlockAvatars(level);
      let player = k.add([
        k.pos(100, 400),
        k.sprite(state.avatar.sprite),
        k.area(),
        k.body(),
        k.z(10),
        "player",
      ]);
      // Add cars, logs, coins, school target...
      // (Implementation in next file)

      k.onKeyPress("space", () => {
        // Move forward
        player.move(0, -32);
      });
      k.onKeyPress("left", () => player.move(-32,0));
      k.onKeyPress("right", () => player.move(32,0));
      k.onKeyPress("up", () => player.move(0,-32));
      k.onKeyPress("down", () => player.move(0,32));

      player.onCollide("car", () => {
        k.add([
          k.pos(player.pos),
          k.sprite("squash"),
          k.z(20),
        ]);
        k.wait(1, () => k.go("over", state.score));
      });
      player.onCollide("coin", (coin) => {
        state.coins += 1;
        state.score += 1;
        onScore(state.score);
        k.destroy(coin);
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
    if (score > getHighScore("crossy-school")) {
      setHighScore("crossy-school", score);
    }
    k.add([
      k.text("Game Over!", { size: 32 }),
      k.pos(120, 100),
      k.z(50),
    ]);
    k.add([
      k.text(`Score: ${score}`, { size: 24 }),
      k.pos(120, 140),
      k.z(50),
    ]);
    k.add([
      k.text("Press Space to Restart", { size: 18 }),
      k.pos(120, 180),
      k.z(50),
    ]);
    k.onKeyPress("space", () => {
      state = {
        ...state,
        score: 0,
        level: 1,
        coins: 0,
        avatar: avatars[0],
        avatarsUnlocked: [0],
      };
      startLevel(1);
    });
  });

  startLevel(1);

  // Music controls
  k.onMousePress(() => {
    if (state.isMuted) {
      musicInst = k.play("music", { loop: true, volume: 0.5 });
      state.isMuted = false;
    }
  });

  return () => {
    if (musicInst) musicInst.stop();
  };
}
