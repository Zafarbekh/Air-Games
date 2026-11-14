
import { supabase } from '@/integrations/supabase/client';

export interface Player {
  id: string;
  name: string;
  ready: boolean;
  isHost: boolean;
}

export type RoomStatus = 'lobby' | 'playing' | 'finished';

export interface Room {
  code: string;
  gameId: 'snake' | 'quiz' | 'bomb' | 'racing';
  status: RoomStatus;
  hostPlayerId: string;
  players: Player[];
}

export interface PlayerSession {
  code: string;
  playerId: string;
  token: string;
}

export interface RoomResult extends Room {
  playerId: string;
  playerToken: string;
}

export const validRoomCode = (value: string) =>
  /^[A-Z0-9]{6}$/.test(value);

export const PLAYER_SESSION_KEY = 'air-games-player-v2';

type JsonObject = Record<string, unknown>;

function readObject(data: unknown): JsonObject {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Invalid response from server.');
  }

  return data as JsonObject;
}

function mapRoom(data: unknown): Room {
  const value = readObject(data);
  const rawPlayers = value['players'];

  const players: Player[] = Array.isArray(rawPlayers)
    ? rawPlayers.map((item): Player => {
        const player = readObject(item);

        return {
          id: String(player['id'] ?? ''),
          name: String(player['name'] ?? ''),
          ready: Boolean(player['ready']),
          isHost: Boolean(player['isHost']),
        };
      })
    : [];

  return {
    code: String(value['code'] ?? ''),
    gameId: value['gameId'] as Room['gameId'],
    status: value['status'] as RoomStatus,
    hostPlayerId: String(value['hostPlayerId'] ?? ''),
    players,
  };
}

function mapRoomResult(data: unknown): RoomResult {
  const value = readObject(data);
  const room = mapRoom(value);

  const playerId = value['playerId'];
  const playerToken = value['playerToken'];

  if (
    typeof playerId !== 'string' ||
    typeof playerToken !== 'string'
  ) {
    throw new Error('Player session was not returned by server.');
  }

  return {
    ...room,
    playerId,
    playerToken,
  };
}

export async function createNetworkRoom(
  gameId: Room['gameId'],
  name: string
): Promise<RoomResult> {
  const { data, error } = await supabase.rpc('air_create_room', {
    p_game_id: gameId,
    p_name: name,
  });

  if (error) throw error;

  return mapRoomResult(data);
}

export async function joinNetworkRoom(
  code: string,
  name: string
): Promise<RoomResult> {
  const { data, error } = await supabase.rpc('air_join_room', {
    p_code: code.toUpperCase().trim(),
    p_name: name,
  });

  if (error) throw error;

  return mapRoomResult(data);
}

export async function getNetworkRoom(
  session: PlayerSession
): Promise<Room> {
  const { data, error } = await supabase.rpc('air_get_room', {
    p_code: session.code,
    p_player_id: session.playerId,
    p_token: session.token,
  });

  if (error) throw error;

  return mapRoom(data);
}

export async function setNetworkReady(
  session: PlayerSession,
  ready: boolean
): Promise<Room> {
  const { data, error } = await supabase.rpc('air_set_ready', {
    p_code: session.code,
    p_player_id: session.playerId,
    p_token: session.token,
    p_ready: ready,
  });

  if (error) throw error;

  return mapRoom(data);
}

export async function startNetworkRoom(
  session: PlayerSession
): Promise<Room> {
  const { data, error } = await supabase.rpc('air_start_room', {
    p_code: session.code,
    p_player_id: session.playerId,
    p_token: session.token,
  });

  if (error) throw error;

  return mapRoom(data);
}

export function savePlayerSession(session: PlayerSession): void {
  localStorage.setItem(
    PLAYER_SESSION_KEY,
    JSON.stringify(session)
  );
}

export function getPlayerSession(): PlayerSession | null {
  try {
    const value = localStorage.getItem(PLAYER_SESSION_KEY);

    if (!value) return null;

    const session: unknown = JSON.parse(value);
    const parsed = readObject(session);

    if (
      typeof parsed['code'] !== 'string' ||
      typeof parsed['playerId'] !== 'string' ||
      typeof parsed['token'] !== 'string'
    ) {
      return null;
    }

    return {
      code: parsed['code'],
      playerId: parsed['playerId'],
      token: parsed['token'],
    };
  } catch {
    return null;
  }
}

export function clearPlayerSession(): void {
  localStorage.removeItem(PLAYER_SESSION_KEY);
}
