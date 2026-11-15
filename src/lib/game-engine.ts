import type { Game } from '@/lib/games';

export type GameId = Game['id'];
export type Direction = 'up' | 'down' | 'left' | 'right';
export interface ControllerInput { direction: Direction | null; a: boolean; b: boolean }
export interface PlayerDescriptor { id: string; name: string }
export interface Point { x: number; y: number }
export const emptyInput: ControllerInput = { direction: null, a: false, b: false };

interface BaseState { gameId: GameId; status: 'playing' | 'finished'; winnerIds: string[] }
export interface SnakePlayer extends Point { id: string; body: Point[]; direction: Direction; queued: Direction; alive: boolean; score: number }
export interface SnakeState extends BaseState { gameId: 'snake'; players: SnakePlayer[]; food: Point; seed: number; accumulator: number }
export interface QuizState extends BaseState { gameId: 'quiz'; questionIndex: number; phase: 'question' | 'reveal'; timeLeft: number; answers: Record<string, number>; scores: Record<string, number>; answeredAt: Record<string, number>; elapsed: number }
export interface BombPlayer extends Point { id: string; alive: boolean; bombs: number }
export interface Bomb { x: number; y: number; owner: string; timer: number; range: number }
export interface BombState extends BaseState { gameId: 'bomb'; players: BombPlayer[]; grid: number[][]; bombs: Bomb[]; explosions: (Point & { timer: number })[]; accumulator: number; elapsed: number }
export interface RacingPlayer extends Point { id: string; angle: number; speed: number; progress: number; lap: number; lastTheta: number; place: number | null }
export interface RacingState extends BaseState { gameId: 'racing'; players: RacingPlayer[]; elapsed: number }
export type GameState = SnakeState | QuizState | BombState | RacingState;

export const QUIZ_QUESTIONS = [
  { question: 'Which planet is known as the Red Planet?', answers: ['Venus', 'Mars', 'Jupiter', 'Mercury'], correct: 1 },
  { question: 'How many players are on a football team on the pitch?', answers: ['9', '10', '11', '12'], correct: 2 },
  { question: 'What is the largest ocean on Earth?', answers: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], correct: 3 },
  { question: 'Which instrument has black and white keys?', answers: ['Piano', 'Guitar', 'Violin', 'Drums'], correct: 0 },
  { question: 'What does WWW stand for?', answers: ['World Wide Web', 'World Web Wide', 'Wide World Web', 'Web World Wide'], correct: 0 },
  { question: 'Which animal is the fastest on land?', answers: ['Lion', 'Cheetah', 'Horse', 'Leopard'], correct: 1 },
  { question: 'How many minutes are in two hours?', answers: ['100', '110', '120', '140'], correct: 2 },
  { question: 'Which color mixes blue and yellow?', answers: ['Purple', 'Orange', 'Pink', 'Green'], correct: 3 },
] as const;

const opposite: Record<Direction, Direction> = { up: 'down', down: 'up', left: 'right', right: 'left' };
const vectors: Record<Direction, Point> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
const base = (gameId: GameId): BaseState => ({ gameId, status: 'playing', winnerIds: [] });
const inputFor = (inputs: Record<string, ControllerInput>, id: string) => inputs[id] ?? emptyInput;

function createSnake(players: PlayerDescriptor[]): SnakeState {
  const starts = [{ x: 5, y: 4, direction: 'right' as const }, { x: 26, y: 15, direction: 'left' as const }, { x: 5, y: 15, direction: 'right' as const }, { x: 26, y: 4, direction: 'left' as const }];
  const state: SnakeState = { ...base('snake'), gameId: 'snake', players: players.map((player, index) => {
    const start = starts[index] ?? starts[0]!; const vector = vectors[start.direction];
    return { id: player.id, x: start.x, y: start.y, direction: start.direction, queued: start.direction, alive: true, score: 0, body: Array.from({ length: 4 }, (_, part) => ({ x: start.x - vector.x * part, y: start.y - vector.y * part })) };
  }), food: { x: 15, y: 10 }, seed: 8731, accumulator: 0 };
  return state;
}

function snakeFood(state: SnakeState): Point {
  for (let attempt = 0; attempt < 100; attempt++) {
    state.seed = (state.seed * 16807) % 2147483647;
    const point = { x: state.seed % 32, y: state.seed % 20 };
    if (!state.players.some(player => player.body.some(part => part.x === point.x && part.y === point.y))) return point;
  }
  return { x: 15, y: 10 };
}

