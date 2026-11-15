import { forwardRef, useEffect } from 'react';
import type { GameState, PlayerDescriptor } from '@/lib/game-engine';
import { QUIZ_QUESTIONS } from '@/lib/game-engine';

export interface CanvasPalette { background: string; foreground: string; muted: string; border: string; primary: string; secondary: string; cyan: string; lime: string; ember: string }
export const playerColors = ['#77E8FF', '#B980FF', '#B8F35A', '#FF9A58', '#FF6F91', '#68A7FF', '#F5D75F', '#59E0B5'];
const playerColor = (index: number, fallback: string) => playerColors[index] ?? fallback;

export function readCanvasPalette(): CanvasPalette {
  const style = getComputedStyle(document.documentElement); const read = (name: string) => style.getPropertyValue(name).trim();
  return { background: read('--background'), foreground: read('--foreground'), muted: read('--muted-foreground'), border: read('--border'), primary: read('--primary'), secondary: read('--secondary'), cyan: read('--cyan'), lime: read('--lime'), ember: read('--ember') };
}

function text(context: CanvasRenderingContext2D, value: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = 'left', weight = 600) {
  context.fillStyle = color; context.font = `${weight} ${size}px "DM Sans", sans-serif`; context.textAlign = align; context.fillText(value, x, y);
}

function wrap(context: CanvasRenderingContext2D, value: string, x: number, y: number, maxWidth: number, lineHeight: number, size: number, color: string) {
  context.font = `700 ${size}px "DM Sans", sans-serif`; const words = value.split(' '); let line = ''; let row = 0;
  for (const word of words) { const candidate = line ? `${line} ${word}` : word; if (context.measureText(candidate).width > maxWidth && line) { text(context, line, x, y + row * lineHeight, size, color, 'center', 700); line = word; row++; } else line = candidate; }
  text(context, line, x, y + row * lineHeight, size, color, 'center', 700);
}

function background(context: CanvasRenderingContext2D, palette: CanvasPalette) {
  context.fillStyle = palette.background; context.fillRect(0, 0, 960, 600);
  context.strokeStyle = palette.border; context.lineWidth = 1; context.globalAlpha = .25;
  for (let x = 0; x <= 960; x += 40) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, 600); context.stroke(); }
  for (let y = 0; y <= 600; y += 40) { context.beginPath(); context.moveTo(0, y); context.lineTo(960, y); context.stroke(); }
  context.globalAlpha = 1;
}

function names(state: GameState, players: PlayerDescriptor[], id: string) { return players.find(player => player.id === id)?.name ?? 'Player'; }
function winner(context: CanvasRenderingContext2D, state: GameState, players: PlayerDescriptor[], palette: CanvasPalette) {
  if (state.status !== 'finished') return;
  context.fillStyle = 'rgba(5, 8, 18, .86)'; context.fillRect(0, 0, 960, 600);
  const title = state.winnerIds.length ? `${state.winnerIds.map(id => names(state, players, id)).join(' & ')} WINS!` : 'DRAW GAME';
  text(context, title, 480, 275, 48, palette.foreground, 'center', 800);
  text(context, 'Great round. Ready for a rematch?', 480, 325, 20, palette.cyan, 'center', 500);
}

function scores(context: CanvasRenderingContext2D, state: GameState, players: PlayerDescriptor[], palette: CanvasPalette, values: Record<string, number>) {
  players.forEach((player, index) => { text(context, player.name, 28, 35 + index * 25, 15, playerColor(index, palette.cyan), 'left', 700); text(context, String(values[player.id] ?? 0), 205, 35 + index * 25, 15, palette.foreground, 'right', 700); });
}

