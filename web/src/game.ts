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

  let musicInst: ReturnType<typeof k.play> | undefined;

  function unlockAvatars(level: number) {
    AVATAR_UNLOCK_LEVELS.forEach((lvl, i) => {
      if (level >= lvl && !state.avatarsUnlocked.includes(i)) {
        state.avatarsUnlocked.push(i);
      }
    });
  }

  function showAvatarPicker(onPick: (idx: number) => void) {
    // Simple avatar picker overlay
    k.add([
      k.rect(320, 180),
      k.pos(80, 180),
      k.color("#fff"),
      k.z(100),
    ]);
    state.avatarsUnlocked.forEach((idx, i) => {
      k.add([
        k.sprite(AVATARS[idx].sprite),
        k.pos(120 + i*60, 220),
        k.area(),
        k.z(101),
        "pickable",
        { idx },
      ]);
    });
    k.onClick("pickable", (e) => {
      onPick(e.idx);
      k.destroyAll("pickable");
      k.destroyAll((obj) => obj.z === 100);
    });
  }

  function startLevel(level: number) {
    k.scene("play", () => {
      unlockAvatars(level);
      let player = k.add([
        k.pos(160, 400),
        k.sprite(AVATARS[state.avatarIdx].sprite),
        k.area(),
        k.body(),
        k.z(10),
        "player",
      ]);
      // Add cars
      for (let i = 0; i < 3 + level; i++) {
        k.add([
          k.pos(0, 120 + i * 50),
          k.sprite("car"),
          k.area(),
          k.move(k.vec2(1,0), 100 + 20*level),
          k.z(5),
          "car",
        ]);
      }
      // Add coins
      for (let i = 0; i < 5; i++) {
        k.add([
          k.pos(60 + i * 50, 150 + i * 40),
          k.sprite("coin"),
          k.area(),
          k.z(15),
          "coin",
        ]);
      }
      // Add school
      k.add([
        k.pos(160, 40),
        k.sprite("school"),
        k.area(),
        k.z(20),
        "school",
      ]);

      k.onKeyPress("space", () => player.move(0, -32));
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
        k.wait(0.7, () => k.go("over", state.score));
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
        showAvatarPicker((idx) => {
          state.avatarIdx = idx;
          startLevel(state.level);
        });
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
      k.z(50),
    ]);
    k.add([
      k.text(`Score: ${score}", { size: 24 }),
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
        avatarIdx: 0,
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
