import { describe, expect, it } from 'vitest';
import { localRoomTransport as transport, validRoomCode } from '@/lib/local-room';
import { games } from '@/lib/games';
describe('Local room rules', () => {
  it('creates a six-character room code', () => { expect(validRoomCode(transport.create('snake').code)).toBe(true); expect(validRoomCode('ABCDE')).toBe(false); expect(validRoomCode('ABCDEFG')).toBe(false); });
  it('requires two players to start', () => { expect(() => transport.start(transport.create('snake'), 2)).toThrow('At least 2 players'); });
  it('requires every player to be ready', () => { const room = transport.join(transport.create('snake'), 'Sam', 4); expect(() => transport.start(room, 2)).toThrow('Every player'); expect(transport.start(transport.setReady(room, 'player-1'), 2).started).toBe(true); });
  it('limits Snake Battle to four players', () => { let room = transport.create('snake'); for (let i = 1; i < 4; i++) room = transport.join(room, `Guest ${i}`, 4); expect(() => transport.join(room, 'Extra', 4)).toThrow('full'); expect(games.find(g => g.id === 'snake')?.max).toBe(4); });
  it('allows eight Quiz Battle players', () => { let room = transport.create('quiz'); for (let i = 1; i < 8; i++) room = transport.join(room, `Guest ${i}`, 8); expect(room.players).toHaveLength(8); expect(games.find(g => g.id === 'quiz')?.max).toBe(8); expect(() => transport.join(room, 'Extra', 8)).toThrow('full'); });
  it('limits Bomb Arena and Mini Racing to four players', () => { for (const id of ['bomb', 'racing']) expect(games.find(g => g.id === id)?.max).toBe(4); });
});