export type RoomStatus = 'waiting' | 'playing' | 'finished';

// interface for every room
export interface Room {
  roomId: string;
  roomCode: string;
  hostUserId: string;
  maxPlayers: number;
  players: string[];
  status: RoomStatus;
  createdAt: string;
}

// Singleton class to manage rooms in-memory
class RoomStore {
  private rooms = new Map<string, Room>();

  create(room: Room) {
    this.rooms.set(room.roomId, room);
    return room;
  }

  get(roomId: string) {
    return this.rooms.get(roomId);
  }

  exists(roomId: string) {
    return this.rooms.has(roomId);
  }

  update(roomId: string, data: Partial<Room>) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    const updated = { ...room, ...data };
    this.rooms.set(roomId, updated);
    return updated;
  }
}

export const roomStore = new RoomStore();