function stepSnake(state: SnakeState, inputs: Record<string, ControllerInput>) {
  const nextHeads = new Map<string, Point>();
  for (const player of state.players) {
    if (!player.alive) continue;
    const requested = inputFor(inputs, player.id).direction;
    if (requested && requested !== opposite[player.direction]) player.queued = requested;
    player.direction = player.queued;
    const head = player.body[0]!; const vector = vectors[player.direction];
    nextHeads.set(player.id, { x: head.x + vector.x, y: head.y + vector.y });
  }
  for (const player of state.players) {
    if (!player.alive) continue;
    const head = nextHeads.get(player.id)!;
    const wall = head.x < 0 || head.x >= 32 || head.y < 0 || head.y >= 20;
    const bodyHit = state.players.some(other => other.body.some(part => part.x === head.x && part.y === head.y));
    const headHit = state.players.some(other => other.id !== player.id && other.alive && nextHeads.get(other.id)?.x === head.x && nextHeads.get(other.id)?.y === head.y);
    if (wall || bodyHit || headHit) { player.alive = false; continue; }
    player.body.unshift(head); player.x = head.x; player.y = head.y;
    if (head.x === state.food.x && head.y === state.food.y) { player.score += 1; state.food = snakeFood(state); }
    else player.body.pop();
  }
  const alive = state.players.filter(player => player.alive);
  if (alive.length <= 1) { state.status = 'finished'; state.winnerIds = alive.map(player => player.id); }
}

function createQuiz(players: PlayerDescriptor[]): QuizState {
  return { ...base('quiz'), gameId: 'quiz', questionIndex: 0, phase: 'question', timeLeft: 12, answers: {}, answeredAt: {}, scores: Object.fromEntries(players.map(player => [player.id, 0])), elapsed: 0 };
}

export function answerQuiz(state: GameState, playerId: string, answer: number) {
  if (state.gameId !== 'quiz' || state.phase !== 'question' || state.status !== 'finished' && state.answers[playerId] !== undefined) return;
  if (state.gameId !== 'quiz' || state.phase !== 'question' || answer < 0 || answer > 3 || state.answers[playerId] !== undefined) return;
  state.answers[playerId] = answer;
  state.answeredAt[playerId] = state.elapsed;
  if (answer === (QUIZ_QUESTIONS[state.questionIndex] ?? QUIZ_QUESTIONS[0]!).correct) state.scores[playerId] = (state.scores[playerId] ?? 0) + Math.max(100, 1000 - Math.floor(state.elapsed * 50));
}

function tickQuiz(state: QuizState, dt: number) {
  state.elapsed += dt; state.timeLeft -= dt;
  if (state.phase === 'question') {
    if (state.timeLeft <= 0 || Object.keys(state.answers).length >= Object.keys(state.scores).length) { state.phase = 'reveal'; state.timeLeft = 3; }
    return;
  }
  if (state.timeLeft > 0) return;
  if (state.questionIndex >= QUIZ_QUESTIONS.length - 1) {
    state.status = 'finished';
    const high = Math.max(...Object.values(state.scores));
    state.winnerIds = Object.entries(state.scores).filter(([, score]) => score === high).map(([id]) => id);
    return;
  }
  state.questionIndex += 1; state.phase = 'question'; state.timeLeft = 12; state.answers = {}; state.answeredAt = {}; state.elapsed = 0;
}

function createBomb(players: PlayerDescriptor[]): BombState {
  const grid = Array.from({ length: 11 }, (_, y) => Array.from({ length: 15 }, (_, x) => x === 0 || y === 0 || x === 14 || y === 10 || (x % 2 === 0 && y % 2 === 0) ? 1 : ((x * 7 + y * 11) % 5 < 2 ? 2 : 0)));
  const starts = [{ x: 1, y: 1 }, { x: 13, y: 9 }, { x: 1, y: 9 }, { x: 13, y: 1 }];
  for (const start of starts) for (const point of [start, { x: start.x + (start.x === 1 ? 1 : -1), y: start.y }, { x: start.x, y: start.y + (start.y === 1 ? 1 : -1) }]) grid[point.y]![point.x] = 0;
  return { ...base('bomb'), gameId: 'bomb', players: players.map((player, index) => ({ id: player.id, ...(starts[index] ?? starts[0]!), alive: true, bombs: 0 })), grid, bombs: [], explosions: [], accumulator: 0, elapsed: 0 };
}

function bombOpen(state: BombState, x: number, y: number) {
  return y >= 0 && y < 11 && x >= 0 && x < 15 && state.grid[y]?.[x] === 0 && !state.bombs.some(bomb => bomb.x === x && bomb.y === y);
}

function stepBomb(state: BombState, inputs: Record<string, ControllerInput>) {
  for (const player of state.players) {
    if (!player.alive) continue;
    const input = inputFor(inputs, player.id);
    if (input.direction) {
      const vector = vectors[input.direction]; const x = player.x + vector.x; const y = player.y + vector.y;
      if (bombOpen(state, x, y)) { player.x = x; player.y = y; }
    }
    if (input.a && player.bombs < 2 && !state.bombs.some(bomb => bomb.x === player.x && bomb.y === player.y)) {
      state.bombs.push({ x: player.x, y: player.y, owner: player.id, timer: 2, range: 2 }); player.bombs += 1;
    }
  }
}

