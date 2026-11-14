export interface Player { id: string; name: string; ready: boolean }
export interface Room { code: string; gameId: string; players: Player[]; started: boolean }
export interface RoomTransport { create(gameId: string): Room; join(room: Room, name: string, capacity: number): Room; setReady(room: Room, playerId: string): Room; start(room: Room, minimum: number): Room }
export const validRoomCode = (value: string) => /^[A-Z0-9]{6}$/.test(value);
export const localRoomTransport: RoomTransport = {
  create(gameId) { return { code: Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, 'X'), gameId, players: [{ id: 'host', name: 'You', ready: true }], started: false }; },
  join(room, name, capacity) {
    if (room.started) throw new Error('This game has already started.');
    if (!name.trim()) throw new Error('Enter a player name.');
    if (room.players.length >= capacity) throw new Error('This room is full.');
    return { ...room, players: [...room.players, { id: `player-${room.players.length}`, name: name.trim(), ready: false }] };
  },
  setReady(room, playerId) { return { ...room, players: room.players.map(p => p.id === playerId ? { ...p, ready: !p.ready } : p) }; },
  start(room, minimum) {
    if (room.players.length < minimum) throw new Error(`At least ${minimum} players are needed.`);
    if (!room.players.every(p => p.ready)) throw new Error('Every player must be ready.');
    return { ...room, started: true };
  },
};