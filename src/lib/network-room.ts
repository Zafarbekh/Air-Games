export interface Player { id: string; name: string; ready: boolean; isHost: boolean }
export type RoomStatus = 'lobby' | 'playing' | 'finished';
export interface Room { code: string; gameId: 'snake' | 'quiz' | 'bomb' | 'racing'; status: RoomStatus; hostPlayerId: string; players: Player[] }
export interface PlayerSession { code: string; playerId: string; token: string }
export interface RoomResult extends Room { playerId: string; playerToken: string }
export const validRoomCode = (value: string) => /^[A-Z0-9]{6}$/.test(value);
export const PLAYER_SESSION_KEY = 'air-games-player-v2';