function explodeBomb(state: BombState, bomb: Bomb) {
  const cells = [{ x: bomb.x, y: bomb.y }];
  for (const direction of Object.values(vectors)) {
    for (let range = 1; range <= bomb.range; range++) {
      const x = bomb.x + direction.x * range; const y = bomb.y + direction.y * range;
      if (x < 0 || x >= 15 || y < 0 || y >= 11 || state.grid[y]?.[x] === 1) break;
      cells.push({ x, y });
      if (state.grid[y]?.[x] === 2) { state.grid[y]![x] = 0; break; }
    }
  }
  for (const cell of cells) {
    state.explosions.push({ ...cell, timer: .45 });
    for (const player of state.players) if (player.alive && player.x === cell.x && player.y === cell.y) player.alive = false;
    for (const other of state.bombs) if (other.x === cell.x && other.y === cell.y) other.timer = 0;
  }
  const owner = state.players.find(player => player.id === bomb.owner); if (owner) owner.bombs = Math.max(0, owner.bombs - 1);
  state.bombs = state.bombs.filter(other => other !== bomb);
}

function tickBomb(state: BombState, inputs: Record<string, ControllerInput>, dt: number) {
  state.elapsed += dt; state.accumulator += dt;
  while (state.accumulator >= .14) { stepBomb(state, inputs); state.accumulator -= .14; }
  for (const explosion of state.explosions) explosion.timer -= dt;
  state.explosions = state.explosions.filter(explosion => explosion.timer > 0);
  for (const bomb of [...state.bombs]) { bomb.timer -= dt; if (bomb.timer <= 0) explodeBomb(state, bomb); }
  for (const explosion of state.explosions) for (const player of state.players) if (player.alive && player.x === explosion.x && player.y === explosion.y) player.alive = false;
  const alive = state.players.filter(player => player.alive);
  if (state.elapsed > 1 && alive.length <= 1) { state.status = 'finished'; state.winnerIds = alive.map(player => player.id); }
}

function createRacing(players: PlayerDescriptor[]): RacingState {
  return { ...base('racing'), gameId: 'racing', elapsed: 0, players: players.map((player, index) => {
    const theta = -Math.PI / 2 - index * .11; const x = Math.cos(theta) * 230; const y = Math.sin(theta) * 140;
    return { id: player.id, x, y, angle: Math.atan2(140 * Math.cos(theta), -230 * Math.sin(theta)), speed: 0, progress: 0, lap: 0, lastTheta: theta, place: null };
  }) };
}

function tickRacing(state: RacingState, inputs: Record<string, ControllerInput>, dt: number) {
  state.elapsed += dt;
  for (const player of state.players) {
    if (player.place !== null) continue;
    const input = inputFor(inputs, player.id);
    const accelerating = input.a || input.direction === 'up'; const braking = input.b || input.direction === 'down';
    player.speed += (accelerating ? 150 : 0) * dt; player.speed -= (braking ? 210 : 35) * dt;
    player.speed = Math.max(0, Math.min(190, player.speed));
    const steer = input.direction === 'left' ? -1 : input.direction === 'right' ? 1 : 0;
    player.angle += steer * dt * (1.2 + player.speed / 100);
    player.x += Math.cos(player.angle) * player.speed * dt; player.y += Math.sin(player.angle) * player.speed * dt;
    const radius = Math.sqrt((player.x / 230) ** 2 + (player.y / 140) ** 2);
    if (radius < .68 || radius > 1.3) {
      const target = Math.max(.68, Math.min(1.3, radius)); player.x *= target / radius; player.y *= target / radius; player.speed *= .35;
    }
    const theta = Math.atan2(player.y / 140, player.x / 230); let delta = theta - player.lastTheta;
    if (delta > Math.PI) delta -= Math.PI * 2; if (delta < -Math.PI) delta += Math.PI * 2;
    if (Math.abs(delta) < .5) player.progress = Math.max(0, player.progress + delta);
    player.lastTheta = theta; player.lap = Math.floor(player.progress / (Math.PI * 2));
    if (player.lap >= 3) { player.place = 1; player.speed = 0; state.status = 'finished'; state.winnerIds = [player.id]; break; }
  }
}

export function createGameState(gameId: GameId, players: PlayerDescriptor[]): GameState {
  if (gameId === 'snake') return createSnake(players);
  if (gameId === 'quiz') return createQuiz(players);
  if (gameId === 'bomb') return createBomb(players);
  return createRacing(players);
}

export function tickGame(state: GameState, inputs: Record<string, ControllerInput>, dt: number) {
  if (state.status === 'finished') return;
  const delta = Math.min(.05, Math.max(0, dt));
  if (state.gameId === 'snake') {
    state.accumulator += delta;
    while (state.accumulator >= .11 && state.status === 'playing') { stepSnake(state, inputs); state.accumulator -= .11; }
  } else if (state.gameId === 'quiz') tickQuiz(state, delta);
  else if (state.gameId === 'bomb') tickBomb(state, inputs, delta);
  else tickRacing(state, inputs, delta);
}
