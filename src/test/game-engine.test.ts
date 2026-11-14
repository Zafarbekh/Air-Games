import { describe, expect, it } from 'vitest';
import { answerQuiz, createGameState, emptyInput, tickGame, type ControllerInput } from '@/lib/game-engine';
import { validRoomCode } from '@/lib/network-room';

const players = [{ id: 'one', name: 'One' }, { id: 'two', name: 'Two' }];
const inputs = (one: ControllerInput = emptyInput, two: ControllerInput = emptyInput) => ({ one, two });

describe('Multiplayer game rules', () => {
  it('requires a six-character room code', () => { expect(validRoomCode('ABC123')).toBe(true); expect(validRoomCode('ABCDE')).toBe(false); expect(validRoomCode('ABCDEFG')).toBe(false); });
  it('ends Snake Battle when only one snake remains', () => { const state = createGameState('snake', players); if (state.gameId !== 'snake') throw new Error('wrong game'); state.players[1].alive = false; tickGame(state, inputs(), .12); expect(state.status).toBe('finished'); expect(state.winnerIds).toEqual(['one']); });
  it('awards 1000 points for an immediate correct quiz answer', () => { const state = createGameState('quiz', players); answerQuiz(state, 'one', 1); expect(state.scores.one).toBe(1000); });
  it('does not allow a second quiz answer to replace the first', () => { const state = createGameState('quiz', players); answerQuiz(state, 'one', 0); answerQuiz(state, 'one', 1); expect(state.answers.one).toBe(0); expect(state.scores.one).toBe(0); });
  it('advances Quiz Battle after all eight questions', () => { const state = createGameState('quiz', players); if (state.gameId !== 'quiz') throw new Error('wrong game'); state.questionIndex = 7; state.phase = 'reveal'; state.timeLeft = 0; tickGame(state, inputs(), .01); expect(state.status).toBe('finished'); });
  it('kills a Bomb Arena player standing in an explosion', () => { const state = createGameState('bomb', players); if (state.gameId !== 'bomb') throw new Error('wrong game'); state.elapsed = 2; state.bombs.push({ x: 1, y: 1, owner: 'one', timer: .001, range: 2 }); tickGame(state, inputs(), .01); expect(state.players[0].alive).toBe(false); });
  it('ends Mini Racing when a player completes three laps', () => { const state = createGameState('racing', players); if (state.gameId !== 'racing') throw new Error('wrong game'); state.players[0].lap = 3; tickGame(state, inputs({ ...emptyInput, a: true }), .01); expect(state.status).toBe('finished'); expect(state.winnerIds).toEqual(['one']); });
});