function drawSnake(context: CanvasRenderingContext2D, state: Extract<GameState, { gameId: 'snake' }>, players: PlayerDescriptor[], palette: CanvasPalette) {
  const size = 25; const offsetX = 80; const offsetY = 50;
  context.strokeStyle = palette.border; context.strokeRect(offsetX, offsetY, 32 * size, 20 * size);
  context.fillStyle = palette.ember; context.beginPath(); context.arc(offsetX + state.food.x * size + size / 2, offsetY + state.food.y * size + size / 2, 9, 0, Math.PI * 2); context.fill();
  state.players.forEach((player, index) => {
    context.globalAlpha = player.alive ? 1 : .2; context.fillStyle = playerColor(index, palette.cyan);
    player.body.forEach((part, partIndex) => { context.fillRect(offsetX + part.x * size + 2, offsetY + part.y * size + 2, size - 4, size - 4); if (partIndex === 0) { context.fillStyle = palette.foreground; context.fillRect(offsetX + part.x * size + 15, offsetY + part.y * size + 7, 4, 4); context.fillStyle = playerColor(index, palette.cyan); } });
    context.globalAlpha = 1;
  });
  text(context, 'SNAKE BATTLE', 30, 580, 18, palette.foreground, 'left', 800); text(context, 'Eat. Grow. Survive.', 930, 580, 15, palette.muted, 'right', 500);
}

function drawQuiz(context: CanvasRenderingContext2D, state: Extract<GameState, { gameId: 'quiz' }>, players: PlayerDescriptor[], palette: CanvasPalette) {
  const question = QUIZ_QUESTIONS[state.questionIndex] ?? QUIZ_QUESTIONS[0]!;
  text(context, `QUESTION ${state.questionIndex + 1} / ${QUIZ_QUESTIONS.length}`, 480, 48, 16, palette.cyan, 'center', 800);
  text(context, `${Math.max(0, Math.ceil(state.timeLeft))}s`, 900, 48, 22, state.timeLeft < 4 ? palette.ember : palette.foreground, 'right', 800);
  wrap(context, question.question, 480, 125, 790, 48, 37, palette.foreground);
  question.answers.forEach((answer, index) => {
    const x = 90 + (index % 2) * 400; const y = 260 + Math.floor(index / 2) * 105;
    const correct = state.phase === 'reveal' && index === question.correct;
    context.fillStyle = correct ? palette.lime : palette.secondary; context.globalAlpha = correct ? .28 : 1; context.fillRect(x, y, 380, 76); context.globalAlpha = 1;
    context.strokeStyle = correct ? palette.lime : palette.border; context.lineWidth = correct ? 3 : 1; context.strokeRect(x, y, 380, 76);
    text(context, String.fromCharCode(65 + index), x + 28, y + 47, 22, correct ? palette.lime : playerColor(index, palette.cyan), 'left', 800);
    text(context, answer, x + 70, y + 46, 20, palette.foreground, 'left', 600);
  });
  const scoreValues = state.scores; players.forEach((player, index) => { const x = 70 + index * (830 / players.length); text(context, `${player.name} · ${scoreValues[player.id] ?? 0}`, x, 535, 15, playerColor(index, palette.cyan), 'left', 700); if (state.phase === 'reveal' && state.answers[player.id] !== undefined) text(context, String.fromCharCode(65 + state.answers[player.id]), x, 565, 14, palette.muted); });
  if (state.phase === 'reveal') text(context, `Correct answer: ${String.fromCharCode(65 + question.correct)}`, 480, 215, 18, palette.lime, 'center', 800);
}

