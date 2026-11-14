
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

import {
  createNetworkRoom,
  joinNetworkRoom,
  getNetworkRoom,
  setNetworkReady,
  startNetworkRoom,
  savePlayerSession,
  getPlayerSession,
  clearPlayerSession,
  type Room,
  type PlayerSession,
  type RoomResult,
} from '@/lib/network-room';

interface RoomContextValue {
  room: Room | null;
  session: PlayerSession | null;
  create: (id: string, name?: string) => Promise<RoomResult>;
  join: (code: string, name: string) => Promise<RoomResult>;
  ready: (id: string) => Promise<void>;
  start: () => Promise<void>;
  leave: () => Promise<void>;
}

const RoomContext = createContext<RoomContextValue | null>(null);

export function RoomProvider({ children }: { children: ReactNode }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [session, setSession] = useState<PlayerSession | null>(null);

  useEffect(() => {
    const saved = getPlayerSession();

    if (saved) {
      setSession(saved);
    }
  }, []);

  // Xona ma'lumotlarini serverdan muntazam yangilash
  useEffect(() => {
    if (!session) return;

    let active = true;

    const refreshRoom = async () => {
      try {
        const updated = await getNetworkRoom(session);

        if (active) {
          setRoom(updated);
        }
      } catch (error) {
        console.error('Room refresh error:', error);
      }
    };

    void refreshRoom();

    const interval = window.setInterval(refreshRoom, 1500);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [session]);

  const create = useCallback(async (id: string, name = 'Host') => {
    const result = await createNetworkRoom(
      id as Room['gameId'],
      name
    );

    const newSession: PlayerSession = {
      code: result.code,
      playerId: result.playerId,
      token: result.playerToken,
    };

    savePlayerSession(newSession);
    setSession(newSession);
    setRoom(result);

    return result;
  }, []);

  const join = useCallback(async (code: string, name: string) => {
    const result = await joinNetworkRoom(code, name);

    const newSession: PlayerSession = {
      code: result.code,
      playerId: result.playerId,
      token: result.playerToken,
    };

    savePlayerSession(newSession);
    setSession(newSession);
    setRoom(result);

    return result;
  }, []);

  const ready = useCallback(async (id: string) => {
    if (!session || session.playerId !== id) {
      throw new Error('Invalid player session.');
    }

    const player = room?.players.find(p => p.id === id);

    if (!player) {
      throw new Error('Player not found.');
    }

    const updated = await setNetworkReady(session, !player.ready);
    setRoom(updated);
  }, [session, room]);

  const start = useCallback(async () => {
    if (!session) {
      throw new Error('No active player session.');
    }

    const updated = await startNetworkRoom(session);
    setRoom(updated);
  }, [session]);

  const leave = useCallback(async () => {
    clearPlayerSession();
    setSession(null);
    setRoom(null);
  }, []);

  const value: RoomContextValue = {
    room,
    session,
    create,
    join,
    ready,
    start,
    leave,
  };

  return (
    <RoomContext.Provider value={value}>
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const context = useContext(RoomContext);

  if (!context) {
    throw new Error('Room provider is required');
  }

  return context;
}
