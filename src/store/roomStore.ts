import { memeRouter } from './../routes/meme.routes';
// expose method for room used by my room.service.ts (mainly return data)
export type RoomStatus = 'waiting' | 'playing' | 'finished';
type RoomPhase = 'waiting' | 'startGame' | 'remakeMeme' | 'ended';

// interface for meme data
export interface Meme {
  id: number;
  videoUrl: string;
  title?: string | null;
}

// interface for every room
export interface Room {
  roomId: string;
  roomCode: string;
  hostUserId: string;
  maxPlayers: number;
  players: string[];
  status: RoomStatus;
  createdAt: string;
  phase: RoomPhase;
  currentMeme: Meme | null;
}

// Singleton class to manage rooms in-memory
class RoomStore {
  private rooms = new Map<string, Room>();

  // method to create and store a new room
  create(room: Room) {
    this.rooms.set(room.roomId, room);
    return room;
  }

  // method to get room by its code
  getByCode(code: string) {
    return [...this.rooms.values()].find(r => r.roomCode === code);
  }

  // method to get room by its ID
  get(roomId: string) {
    return this.rooms.get(roomId);
  }

  // method to check if a room exist or not
  exists(roomId: string) {
    return this.rooms.has(roomId);
  }

  // method to delete a room
  delete(roomId: string) {
    return this.rooms.delete(roomId);
  }

  // method to update a room's data
  update(roomId: string, data: Partial<Room>) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    const updated = { ...room, ...data };
    this.rooms.set(roomId, updated);
    return updated;
  }
}

export const roomStore = new RoomStore();
