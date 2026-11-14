import { createContext, useContext, useState, type ReactNode } from 'react';
import { localRoomTransport, type Room } from '@/lib/local-room';
import { getGame } from '@/lib/games';
interface RoomContextValue { room: Room | null; create: (id: string) => Room; join: (code: string, name: string) => void; ready: (id: string) => void; start: () => void; leave: () => void }
const RoomContext = createContext<RoomContextValue | null>(null);
export function RoomProvider({ children }: { children: ReactNode }) {
  const [room, setRoom] = useState<Room | null>(null);
  const value: RoomContextValue = {
    room,
    create(id) { const next = localRoomTransport.create(id); setRoom(next); return next; },
    join(code, name) { if (!room || room.code !== code) throw new Error('No local room with that code. Create a room in this tab first.'); setRoom(localRoomTransport.join(room, name, getGame(room.gameId).max)); },
    ready(id) { if (room) setRoom(localRoomTransport.setReady(room, id)); },
    start() { if (room) setRoom(localRoomTransport.start(room, getGame(room.gameId).min)); },
    leave() { setRoom(null); },
  };
  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}
export function useRoom() { const context = useContext(RoomContext); if (!context) throw new Error('Room provider is required'); return context; }