function drawBomb(context: CanvasRenderingContext2D, state: Extract<GameState, { gameId: 'bomb' }>, players: PlayerDescriptor[], palette: CanvasPalette) {
  const size = 46; const ox = 135; const oy = 47;
  state.grid.forEach((row, y) => row.forEach((tile, x) => {
    if (!tile) return; context.fillStyle = tile === 1 ? palette.border : palette.secondary; context.fillRect(ox + x * size + 1, oy + y * size + 1, size - 2, size - 2);
    if (tile === 2) { context.strokeStyle = palette.ember; context.strokeRect(ox + x * size + 9, oy + y * size + 9, size - 18, size - 18); }
  }));
  for (const bomb of state.bombs) { context.fillStyle = palette.foreground; context.beginPath(); context.arc(ox + bomb.x * size + size / 2, oy + bomb.y * size + size / 2, 14 + Math.sin(bomb.timer * 12) * 2, 0, Math.PI * 2); context.fill(); context.fillStyle = palette.ember; context.fillRect(ox + bomb.x * size + 21, oy + bomb.y * size + 5, 5, 12); }
  for (const explosion of state.explosions) { context.globalAlpha = Math.min(1, explosion.timer * 3); context.fillStyle = palette.ember; context.fillRect(ox + explosion.x * size + 4, oy + explosion.y * size + 4, size - 8, size - 8); context.globalAlpha = 1; }
  state.players.forEach((player, index) => { if (!player.alive) return; context.fillStyle = playerColor(index, palette.cyan); context.beginPath(); context.arc(ox + player.x * size + size / 2, oy + player.y * size + size / 2, 16, 0, Math.PI * 2); context.fill(); text(context, playerColor(index, palette.cyan) ? String(index + 1) : '', ox + player.x * size + size / 2, oy + player.y * size + size / 2 + 5, 14, palette.background, 'center', 800); });
  text(context, 'BOMB ARENA', 30, 580, 18, palette.foreground, 'left', 800); text(context, 'A / B: drop a bomb', 930, 580, 15, palette.muted, 'right', 500);
}

function drawRacing(context: CanvasRenderingContext2D, state: Extract<GameState, { gameId: 'racing' }>, players: PlayerDescriptor[], palette: CanvasPalette) {
  context.save(); context.translate(480, 305);
  context.strokeStyle = palette.border; context.lineWidth = 118; context.beginPath(); context.ellipse(0, 0, 230, 140, 0, 0, Math.PI * 2); context.stroke();
  context.strokeStyle = palette.secondary; context.lineWidth = 108; context.beginPath(); context.ellipse(0, 0, 230, 140, 0, 0, Math.PI * 2); context.stroke();
  context.setLineDash([12, 15]); context.strokeStyle = palette.muted; context.lineWidth = 2; context.beginPath(); context.ellipse(0, 0, 230, 140, 0, 0, Math.PI * 2); context.stroke(); context.setLineDash([]);
  context.strokeStyle = palette.foreground; context.lineWidth = 5; context.beginPath(); context.moveTo(-8, -200); context.lineTo(-8, -90); context.stroke();
  state.players.forEach((player, index) => {
    context.save(); context.translate(player.x, player.y); context.rotate(player.angle); context.fillStyle = playerColor(index, palette.cyan); context.fillRect(-15, -9, 30, 18); context.fillStyle = palette.background; context.fillRect(2, -6, 8, 12); context.restore();
    text(context, `${names(state, players, player.id)} · LAP ${Math.min(3, player.lap + 1)}/3`, -420 + index * 215, -250, 14, playerColor(index, palette.cyan), 'left', 700);
  });
  context.restore(); text(context, 'MINI RACING', 30, 580, 18, palette.foreground, 'left', 800); text(context, 'A / ↑ accelerate · B / ↓ brake', 930, 580, 15, palette.muted, 'right', 500);
}

export function drawGame(context: CanvasRenderingContext2D, state: GameState, players: PlayerDescriptor[], palette: CanvasPalette) {
  background(context, palette);
  if (state.gameId === 'snake') { drawSnake(context, state, players, palette); scores(context, state, players, palette, Object.fromEntries(state.players.map(player => [player.id, player.score]))); }
  else if (state.gameId === 'quiz') drawQuiz(context, state, players, palette);
  else if (state.gameId === 'bomb') drawBomb(context, state, players, palette);
  else drawRacing(context, state, players, palette);
  winner(context, state, players, palette);
}

export const GameCanvas = forwardRef<HTMLCanvasElement, { state: GameState | null; players: PlayerDescriptor[]; className?: string }>(function GameCanvas({ state, players, className = '' }, ref) {
  useEffect(() => {
    if (!state || !ref || typeof ref === 'function' || !ref.current) return;
    const context = ref.current.getContext('2d'); if (context) drawGame(context, state, players, readCanvasPalette());
  }, [state, players, ref]);
  return <canvas ref={ref} width={960} height={600} className={`game-canvas ${className}`} aria-label="Live multiplayer game screen" />;
});
