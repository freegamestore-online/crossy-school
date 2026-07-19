import kaplay from "kaplay";
import { AVATARS } from "./avatars";
import { getHighScore, setHighScore } from "./hooks/useHighScore";

const VW = 400;
const VH = 600;
const STEP = 36;
const AVATAR_UNLOCK_LEVELS = [1, 2, 4, 6];

interface GameState {
  score: number;
  level: number;
  coins: number;
  avatarIdx: number;
  avatarsUnlocked: number[];
}

type K = ReturnType<typeof kaplay>;

function clampToRoad(k: K, value: number, min: number, max: number) {
  return k.clamp(value, min, max);
}

function unlockAvatars(state: GameState) {
  for (let i = 0; i < AVATAR_UNLOCK_LEVELS.length; i++) {
    const requiredLevel = AVATAR_UNLOCK_LEVELS[i]!;
    if (state.level >= requiredLevel && !state.avatarsUnlocked.includes(i)) {
      state.avatarsUnlocked.push(i);
    }
  }
}

function drawSchool(k: K, level: number) {
  k.add([
    k.pos(72, 34),
    k.rect(256, 58, { radius: 8 }),
    k.color(56, 189, 248),
    k.area(),
    "school",
  ]);
  k.add([
    k.text(`School Gate - Level ${level}`, { size: 18 }),
    k.pos(88, 52),
    k.color(15, 23, 42),
  ]);
}

function addCoin(k: K, x: number, y: number) {
  return k.add([
    k.pos(x, y),
    k.circle(13),
    k.color(250, 204, 21),
    k.area(),
    k.anchor("center"),
    "coin",
  ]);
}

export function startGame(canvas: HTMLCanvasElement, onScore: (score: number) => void): () => void {
  const k = kaplay({
    canvas,
    width: VW,
    height: VH,
    letterbox: true,
    background: [226, 232, 240],
    global: false,
    pixelDensity: Math.min(window.devicePixelRatio || 1, 2),
  });

  let state: GameState = {
    score: 0,
    level: 1,
    coins: 0,
    avatarIdx: 0,
    avatarsUnlocked: [0],
  };

  const resetRun = () => {
    state = { ...state, score: 0, level: 1, coins: 0 };
    onScore(0);
    k.go("play");
  };

  k.scene("play", () => {
    unlockAvatars(state);
    const avatar = AVATARS[state.avatarIdx] ?? AVATARS[0]!;
    const speed = 95 + state.level * 18;
    let finished = false;

    k.add([k.pos(0, 0), k.rect(VW, VH), k.color(226, 232, 240)]);
    k.add([k.pos(0, 116), k.rect(VW, 328), k.color(51, 65, 85)]);
    for (let y = 152; y < 420; y += 72) {
      k.add([k.pos(0, y), k.rect(VW, 4), k.color(148, 163, 184)]);
    }
    k.add([k.pos(0, 470), k.rect(VW, 130), k.color(34, 197, 94)]);
    drawSchool(k, state.level);

    const player = k.add([
      k.pos(VW / 2, 538),
      k.rect(30, 34, { radius: 6 }),
      k.color(avatar.color),
      k.area(),
      k.anchor("center"),
      "player",
    ]);
    k.add([
      k.text(avatar.name, { size: 12 }),
      k.pos(16, 562),
      k.color(15, 23, 42),
    ]);

    const cars = [
      { y: 160, x: 24, dir: 1, color: [239, 68, 68] as const },
      { y: 236, x: 330, dir: -1, color: [59, 130, 246] as const },
      { y: 312, x: 92, dir: 1, color: [245, 158, 11] as const },
      { y: 388, x: 260, dir: -1, color: [168, 85, 247] as const },
    ].map((car) =>
      k.add([
        k.pos(car.x, car.y),
        k.rect(70, 30, { radius: 5 }),
        k.color(car.color[0], car.color[1], car.color[2]),
        k.area(),
        k.anchor("center"),
        { dir: car.dir },
        "car",
      ]),
    );

    let coin = addCoin(k, k.rand(52, VW - 52), k.rand(160, 420));

    const movePlayer = (dx: number, dy: number) => {
      if (finished) return;
      player.pos.x = clampToRoad(k, player.pos.x + dx, 18, VW - 18);
      player.pos.y = clampToRoad(k, player.pos.y + dy, 48, VH - 28);
    };

    k.onKeyPress("left", () => movePlayer(-STEP, 0));
    k.onKeyPress("right", () => movePlayer(STEP, 0));
    k.onKeyPress("up", () => movePlayer(0, -STEP));
    k.onKeyPress("down", () => movePlayer(0, STEP));
    k.onMousePress(() => movePlayer(0, -STEP));
    k.onTouchStart(() => movePlayer(0, -STEP));

    k.onUpdate(() => {
      for (const car of cars) {
        car.pos.x += car.dir * speed * k.dt();
        if (car.dir > 0 && car.pos.x > VW + 48) car.pos.x = -48;
        if (car.dir < 0 && car.pos.x < -48) car.pos.x = VW + 48;
      }
    });

    player.onCollide("coin", () => {
      state.coins += 1;
      state.score += 1;
      onScore(state.score);
      k.destroy(coin);
      coin = addCoin(k, k.rand(52, VW - 52), k.rand(160, 420));
    });

    player.onCollide("car", () => {
      if (finished) return;
      finished = true;
      k.add([
        k.pos(player.pos),
        k.rect(42, 12, { radius: 6 }),
        k.color(203, 213, 225),
        k.anchor("center"),
      ]);
      k.destroy(player);
      k.wait(0.5, () => k.go("over", state.score));
    });

    player.onCollide("school", () => {
      if (finished) return;
      finished = true;
      state.level += 1;
      state.score += 5;
      state.avatarIdx = state.avatarsUnlocked[state.level % state.avatarsUnlocked.length] ?? 0;
      onScore(state.score);
      k.wait(0.2, () => k.go("play"));
    });
  });

  k.scene("over", (score: number) => {
    if (score > getHighScore()) setHighScore(score);

    k.add([k.pos(0, 0), k.rect(VW, VH), k.color(15, 23, 42)]);
    k.add([
      k.text("Game Over", { size: 38 }),
      k.anchor("center"),
      k.pos(VW / 2, 190),
      k.color(255, 255, 255),
    ]);
    k.add([
      k.text(`Score: ${score}`, { size: 24 }),
      k.anchor("center"),
      k.pos(VW / 2, 246),
      k.color(250, 204, 21),
    ]);
    k.add([
      k.text(`Best: ${getHighScore()}`, { size: 18 }),
      k.anchor("center"),
      k.pos(VW / 2, 282),
      k.color(203, 213, 225),
    ]);
    k.add([
      k.text("Press space or tap to restart", { size: 16 }),
      k.anchor("center"),
      k.pos(VW / 2, 340),
      k.color(148, 163, 184),
    ]);

    k.onKeyPress("space", resetRun);
    k.onMousePress(resetRun);
    k.onTouchStart(resetRun);
  });

  k.go("play");
  return () => k.quit();
}
